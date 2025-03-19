import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  startAt,
  endAt,
  DocumentData,
  QuerySnapshot,
  startAfter,
  endBefore,
  QueryConstraint,
  runTransaction,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UsageMeteringService, TimeUnit, ResourceType, UsageSummary } from './UsageMeteringService';
import { BillingCycleService, BillingCycleFrequency, BillingCycleStatus, BillingCycleEvent } from './BillingCycleService';
import { SubscriptionService } from './SubscriptionService';
import { Company, CompanySubscription, SubscriptionPlan, SubscriptionStatus } from '@/lib/types/company';

// Extended CompanySubscription interface to add properties needed for analytics
interface AnalyticsCompanySubscription extends CompanySubscription {
  wasInTrial?: boolean;
  isInTrial?: boolean;
  previousSubscriptionId?: string;
  cancellationDate?: Timestamp;
  cancellationReason?: string;
  planName?: string;
}

/**
 * Time period for subscription analytics
 */
export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

/**
 * Subscription Metrics
 */
export interface SubscriptionMetrics {
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenue: number;
  averageRevenuePerSubscription: number;
  conversionRate: number; // Trial to paid conversion rate
  churnRate: number;
  renewalRate: number;
  popularPlans: Array<{
    planId: string;
    planName: string;
    count: number;
    percentageOfTotal: number;
  }>;
  usageMetrics: {
    [key in ResourceType]?: {
      totalUsage: number;
      averagePerSubscription: number;
      percentOfLimit: number;
    };
  };
}

/**
 * Revenue Forecast
 */
export interface RevenueForecast {
  period: AnalyticsPeriod;
  timePeriods: string[]; // Array of time period labels (e.g., months, quarters)
  projectedRevenue: number[];
  projectedSubscriptions: number[];
  confidenceInterval?: {
    lower: number[];
    upper: number[];
  };
  assumptions: {
    churnRate: number;
    conversionRate: number;
    newSubscriptionRate: number;
  };
}

/**
 * Subscription Trend
 */
export interface SubscriptionTrend {
  period: AnalyticsPeriod;
  timePoints: string[]; // Array of time labels (e.g., dates, months)
  metrics: {
    [key: string]: number[]; // Array of values for each metric over time
  };
  compareWithPrevious?: {
    [key: string]: number; // Percentage change compared to previous period
  };
}

/**
 * Churn Analysis
 */
export interface ChurnAnalysis {
  overallChurnRate: number;
  churnByPlan: Array<{
    planId: string;
    planName: string;
    churnRate: number;
    churnCount: number;
  }>;
  churnReasons?: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  churnByTenure: Array<{
    tenureRange: string; // e.g., "0-30 days", "31-90 days"
    churnRate: number;
    churnCount: number;
  }>;
  retentionCurve: Array<{
    month: number;
    retentionRate: number;
  }>;
}

/**
 * Analytics Report
 */
export interface SubscriptionAnalyticsReport {
  reportId: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  companyId?: string;
  reportType: 'overview' | 'revenue' | 'usage' | 'churn' | 'forecast' | 'custom';
  metrics: SubscriptionMetrics;
  trends?: SubscriptionTrend[];
  forecast?: RevenueForecast;
  churnAnalysis?: ChurnAnalysis;
  segments?: Array<{
    name: string;
    filterCriteria: string;
    metrics: Partial<SubscriptionMetrics>;
  }>;
  recommendations?: string[];
}

/**
 * Service for subscription analytics and business intelligence
 */
export class SubscriptionAnalyticsService {
  private usageMeteringService: UsageMeteringService;
  private billingCycleService: BillingCycleService;
  private subscriptionService: SubscriptionService;
  private analyticsReportsCollection = collection(db, 'subscriptionAnalyticsReports');
  
  constructor() {
    this.usageMeteringService = new UsageMeteringService();
    this.billingCycleService = new BillingCycleService();
    this.subscriptionService = new SubscriptionService();
  }
  
