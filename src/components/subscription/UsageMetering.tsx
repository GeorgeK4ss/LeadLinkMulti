import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  LinearProgress, 
  Chip, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button, 
  Tab, 
  Tabs, 
  CircularProgress, 
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  SelectChangeEvent
} from '@mui/material';
import { 
  Storage as StorageIcon,
  PersonAdd as UserIcon,
  Api as ApiIcon,
  DocumentScanner as DocumentIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  AutoAwesome as AiIcon,
  Loop as AutomationIcon,
  ShowChart as ReportIcon,
  ImportExport as ImportExportIcon,
  Event as CalendarIcon,
  Link as WebhookIcon,
  RefreshRounded as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useCompany } from '@/lib/hooks/useCompany';
import { UsageMeteringService, ResourceType, TimeUnit } from '@/lib/services/UsageMeteringService';
import { formatNumber, formatDate } from '@/lib/utils';

// Tab interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`usage-tabpanel-${index}`}
      aria-labelledby={`usage-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Resource icon mapping
const resourceIcons: Record<string, React.ReactNode> = {
  [ResourceType.STORAGE]: <StorageIcon />,
  [ResourceType.API_CALLS]: <ApiIcon />,
  [ResourceType.USER_SEATS]: <UserIcon />,
  [ResourceType.DOCUMENTS]: <DocumentIcon />,
  [ResourceType.EXPORTS]: <ImportExportIcon />,
  [ResourceType.IMPORTS]: <ImportExportIcon />,
  [ResourceType.EMAIL_NOTIFICATIONS]: <EmailIcon />,
  [ResourceType.SMS_NOTIFICATIONS]: <SmsIcon />,
  [ResourceType.AUTOMATION_EXECUTIONS]: <AutomationIcon />,
  [ResourceType.CUSTOM_REPORTS]: <ReportIcon />,
  [ResourceType.AI_RECOMMENDATIONS]: <AiIcon />,
  [ResourceType.WEBHOOKS]: <WebhookIcon />,
  [ResourceType.CALENDAR_INTEGRATIONS]: <CalendarIcon />
};

// Format resource name for display
const formatResourceName = (resourceType: string): string => {
  return resourceType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const UsageMetering: React.FC = () => {
  const { company } = useCompany();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [resourceLimits, setResourceLimits] = useState<any[]>([]);
  const [selectedResource, setSelectedResource] = useState<ResourceType | ''>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeUnit>(TimeUnit.MONTHLY);
  const [historyTimeframe, setHistoryTimeframe] = useState<TimeUnit>(TimeUnit.DAILY);
  
  const usageMeteringService = new UsageMeteringService();

  // Load usage data
  useEffect(() => {
    if (!company?.id) return;

    const loadUsageData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the usage summary
        const summary = await usageMeteringService.getUsageSummary(company.id);
        setUsageSummary(summary);

        // Get resource limits
        const limits = await usageMeteringService.getResourceLimits(company.id);
        setResourceLimits(limits);

        // If a resource is selected, get its usage history
        if (selectedResource) {
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1); // Last month
          
          const history = await usageMeteringService.getUsageHistory(
            company.id,
            selectedResource as ResourceType,
            startDate,
            undefined,
            100
          );
          
          setUsageHistory(history);
        }
      } catch (err) {
        console.error('Error loading usage data:', err);
        setError('Failed to load usage data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadUsageData();
  }, [company?.id, selectedResource]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle resource selection change
  const handleResourceChange = (event: SelectChangeEvent<ResourceType | ''>) => {
    setSelectedResource(event.target.value as ResourceType | '');
  };

  // Handle timeframe change
  const handleTimeframeChange = (event: SelectChangeEvent<TimeUnit>) => {
    setSelectedTimeframe(event.target.value as TimeUnit);
  };

  // Handle history timeframe change
  const handleHistoryTimeframeChange = (event: SelectChangeEvent<TimeUnit>) => {
    setHistoryTimeframe(event.target.value as TimeUnit);
  };

  // Refresh data
  const handleRefresh = async () => {
    if (!company?.id) return;
    
    try {
      setLoading(true);
      
      // Get the usage summary
      const summary = await usageMeteringService.getUsageSummary(company.id);
      setUsageSummary(summary);
      
      // If a resource is selected, get its usage history
      if (selectedResource) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1); // Last month
        
        const history = await usageMeteringService.getUsageHistory(
          company.id,
          selectedResource as ResourceType,
          startDate,
          undefined,
          100
        );
        
        setUsageHistory(history);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error refreshing usage data:', err);
      setError('Failed to refresh usage data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'normal':
        return 'success';
      case 'warning':
        return 'warning';
      case 'exceeded':
        return 'error';
      default:
        return 'info';
    }
  };

  // Render loading state
  if (loading && !usageSummary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">Usage Metering</Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh} 
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="usage metering tabs"
        >
          <Tab label="Overview" id="usage-tab-0" aria-controls="usage-tabpanel-0" />
          <Tab label="Resource Details" id="usage-tab-1" aria-controls="usage-tabpanel-1" />
          <Tab label="Usage History" id="usage-tab-2" aria-controls="usage-tabpanel-2" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        {usageSummary ? (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Usage Summary</Typography>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Last updated: {usageSummary.lastUpdated ? formatDate(usageSummary.lastUpdated) : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Period: {usageSummary.period ? formatDate(usageSummary.period.start) : 'N/A'} to{' '}
                    {usageSummary.period ? formatDate(usageSummary.period.end) : 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  Overall Usage: {formatNumber(usageSummary.totalUsagePercentage, 1)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(usageSummary.totalUsagePercentage, 100)} 
                  color={
                    usageSummary.totalUsagePercentage >= 100 ? 'error' :
                    usageSummary.totalUsagePercentage >= 80 ? 'warning' : 'primary'
                  }
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
            </Paper>

            <Typography variant="h6" gutterBottom>Resource Usage</Typography>
            <Grid container spacing={3}>
              {Object.entries(usageSummary.resources).map(([resourceType, data]: [string, any]) => (
                <Grid item xs={12} sm={6} md={4} key={resourceType}>
                  <Card>
                    <CardHeader
                      avatar={
                        <Box component="span">
                          {resourceIcons[resourceType] || <InfoIcon />}
                        </Box>
                      }
                      title={formatResourceName(resourceType)}
                      action={
                        <Chip 
                          label={data.status.toUpperCase()} 
                          color={getStatusColor(data.status)} 
                          size="small" 
                        />
                      }
                    />
                    <CardContent>
                      <Typography variant="body2" gutterBottom>
                        {data.currentUsage} / {data.limit === -1 ? 'Unlimited' : data.limit}
                      </Typography>
                      {data.limit !== -1 && (
                        <>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(data.percentUsed, 100)} 
                            color={getStatusColor(data.status)}
                            sx={{ height: 8, borderRadius: 4, mb: 1 }}
                          />
                          <Typography variant="body2" color="textSecondary">
                            {formatNumber(data.percentUsed, 1)}% used
                          </Typography>
                        </>
                      )}
                      {data.overageUsage > 0 && (
                        <Typography variant="body2" color="error">
                          Overage: {data.overageUsage}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1">No usage data available.</Typography>
          </Box>
        )}
      </TabPanel>

      {/* Resource Details Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel id="resource-select-label">Select Resource</InputLabel>
            <Select
              labelId="resource-select-label"
              id="resource-select"
              value={selectedResource}
              onChange={handleResourceChange}
              label="Select Resource"
            >
              <MenuItem value=""><em>Select a resource</em></MenuItem>
              {Object.values(ResourceType).map((type) => (
                <MenuItem key={type} value={type}>
                  {formatResourceName(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedResource && usageSummary?.resources?.[selectedResource] ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box component="span" sx={{ mr: 1 }}>
                  {resourceIcons[selectedResource] || <InfoIcon />}
                </Box>
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {formatResourceName(selectedResource)}
                </Typography>
                <Chip 
                  label={usageSummary.resources[selectedResource].status.toUpperCase()} 
                  color={getStatusColor(usageSummary.resources[selectedResource].status)} 
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Current Usage</Typography>
                  <Typography variant="h4">
                    {usageSummary.resources[selectedResource].currentUsage}
                    {usageSummary.resources[selectedResource].limit !== -1 && (
                      <Typography component="span" variant="body1" color="textSecondary">
                        {' '}/{' '}{usageSummary.resources[selectedResource].limit}
                      </Typography>
                    )}
                  </Typography>
                  
                  {usageSummary.resources[selectedResource].limit !== -1 && (
                    <>
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(usageSummary.resources[selectedResource].percentUsed, 100)} 
                          color={getStatusColor(usageSummary.resources[selectedResource].status)}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {formatNumber(usageSummary.resources[selectedResource].percentUsed, 1)}% used
                      </Typography>
                    </>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Usage Details</Typography>
                  <Box>
                    <Typography variant="body2">
                      <strong>Remaining:</strong>{' '}
                      {usageSummary.resources[selectedResource].limit === -1 
                        ? 'Unlimited' 
                        : usageSummary.resources[selectedResource].remainingUsage}
                    </Typography>
                    {usageSummary.resources[selectedResource].overageUsage > 0 && (
                      <Typography variant="body2" color="error">
                        <strong>Overage:</strong> {usageSummary.resources[selectedResource].overageUsage}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Period Start:</strong> {formatDate(usageSummary.period.start)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Period End:</strong> {formatDate(usageSummary.period.end)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Period Type:</strong> {usageSummary.period.unit}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Resource limit details */}
              {resourceLimits.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>Resource Limit Settings</Typography>
                  {resourceLimits.find(l => l.resourceType === selectedResource) ? (
                    <Box>
                      {(() => {
                        const limit = resourceLimits.find(l => l.resourceType === selectedResource);
                        return (
                          <>
                            <Typography variant="body2">
                              <strong>Limit:</strong> {limit.limit}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Unit:</strong> {limit.unit}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Reset Type:</strong> {limit.reset}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Alert Threshold:</strong> {limit.alertThreshold || 'None'}
                              {limit.alertThreshold && '%'}
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                  ) : (
                    <Typography variant="body2">No limit settings found for this resource.</Typography>
                  )}
                </Box>
              )}
            </Paper>
          ) : (
            selectedResource && (
              <Alert severity="info">
                No usage data available for this resource.
              </Alert>
            )
          )}
        </Box>
      </TabPanel>

      {/* Usage History Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="history-resource-select-label">Select Resource</InputLabel>
                <Select
                  labelId="history-resource-select-label"
                  id="history-resource-select"
                  value={selectedResource}
                  onChange={handleResourceChange}
                  label="Select Resource"
                >
                  <MenuItem value=""><em>Select a resource</em></MenuItem>
                  {Object.values(ResourceType).map((type) => (
                    <MenuItem key={type} value={type}>
                      {formatResourceName(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="history-timeframe-select-label">Timeframe</InputLabel>
                <Select
                  labelId="history-timeframe-select-label"
                  id="history-timeframe-select"
                  value={historyTimeframe}
                  onChange={handleHistoryTimeframeChange}
                  label="Timeframe"
                >
                  <MenuItem value={TimeUnit.DAILY}>Daily</MenuItem>
                  <MenuItem value={TimeUnit.WEEKLY}>Weekly</MenuItem>
                  <MenuItem value={TimeUnit.MONTHLY}>Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Button 
                variant="outlined" 
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Box>

        {selectedResource ? (
          loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            usageHistory.length > 0 ? (
              <Paper>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Metadata</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usageHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.timestamp, 'long')}</TableCell>
                        <TableCell>{record.value}</TableCell>
                        <TableCell>{record.userId || 'System'}</TableCell>
                        <TableCell>
                          {record.metadata && Object.keys(record.metadata).length > 0 ? (
                            <Box>
                              {Object.entries(record.metadata).map(([key, value]) => (
                                <Typography key={key} variant="caption" display="block">
                                  <strong>{key}:</strong> {String(value)}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            'No metadata'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            ) : (
              <Alert severity="info">
                No usage history available for this resource.
              </Alert>
            )
          )
        ) : (
          <Alert severity="info">
            Please select a resource to view its usage history.
          </Alert>
        )}
      </TabPanel>
    </Box>
  );
};

export default UsageMetering; 