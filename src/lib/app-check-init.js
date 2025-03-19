import { initializeAppCheck, ReCaptchaV3Provider, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { app } from './firebase/config';

let appCheck = null;

/**
 * Initializes Firebase App Check if supported and enabled
 */
export const initializeAppCheckService = () => {
  try {
    // Check if app check is enabled via environment variable
    if (process.env.NEXT_PUBLIC_ENABLE_APP_CHECK !== 'true') {
      console.log('Firebase App Check is disabled via configuration');
      return null;
    }

    // Get reCAPTCHA site key from environment variables
    const reCaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    
    if (!reCaptchaSiteKey) {
      console.error('reCAPTCHA site key not found in environment variables');
      return null;
    }

    // Enable debug mode in development
    if (process.env.NODE_ENV === 'development') {
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    // Initialize App Check
    const app = getApp();
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(reCaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    });
    
    console.log('Firebase App Check initialized successfully');
    return appCheck;
  } catch (error) {
    console.error('Error initializing Firebase App Check:', error);
    return null;
  }
} 