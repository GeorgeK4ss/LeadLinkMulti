const admin = require('firebase-admin');
let serviceAccount;

// Initialize Firebase Admin with environment variables if available, otherwise use service account file
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  // Service account from environment variable (base64 encoded)
  const serviceAccountJson = Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    'base64'
  ).toString('utf8');
  
  serviceAccount = JSON.parse(serviceAccountJson);
} else if (process.env.FIREBASE_PROJECT_ID) {
  // For environments with Application Default Credentials
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
} else {
  // Fallback to local service account file
  try {
    serviceAccount = require('../src/lib/firebase/service-account.json');
  } catch (error) {
    console.error('Failed to load service account:', error);
    process.exit(1);
  }
}

// Initialize the app if we have a service account
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function configureEmailTemplates() {
  console.log('Configuring Firebase Authentication email templates...');

  try {
    // Configure email templates
    const actionCodeSettings = {
      url: 'https://lead-link-multi-tenant.web.app/login',
      handleCodeInApp: false
    };

    // Password reset email template
    await admin.auth().updateConfig({
      passwordResetTemplate: {
        body: `
          <p>Hello,</p>
          <p>You requested to reset your password for LeadLink CRM.</p>
          <p>Please click the link below to reset your password:</p>
          <p><a href="{{ link }}">Reset password</a></p>
          <p>If you did not request a password reset, you can ignore this email.</p>
          <p>Thank you,<br>LeadLink CRM Team</p>
        `,
        subject: 'Reset your LeadLink CRM password',
        fromDisplayName: 'LeadLink CRM Support',
        replyTo: 'support@leadlink.com'
      }
    });
    console.log('Password reset template updated');

    // Email verification template
    await admin.auth().updateConfig({
      verifyEmailTemplate: {
        body: `
          <p>Hello,</p>
          <p>Thank you for registering with LeadLink CRM.</p>
          <p>Please click the link below to verify your email address:</p>
          <p><a href="{{ link }}">Verify email</a></p>
          <p>If you did not create an account, you can ignore this email.</p>
          <p>Thank you,<br>LeadLink CRM Team</p>
        `,
        subject: 'Verify your email for LeadLink CRM',
        fromDisplayName: 'LeadLink CRM',
        replyTo: 'noreply@leadlink.com'
      }
    });
    console.log('Email verification template updated');

    // Email sign-in template
    await admin.auth().updateConfig({
      emailSignInTemplate: {
        body: `
          <p>Hello,</p>
          <p>Click the link below to sign in to LeadLink CRM:</p>
          <p><a href="{{ link }}">Sign in</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this email, you can ignore it.</p>
          <p>Thank you,<br>LeadLink CRM Team</p>
        `,
        subject: 'Sign in to LeadLink CRM',
        fromDisplayName: 'LeadLink CRM',
        replyTo: 'noreply@leadlink.com'
      }
    });
    console.log('Email sign-in template updated');

    console.log('Email templates configured successfully!');
  } catch (error) {
    console.error('Error configuring email templates:', error);
  } finally {
    // Terminate the Firebase Admin app
    await admin.app().delete();
  }
}

// Run the configuration
configureEmailTemplates(); 