  /**
   * Generate subscription metrics for the specified period
   * @param periodStart Start date of the period
   * @param periodEnd End date of the period
   * @param companyId Optional company ID to filter metrics for a specific company
   * @returns Subscription metrics for the period
   */
  async generateSubscriptionMetrics(
    periodStart: Date,
    periodEnd: Date,
    companyId?: string
  ): Promise<SubscriptionMetrics> {
    try {
      // Convert dates to Firestore Timestamps
      const startTimestamp = Timestamp.fromDate(periodStart);
      const endTimestamp = Timestamp.fromDate(periodEnd);
      
      // Build query constraints
      const constraints: QueryConstraint[] = [
        where('startDate', '<=', endTimestamp),
        orderBy('startDate', 'desc')
      ];
      
      // Add company filter if specified
      if (companyId) {
        constraints.push(where('companyId', '==', companyId));
      }
      
      // Get all relevant subscriptions
      const subscriptionsRef = collection(db, 'companySubscriptions');
      const q = query(subscriptionsRef, ...constraints);
      const snapshot = await getDocs(q);
      
      // Initialize counters
      let activeCount = 0;
      let trialCount = 0;
      let cancelledCount = 0;
      let expiredCount = 0;
      let totalRevenue = 0;
      let trialToActivePaidCount = 0;
      let trialToInactiveCount = 0;
      let renewalCount = 0;
      let nonRenewalCount = 0;
      
      // Plan popularity tracking
      const planCounts: { [planId: string]: { count: number; name: string } } = {};
      
      // Process subscriptions
      for (const doc of snapshot.docs) {
        const subscription = doc.data() as AnalyticsCompanySubscription;
        
        // Skip subscriptions that started after the period end
        if (subscription.startDate instanceof Timestamp && subscription.startDate.toDate() > periodEnd) {
          continue;
        }
        
        // Skip subscriptions that were cancelled before the period start
        if (subscription.status === SubscriptionStatus.CANCELLED && 
            subscription.cancellationDate && 
            subscription.cancellationDate.toDate() < periodStart) {
          continue;
        }
        
        // Count subscription by status during the period
        if (subscription.status === SubscriptionStatus.ACTIVE) {
          activeCount++;
          
          // Add to revenue if not in trial
          if (!subscription.isInTrial) {
            totalRevenue += subscription.price || 0;
          }
          
          // Check for renewals
          if (subscription.previousSubscriptionId) {
            renewalCount++;
          }
        } else if (subscription.status === SubscriptionStatus.TRIAL) {
          trialCount++;
        } else if (subscription.status === SubscriptionStatus.CANCELLED) {
          cancelledCount++;
          
          // Check if it was previously in trial
          if (subscription.wasInTrial) {
            trialToInactiveCount++;
          } else {
            nonRenewalCount++;
          }
        } else if (subscription.status === SubscriptionStatus.EXPIRED) {
          expiredCount++;
          nonRenewalCount++;
        }
        
        // Track plan popularity
        if (subscription.planId) {
          if (!planCounts[subscription.planId]) {
            planCounts[subscription.planId] = { count: 0, name: subscription.planName || 'Unknown Plan' };
          }
          planCounts[subscription.planId].count++;
        }
        
        // Check for trial conversions
        if (subscription.wasInTrial && subscription.status === SubscriptionStatus.ACTIVE) {
          trialToActivePaidCount++;
        }
      }
      
      // Get total subscriptions
      const totalSubscriptions = activeCount + trialCount + cancelledCount + expiredCount;
      
      // Calculate derived metrics
      const averageRevenue = activeCount > 0 ? totalRevenue / activeCount : 0;
      const conversionRate = (trialToActivePaidCount + trialToInactiveCount) > 0 
        ? trialToActivePaidCount / (trialToActivePaidCount + trialToInactiveCount) 
        : 0;
      const churnRate = (cancelledCount + expiredCount) / (totalSubscriptions || 1);
      const renewalRate = (renewalCount + nonRenewalCount) > 0 
        ? renewalCount / (renewalCount + nonRenewalCount) 
        : 0;
      
      // Format plan popularity
      const totalPlanCount = Object.values(planCounts).reduce((sum, plan) => sum + plan.count, 0);
      const popularPlans = Object.entries(planCounts).map(([planId, data]) => ({
        planId,
        planName: data.name,
        count: data.count,
        percentageOfTotal: totalPlanCount > 0 ? (data.count / totalPlanCount) * 100 : 0
      })).sort((a, b) => b.count - a.count);
      
      // Get usage metrics if no specific company
      let usageMetrics: SubscriptionMetrics['usageMetrics'] = {};
      
      if (companyId) {
        // Get usage summary for the company
        const usageSummary = await this.usageMeteringService.getUsageSummary(companyId);
        
        if (usageSummary) {
          // Transform the usage summary into the required format
          for (const [resourceType, data] of Object.entries(usageSummary.resources)) {
            usageMetrics[resourceType as ResourceType] = {
              totalUsage: data.currentUsage,
              averagePerSubscription: data.currentUsage / (activeCount || 1),
              percentOfLimit: data.percentUsed
            };
          }
        }
      } else {
        // Get aggregated usage metrics across all subscriptions
        // This would need to be implemented based on how usage data is stored
        // For now, return an empty object
        usageMetrics = {};
      }
      
      return {
        activeSubscriptions: activeCount,
        trialSubscriptions: trialCount,
        cancelledSubscriptions: cancelledCount,
        expiredSubscriptions: expiredCount,
        totalRevenue,
        averageRevenuePerSubscription: averageRevenue,
        conversionRate,
        churnRate,
        renewalRate,
        popularPlans,
        usageMetrics
      };
    } catch (error) {
      console.error('Error generating subscription metrics:', error);
      throw new Error('Failed to generate subscription metrics');
    }
  }
  
