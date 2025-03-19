import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  runTransaction,
  DocumentReference,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { SubscriptionService } from './SubscriptionService';
import { PaymentGatewayService } from './PaymentGatewayService';

// Interface for subscription data from SubscriptionService
interface Subscription {
  id: string;
  companyId: string;
  tenantId?: string;
  planId: string;
  planName?: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  billingCycle: string;
  price: number;
  currency?: string;
}

const functions = getFunctions();

export enum BillingCycleStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum BillingCycleFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  BIANNUAL = 'biannual',
  ANNUAL = 'annual',
  CUSTOM = 'custom'
}

export interface BillingCycleEvent {
  id?: string;
  subscriptionId: string;
  companyId: string;
  tenantId: string;
  cycleStartDate: Date;
  cycleEndDate: Date;
  dueDate: Date;
  amount: number;
  currency: string;
  status: BillingCycleStatus;
  paymentAttempts: number;
  lastPaymentAttempt?: Date;
  paymentMethodId?: string;
  invoiceId?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Service for automating subscription billing cycles
 */
export class BillingCycleService {
  private billingCyclesCollection = collection(db, 'billingCycles');
  private subscriptionService = new SubscriptionService();
  private paymentService = new PaymentGatewayService();

  /**
   * Create a new billing cycle event
   * @param cycleEvent Billing cycle event details
   * @returns The created billing cycle event ID
   */
  async createBillingCycle(cycleEvent: BillingCycleEvent): Promise<string> {
    try {
      // Create a new billing cycle document
      const cycleData = {
        ...cycleEvent,
        cycleStartDate: Timestamp.fromDate(cycleEvent.cycleStartDate),
        cycleEndDate: Timestamp.fromDate(cycleEvent.cycleEndDate),
        dueDate: Timestamp.fromDate(cycleEvent.dueDate),
        paymentAttempts: cycleEvent.paymentAttempts || 0,
        lastPaymentAttempt: cycleEvent.lastPaymentAttempt ? Timestamp.fromDate(cycleEvent.lastPaymentAttempt) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.billingCyclesCollection, cycleData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating billing cycle:', error);
      throw new Error('Failed to create billing cycle');
    }
  }

  /**
   * Get a billing cycle by ID
   * @param cycleId Billing cycle ID
   * @returns Billing cycle event data
   */
  async getBillingCycle(cycleId: string): Promise<BillingCycleEvent | null> {
    try {
      const cycleRef = doc(this.billingCyclesCollection, cycleId);
      const cycleDoc = await getDoc(cycleRef);

      if (!cycleDoc.exists()) {
        return null;
      }

      const data = cycleDoc.data();
      return {
        id: cycleDoc.id,
        subscriptionId: data.subscriptionId,
        companyId: data.companyId,
        tenantId: data.tenantId,
        cycleStartDate: data.cycleStartDate.toDate(),
        cycleEndDate: data.cycleEndDate.toDate(),
        dueDate: data.dueDate.toDate(),
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        paymentAttempts: data.paymentAttempts,
        lastPaymentAttempt: data.lastPaymentAttempt ? data.lastPaymentAttempt.toDate() : undefined,
        paymentMethodId: data.paymentMethodId,
        invoiceId: data.invoiceId,
        metadata: data.metadata,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    } catch (error) {
      console.error('Error getting billing cycle:', error);
      throw new Error('Failed to get billing cycle');
    }
  }

  /**
   * Update a billing cycle's status
   * @param cycleId Billing cycle ID
   * @param status New status
   * @param additionalData Additional data to update
   */
  async updateBillingCycleStatus(
    cycleId: string,
    status: BillingCycleStatus,
    additionalData: Partial<BillingCycleEvent> = {}
  ): Promise<void> {
    try {
      const cycleRef = doc(this.billingCyclesCollection, cycleId);
      
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      // Add any additional data to update
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value instanceof Date) {
          updateData[key] = Timestamp.fromDate(value);
        } else {
          updateData[key] = value;
        }
      });

      await updateDoc(cycleRef, updateData);
    } catch (error) {
      console.error('Error updating billing cycle status:', error);
      throw new Error('Failed to update billing cycle status');
    }
  }

