import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs, 
  Timestamp,
  QueryConstraint 
} from 'firebase/firestore';
import { LeadService, LeadStatus } from './LeadService';
import { CustomerService, CustomerStatus } from './CustomerService';
import { TaskService, TaskStatus } from './TaskService';
import { ActivityService, ActivityType } from './ActivityService';

// Types for dashboard analytics data
export interface DashboardSummary {
  leads: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    won: number;
    lost: number;
    conversionRate: number;
  };
  customers: {
    total: number;
    active: number;
    new: number; // Added in the last 30 days
    totalRevenue: number;
    averageRevenue: number;
  };
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    dueSoon: number;
    completionRate: number;
  };
  activities: {
    total: number;
    today: number;
    byType: Record<string, number>;
  };
}

export interface TimeSeriesDataPoint {
  date: Date;
  value: number;
}

export interface LeadsBySourceData {
  source: string;
  count: number;
  percentage: number;
}

export interface LeadsByStatusData {
  status: LeadStatus;
  count: number;
  percentage: number;
}

export interface PerformanceData {
  userId: string;
  userName: string;
  leadsAssigned: number;
  leadsContacted: number;
  leadsConverted: number;
  tasksCompleted: number;
  conversionRate: number;
}

/**
 * Service for dashboard analytics data
 */
export class DashboardService {
  private leadService: LeadService;
  private customerService: CustomerService;
  private taskService: TaskService;
  private activityService: ActivityService;
  
  constructor() {
    this.leadService = new LeadService();
    this.customerService = new CustomerService();
    this.taskService = new TaskService();
    this.activityService = new ActivityService();
  }
  
  /**
   * Get dashboard summary data
   * @param tenantId Tenant ID
   * @returns Promise with dashboard summary data
   */
  async getDashboardSummary(tenantId: string): Promise<DashboardSummary> {
    try {
      // Get lead statistics
      const leadStats = await this.leadService.getLeadStatistics(tenantId);
      
      // Get task statistics
      const taskStats = await this.taskService.getTaskStatistics(tenantId);
      
      // Get all customers for revenue calculation
      const customers = await this.customerService.getCustomersByCompany(tenantId);
      
      // Get recent activities (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activities = await this.activityService.getRecentActivities(tenantId, 30, 1000);
      
      // Calculate today's activities
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activitiesToday = activities.filter(a => a.timestamp >= today);
      
      // Count activities by type
      const activityByType: Record<string, number> = {};
      activities.forEach(activity => {
        activityByType[activity.type] = (activityByType[activity.type] || 0) + 1;
      });
      
      // Calculate customer metrics
      const newCustomers = customers.filter(c => {
        return c.createdAt && c.createdAt >= thirtyDaysAgo;
      });
      
      const totalRevenue = customers.reduce((sum, customer) => sum + (customer.totalRevenue || 0), 0);
      const avgRevenue = customers.length > 0 ? totalRevenue / customers.length : 0;
      
      // Calculate lead conversion rate
      const totalProcessedLeads = (leadStats.byStatus[LeadStatus.WON] || 0) + (leadStats.byStatus[LeadStatus.LOST] || 0);
      const conversionRate = totalProcessedLeads > 0 
        ? (leadStats.byStatus[LeadStatus.WON] || 0) / totalProcessedLeads * 100 
        : 0;
      
      // Calculate task completion rate
      const completionRate = taskStats.total > 0 
        ? taskStats.byStatus[TaskStatus.COMPLETED] / taskStats.total * 100 
        : 0;
      
      return {
        leads: {
          total: leadStats.totalLeads,
          new: leadStats.byStatus[LeadStatus.NEW] || 0,
          contacted: leadStats.byStatus[LeadStatus.CONTACTED] || 0,
          qualified: leadStats.byStatus[LeadStatus.QUALIFIED] || 0,
          won: leadStats.byStatus[LeadStatus.WON] || 0,
          lost: leadStats.byStatus[LeadStatus.LOST] || 0,
          conversionRate
        },
        customers: {
          total: customers.length,
          active: customers.filter(c => c.status === CustomerStatus.ACTIVE).length,
          new: newCustomers.length,
          totalRevenue,
          averageRevenue: avgRevenue
        },
        tasks: {
          total: taskStats.total,
          completed: taskStats.byStatus[TaskStatus.COMPLETED] || 0,
          overdue: taskStats.overdue,
          dueSoon: taskStats.dueSoon,
          completionRate
        },
        activities: {
          total: activities.length,
          today: activitiesToday.length,
          byType: activityByType
        }
      };
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      throw error;
    }
  }
  