  /**
   * Generate subscription trends over time
   * @param periodType Time period for trend analysis
   * @param periodCount Number of periods to analyze
   * @param endDate End date for the analysis (defaults to current date)
   * @param companyId Optional company ID to filter trends for a specific company
   * @returns Subscription trends over time
   */
  async generateSubscriptionTrends(
    periodType: AnalyticsPeriod,
    periodCount: number = 6,
    endDate: Date = new Date(),
    companyId?: string
  ): Promise<SubscriptionTrend> {
    try {
      const timePoints: string[] = [];
      const metrics: { [key: string]: number[] } = {
        activeSubscriptions: [],
        trialSubscriptions: [],
        revenue: [],
        newSubscriptions: [],
        churnRate: []
      };
      
      // Calculate period start dates and labels
      const periodEndDates: Date[] = [];
      const periodStartDates: Date[] = [];
      
      for (let i = 0; i < periodCount; i++) {
        const endDateForPeriod = new Date(endDate);
        
        // Adjust end date based on period type
        switch (periodType) {
          case AnalyticsPeriod.DAILY:
            endDateForPeriod.setDate(endDate.getDate() - i);
            timePoints.unshift(endDateForPeriod.toISOString().split('T')[0]);
            break;
          case AnalyticsPeriod.WEEKLY:
            endDateForPeriod.setDate(endDate.getDate() - (i * 7));
            timePoints.unshift(`Week ${periodCount - i}`);
            break;
          case AnalyticsPeriod.MONTHLY:
            endDateForPeriod.setMonth(endDate.getMonth() - i);
            timePoints.unshift(endDateForPeriod.toLocaleString('default', { month: 'short', year: 'numeric' }));
            break;
          case AnalyticsPeriod.QUARTERLY:
            endDateForPeriod.setMonth(endDate.getMonth() - (i * 3));
            const quarter = Math.floor(endDateForPeriod.getMonth() / 3) + 1;
            timePoints.unshift(`Q${quarter} ${endDateForPeriod.getFullYear()}`);
            break;
          case AnalyticsPeriod.YEARLY:
            endDateForPeriod.setFullYear(endDate.getFullYear() - i);
            timePoints.unshift(endDateForPeriod.getFullYear().toString());
            break;
          default:
            // Handle custom period if needed
            break;
        }
        
        periodEndDates.unshift(endDateForPeriod);
        
        // Calculate start date for each period
        const startDateForPeriod = new Date(endDateForPeriod);
        
        switch (periodType) {
          case AnalyticsPeriod.DAILY:
            startDateForPeriod.setDate(startDateForPeriod.getDate() - 1);
            break;
          case AnalyticsPeriod.WEEKLY:
            startDateForPeriod.setDate(startDateForPeriod.getDate() - 7);
            break;
          case AnalyticsPeriod.MONTHLY:
            startDateForPeriod.setMonth(startDateForPeriod.getMonth() - 1);
            break;
          case AnalyticsPeriod.QUARTERLY:
            startDateForPeriod.setMonth(startDateForPeriod.getMonth() - 3);
            break;
          case AnalyticsPeriod.YEARLY:
            startDateForPeriod.setFullYear(startDateForPeriod.getFullYear() - 1);
            break;
          default:
            // Handle custom period if needed
            break;
        }
        
        periodStartDates.unshift(startDateForPeriod);
      }
      
      // Generate metrics for each period
      for (let i = 0; i < periodCount; i++) {
        const periodMetrics = await this.generateSubscriptionMetrics(
          periodStartDates[i],
          periodEndDates[i],
          companyId
        );
        
        // Get new subscriptions for the period
        const newSubscriptionCount = await this.getNewSubscriptionsCount(
          periodStartDates[i],
          periodEndDates[i],
          companyId
        );
        
        // Store metrics for the period
        metrics.activeSubscriptions.push(periodMetrics.activeSubscriptions);
        metrics.trialSubscriptions.push(periodMetrics.trialSubscriptions);
        metrics.revenue.push(periodMetrics.totalRevenue);
        metrics.newSubscriptions.push(newSubscriptionCount);
        metrics.churnRate.push(periodMetrics.churnRate * 100); // Convert to percentage
      }
      
      // Calculate percentage changes compared to previous period
      const compareWithPrevious: { [key: string]: number } = {};
      
      for (const [key, values] of Object.entries(metrics)) {
        if (values.length >= 2) {
          const current = values[values.length - 1];
          const previous = values[values.length - 2];
          
          if (previous !== 0) {
            compareWithPrevious[key] = ((current - previous) / previous) * 100;
          } else {
            compareWithPrevious[key] = current > 0 ? 100 : 0;
          }
        }
      }
      
      return {
        period: periodType,
        timePoints,
        metrics,
        compareWithPrevious
      };
    } catch (error) {
      console.error('Error generating subscription trends:', error);
      throw new Error('Failed to generate subscription trends');
    }
  }
  
