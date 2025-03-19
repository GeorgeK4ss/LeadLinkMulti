# Analytics Service Implementation with Multi-Tenant Isolation

## Overview

This document details the implementation of the AnalyticsService with multi-tenant isolation (DATA-9). The service provides comprehensive data analytics capabilities while ensuring proper data isolation between tenants.

## Core Features Implemented

### 1. Analytics Engine
- **Dimensioned Data**: Support for analyzing data across various dimensions
- **Multiple Metrics**: Flexible calculation of counts, sums, averages, and other metrics
- **Custom Filtering**: Dynamic query filtration with multiple operators
- **Time-Based Analysis**: Support for various time periods (day, week, month, quarter, year)
- **Data Caching**: Smart caching system for performance optimization
- **Result Formatting**: Standardized output format for UI consumption

### 2. Multi-Tenant Isolation
- **Tenant Context Management**: Set and retrieve the current tenant context for operations
- **Tenant-Specific Collection Access**: Automatic routing to tenant-isolated collections
- **Collection Path Management**: Dynamic collection path generation based on tenant context
- **Cross-Collection Consistency**: Uniform tenant isolation across different data types
- **Isolation Testing**: Built-in functionality to verify data isolation between tenants

### 3. Pre-built Analytics Modules
- **Lead Conversion Analysis**: Track and analyze lead conversion metrics by status
- **Customer Activity Tracking**: Monitor and analyze customer engagement
- **Sales Performance Metrics**: Analyze opportunity pipeline and conversion rates
- **User Engagement Insights**: Track and measure user activity and engagement
- **Content Performance Analytics**: Analyze content effectiveness and engagement

## Technical Implementation

### Tenant Context Management
- Implemented tenant context management with:
  - Constructor parameter for initial tenant ID
  - Set/get methods for tenant context
  - Error handling for missing tenant context
  - Tenant ID parameter in all API methods as an override option

### Data Isolation Approach
- **Hierarchical Collection Path Generation**: Smart detection of tenant-scoped collections
- **Collection Path Determination**: Dynamic selection between direct and tenant-specific paths
- **Tenant Filter Fallback**: Automatic `tenantId` filter for non-hierarchical collections
- **Tenant-Aware Cache Keys**: Cache isolation between tenants with tenant-specific keys

### Analytics Query Engine
- **Flexible Query Construction**: Dynamic build of Firestore queries based on analytics parameters
- **Metric Calculation**: Processing of raw data into aggregated metrics
- **Dimension Handling**: Support for single dimension analytics with extensibility for multi-dimension
- **Date Range Management**: Smart date calculation based on period types
- **Result Transformation**: Conversion of Firestore query results into structured analytics format

## Security Considerations

- **Cross-Tenant Prevention**: Methods to prevent data leakage between tenants
- **Tenant Isolation Testing**: Built-in method to test tenant isolation
- **Result Verification**: Comparison of results across tenants to verify isolation
- **Cache Isolation**: Tenant-specific caching to prevent cross-tenant data exposure

## Usage Examples

### Setting Tenant Context
```typescript
// Set the tenant context for subsequent operations
const analyticsService = new AnalyticsService();
analyticsService.setTenantContext('tenant-123');

// Or initialize with a tenant ID
const analyticsService = new AnalyticsService('tenant-123');
```

### Running Custom Analytics Queries
```typescript
// Define an analytics query
const options = {
  dimensions: [
    { field: 'status', displayName: 'Lead Status' }
  ],
  metrics: [
    { name: 'count', displayName: 'Count', type: 'count' },
    { name: 'value', displayName: 'Total Value', type: 'sum', field: 'value' }
  ],
  filters: [
    { field: 'createdAt', operator: '>=', value: new Date('2023-06-01') },
    { field: 'isActive', operator: '==', value: true }
  ],
  period: {
    type: AnalyticsPeriod.MONTH
  },
  cache: true
};

// Run the query on a collection
const result = await analyticsService.runQuery('leads', options);
```

### Using Pre-built Analytics
```typescript
// Get lead conversion metrics
const conversionMetrics = await analyticsService.getLeadConversionMetrics({
  period: { type: AnalyticsPeriod.QUARTER }
});

// Get customer activity metrics
const activityMetrics = await analyticsService.getCustomerActivityMetrics();

// Get sales performance metrics
const salesMetrics = await analyticsService.getSalesPerformanceMetrics({
  cache: false // Bypass cache for fresh data
});
```

### Manipulating Results
```typescript
// Access aggregated totals
console.log(`Total leads: ${result.totals.count}`);
console.log(`Total value: ${result.totals.value}`);

// Access dimensional data
result.data.forEach(dataPoint => {
  console.log(`${dataPoint.dimensionValue}: ${dataPoint.metrics.count} (${dataPoint.metrics.value})`);
});

// Get dimension and metric names
console.log(`Dimensions: ${result.dimensions.join(', ')}`);
console.log(`Metrics: ${result.metrics.join(', ')}`);
```

### Cache Management
```typescript
// Clear all analytics cache
analyticsService.clearCache();

// Clear tenant-specific cache
analyticsService.clearCache('tenant-123');
```

### Isolation Testing
```typescript
// Test isolation between tenants
const isolationResult = await analyticsService.testAnalyticsIsolation('tenant-1', 'tenant-2');
if (isolationResult.success) {
  console.log('Tenant isolation is working properly');
} else {
  console.error('Tenant isolation issue detected:', isolationResult.message);
}
```

## Query Structure

### Dimensions
Dimensions are the properties by which data is grouped. For example:
```typescript
{ field: 'status', displayName: 'Lead Status' }
```

### Metrics
Metrics are calculations performed on the grouped data. Types include:
- **count**: Count of records
- **sum**: Sum of a specific field
- **average**: Average value of a field
- **min**: Minimum value of a field
- **max**: Maximum value of a field
- **distinct**: Count of distinct values of a field

Example:
```typescript
{ name: 'conversionRate', displayName: 'Conversion Rate', type: 'average', field: 'isConverted' }
```

### Filters
Filters narrow down the data that is analyzed:
```typescript
{ field: 'status', operator: 'in', value: ['new', 'contacted'] }
```

### Time Periods
Time periods control the date range for analysis:
- **DAY**: Current day
- **WEEK**: Current week (Sunday to Saturday)
- **MONTH**: Current month
- **QUARTER**: Current quarter
- **YEAR**: Current year
- **CUSTOM**: Custom date range specified by start and end

## Testing

The service includes the `testAnalyticsIsolation` method that verifies data isolation between tenants by:
1. Running the same query for two different tenants
2. Comparing the results to ensure they are different
3. Verifying that tenant data is properly isolated

## Integration with Other Services

The AnalyticsService integrates with:
- **TenantService**: For tenant context management
- **LeadService**: For lead conversion analytics
- **CustomerService**: For customer activity analytics
- **ActivityService**: For user engagement tracking
- **CacheService**: For performance optimization

## Future Enhancements

Potential future improvements to the analytics system:
- Multi-dimensional analytics with cross-tabulation
- Advanced statistical calculations (correlation, trends, forecasting)
- Scheduled analytics report generation
- Export functionality for analytics data
- Interactive visualization components
- Anomaly detection algorithms
- Cohort analysis capabilities
- Custom metric definitions
- Real-time analytics dashboards 