  /**
   * Get all billing cycles for a subscription
   * @param subscriptionId Subscription ID
   * @returns Array of billing cycle events
   */
  async getBillingCyclesForSubscription(subscriptionId: string): Promise<BillingCycleEvent[]> {
    try {
      const q = query(
        this.billingCyclesCollection,
        where('subscriptionId', '==', subscriptionId),
        orderBy('cycleStartDate', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          subscriptionId: data.subscriptionId,
          companyId: data.companyId,
          tenantId: data.tenantId,
          cycleStartDate: data.cycleStartDate.toDate(),
          cycleEndDate: data.cycleEndDate.toDate(),
          dueDate: data.dueDate.toDate(),
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          paymentAttempts: data.paymentAttempts,
          lastPaymentAttempt: data.lastPaymentAttempt ? data.lastPaymentAttempt.toDate() : undefined,
          paymentMethodId: data.paymentMethodId,
          invoiceId: data.invoiceId,
          metadata: data.metadata,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      });
    } catch (error) {
      console.error('Error getting billing cycles for subscription:', error);
      throw new Error('Failed to get billing cycles for subscription');
    }
  }

  /**
   * Get upcoming billing cycles for a company
   * @param companyId Company ID
   * @param count Number of upcoming cycles to retrieve
   * @returns Array of upcoming billing cycle events
   */
  async getUpcomingBillingCycles(companyId: string, count: number = 5): Promise<BillingCycleEvent[]> {
    try {
      const now = new Date();
      const q = query(
        this.billingCyclesCollection,
        where('companyId', '==', companyId),
        where('cycleStartDate', '>=', Timestamp.fromDate(now)),
        orderBy('cycleStartDate', 'asc'),
        limit(count)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          subscriptionId: data.subscriptionId,
          companyId: data.companyId,
          tenantId: data.tenantId,
          cycleStartDate: data.cycleStartDate.toDate(),
          cycleEndDate: data.cycleEndDate.toDate(),
          dueDate: data.dueDate.toDate(),
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          paymentAttempts: data.paymentAttempts,
          lastPaymentAttempt: data.lastPaymentAttempt ? data.lastPaymentAttempt.toDate() : undefined,
          paymentMethodId: data.paymentMethodId,
          invoiceId: data.invoiceId,
          metadata: data.metadata,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      });
    } catch (error) {
      console.error('Error getting upcoming billing cycles:', error);
      throw new Error('Failed to get upcoming billing cycles');
    }
  }

  /**
   * Generate billing cycles for a subscription
   * @param subscriptionId Subscription ID
   * @param count Number of billing cycles to generate
   * @returns Array of created billing cycle IDs
   */
  async generateBillingCycles(subscriptionId: string, count: number = 1): Promise<string[]> {
    try {
      // Get subscription details
      const subscriptionsRef = collection(db, 'companySubscriptions');
      const subscriptionDoc = await getDoc(doc(subscriptionsRef, subscriptionId));
      
      if (!subscriptionDoc.exists()) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }
      
      const data = subscriptionDoc.data();
      const subscription: Subscription = {
        id: subscriptionId,
        companyId: data.companyId,
        tenantId: data.tenantId,
        planId: data.planId,
        planName: data.planName,
        status: data.status,
        startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate),
        endDate: data.endDate ? (data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate)) : undefined,
        billingCycle: data.billingCycle,
        price: data.price,
        currency: data.currency
      };
      
      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        throw new Error(`Cannot generate billing cycles for subscription with status ${subscription.status}`);
      }
      
      // Get the latest billing cycle
      const existingCycles = await this.getBillingCyclesForSubscription(subscriptionId);
      let lastCycleEnd = existingCycles.length > 0 
        ? existingCycles[0].cycleEndDate 
        : subscription.startDate;
      
      const cycleIds: string[] = [];
      
      // Generate new billing cycles
      for (let i = 0; i < count; i++) {
        const { cycleStart, cycleEnd, dueDate } = this.calculateNextBillingCycleDates(
          lastCycleEnd,
          subscription.billingCycle
        );
        
        const cycleEvent: BillingCycleEvent = {
          subscriptionId,
          companyId: subscription.companyId,
          tenantId: subscription.tenantId || subscription.companyId,
          cycleStartDate: cycleStart,
          cycleEndDate: cycleEnd,
          dueDate,
          amount: subscription.price,
          currency: subscription.currency || 'USD',
          status: BillingCycleStatus.PENDING,
          paymentAttempts: 0,
          metadata: {
            planId: subscription.planId,
            planName: subscription.planName
          }
        };
        
        const cycleId = await this.createBillingCycle(cycleEvent);
        cycleIds.push(cycleId);
        
        // Update last cycle end for next iteration
        lastCycleEnd = cycleEnd;
      }
      
      return cycleIds;
    } catch (error) {
      console.error('Error generating billing cycles:', error);
      throw new Error('Failed to generate billing cycles');
    }
  }

  /**
   * Calculate next billing cycle dates based on a reference date and billing cycle frequency
   * @param referenceDate Date to calculate next cycle from
   * @param frequency Billing cycle frequency
   * @returns Object containing cycle start, end, and due dates
   */
  private calculateNextBillingCycleDates(
    referenceDate: Date,
    frequency: BillingCycleFrequency | string
  ): { cycleStart: Date; cycleEnd: Date; dueDate: Date } {
    const cycleStart = new Date(referenceDate);
    const cycleEnd = new Date(referenceDate);
    let daysInCycle = 30;
    
    // Add one day to start date (day after last cycle ended)
    cycleStart.setDate(cycleStart.getDate() + 1);
    
    switch (frequency) {
      case BillingCycleFrequency.MONTHLY:
        cycleEnd.setMonth(cycleEnd.getMonth() + 1);
        daysInCycle = 30;
        break;
      case BillingCycleFrequency.QUARTERLY:
        cycleEnd.setMonth(cycleEnd.getMonth() + 3);
        daysInCycle = 90;
        break;
      case BillingCycleFrequency.BIANNUAL:
        cycleEnd.setMonth(cycleEnd.getMonth() + 6);
        daysInCycle = 180;
        break;
      case BillingCycleFrequency.ANNUAL:
        cycleEnd.setFullYear(cycleEnd.getFullYear() + 1);
        daysInCycle = 365;
        break;
      case BillingCycleFrequency.CUSTOM:
        // Default to monthly if custom without specification
        cycleEnd.setMonth(cycleEnd.getMonth() + 1);
        daysInCycle = 30;
        break;
      default:
        // Default to monthly for unknown frequencies
        cycleEnd.setMonth(cycleEnd.getMonth() + 1);
        daysInCycle = 30;
    }
    
    // Set due date (typically cycle start date)
    const dueDate = new Date(cycleStart);
    
    return { cycleStart, cycleEnd, dueDate };
  }

  /**
   * Process pending billing cycles
   * @param count Maximum number of cycles to process
   * @returns Array of processed billing cycle IDs
   */
  async processPendingBillingCycles(count: number = 10): Promise<string[]> {
    try {
      // Get pending billing cycles that are due
      const now = new Date();
      const q = query(
        this.billingCyclesCollection,
        where('status', '==', BillingCycleStatus.PENDING),
        where('dueDate', '<=', Timestamp.fromDate(now)),
        orderBy('dueDate', 'asc'),
        limit(count)
      );
      
      const snapshot = await getDocs(q);
      const processedCycleIds: string[] = [];
      
      for (const cycleDoc of snapshot.docs) {
        const cycleId = cycleDoc.id;
        const cycleData = cycleDoc.data();
        
        try {
          // Mark cycle as processing
          await this.updateBillingCycleStatus(cycleId, BillingCycleStatus.PROCESSING, {
            paymentAttempts: cycleData.paymentAttempts + 1,
            lastPaymentAttempt: new Date()
          });
          
          // Get subscription and company details
          const subscriptionsRef = collection(db, 'companySubscriptions');
          const subscriptionDoc = await getDoc(doc(subscriptionsRef, cycleData.subscriptionId));
          
          if (!subscriptionDoc.exists()) {
            await this.updateBillingCycleStatus(cycleId, BillingCycleStatus.FAILED, {
              metadata: {
                ...cycleData.metadata,
                error: 'Subscription not found'
              }
            });
            continue;
          }
          
          const data = subscriptionDoc.data();
          const subscription: Subscription = {
            id: cycleData.subscriptionId,
            companyId: data.companyId,
            tenantId: data.tenantId,
            planId: data.planId,
            planName: data.planName,
            status: data.status,
            startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate),
            endDate: data.endDate ? (data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate)) : undefined,
            billingCycle: data.billingCycle,
            price: data.price,
            currency: data.currency
          };
          
          if (subscription.status !== 'active') {
            await this.updateBillingCycleStatus(cycleId, BillingCycleStatus.CANCELLED, {
              metadata: {
                ...cycleData.metadata,
                reason: `Subscription status is ${subscription.status}`
              }
            });
            continue;
          }
          
          // Get customer payment method
          const customer = await this.paymentService.getCustomerByCompanyId(cycleData.companyId);
          
          if (!customer) {
            await this.updateBillingCycleStatus(cycleId, BillingCycleStatus.FAILED, {
              metadata: {
                ...cycleData.metadata,
                error: 'Customer not found'
              }
            });
            continue;
          }
          
          const defaultPaymentMethod = customer.paymentMethods?.find(pm => pm.default);
          
          if (!defaultPaymentMethod) {
            await this.updateBillingCycleStatus(cycleId, BillingCycleStatus.FAILED, {
              metadata: {
                ...cycleData.metadata,
                error: 'No default payment method found'
              }
            });
            continue;
          }
          
          // Generate invoice
          const generateInvoice = httpsCallable(functions, 'generateInvoice');
          const invoiceResponse = await generateInvoice({
            companyId: cycleData.companyId,
            subscriptionId: cycleData.subscriptionId,
            billingCycleId: cycleId,
            amount: cycleData.amount,
            currency: cycleData.currency,
            description: `Subscription billing for period ${cycleData.cycleStartDate.toDate().toISOString().split('T')[0]} to ${cycleData.cycleEndDate.toDate().toISOString().split('T')[0]}`,
            items: [
              {
                name: subscription.planName || 'Subscription',
                description: `${subscription.billingCycle} billing cycle`,
                quantity: 1,
                unitPrice: cycleData.amount
              }
            ]
          });
          
          const invoiceId = (invoiceResponse.data as { invoiceId: string }).invoiceId;
          
          // Process payment
          const processPayment = httpsCallable(functions, 'processSubscriptionPayment');
          const paymentResponse = await processPayment({
            companyId: cycleData.companyId,
            subscriptionId: cycleData.subscriptionId,
            billingCycleId: cycleId,
            invoiceId,
            paymentMethodId: defaultPaymentMethod.id,
            amount: cycleData.amount,
            currency: cycleData.currency
          });
          
          // Mark cycle as completed
          await this.updateBillingCycleStatus(cycleId, BillingCycleStatus.COMPLETED, {
            invoiceId,
            paymentMethodId: defaultPaymentMethod.id,
            metadata: {
              ...cycleData.metadata,
              paymentId: (paymentResponse.data as { paymentId: string }).paymentId,
              receiptUrl: (paymentResponse.data as { receiptUrl: string }).receiptUrl
            }
          });
          
          processedCycleIds.push(cycleId);
        } catch (error: any) {
          console.error(`Error processing billing cycle ${cycleId}:`, error);
          
          // Update status to failed
          await this.updateBillingCycleStatus(cycleId, BillingCycleStatus.FAILED, {
            metadata: {
              ...cycleData.metadata,
              error: error.message || 'Unknown error'
            }
          });
        }
      }
      
      return processedCycleIds;
    } catch (error) {
      console.error('Error processing pending billing cycles:', error);
      throw new Error('Failed to process pending billing cycles');
    }
  }

  /**
   * Retry a failed billing cycle
   * @param cycleId Billing cycle ID
   * @returns True if retry was successful
   */
  async retryBillingCycle(cycleId: string): Promise<boolean> {
    try {
      const cycle = await this.getBillingCycle(cycleId);
      
      if (!cycle) {
        throw new Error(`Billing cycle ${cycleId} not found`);
      }
      
      if (cycle.status !== BillingCycleStatus.FAILED) {
        throw new Error(`Cannot retry billing cycle with status ${cycle.status}`);
      }
      
      // Reset status to pending
      await this.updateBillingCycleStatus(cycleId, BillingCycleStatus.PENDING);
      
      // Process the cycle
      const processRetry = httpsCallable(functions, 'processRetryBillingCycle');
      await processRetry({ billingCycleId: cycleId });
      
      return true;
    } catch (error) {
      console.error('Error retrying billing cycle:', error);
      throw new Error('Failed to retry billing cycle');
    }
  }

  /**
   * Cancel a pending billing cycle
   * @param cycleId Billing cycle ID
   * @param reason Reason for cancellation
   */
  async cancelBillingCycle(cycleId: string, reason: string): Promise<void> {
    try {
      const cycle = await this.getBillingCycle(cycleId);
      
      if (!cycle) {
        throw new Error(`Billing cycle ${cycleId} not found`);
      }
      
      if (cycle.status !== BillingCycleStatus.PENDING) {
        throw new Error(`Cannot cancel billing cycle with status ${cycle.status}`);
      }
      
      await this.updateBillingCycleStatus(cycleId, BillingCycleStatus.CANCELLED, {
        metadata: {
          ...cycle.metadata,
          cancellationReason: reason,
          cancelledAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error cancelling billing cycle:', error);
      throw new Error('Failed to cancel billing cycle');
    }
  }

  /**
   * Get current billing cycle for a subscription
   * @param subscriptionId Subscription ID
   * @returns Current billing cycle or null if not found
   */
  async getCurrentBillingCycle(subscriptionId: string): Promise<BillingCycleEvent | null> {
    try {
      const now = new Date();
      const q = query(
        this.billingCyclesCollection,
        where('subscriptionId', '==', subscriptionId),
        where('cycleStartDate', '<=', Timestamp.fromDate(now)),
        where('cycleEndDate', '>=', Timestamp.fromDate(now)),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const data = snapshot.docs[0].data();
      return {
        id: snapshot.docs[0].id,
        subscriptionId: data.subscriptionId,
        companyId: data.companyId,
        tenantId: data.tenantId,
        cycleStartDate: data.cycleStartDate.toDate(),
        cycleEndDate: data.cycleEndDate.toDate(),
        dueDate: data.dueDate.toDate(),
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        paymentAttempts: data.paymentAttempts,
        lastPaymentAttempt: data.lastPaymentAttempt ? data.lastPaymentAttempt.toDate() : undefined,
        paymentMethodId: data.paymentMethodId,
        invoiceId: data.invoiceId,
        metadata: data.metadata,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    } catch (error) {
      console.error('Error getting current billing cycle:', error);
      throw new Error('Failed to get current billing cycle');
    }
  }
}

export default BillingCycleService; 