  /**
   * Get the number of new subscriptions in a given period
   * @param startDate Start date of the period
   * @param endDate End date of the period
   * @param companyId Optional company ID
   * @returns Number of new subscriptions
   */
  private async getNewSubscriptionsCount(
    startDate: Date,
    endDate: Date,
    companyId?: string
  ): Promise<number> {
    try {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);
      
      const constraints: QueryConstraint[] = [
        where('startDate', '>=', startTimestamp),
        where('startDate', '<=', endTimestamp)
      ];
      
      if (companyId) {
        constraints.push(where('companyId', '==', companyId));
      }
      
      const subscriptionsRef = collection(db, 'companySubscriptions');
      const q = query(subscriptionsRef, ...constraints);
      const snapshot = await getDocs(q);
      
      return snapshot.size;
    } catch (error) {
      console.error('Error counting new subscriptions:', error);
      return 0;
    }
  }
  
  /**
   * Generate churn analysis for subscriptions
   * @param periodStart Start date of the period
   * @param periodEnd End date of the period
   * @param companyId Optional company ID
   * @returns Churn analysis data
   */
  async generateChurnAnalysis(
    periodStart: Date,
    periodEnd: Date,
    companyId?: string
  ): Promise<ChurnAnalysis> {
    try {
      // Get all cancelled/expired subscriptions in the period
      const startTimestamp = Timestamp.fromDate(periodStart);
      const endTimestamp = Timestamp.fromDate(periodEnd);
      
      // Query constraints for cancelled subscriptions
      const cancelledConstraints: QueryConstraint[] = [
        where('status', '==', SubscriptionStatus.CANCELLED),
        where('cancellationDate', '>=', startTimestamp),
        where('cancellationDate', '<=', endTimestamp)
      ];
      
      // Query constraints for expired subscriptions
      const expiredConstraints: QueryConstraint[] = [
        where('status', '==', SubscriptionStatus.EXPIRED),
        where('endDate', '>=', startTimestamp),
        where('endDate', '<=', endTimestamp)
      ];
      
      if (companyId) {
        cancelledConstraints.push(where('companyId', '==', companyId));
        expiredConstraints.push(where('companyId', '==', companyId));
      }
      
      const subscriptionsRef = collection(db, 'companySubscriptions');
      const cancelledQuery = query(subscriptionsRef, ...cancelledConstraints);
      const expiredQuery = query(subscriptionsRef, ...expiredConstraints);
      
      const [cancelledSnapshot, expiredSnapshot] = await Promise.all([
        getDocs(cancelledQuery),
        getDocs(expiredQuery)
      ]);
      
      // Combine cancelled and expired subscriptions
      const churnedSubscriptions = [
        ...cancelledSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })),
        ...expiredSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
      ] as (AnalyticsCompanySubscription & { id: string })[];
      
      // Get all active subscriptions at the end of the period for churn rate calculation
      const activeConstraints: QueryConstraint[] = [
        where('status', '==', SubscriptionStatus.ACTIVE),
        where('startDate', '<=', endTimestamp)
      ];
      
      if (companyId) {
        activeConstraints.push(where('companyId', '==', companyId));
      }
      
      const activeQuery = query(subscriptionsRef, ...activeConstraints);
      const activeSnapshot = await getDocs(activeQuery);
      
      const totalSubscriptions = activeSnapshot.size + churnedSubscriptions.length;
      const overallChurnRate = totalSubscriptions > 0 ? churnedSubscriptions.length / totalSubscriptions : 0;
      
      // Analyze churn by plan
      const churnByPlan: { [planId: string]: { count: number; name: string } } = {};
      const churnReasons: { [reason: string]: number } = {};
      const churnByTenure: { [range: string]: number } = {
        '0-30 days': 0,
        '31-90 days': 0,
        '91-180 days': 0,
        '181-365 days': 0,
        '365+ days': 0
      };
      
      // Process each churned subscription
      for (const subscription of churnedSubscriptions) {
        // Count by plan
        if (subscription.planId) {
          if (!churnByPlan[subscription.planId]) {
            churnByPlan[subscription.planId] = { count: 0, name: subscription.planName || 'Unknown Plan' };
          }
          churnByPlan[subscription.planId].count++;
        }
        
        // Count by reason
        if (subscription.cancellationReason) {
          churnReasons[subscription.cancellationReason] = (churnReasons[subscription.cancellationReason] || 0) + 1;
        }
        
        // Count by tenure
        const startDate = subscription.startDate instanceof Timestamp ? 
          subscription.startDate.toDate() : 
          new Date(subscription.startDate);
          
        const endDate = subscription.cancellationDate?.toDate() || 
          (subscription.endDate instanceof Timestamp ? subscription.endDate.toDate() : 
          subscription.endDate ? new Date(subscription.endDate) : new Date());
          
        const tenureDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (tenureDays <= 30) {
          churnByTenure['0-30 days']++;
        } else if (tenureDays <= 90) {
          churnByTenure['31-90 days']++;
        } else if (tenureDays <= 180) {
          churnByTenure['91-180 days']++;
        } else if (tenureDays <= 365) {
          churnByTenure['181-365 days']++;
        } else {
          churnByTenure['365+ days']++;
        }
      }
      
      // Calculate churn by plan with rates
      const planSubscriptionCounts: { [planId: string]: number } = {};
      
      // Count active subscriptions by plan
      for (const doc of activeSnapshot.docs) {
        const subscription = doc.data() as AnalyticsCompanySubscription;
        if (subscription.planId) {
          planSubscriptionCounts[subscription.planId] = (planSubscriptionCounts[subscription.planId] || 0) + 1;
        }
      }
      
      // Format churn by plan data
      const churnByPlanFormatted = Object.entries(churnByPlan).map(([planId, data]) => {
        const totalForPlan = (planSubscriptionCounts[planId] || 0) + data.count;
        return {
          planId,
          planName: data.name,
          churnCount: data.count,
          churnRate: totalForPlan > 0 ? data.count / totalForPlan : 0
        };
      }).sort((a, b) => b.churnCount - a.churnCount);
      
      // Format churn reasons
      const totalChurnWithReason = Object.values(churnReasons).reduce((sum, count) => sum + count, 0);
      const churnReasonsFormatted = Object.entries(churnReasons).map(([reason, count]) => ({
        reason,
        count,
        percentage: totalChurnWithReason > 0 ? (count / totalChurnWithReason) * 100 : 0
      })).sort((a, b) => b.count - a.count);
      
      // Format churn by tenure
      const churnByTenureFormatted = Object.entries(churnByTenure).map(([tenureRange, count]) => ({
        tenureRange,
        churnCount: count,
        churnRate: totalSubscriptions > 0 ? count / totalSubscriptions : 0
      }));
      
      // Generate retention curve (simplified)
      const retentionCurve = [
        { month: 1, retentionRate: 1 - (churnByTenure['0-30 days'] / totalSubscriptions) },
        { month: 3, retentionRate: 1 - ((churnByTenure['0-30 days'] + churnByTenure['31-90 days']) / totalSubscriptions) },
        { month: 6, retentionRate: 1 - ((churnByTenure['0-30 days'] + churnByTenure['31-90 days'] + churnByTenure['91-180 days']) / totalSubscriptions) },
        { month: 12, retentionRate: 1 - ((churnByTenure['0-30 days'] + churnByTenure['31-90 days'] + churnByTenure['91-180 days'] + churnByTenure['181-365 days']) / totalSubscriptions) }
      ];
      
      return {
        overallChurnRate,
        churnByPlan: churnByPlanFormatted,
        churnReasons: churnReasonsFormatted,
        churnByTenure: churnByTenureFormatted,
        retentionCurve
      };
    } catch (error) {
      console.error('Error generating churn analysis:', error);
      throw new Error('Failed to generate churn analysis');
    }
  }
  
  /**
   * Generate revenue forecast for future periods
   * @param periodType Type of time period for forecasting
   * @param periodCount Number of periods to forecast
   * @param companyId Optional company ID to forecast for a specific company
   * @returns Revenue forecast data
   */
  async generateRevenueForecast(
    periodType: AnalyticsPeriod,
    periodCount: number = 6,
    companyId?: string
  ): Promise<RevenueForecast> {
    try {
      // Get historical data for trend analysis
      const historicalTrends = await this.generateSubscriptionTrends(
        periodType,
        periodCount,
        new Date(),
        companyId
      );
      
      // Calculate growth rates from historical data
      const revenueGrowthRates: number[] = [];
      const subscriptionGrowthRates: number[] = [];
      
      for (let i = 1; i < historicalTrends.metrics.revenue.length; i++) {
        const previousRevenue = historicalTrends.metrics.revenue[i - 1];
        const currentRevenue = historicalTrends.metrics.revenue[i];
        
        if (previousRevenue > 0) {
          revenueGrowthRates.push((currentRevenue - previousRevenue) / previousRevenue);
        }
        
        const previousSubscriptions = historicalTrends.metrics.activeSubscriptions[i - 1];
        const currentSubscriptions = historicalTrends.metrics.activeSubscriptions[i];
        
        if (previousSubscriptions > 0) {
          subscriptionGrowthRates.push((currentSubscriptions - previousSubscriptions) / previousSubscriptions);
        }
      }
      
      // Calculate average growth rates
      const avgRevenueGrowthRate = revenueGrowthRates.length > 0
        ? revenueGrowthRates.reduce((sum, rate) => sum + rate, 0) / revenueGrowthRates.length
        : 0;
      
      const avgSubscriptionGrowthRate = subscriptionGrowthRates.length > 0
        ? subscriptionGrowthRates.reduce((sum, rate) => sum + rate, 0) / subscriptionGrowthRates.length
        : 0;
      
      // Get latest metrics as starting point
      const latestRevenue = historicalTrends.metrics.revenue[historicalTrends.metrics.revenue.length - 1];
      const latestSubscriptions = historicalTrends.metrics.activeSubscriptions[historicalTrends.metrics.activeSubscriptions.length - 1];
      
      // Get churn rate from the most recent period
      const latestChurnRate = historicalTrends.metrics.churnRate[historicalTrends.metrics.churnRate.length - 1] / 100; // Convert from percentage back to decimal
      
      // Generate time period labels for forecast
      const timePeriods: string[] = [];
      const projectedRevenue: number[] = [];
      const projectedSubscriptions: number[] = [];
      const lowerBound: number[] = [];
      const upperBound: number[] = [];
      
      // Generate the next label based on the last historical label
      let nextDate = new Date();
      const lastLabel = historicalTrends.timePoints[historicalTrends.timePoints.length - 1];
      
      for (let i = 0; i < periodCount; i++) {
        // Generate next time period label
        switch (periodType) {
          case AnalyticsPeriod.DAILY:
            nextDate.setDate(nextDate.getDate() + 1);
            timePeriods.push(nextDate.toISOString().split('T')[0]);
            break;
          case AnalyticsPeriod.WEEKLY:
            nextDate.setDate(nextDate.getDate() + 7);
            timePeriods.push(`Week ${i + 1}`);
            break;
          case AnalyticsPeriod.MONTHLY:
            nextDate.setMonth(nextDate.getMonth() + 1);
            timePeriods.push(nextDate.toLocaleString('default', { month: 'short', year: 'numeric' }));
            break;
          case AnalyticsPeriod.QUARTERLY:
            nextDate.setMonth(nextDate.getMonth() + 3);
            const quarter = Math.floor(nextDate.getMonth() / 3) + 1;
            timePeriods.push(`Q${quarter} ${nextDate.getFullYear()}`);
            break;
          case AnalyticsPeriod.YEARLY:
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            timePeriods.push(nextDate.getFullYear().toString());
            break;
          default:
            timePeriods.push(`Period ${i + 1}`);
            break;
        }
        
        // Project subscriptions with growth and churn
        const newSubscriptionsRate = Math.max(0, avgSubscriptionGrowthRate + latestChurnRate);
        let projectedSubscriptionCount = i === 0
          ? latestSubscriptions * (1 + newSubscriptionsRate - latestChurnRate)
          : projectedSubscriptions[i - 1] * (1 + newSubscriptionsRate - latestChurnRate);
        
        projectedSubscriptionCount = Math.max(0, Math.round(projectedSubscriptionCount));
        projectedSubscriptions.push(projectedSubscriptionCount);
        
        // Project revenue based on subscription growth and average revenue per subscription
        const avgRevenuePerSubscription = latestSubscriptions > 0 ? latestRevenue / latestSubscriptions : 0;
        let projectedRevenueAmount = projectedSubscriptionCount * avgRevenuePerSubscription * (1 + avgRevenueGrowthRate);
        projectedRevenueAmount = Math.max(0, Math.round(projectedRevenueAmount * 100) / 100);
        projectedRevenue.push(projectedRevenueAmount);
        
        // Calculate confidence intervals (simplified)
        const volatility = Math.max(
          Math.abs(avgRevenueGrowthRate),
          Math.abs(avgSubscriptionGrowthRate),
          0.1 // Minimum volatility to ensure some range
        );
        
        lowerBound.push(Math.max(0, projectedRevenueAmount * (1 - volatility)));
        upperBound.push(projectedRevenueAmount * (1 + volatility));
      }
      
      return {
        period: periodType,
        timePeriods,
        projectedRevenue,
        projectedSubscriptions,
        confidenceInterval: {
          lower: lowerBound,
          upper: upperBound
        },
        assumptions: {
          churnRate: latestChurnRate,
          conversionRate: 0, // Would need historical trial conversion data
          newSubscriptionRate: avgSubscriptionGrowthRate + latestChurnRate
        }
      };
    } catch (error) {
      console.error('Error generating revenue forecast:', error);
      throw new Error('Failed to generate revenue forecast');
    }
  }
  
  /**
   * Generate a comprehensive subscription analytics report
   * @param reportType Type of report to generate
   * @param periodStart Start date for the report period
   * @param periodEnd End date for the report period
   * @param companyId Optional company ID to generate report for a specific company
   * @returns Comprehensive analytics report
   */
  async generateAnalyticsReport(
    reportType: 'overview' | 'revenue' | 'usage' | 'churn' | 'forecast' | 'custom',
    periodStart: Date,
    periodEnd: Date,
    companyId?: string
  ): Promise<string> {
    try {
      // Generate core metrics
      const metrics = await this.generateSubscriptionMetrics(periodStart, periodEnd, companyId);
      
      let trends: SubscriptionTrend[] | undefined;
      let forecast: RevenueForecast | undefined;
      let churnAnalysis: ChurnAnalysis | undefined;
      
      // Generate additional sections based on report type
      if (reportType === 'overview' || reportType === 'revenue' || reportType === 'forecast') {
        // Generate monthly trends for the past 6 months
        trends = [await this.generateSubscriptionTrends(AnalyticsPeriod.MONTHLY, 6, periodEnd, companyId)];
        
        // Generate forecast if requested
        if (reportType === 'overview' || reportType === 'forecast') {
          forecast = await this.generateRevenueForecast(AnalyticsPeriod.MONTHLY, 6, companyId);
        }
      }
      
      if (reportType === 'overview' || reportType === 'churn') {
        // Generate churn analysis
        churnAnalysis = await this.generateChurnAnalysis(periodStart, periodEnd, companyId);
      }
      
      // Collect recommendations based on the data
      const recommendations: string[] = [];
      
      if (metrics.churnRate > 0.05) { // Suggesting 5% as a threshold
        recommendations.push('Churn rate is above target threshold. Consider implementing retention strategies such as loyalty programs or product improvements.');
      }
      
      if (metrics.conversionRate < 0.3) { // Suggesting 30% as a threshold
        recommendations.push('Trial conversion rate is below target. Review onboarding experience and consider extending trial period or adding trial-specific features.');
      }
      
      // Check for resource utilization issues
      for (const [resourceType, data] of Object.entries(metrics.usageMetrics)) {
        if (data.percentOfLimit > 90) {
          recommendations.push(`${resourceType} usage is approaching limit (${data.percentOfLimit.toFixed(0)}%). Consider upgrading subscription plans or optimizing resource usage.`);
        }
      }
      
      // Create the report
      const report: SubscriptionAnalyticsReport = {
        reportId: '', // Will be set after document creation
        generatedAt: new Date(),
        periodStart,
        periodEnd,
        companyId,
        reportType,
        metrics,
        trends,
        forecast,
        churnAnalysis,
        recommendations
      };
      
      // Save the report to Firestore
      const docRef = await addDoc(this.analyticsReportsCollection, {
        ...report,
        generatedAt: serverTimestamp(),
        periodStart: Timestamp.fromDate(periodStart),
        periodEnd: Timestamp.fromDate(periodEnd)
      });
      
      // Return the report ID
      return docRef.id;
    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw new Error('Failed to generate analytics report');
    }
  }
} 