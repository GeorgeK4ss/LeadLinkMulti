# LeadLink CRM Firebase Functions

This directory contains the Firebase Cloud Functions for the LeadLink CRM system. These functions handle various backend operations, data processing, and API endpoints.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
- Copy `.env.example` to `.env`
- Fill in the required values

3. Deploy functions:
```bash
npm run deploy
```

## Available Functions

### Authentication Functions
- `onUserCreated`: Creates user document when a new user signs up
- `onUserDeleted`: Cleans up user data when account is deleted
- `setCustomClaims`: Sets default role and permissions for new users

### Storage Functions
- `processImage`: Automatically generates thumbnails for uploaded images
- `cleanupFiles`: Removes associated files when main file is deleted

### Firestore Triggers
- `onTenantWrite`: Updates company statistics when tenants are modified
- `onLeadWrite`: Updates tenant statistics when leads are modified
- `onCustomerUpdate`: Creates activity logs for customer changes

### API Endpoints
- `createLead`: Creates a new lead with proper validation
- `getTenantStats`: Retrieves statistics for a specific tenant
- `webhook`: Handles external integrations via webhooks

## Development

1. Run functions locally:
```bash
npm run serve
```

2. Test functions:
```bash
npm test
```

3. Watch for changes:
```bash
npm run build:watch
```

## Security

- All functions use proper authentication
- API endpoints require valid Firebase ID tokens
- Webhooks require API key authentication
- Data access is restricted based on user roles

## Environment Variables

- `WEBHOOK_API_KEY`: API key for webhook authentication
- `STORAGE_BUCKET`: Firebase Storage bucket name
- `PROJECT_ID`: Firebase project ID
- `NODE_ENV`: Development/production environment
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window
- `MAX_IMAGE_SIZE_MB`: Maximum image size in MB
- `THUMBNAIL_SIZE`: Thumbnail image size
- `MEDIUM_SIZE`: Medium image size
- `FILE_CLEANUP_BATCH_SIZE`: Number of files to process in cleanup
- `ACTIVITY_LOG_RETENTION_DAYS`: Days to keep activity logs

## Best Practices

1. Always use TypeScript for type safety
2. Handle errors properly and log them
3. Use environment variables for configuration
4. Follow the principle of least privilege
5. Implement proper rate limiting
6. Keep functions focused and small
7. Use batching for bulk operations
8. Implement proper logging and monitoring

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy specific functions:
```bash
firebase deploy --only functions:functionName
```

3. Deploy all functions:
```bash
npm run deploy
```

## Monitoring

- Use Firebase Console to monitor function execution
- Check logs using `npm run logs`
- Set up alerts for errors and performance issues

## Contributing

1. Follow the TypeScript style guide
2. Write tests for new functions
3. Update documentation as needed
4. Use descriptive commit messages 