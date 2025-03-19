# Firebase Setup for LeadLink CRM

This document provides information on how to access and use the Firebase services that have been set up for the LeadLink CRM application.

## Accessing Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the project: `lead-link-multi-tenant`
3. You'll see the dashboard with all available services

## Authentication

The system has been set up with an admin user:

- **Email**: admin@leadlink.com
- **Password**: Admin123!

You can use these credentials to log in to the application. For security reasons, please change this password after your first login.

### Adding More Users

1. Go to Firebase Console > Authentication
2. Click "Add User"
3. Enter email and password
4. Assign appropriate roles in the Firestore database

## Firestore Database

The following collections have been initialized:

- **users**: User profiles and information
- **userRoles**: Role definitions and permissions
- **organizations**: Multi-tenant organization data
- **leads**: Lead information
- **activities**: Activity logs for leads

### Accessing Data

1. Go to Firebase Console > Firestore Database
2. Browse through the collections to view and edit data

## Realtime Database

The Realtime Database has been set up with the following structure:

- **/status**: User online status
- **/notifications**: Real-time notifications
- **/metrics**: System metrics
- **/presence**: User presence information
- **/activity**: Recent activity logs

### Accessing Data

1. Go to Firebase Console > Realtime Database
2. Browse through the data structure to view and edit data

## Storage

The Storage bucket has been organized with the following folder structure:

- **/users/avatars**: User profile images
- **/organizations/logos**: Organization logos
- **/leads/documents**: Documents related to leads
- **/exports**: Generated exports
- **/imports**: Temporary import files
- **/templates**: System templates
- **/public**: Publicly accessible files

### Accessing Files

1. Go to Firebase Console > Storage
2. Browse through the folders to view and manage files

## Cloud Functions

Several Cloud Functions have been deployed to handle backend operations:

- **ping**: Simple health check function
- **createLead**: API endpoint for lead creation
- **getTenantStats**: Get statistics for a tenant
- **webhook**: External integration webhook

Additional functions will be deployed in subsequent updates.

### Accessing Functions

1. Go to Firebase Console > Functions
2. View logs and monitor function execution

## Hosting

The application has been deployed to Firebase Hosting and is accessible at:

- [https://lead-link-multi-tenant.web.app](https://lead-link-multi-tenant.web.app)

## Next Steps

1. **Complete Function Deployment**: Some functions failed to deploy due to permission issues. Retry deployment after a few minutes.
2. **Set Up Custom Domain**: Configure a custom domain for your application.
3. **Configure Email Templates**: Set up email templates for authentication and notifications.
4. **Enable Analytics**: Configure Firebase Analytics for tracking user behavior.
5. **Set Up Monitoring**: Configure alerts and monitoring for your application.

## Troubleshooting

If you encounter any issues:

1. Check Firebase Console logs for errors
2. Verify that all required APIs are enabled
3. Ensure proper permissions are set for service accounts
4. Review security rules for Firestore, Realtime Database, and Storage

## Security Considerations

1. Change the default admin password immediately
2. Review and update security rules regularly
3. Set up Firebase App Check to prevent abuse
4. Enable MFA for Firebase Console access
5. Regularly audit user permissions and access 