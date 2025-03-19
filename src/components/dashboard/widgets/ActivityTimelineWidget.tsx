import React, { useEffect, useState } from 'react';
import { DashboardWidget } from '@/components/ui/responsive-dashboard';
import { collection, query, orderBy, getDocs, QueryConstraint, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { 
  ChatBubbleIcon, 
  EnvelopeClosedIcon, 
  MobileIcon, 
  CalendarIcon, 
  ClockIcon, 
  FileTextIcon, 
  PersonIcon,
  CheckCircledIcon 
} from '@radix-ui/react-icons';

interface ActivityTimelineWidgetProps {
  tenantId: string;
  limit?: number;
  desktopWidth?: "full" | "half" | "third" | "two-thirds" | "quarter";
  height?: "auto" | "small" | "medium" | "large";
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: Date;
  userId: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  entityId?: string;
  entityType?: string;
  entityName?: string;
}

export function ActivityTimelineWidget({ 
  tenantId, 
  limit = 10, 
  desktopWidth = "third",
  height = "large"
}: ActivityTimelineWidgetProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const activitiesCollection = collection(db, `tenants/${tenantId}/activities`);
        const queryConstraints: QueryConstraint[] = [
          orderBy('timestamp', 'desc'),
          firestoreLimit(limit)
        ];
        
        const activitiesQuery = query(activitiesCollection, ...queryConstraints);
        const querySnapshot = await getDocs(activitiesQuery);
        const activitiesData: Activity[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          activitiesData.push({
            id: doc.id,
            type: data.type as string || 'unknown',
            title: data.title as string || 'Unknown activity',
            description: data.description as string | undefined,
            timestamp: data.timestamp ? new Date(data.timestamp.seconds * 1000) : new Date(),
            userId: data.userId as string || 'unknown',
            userDisplayName: data.userDisplayName as string | undefined,
            userPhotoURL: data.userPhotoURL as string | undefined,
            entityId: data.entityId as string | undefined,
            entityType: data.entityType as string | undefined,
            entityName: data.entityName as string | undefined
          });
        });
        
        setActivities(activitiesData);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [tenantId, limit]);

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
      case 'email_sent':
        return <EnvelopeClosedIcon className="h-4 w-4 text-blue-500" />;
      case 'call':
      case 'phone_call':
        return <MobileIcon className="h-4 w-4 text-green-500" />;
      case 'meeting':
      case 'appointment':
        return <CalendarIcon className="h-4 w-4 text-purple-500" />;
      case 'note':
      case 'comment':
        return <ChatBubbleIcon className="h-4 w-4 text-gray-500" />;
      case 'task':
      case 'task_created':
        return <FileTextIcon className="h-4 w-4 text-amber-500" />;
      case 'task_completed':
        return <CheckCircledIcon className="h-4 w-4 text-green-600" />;
      case 'reminder':
        return <ClockIcon className="h-4 w-4 text-red-500" />;
      default:
        return <PersonIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRelativeTime = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };

  const getEntityLink = (activity: Activity) => {
    if (!activity.entityId || !activity.entityType) return null;
    
    const entityType = activity.entityType.toLowerCase();
    const link = `/${entityType}s/${activity.entityId}`;
    
    return (
      <a 
        href={link} 
        className="text-sm text-primary hover:underline"
      >
        {activity.entityName || `View ${entityType}`}
      </a>
    );
  };

  return (
    <DashboardWidget
      title="Recent Activities"
      description="Latest actions across your account"
      desktopWidth={desktopWidth}
      height={height}
      loading={loading}
    >
      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No recent activities</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map(activity => (
            <div key={activity.id} className="flex">
              <div className="mr-4 flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {getRelativeTime(activity.timestamp)}
                  </p>
                </div>
                
                {activity.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {activity.description}
                  </p>
                )}
                
                <div className="flex items-center pt-1">
                  {activity.userPhotoURL ? (
                    <Avatar className="h-5 w-5 mr-1">
                      <img src={activity.userPhotoURL} alt={activity.userDisplayName || 'User'} />
                    </Avatar>
                  ) : (
                    <PersonIcon className="h-4 w-4 text-muted-foreground mr-1" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {activity.userDisplayName || 'Unknown user'}
                  </span>
                  
                  {getEntityLink(activity) && (
                    <>
                      <span className="mx-1 text-muted-foreground">•</span>
                      {getEntityLink(activity)}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardWidget>
  );
} 