  /**
   * Get lead acquisition data over time
   * @param tenantId Tenant ID
   * @param days Number of days to include in the time series
   * @returns Promise with time series data
   */
  async getLeadAcquisitionTimeSeries(tenantId: string, days: number = 30): Promise<TimeSeriesDataPoint[]> {
    try {
      // Get all leads
      const leads = await this.leadService.getLeadsByCompany(tenantId);
      
      // Generate date points for each day
      const datePoints: TimeSeriesDataPoint[] = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        // Count leads created on this day
        const count = leads.filter(lead => {
          if (!lead.createdAt) return false;
          return lead.createdAt >= date && lead.createdAt <= endDate;
        }).length;
        
        datePoints.push({
          date,
          value: count
        });
      }
      
      return datePoints;
    } catch (error) {
      console.error('Error getting lead acquisition time series:', error);
      throw error;
    }
  }
  
  /**
   * Get customer acquisition data over time
   * @param tenantId Tenant ID
   * @param days Number of days to include in the time series
   * @returns Promise with time series data
   */
  async getCustomerAcquisitionTimeSeries(tenantId: string, days: number = 30): Promise<TimeSeriesDataPoint[]> {
    try {
      // Get all customers
      const customers = await this.customerService.getCustomersByCompany(tenantId);
      
      // Generate date points for each day
      const datePoints: TimeSeriesDataPoint[] = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        // Count customers created on this day
        const count = customers.filter(customer => {
          if (!customer.createdAt) return false;
          return customer.createdAt >= date && customer.createdAt <= endDate;
        }).length;
        
        datePoints.push({
          date,
          value: count
        });
      }
      
      return datePoints;
    } catch (error) {
      console.error('Error getting customer acquisition time series:', error);
      throw error;
    }
  }
  
  /**
   * Get task completion data over time
   * @param tenantId Tenant ID
   * @param days Number of days to include in the time series
   * @returns Promise with time series data
   */
  async getTaskCompletionTimeSeries(tenantId: string, days: number = 30): Promise<TimeSeriesDataPoint[]> {
    try {
      // Get all tasks
      const tasks = await this.taskService.getTasks(tenantId, { 
        status: TaskStatus.COMPLETED
      });
      
      // Generate date points for each day
      const datePoints: TimeSeriesDataPoint[] = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        // Count tasks completed on this day
        const count = tasks.filter(task => {
          if (!task.completedAt) return false;
          return task.completedAt >= date && task.completedAt <= endDate;
        }).length;
        
        datePoints.push({
          date,
          value: count
        });
      }
      
      return datePoints;
    } catch (error) {
      console.error('Error getting task completion time series:', error);
      throw error;
    }
  }
  
  /**
   * Get revenue data over time
   * @param tenantId Tenant ID
   * @param days Number of days to include in the time series
   * @returns Promise with time series data
   */
  async getRevenueTimeSeries(tenantId: string, days: number = 30): Promise<TimeSeriesDataPoint[]> {
    try {
      // This is a simplified implementation that assumes you store revenue data
      // with timestamps. In a real app, you might need a separate collection for transactions.
      const customers = await this.customerService.getCustomersByCompany(tenantId);
      
      // Generate date points for each day
      const datePoints: TimeSeriesDataPoint[] = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        // Calculate revenue for this day (simplified)
        // In a real app, you would have transaction records with dates
        let revenue = 0;
        customers.forEach(customer => {
          if (customer.lastPurchaseDate && 
              customer.lastPurchaseDate >= date && 
              customer.lastPurchaseDate <= endDate) {
            revenue += customer.totalRevenue || 0;
          }
        });
        
        datePoints.push({
          date,
          value: revenue
        });
      }
      
      return datePoints;
    } catch (error) {
      console.error('Error getting revenue time series:', error);
      throw error;
    }
  }
  
  /**
   * Get leads breakdown by source
   * @param tenantId Tenant ID
   * @returns Promise with lead source data
   */
  async getLeadsBySource(tenantId: string): Promise<LeadsBySourceData[]> {
    try {
      const leadStats = await this.leadService.getLeadStatistics(tenantId);
      
      // Calculate total and percentages
      const result: LeadsBySourceData[] = [];
      const total = leadStats.totalLeads;
      
      if (total === 0) return [];
      
      // Convert source counts to percentage data
      Object.entries(leadStats.bySource).forEach(([source, count]) => {
        if (count > 0) {
          result.push({
            source,
            count,
            percentage: (count / total) * 100
          });
        }
      });
      
      // Sort by count descending
      return result.sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error getting leads by source:', error);
      throw error;
    }
  }
  
  /**
   * Get leads breakdown by status
   * @param tenantId Tenant ID
   * @returns Promise with lead status data
   */
  async getLeadsByStatus(tenantId: string): Promise<LeadsByStatusData[]> {
    try {
      const leadStats = await this.leadService.getLeadStatistics(tenantId);
      
      // Calculate total and percentages
      const result: LeadsByStatusData[] = [];
      const total = leadStats.totalLeads;
      
      if (total === 0) return [];
      
      // Convert status counts to percentage data
      Object.entries(leadStats.byStatus).forEach(([status, count]) => {
        if (count > 0) {
          result.push({
            status: status as LeadStatus,
            count,
            percentage: (count / total) * 100
          });
        }
      });
      
      // Sort by status progression
      const statusOrder = [
        LeadStatus.NEW,
        LeadStatus.CONTACTED,
        LeadStatus.QUALIFIED,
        LeadStatus.PROPOSAL,
        LeadStatus.NEGOTIATION,
        LeadStatus.WON,
        LeadStatus.LOST,
        LeadStatus.ARCHIVED
      ];
      
      return result.sort((a, b) => {
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      });
    } catch (error) {
      console.error('Error getting leads by status:', error);
      throw error;
    }
  }
  
  /**
   * Get sales team performance data
   * @param tenantId Tenant ID
   * @param days Number of days to include in the analysis
   * @returns Promise with performance data
   */
  async getTeamPerformance(tenantId: string, days: number = 30): Promise<PerformanceData[]> {
    try {
      // This is a simplified implementation. In a real app, you would need:
      // 1. A user service to get user details
      // 2. More sophisticated queries to aggregate data
      
      // Get leads
      const leads = await this.leadService.getLeadsByCompany(tenantId);
      
      // Get tasks
      const tasks = await this.taskService.getTasks(tenantId, {
        status: TaskStatus.COMPLETED
      });
      
      // Calculate date threshold
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      
      // Filter for recent leads and tasks
      const recentLeads = leads.filter(lead => lead.createdAt && lead.createdAt >= threshold);
      const recentTasks = tasks.filter(task => task.completedAt && task.completedAt >= threshold);
      
      // Group by assignee
      const userMap: Record<string, {
        leadsAssigned: number;
        leadsContacted: number;
        leadsConverted: number;
        tasksCompleted: number;
      }> = {};
      
      // Count leads assigned to each user
      recentLeads.forEach(lead => {
        if (!lead.assignedTo) return;
        
        if (!userMap[lead.assignedTo]) {
          userMap[lead.assignedTo] = {
            leadsAssigned: 0,
            leadsContacted: 0,
            leadsConverted: 0,
            tasksCompleted: 0
          };
        }
        
        userMap[lead.assignedTo].leadsAssigned++;
        
        if (lead.status === LeadStatus.CONTACTED || 
            lead.status === LeadStatus.QUALIFIED || 
            lead.status === LeadStatus.PROPOSAL || 
            lead.status === LeadStatus.NEGOTIATION) {
          userMap[lead.assignedTo].leadsContacted++;
        }
        
        if (lead.status === LeadStatus.WON) {
          userMap[lead.assignedTo].leadsConverted++;
        }
      });
      
      // Count tasks completed by each user
      recentTasks.forEach(task => {
        if (!task.completedBy) return;
        
        if (!userMap[task.completedBy]) {
          userMap[task.completedBy] = {
            leadsAssigned: 0,
            leadsContacted: 0,
            leadsConverted: 0,
            tasksCompleted: 0
          };
        }
        
        userMap[task.completedBy].tasksCompleted++;
      });
      
      // Convert to array with calculated metrics
      const result: PerformanceData[] = [];
      
      for (const [userId, data] of Object.entries(userMap)) {
        // Calculate conversion rate
        const conversionRate = data.leadsAssigned > 0 
          ? (data.leadsConverted / data.leadsAssigned) * 100 
          : 0;
        
        result.push({
          userId,
          userName: userId, // In a real app, get name from user service
          ...data,
          conversionRate
        });
      }
      
      // Sort by leads converted (descending)
      return result.sort((a, b) => b.leadsConverted - a.leadsConverted);
    } catch (error) {
      console.error('Error getting team performance data:', error);
      throw error;
    }
  }
  
  /**
   * Get recent activity feed
   * @param tenantId Tenant ID
   * @param limit Maximum number of activities to return
   * @returns Promise with recent activities
   */
  async getRecentActivityFeed(tenantId: string, limit: number = 10): Promise<any[]> {
    try {
      return await this.activityService.getRecentActivities(tenantId, 7, limit);
    } catch (error) {
      console.error('Error getting recent activity feed:', error);
      throw error;
    }
  }
} 