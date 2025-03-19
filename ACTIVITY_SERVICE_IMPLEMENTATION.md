# Activity Service Implementation with Multi-Tenant Isolation

## Overview

This document details the implementation of the ActivityService with multi-tenant isolation (DATA-6). The service provides comprehensive activity logging and tracking functionality while ensuring proper data isolation between tenants.

## Core Features Implemented

### 1. Activity Logging
- **Activity Type Tracking**: Enum-based classification of different activity types
- **User Activity Logging**: Track activities performed by specific users
- **System Activity Logging**: Record system events and actions
- **Target Association**: Link activities to specific entities (leads, customers, etc.)
- **Metadata Support**: Store additional structured data with activities
- **Timestamps**: Accurate time tracking for all activities

### 2. Multi-Tenant Isolation
- **Tenant Context Management**: Set and retrieve the current tenant context for operations
- **Tenant-Specific Collection Access**: Methods to access tenant-isolated activity collections
- **Isolation Testing**: Built-in functionality to verify data isolation between tenants

### 3. Activity Querying
- **Recent Activities**: Get most recent activities within a timeframe
- **User-Specific Activities**: Query activities for specific users
- **Target-Specific Activities**: Get activities related to specific entities
- **Type-Based Filtering**: Query activities by type
- **Real-time Updates**: Subscribe to activity streams with live updates

## Technical Implementation

### Activity Types
Implemented a comprehensive enum of activity types covering various entity operations:
- Lead-related activities (created, updated, status changed, etc.)
- Customer-related activities (created, updated, deleted, etc.)
- User-related activities (login, logout, profile updates, etc.)
- System events (errors, warnings, information)
- Task-related activities (created, completed, etc.)
- Email and note activities

### Tenant Context
- Implemented tenant context management with:
  - Constructor parameter for initial tenant ID
  - Set/get methods for tenant context
  - Error handling for missing tenant context
  - Tenant ID parameter in all API methods

### Data Isolation Approach
- **Hierarchical Collections**: Activity data is stored in tenant-specific subcollections (`tenants/{tenantId}/activities`)
- **Tenant ID Required**: All operations require a tenant ID either from context or as a parameter
- **Collection References**: Dynamic generation of collection references based on current tenant

### Real-time Capabilities
- **Live Activity Updates**: Subscribe to real-time changes to activity streams
- **Ordered Results**: Activities are always ordered by timestamp for chronological display

## Security Considerations

- **Cross-Tenant Prevention**: Methods to prevent data leakage between tenants
- **Tenant Isolation Testing**: Built-in method to test tenant isolation
- **User Tracking**: Record which user performs which operations
- **IP and User Agent Tracking**: Optionally record client information for security auditing

## Usage Examples

### Setting Tenant Context
```typescript
// Set the tenant context for subsequent operations
const activityService = new ActivityService();
activityService.setTenantContext('tenant-123');

// Or initialize with a tenant ID
const activityService = new ActivityService('tenant-123');
```

### Logging Activities
```typescript
// Log user activity
await activityService.logUserActivity(
  'user-456',
  ActivityType.LEAD_STATUS_CHANGED,
  'Changed lead status from New to Contacted',
  {
    targetId: 'lead-789',
    targetType: 'lead',
    metadata: {
      previousStatus: 'new',
      newStatus: 'contacted'
    }
  }
);

// Log system activity
await activityService.logSystemActivity(
  ActivityType.SYSTEM_INFO,
  'Daily data backup completed',
  {
    recordsBackedUp: 12543,
    backupLocation: 'gs://backups/2023-07-15/'
  }
);
```

### Querying Activities
```typescript
// Get recent activities (last 7 days)
const recentActivities = await activityService.getRecentActivities();

// Get activities for a specific user
const userActivities = await activityService.getUserActivities('user-456');

// Get activities related to a specific lead
const leadActivities = await activityService.getTargetActivities('lead', 'lead-789');

// Get all activities of a specific type
const emailSentActivities = await activityService.getActivitiesByType(ActivityType.EMAIL_SENT);
```

### Real-time Activity Stream
```typescript
// Subscribe to real-time activity updates
const unsubscribe = activityService.subscribeToActivities((activities) => {
  console.log('New activity stream:', activities);
  // Update UI or process new activities
});

// Later, unsubscribe to stop listening
unsubscribe();
```

### Multi-tenant Testing
```typescript
// Test isolation between two tenants
const result = await activityService.testActivityIsolation('tenant-1', 'tenant-2');
if (result.success) {
  console.log('Tenant isolation working properly');
} else {
  console.error('Tenant isolation issue:', result.message);
}
```

## Testing

The service includes the `testActivityIsolation` method that verifies data isolation between tenants by:
1. Creating test activity data in one tenant
2. Attempting to access it from another tenant
3. Verifying that the data is not accessible across tenant boundaries
4. Cleaning up the test data

## Integration with Other Services

The Activity service can integrate with:
- **TenantService**: For tenant context management
- **LeadService**: For tracking lead-related activities
- **CustomerService**: For tracking customer-related activities
- **UserService**: For tracking user-related activities
- **NotificationService**: For creating notifications based on important activities

## Future Enhancements

Potential future improvements to the activity tracking system:
- Activity aggregation and reporting
- Activity analytics and insights
- Activity-based notifications and alerts
- Advanced activity search capabilities
- Activity stream filtering and customization
- Activity export functionality
- Activity retention policies and archiving
- Activity importance/priority classification 