import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  serverTimestamp,
  DocumentReference
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { httpsCallable, Functions } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';

// Get Firebase functions instance
const functions = getFunctions();

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BRAINTREE = 'braintree',
  MANUAL = 'manual'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELED = 'canceled',
  DISPUTED = 'disputed'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  PAYPAL = 'paypal',
  INVOICE = 'invoice'
}

export interface PaymentCard {
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  billingAddress?: Address;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethodDetails {
  id: string;
  type: PaymentMethod;
  default: boolean;
  card?: PaymentCard;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntent {
  id: string;
  companyId: string;
  customerId?: string;
  amount: number;
  currency: string;
  description?: string;
  status: PaymentStatus;
  paymentMethod?: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  metadata?: Record<string, any>;
  receiptUrl?: string;
  subscriptionId?: string;
  invoiceId?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
}

export interface CustomerPaymentProfile {
  id: string;
  companyId: string;
  userId?: string;
  email: string;
  name?: string;
  phone?: string;
  defaultPaymentMethodId?: string;
  paymentMethods: PaymentMethodDetails[];
  provider: PaymentProvider;
  providerCustomerId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  companyId: string;
  customerId?: string;
  subscriptionId?: string;
  invoiceNumber: string;
  amount: number;
  tax?: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'void' | 'overdue';
  dueDate: Date;
  items: {
    description: string;
    amount: number;
    quantity: number;
  }[];
  subtotal: number;
  total: number;
  notes?: string;
  paymentIntentId?: string;
  pdfUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
}

export class PaymentGatewayService {
  private customersCollection = collection(db, 'paymentCustomers');
  private paymentMethodsCollection = collection(db, 'paymentMethods');
  private paymentIntentsCollection = collection(db, 'paymentIntents');
  private invoicesCollection = collection(db, 'invoices');
  
  private defaultProvider: PaymentProvider = PaymentProvider.STRIPE;
  
  /**
   * Create a new customer payment profile
   */
  async createCustomer(
    companyId: string, 
    email: string, 
    name?: string,
    provider: PaymentProvider = this.defaultProvider
  ): Promise<CustomerPaymentProfile> {
    try {
      // Check if customer already exists
      const existingCustomer = await this.getCustomerByCompanyId(companyId);
      if (existingCustomer) {
        return existingCustomer;
      }
      
      // Call Cloud Function to create customer in payment provider
      const createCustomerFn = httpsCallable(functions, 'createPaymentCustomer');
      const result = await createCustomerFn({
        email,
        name,
        companyId,
        provider
      });
      
      // Type assertion for the response data
      const providerCustomerId = (result.data as { customerId: string }).customerId;
      
      // Store customer in Firestore
      const now = new Date();
      const customerData: Omit<CustomerPaymentProfile, 'id'> = {
        companyId,
        email,
        name,
        paymentMethods: [],
        provider,
        providerCustomerId,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(this.customersCollection, {
        ...customerData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...customerData
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create payment customer');
    }
  }
  
  /**
   * Get a customer by company ID
   */
  async getCustomerByCompanyId(companyId: string): Promise<CustomerPaymentProfile | null> {
    try {
      const q = query(
        this.customersCollection,
        where('companyId', '==', companyId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        paymentMethods: data.paymentMethods?.map((method: any) => ({
          ...method,
          createdAt: method.createdAt instanceof Timestamp ? method.createdAt.toDate() : method.createdAt,
          updatedAt: method.updatedAt instanceof Timestamp ? method.updatedAt.toDate() : method.updatedAt
        })) || []
      } as CustomerPaymentProfile;
    } catch (error) {
      console.error('Error getting customer:', error);
      throw new Error('Failed to retrieve payment customer');
    }
  }
  
  /**
   * Add a payment method to a customer
   */
  async addPaymentMethod(
    customerId: string, 
    paymentMethodToken: string,
    makeDefault: boolean = false
  ): Promise<PaymentMethodDetails> {
    try {
      // Get the customer
      const customerRef = doc(this.customersCollection, customerId);
      const customerDoc = await getDoc(customerRef);
      
      if (!customerDoc.exists()) {
        throw new Error(`Customer ${customerId} not found`);
      }
      
      const customerData = customerDoc.data() as CustomerPaymentProfile;
      
      // Call Cloud Function to add payment method
      const addPaymentMethodFn = httpsCallable(functions, 'addPaymentMethod');
      const result = await addPaymentMethodFn({
        customerId,
        providerCustomerId: customerData.providerCustomerId,
        paymentMethodToken,
        provider: customerData.provider,
        makeDefault
      });
      
      // Type assertion for the response data
      const paymentMethodData = result.data as PaymentMethodDetails;
      
      // Update customer with new payment method
      const now = new Date();
      const newPaymentMethod: PaymentMethodDetails = {
        ...paymentMethodData,
        default: makeDefault,
        createdAt: now,
        updatedAt: now
      };
      
      // Get existing payment methods
      let paymentMethods = customerData.paymentMethods || [];
      
      // If this is default, remove default from others
      if (makeDefault) {
        paymentMethods = paymentMethods.map(method => ({
          ...method,
          default: false,
          updatedAt: now
        }));
      }
      
      // Add the new payment method
      paymentMethods.push(newPaymentMethod);
      
      // Update the customer document
      await updateDoc(customerRef, {
        paymentMethods,
        defaultPaymentMethodId: makeDefault ? newPaymentMethod.id : customerData.defaultPaymentMethodId,
        updatedAt: serverTimestamp()
      });
      
      return newPaymentMethod;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw new Error('Failed to add payment method');
    }
  }
  
  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(
    customerId: string, 
    paymentMethodId: string
  ): Promise<void> {
    try {
      // Get the customer
      const customerRef = doc(this.customersCollection, customerId);
      const customerDoc = await getDoc(customerRef);
      
      if (!customerDoc.exists()) {
        throw new Error(`Customer ${customerId} not found`);
      }
      
      const customerData = customerDoc.data() as CustomerPaymentProfile;
      
      // Find the payment method
      const paymentMethods = customerData.paymentMethods || [];
      const methodIndex = paymentMethods.findIndex(m => m.id === paymentMethodId);
      
      if (methodIndex === -1) {
        throw new Error(`Payment method ${paymentMethodId} not found`);
      }
      
      // Update payment methods
      const now = new Date();
      const updatedMethods = paymentMethods.map((method, index) => ({
        ...method,
        default: index === methodIndex,
        updatedAt: index === methodIndex ? now : method.updatedAt
      }));
      
      // Call Cloud Function to update default payment method
      const setDefaultMethodFn = httpsCallable(functions, 'setDefaultPaymentMethod');
      await setDefaultMethodFn({
        customerId,
        providerCustomerId: customerData.providerCustomerId,
        paymentMethodId,
        provider: customerData.provider
      });
      
      // Update the customer document
      await updateDoc(customerRef, {
        paymentMethods: updatedMethods,
        defaultPaymentMethodId: paymentMethodId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw new Error('Failed to set default payment method');
    }
  }
  
  /**
   * Remove a payment method
   */
  async removePaymentMethod(
    customerId: string, 
    paymentMethodId: string
  ): Promise<void> {
    try {
      // Get the customer
      const customerRef = doc(this.customersCollection, customerId);
      const customerDoc = await getDoc(customerRef);
      
      if (!customerDoc.exists()) {
        throw new Error(`Customer ${customerId} not found`);
      }
      
      const customerData = customerDoc.data() as CustomerPaymentProfile;
      
      // Find the payment method
      const paymentMethods = customerData.paymentMethods || [];
      const methodIndex = paymentMethods.findIndex(m => m.id === paymentMethodId);
      
      if (methodIndex === -1) {
        throw new Error(`Payment method ${paymentMethodId} not found`);
      }
      
      // Call Cloud Function to remove payment method
      const removePaymentMethodFn = httpsCallable(functions, 'removePaymentMethod');
      await removePaymentMethodFn({
        customerId,
        providerCustomerId: customerData.providerCustomerId,
        paymentMethodId,
        provider: customerData.provider
      });
      
      // Remove the method
      const isDefault = paymentMethods[methodIndex].default;
      const filteredMethods = paymentMethods.filter(m => m.id !== paymentMethodId);
      
      // If we removed the default method, set a new default if available
      let defaultPaymentMethodId = customerData.defaultPaymentMethodId;
      if (isDefault && filteredMethods.length > 0) {
        defaultPaymentMethodId = filteredMethods[0].id;
        filteredMethods[0].default = true;
      } else if (filteredMethods.length === 0) {
        defaultPaymentMethodId = undefined;
      }
      
      // Update the customer document
      await updateDoc(customerRef, {
        paymentMethods: filteredMethods,
        defaultPaymentMethodId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw new Error('Failed to remove payment method');
    }
  }
  
  /**
   * Create a payment intent
   */
  async createPaymentIntent(
    companyId: string,
    amount: number,
    currency: string = 'USD',
    description?: string,
    paymentMethodId?: string,
    subscriptionId?: string,
    invoiceId?: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    try {
      // Get or create customer
      const customer = await this.getCustomerByCompanyId(companyId);
      
      if (!customer) {
        throw new Error(`No payment customer found for company ${companyId}`);
      }
      
      // Call Cloud Function to create payment intent
      const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
      const result = await createPaymentIntentFn({
        amount,
        currency,
        description,
        customerId: customer.id,
        providerCustomerId: customer.providerCustomerId,
        paymentMethodId,
        provider: customer.provider,
        metadata: {
          ...metadata,
          companyId,
          subscriptionId,
          invoiceId
        }
      });
      
      // Type assertion for the response data
      const providerIntentData = result.data as { id: string };
      
      // Store payment intent in Firestore
      const now = new Date();
      const paymentIntentData: Omit<PaymentIntent, 'id'> = {
        companyId,
        customerId: customer.id,
        amount,
        currency,
        description,
        status: PaymentStatus.PENDING,
        paymentMethod: paymentMethodId,
        provider: customer.provider,
        providerPaymentId: providerIntentData.id,
        metadata: {
          ...metadata,
          subscriptionId,
          invoiceId
        },
        subscriptionId,
        invoiceId,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(this.paymentIntentsCollection, {
        ...paymentIntentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...paymentIntentData
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }
  
  /**
   * Process a payment
   */
  async processPayment(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<PaymentIntent> {
    try {
      // Get the payment intent
      const intentRef = doc(this.paymentIntentsCollection, paymentIntentId);
      const intentDoc = await getDoc(intentRef);
      
      if (!intentDoc.exists()) {
        throw new Error(`Payment intent ${paymentIntentId} not found`);
      }
      
      const intentData = intentDoc.data() as PaymentIntent;
      
      // Update status to processing
      await updateDoc(intentRef, {
        status: PaymentStatus.PROCESSING,
        updatedAt: serverTimestamp()
      });
      
      // Get the customer
      const customer = await this.getCustomerByCompanyId(intentData.companyId);
      
      if (!customer) {
        throw new Error(`No payment customer found for company ${intentData.companyId}`);
      }
      
      // Process payment via Cloud Function
      const processPaymentFn = httpsCallable(functions, 'processPayment');
      const result = await processPaymentFn({
        paymentIntentId: intentData.providerPaymentId,
        customerId: customer.providerCustomerId,
        paymentMethodId: paymentMethodId || intentData.paymentMethod,
        provider: intentData.provider
      });
      
      // Type assertion for the response data
      const processedData = result.data as { 
        status: PaymentStatus; 
        receiptUrl: string 
      };
      const now = new Date();
      
      // Update payment intent with result
      const updateData: Partial<PaymentIntent> = {
        status: processedData.status,
        receiptUrl: processedData.receiptUrl,
        updatedAt: now
      };
      
      if (processedData.status === PaymentStatus.COMPLETED) {
        updateData.completedAt = now;
        
        // If this was for an invoice, update the invoice
        if (intentData.invoiceId) {
          const invoiceRef = doc(this.invoicesCollection, intentData.invoiceId);
          await updateDoc(invoiceRef, {
            status: 'paid',
            paidAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } else if (processedData.status === PaymentStatus.FAILED) {
        updateData.failedAt = now;
      }
      
      await updateDoc(intentRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      return {
        ...intentData,
        ...updateData
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      
      // Update payment intent to failed status
      const intentRef = doc(this.paymentIntentsCollection, paymentIntentId);
      await updateDoc(intentRef, {
        status: PaymentStatus.FAILED,
        failedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      throw new Error('Payment processing failed');
    }
  }
  
  /**
   * Create a subscription
   */
  async createSubscription(
    companyId: string,
    planId: string,
    paymentMethodId?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Get or create customer
      const customer = await this.getCustomerByCompanyId(companyId);
      
      if (!customer) {
        throw new Error(`No payment customer found for company ${companyId}`);
      }
      
      // If no payment method specified, use default
      if (!paymentMethodId && customer.defaultPaymentMethodId) {
        paymentMethodId = customer.defaultPaymentMethodId;
      }
      
      if (!paymentMethodId) {
        throw new Error('No payment method specified and no default method found');
      }
      
      // Call Cloud Function to create subscription
      const createSubscriptionFn = httpsCallable(functions, 'createSubscription');
      const result = await createSubscriptionFn({
        customerId: customer.providerCustomerId,
        planId,
        paymentMethodId,
        provider: customer.provider,
        metadata: {
          ...metadata,
          companyId
        }
      });
      
      // Type assertion for the response data
      const subscriptionData = result.data as { subscriptionId: string };
      
      // Return the subscription ID
      return subscriptionData.subscriptionId;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }
  
  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediateEffect: boolean = false
  ): Promise<void> {
    try {
      // Call Cloud Function to cancel subscription
      const cancelSubscriptionFn = httpsCallable(functions, 'cancelSubscription');
      await cancelSubscriptionFn({
        subscriptionId,
        immediateEffect
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }
  
  /**
   * Generate invoice
   */
  async generateInvoice(
    companyId: string,
    items: {
      description: string;
      amount: number;
      quantity: number;
    }[],
    dueDate: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    subscriptionId?: string,
    notes?: string,
    metadata?: Record<string, any>
  ): Promise<Invoice> {
    try {
      // Calculate totals
      const subtotal = items.reduce((total, item) => total + (item.amount * item.quantity), 0);
      const tax = 0; // Calculate tax if needed
      const total = subtotal + tax;
      
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString().substring(0, 10)}`;
      
      // Create invoice in Firestore
      const now = new Date();
      const invoiceData: Omit<Invoice, 'id'> = {
        companyId,
        invoiceNumber,
        amount: total,
        subtotal,
        tax,
        currency: 'USD',
        status: 'draft',
        dueDate,
        items,
        total,
        notes,
        subscriptionId,
        metadata,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(this.invoicesCollection, {
        ...invoiceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dueDate: Timestamp.fromDate(dueDate)
      });
      
      // Generate PDF via Cloud Function
      const generateInvoicePdfFn = httpsCallable(functions, 'generateInvoicePdf');
      const result = await generateInvoicePdfFn({
        invoiceId: docRef.id
      });
      
      // Type assertion for the response data
      const pdfData = result.data as { pdfUrl: string };
      
      // Update invoice with PDF URL
      await updateDoc(docRef, {
        pdfUrl: pdfData.pdfUrl,
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...invoiceData,
        pdfUrl: pdfData.pdfUrl
      };
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw new Error('Failed to generate invoice');
    }
  }
  
  /**
   * Send invoice to customer
   */
  async sendInvoice(invoiceId: string): Promise<void> {
    try {
      // Get the invoice
      const invoiceRef = doc(this.invoicesCollection, invoiceId);
      const invoiceDoc = await getDoc(invoiceRef);
      
      if (!invoiceDoc.exists()) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }
      
      const invoiceData = invoiceDoc.data() as Invoice;
      
      // Update invoice status
      await updateDoc(invoiceRef, {
        status: 'sent',
        updatedAt: serverTimestamp()
      });
      
      // Send email via Cloud Function
      const sendInvoiceEmailFn = httpsCallable(functions, 'sendInvoiceEmail');
      await sendInvoiceEmailFn({
        invoiceId,
        companyId: invoiceData.companyId
      });
    } catch (error) {
      console.error('Error sending invoice:', error);
      throw new Error('Failed to send invoice');
    }
  }
  
  /**
   * Get all invoices for a company
   */
  async getCompanyInvoices(companyId: string): Promise<Invoice[]> {
    try {
      const q = query(
        this.invoicesCollection,
        where('companyId', '==', companyId),
        where('status', 'in', ['draft', 'sent', 'paid', 'overdue'])
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          paidAt: data.paidAt instanceof Timestamp ? data.paidAt.toDate() : data.paidAt
        } as Invoice;
      });
    } catch (error) {
      console.error('Error getting company invoices:', error);
      throw new Error('Failed to retrieve invoices');
    }
  }
  
  /**
   * Get payment history for a company
   */
  async getPaymentHistory(companyId: string): Promise<PaymentIntent[]> {
    try {
      const q = query(
        this.paymentIntentsCollection,
        where('companyId', '==', companyId)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt,
          failedAt: data.failedAt instanceof Timestamp ? data.failedAt.toDate() : data.failedAt,
          refundedAt: data.refundedAt instanceof Timestamp ? data.refundedAt.toDate() : data.refundedAt
        } as PaymentIntent;
      });
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw new Error('Failed to retrieve payment history');
    }
  }
}

export default PaymentGatewayService; 