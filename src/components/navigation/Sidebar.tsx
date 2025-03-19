import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  FileText, 
  Settings, 
  PieChart, 
  Bell, 
  Mail,
  Activity,
  BarChart,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  UserCircle,
  UsersRound,
  FolderOpen,
  BarChart4,
  Cog,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  title: string;
  icon: React.ReactNode;
  href: string;
  children?: SidebarItemProps[];
  current?: boolean;
  depth?: number;
}

const SidebarItem = ({ item, depth = 0 }: { item: SidebarItemProps; depth?: number }) => {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const isCurrentPage = pathname === item.href;
  const hasChildren = item.children && item.children.length > 0;

  // Create a separate handler for expansion to avoid blocking navigation
  const handleExpandToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setExpanded(!expanded);
  };

  return (
    <div>
      {hasChildren ? (
        <div
          className={cn(
            'flex items-center px-3 py-2 text-sm rounded-md gap-x-3 mb-1 cursor-pointer',
            isCurrentPage 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
            depth > 0 && 'ml-6'
          )}
          onClick={handleExpandToggle}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          <span className="flex-grow">{item.title}</span>
          <span className="flex-shrink-0">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        </div>
      ) : (
        <Link
          href={item.href}
          className={cn(
            'flex items-center px-3 py-2 text-sm rounded-md gap-x-3 mb-1',
            isCurrentPage 
              ? 'bg-primary/10 text-primary font-medium' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
            depth > 0 && 'ml-6'
          )}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          <span className="flex-grow">{item.title}</span>
        </Link>
      )}
      
      {hasChildren && expanded && (
        <div className="ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          {item.children?.map((child, index) => (
            <SidebarItem key={index} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const sidebarItems: SidebarItemProps[] = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: '/dashboard',
  },
  {
    title: 'Leads',
    icon: <UserCircle className="h-5 w-5" />,
    href: '/leads',
    children: [
      {
        title: 'All Leads',
        icon: <Users className="h-4 w-4" />,
        href: '/leads',
      },
      {
        title: 'Lead Sources',
        icon: <PieChart className="h-4 w-4" />,
        href: '/leads/sources',
      },
      {
        title: 'Import/Export',
        icon: <FileText className="h-4 w-4" />,
        href: '/leads/import-export',
      },
    ],
  },
  {
    title: 'Customers',
    icon: <UsersRound className="h-5 w-5" />,
    href: '/customers',
    children: [
      {
        title: 'All Customers',
        icon: <Users className="h-4 w-4" />,
        href: '/customers',
      },
      {
        title: 'Documents',
        icon: <FolderOpen className="h-4 w-4" />,
        href: '/customers/documents',
      },
    ],
  },
  {
    title: 'Reports',
    icon: <BarChart4 className="h-5 w-5" />,
    href: '/reports',
    children: [
      {
        title: 'Overview',
        icon: <PieChart className="h-4 w-4" />,
        href: '/reports',
      },
      {
        title: 'Sales',
        icon: <BarChart className="h-4 w-4" />,
        href: '/reports/sales',
      },
      {
        title: 'Leads',
        icon: <UserCircle className="h-4 w-4" />,
        href: '/reports/leads',
      },
    ],
  },
  {
    title: 'Communications',
    icon: <Mail className="h-5 w-5" />,
    href: '/communications',
    children: [
      {
        title: 'Email',
        icon: <Mail className="h-4 w-4" />,
        href: '/communications/email',
      },
      {
        title: 'Notifications',
        icon: <Bell className="h-4 w-4" />,
        href: '/communications/notifications',
      },
    ],
  },
  {
    title: 'Monitoring',
    icon: <Activity className="h-5 w-5" />,
    href: '/admin/monitoring',
    children: [
      {
        title: 'System Health',
        icon: <AlertCircle className="h-4 w-4" />,
        href: '/admin/monitoring',
      },
      {
        title: 'Performance',
        icon: <BarChart className="h-4 w-4" />,
        href: '/admin/monitoring/performance',
      },
      {
        title: 'Database',
        icon: <Database className="h-4 w-4" />,
        href: '/admin/monitoring/database',
      },
      {
        title: 'Logs',
        icon: <FileText className="h-4 w-4" />,
        href: '/admin/monitoring/logs',
      },
    ],
  },
  {
    title: 'Settings',
    icon: <Cog className="h-5 w-5" />,
    href: '/settings',
    children: [
      {
        title: 'Profile',
        icon: <UserCircle className="h-4 w-4" />,
        href: '/settings/profile',
      },
      {
        title: 'Team',
        icon: <Users className="h-4 w-4" />,
        href: '/settings/team',
      },
      {
        title: 'Preferences',
        icon: <Settings className="h-4 w-4" />,
        href: '/settings/preferences',
      },
    ],
  },
];

const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed top-0 left-0 overflow-y-auto">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold">LeadLink CRM</h1>
      </div>
      <nav className="p-4 space-y-1">
        {sidebarItems.map((item, index) => (
          <SidebarItem key={index} item={item} />
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar; 