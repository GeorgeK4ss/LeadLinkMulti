import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from './firebase/config';

// Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: EmailCategory;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type EmailCategory = 'welcome' | 'follow-up' | 'newsletter' | 'notification' | 'marketing' | 'custom';

export interface EmailSchedule {
  id?: string;
  templateId: string;
  recipients: string[];
  scheduledFor: Timestamp;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  metadata?: Record<string, any>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface EmailVariables {
  [key: string]: string | number | boolean | null | undefined;
}

// Default templates
export const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to LeadLink CRM!',
    body: `
      <h1>Welcome to LeadLink CRM!</h1>
      <p>Dear {{name}},</p>
      <p>Thank you for joining LeadLink CRM. We're excited to have you on board!</p>
      <p>Here are a few things you can do to get started:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Import your contacts</li>
        <li>Set up your first workflow</li>
      </ul>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>The LeadLink Team</p>
    `,
    category: 'welcome'
  },
  {
    name: 'Follow-up Email',
    subject: 'Following up on our conversation',
    body: `
      <h1>Following Up</h1>
      <p>Dear {{name}},</p>
      <p>I wanted to follow up on our conversation about {{topic}}.</p>
      <p>As discussed, I've outlined the next steps below:</p>
      <ul>
        <li>{{nextStep1}}</li>
        <li>{{nextStep2}}</li>
      </ul>
      <p>Please let me know if you have any questions or if there's anything else I can help with.</p>
      <p>Best regards,<br>{{senderName}}</p>
    `,
    category: 'follow-up'
  },
  {
    name: 'Monthly Newsletter',
    subject: 'Your Monthly Update from LeadLink',
    body: `
      <h1>Monthly Newsletter</h1>
      <p>Dear {{name}},</p>
      <p>Here's your monthly update from LeadLink CRM:</p>
      <h2>Latest Features</h2>
      <p>{{latestFeatures}}</p>
      <h2>Tips & Tricks</h2>
      <p>{{tipsAndTricks}}</p>
      <h2>Upcoming Events</h2>
      <p>{{upcomingEvents}}</p>
      <p>Thank you for being a valued customer!</p>
      <p>Best regards,<br>The LeadLink Team</p>
    `,
    category: 'newsletter'
  }
];

/**
 * Process template variables in the email content
 */
export const processTemplate = (template: EmailTemplate, variables: EmailVariables): EmailTemplate => {
  let processedSubject = template.subject;
  let processedBody = template.body;
  
  // Replace variables in subject and body
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedSubject = processedSubject.replace(regex, String(value || ''));
    processedBody = processedBody.replace(regex, String(value || ''));
  });
  
  // Remove any remaining template variables
  processedSubject = processedSubject.replace(/{{[^{}]+}}/g, '');
  processedBody = processedBody.replace(/{{[^{}]+}}/g, '');
  
  return {
    ...template,
    subject: processedSubject,
    body: processedBody
  };
};

/**
 * Schedule an email to be sent at a specific time
 */
export const scheduleEmail = async (
  templateId: string,
  recipients: string[],
  scheduledFor: Date,
  variables: EmailVariables = {}
): Promise<string> => {
  try {
    const emailSchedule: Omit<EmailSchedule, 'id'> = {
      templateId,
      recipients,
      scheduledFor: Timestamp.fromDate(scheduledFor),
      status: 'scheduled',
      metadata: { variables },
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'emailSchedules'), emailSchedule);
    return docRef.id;
  } catch (error) {
    console.error('Error scheduling email:', error);
    throw new Error('Failed to schedule email');
  }
};

/**
 * Cancel a scheduled email
 */
export const cancelScheduledEmail = async (scheduleId: string): Promise<void> => {
  try {
    // In a real implementation, this would update the status in Firestore
    console.log(`Cancelling scheduled email with ID: ${scheduleId}`);
    // await updateDoc(doc(db, 'emailSchedules', scheduleId), { status: 'cancelled' });
  } catch (error) {
    console.error('Error cancelling scheduled email:', error);
    throw new Error('Failed to cancel scheduled email');
  }
};

/**
 * Extract template variables from a template
 */
export const extractTemplateVariables = (template: EmailTemplate): string[] => {
  const combinedText = template.subject + template.body;
  const matches = combinedText.match(/{{([^{}]+)}}/g) || [];
  
  // Extract variable names and remove duplicates
  return [...new Set(matches.map(match => match.replace(/{{|}}/g, '')))];
};

/**
 * Get email template categories with labels
 */
export const getEmailCategories = (): { value: EmailCategory; label: string }[] => {
  return [
    { value: 'welcome', label: 'Welcome Emails' },
    { value: 'follow-up', label: 'Follow-up Emails' },
    { value: 'newsletter', label: 'Newsletters' },
    { value: 'notification', label: 'Notifications' },
    { value: 'marketing', label: 'Marketing Campaigns' },
    { value: 'custom', label: 'Custom Templates' }
  ];
}; 