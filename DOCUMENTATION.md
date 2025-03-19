# LeadLink CRM System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Authentication System](#authentication-system)
3. [Role-Based Access Control (RBAC)](#role-based-access-control)
4. [UI Components](#ui-components)
5. [API Endpoints](#api-endpoints)
6. [Database Structure](#database-structure)
7. [Security Rules](#security-rules)

## System Overview

LeadLink CRM is a multi-tenant customer relationship management system built with Next.js 14.1.0 and Firebase. The system supports multiple organizational levels (System, Company, and Tenant) with comprehensive role-based access control.

### Tech Stack
- **Frontend**: Next.js 14.1.0, TypeScript 5.7.2
- **UI Framework**: Tailwind CSS, Shadcn UI
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions)
- **Authentication**: Firebase Auth with Google OAuth
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **Styling**: Tailwind CSS with CSS Variables

## Authentication System

### Authentication Flow
1. **Sign Up Process**
   - Email/Password registration
   - Google OAuth integration
   - User profile creation in Firestore
   - Initial role assignment

2. **Sign In Methods**
   - Email/Password authentication
   - Google OAuth sign-in
   - Session management with NextAuth.js

3. **Password Management**
   - Password reset functionality
   - Email verification
   - Password strength requirements

### Authentication Context
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

## Role-Based Access Control

### Role Hierarchy
1. **System Level**
   - System Admin: Full system access

2. **Company Level**
   - Company Admin: Full company access
   - Company Manager: Company operations
   - Company User: Basic access
   - Company Support: Support tickets
   - Company Billing: Financial operations

3. **Tenant Level**
   - Tenant Admin: Full tenant access
   - Tenant Manager: Tenant operations
   - Tenant Agent: Basic tenant access

### Permission System
```typescript
type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';
type PermissionResource = 'users' | 'companies' | 'tenants' | 'leads' | 
                         'customers' | 'activities' | 'settings' | 
                         'billing' | 'support';
type Permission = `${PermissionAction}:${PermissionResource}`;
```

### Role Management Interface
1. **Role Assignment**
   - User role assignment
   - Scope-based controls (Company/Tenant)
   - Role validation

2. **Permission Visualization**
   - Permission matrix display
   - Role details view
   - Scope information

3. **Role Switching**
   - Dynamic role switching
   - Scope preservation
   - Permission refresh

### RBAC Service
```typescript
class RBACService {
  assignRole(userId: string, roleId: RoleType, companyId?: string, tenantId?: string);
  getUserRole(userId: string): Promise<UserRole[]>;
  getUserPermissions(userId: string): Promise<Permission[]>;
  hasPermission(userId: string, permission: Permission): Promise<boolean>;
  updateActiveRole(userId: string, role: Partial<UserRole>): Promise<void>;
}
```

## UI Components

### Base Components
1. **Button**
   - Variants: default, destructive, outline, secondary, ghost, link
   - Sizes: default, sm, lg, icon
   - Loading state support

2. **Card**
   - Sections: Header, Content, Footer
   - Title and description support
   - Flexible content layout

3. **Input**
   - Standard text input
   - Error state handling
   - Disabled state support

4. **Select**
   - Dropdown selection
   - Custom triggers
   - Group support
   - Search functionality

5. **Table**
   - Sortable headers
   - Custom cell rendering
   - Pagination support
   - Row selection

6. **Badge**
   - Status indicators
   - Multiple variants
   - Custom colors

7. **Tabs**
   - Navigation tabs
   - Content switching
   - Custom styling

### Styling System
```css
/* CSS Variable System */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... other variables ... */
}
```

## API Endpoints

### Authentication Endpoints
- POST `/api/auth/signup`
- POST `/api/auth/signin`
- POST `/api/auth/reset-password`
- GET `/api/auth/verify-email`

### Role Management Endpoints
- POST `/api/auth/switch-role`
- GET `/api/roles/user/:userId`
- POST `/api/roles/assign`
- PUT `/api/roles/update`

## Database Structure

### Firestore Collections
1. **users**
   - User profile information
   - Authentication details
   - Preferences

2. **userRoles**
   - Role assignments
   - Scope information
   - Timestamps

3. **companies**
   - Company information
   - Configuration
   - Subscription details

4. **tenants**
   - Tenant information
   - Configuration
   - Company association

## Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data;
    }

    function hasPermission(permission) {
      let userRole = getUserRole();
      return userRole != null && userRole.permissions.hasAny([permission]);
    }

    // Collection rules
    match /users/{userId} {
      allow read: if isAuthenticated() && (
        request.auth.uid == userId || 
        hasPermission('read:users')
      );
      allow write: if isAuthenticated() && hasPermission('manage:users');
    }

    // ... other collection rules ...
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     hasPermission('manage:storage');
    }
  }
}
```

## Development Guidelines

### Code Organization
- Components in `src/components/`
- Pages in `src/app/`
- Utilities in `src/lib/`
- Types in `src/lib/types/`
- Services in `src/lib/services/`
- Contexts in `src/lib/context/`

### Best Practices
1. **Type Safety**
   - Use TypeScript for all files
   - Define interfaces for all data structures
   - Implement proper error handling

2. **Component Structure**
   - Follow atomic design principles
   - Implement proper prop validation
   - Use React hooks effectively

3. **Performance**
   - Implement proper memoization
   - Use lazy loading where appropriate
   - Optimize database queries

4. **Security**
   - Validate all user input
   - Implement proper RBAC checks
   - Follow security best practices

### Testing Strategy
1. **Unit Tests**
   - Component testing
   - Service testing
   - Utility function testing

2. **Integration Tests**
   - API endpoint testing
   - Authentication flow testing
   - RBAC system testing

3. **E2E Tests**
   - User flow testing
   - Critical path testing
   - Cross-browser testing

## Deployment

### Environment Setup
1. **Development**
   - Local development server
   - Firebase emulators
   - Hot reloading

2. **Staging**
   - Staging Firebase project
   - Preview deployments
   - Integration testing

3. **Production**
   - Production Firebase project
   - CDN configuration
   - Monitoring setup

### CI/CD Pipeline
- GitHub Actions workflow
- Automated testing
- Deployment automation
- Version control

## Maintenance

### Monitoring
- Error tracking with Sentry
- Performance monitoring
- User analytics
- Security monitoring

### Backup Strategy
- Automated Firestore backups
- Storage backup system
- Configuration backups
- Disaster recovery plan

### Project Configuration

#### Next.js Configuration
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
```

#### Firebase Configuration
```typescript
// src/lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
```

### Authentication Implementation

#### Auth Context Provider
```typescript
// src/lib/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/types/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          ...userDoc.data(),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ... implementation of signIn, signOut, etc.

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### RBAC Implementation Details

#### Role Service Implementation
```typescript
// src/lib/services/RoleService.ts
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import type { Role, Permission, UserRole } from '@/lib/types/auth';

export class RoleService {
  private static instance: RoleService;
  private constructor() {}

  static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService();
    }
    return RoleService.instance;
  }

  async assignRole(
    userId: string, 
    roleType: RoleType, 
    scope: { companyId?: string; tenantId?: string }
  ): Promise<void> {
    const userRoleRef = doc(db, 'userRoles', userId);
    const role = await this.getRoleDefinition(roleType);
    
    await setDoc(userRoleRef, {
      userId,
      roleType,
      permissions: role.permissions,
      scope,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoleDoc = await getDoc(doc(db, 'userRoles', userId));
    if (!userRoleDoc.exists()) return [];
    return userRoleDoc.data().permissions;
  }

  // ... other methods
}
```

#### Permission Hook
```typescript
// src/lib/hooks/usePermissions.ts
import { useContext } from 'react';
import { AuthContext } from '@/lib/context/AuthContext';
import { RoleService } from '@/lib/services/RoleService';

export function usePermissions() {
  const { user } = useContext(AuthContext);
  const roleService = RoleService.getInstance();

  const hasPermission = async (permission: Permission): Promise<boolean> => {
    if (!user) return false;
    const permissions = await roleService.getUserPermissions(user.id);
    return permissions.includes(permission);
  };

  return { hasPermission };
}
```

### Database Schema Details

#### Users Collection
```typescript
interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  status: 'active' | 'inactive' | 'suspended';
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
}
```

#### Companies Collection
```typescript
interface Company {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  subscription: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'trialing' | 'canceled' | 'expired';
    startDate: Timestamp;
    endDate: Timestamp;
  };
  settings: {
    maxUsers: number;
    maxTenants: number;
    features: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Tenants Collection
```typescript
interface Tenant {
  id: string;
  companyId: string;
  name: string;
  domain?: string;
  settings: {
    maxAgents: number;
    features: string[];
    customization: {
      primaryColor: string;
      logo?: string;
    };
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### API Implementation Examples

#### Role Switch API
```typescript
// src/app/api/auth/switch-role/route.ts
import { NextResponse } from 'next/server';
import { RoleService } from '@/lib/services/RoleService';
import { auth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { roleId, scope } = await request.json();
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const roleService = RoleService.getInstance();

    await roleService.updateActiveRole(decodedToken.uid, { roleId, scope });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error switching role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Testing Implementation

#### Component Testing Example
```typescript
// src/components/RoleSelector/RoleSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleSelector } from './RoleSelector';
import { AuthContext } from '@/lib/context/AuthContext';

describe('RoleSelector', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    roles: ['company_admin', 'tenant_manager'],
  };

  it('renders available roles', () => {
    render(
      <AuthContext.Provider value={{ user: mockUser, loading: false }}>
        <RoleSelector />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Company Admin')).toBeInTheDocument();
    expect(screen.getByText('Tenant Manager')).toBeInTheDocument();
  });

  it('handles role switch', async () => {
    const onRoleSwitch = jest.fn();
    render(
      <AuthContext.Provider value={{ user: mockUser, loading: false }}>
        <RoleSelector onRoleSwitch={onRoleSwitch} />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText('Tenant Manager'));
    expect(onRoleSwitch).toHaveBeenCalledWith('tenant_manager');
  });
});
```

### Error Handling

#### Global Error Boundary
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Here you could send error to your error tracking service
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Admin Portal Implementation

### Dashboard Layout
```typescript
// src/app/(admin)/dashboard/layout.tsx
import { AdminSidebar } from '@/components/admin/Sidebar';
import { AdminHeader } from '@/components/admin/Header';
import { AdminRoleGuard } from '@/components/guards/AdminRoleGuard';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoleGuard>
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminRoleGuard>
  );
}
```

### System Management
```typescript
// src/lib/services/SystemService.ts
export class SystemService {
  private static instance: SystemService;

  static getInstance(): SystemService {
    if (!SystemService.instance) {
      SystemService.instance = new SystemService();
    }
    return SystemService.instance;
  }

  async getSystemStats(): Promise<SystemStats> {
    const stats = await Promise.all([
      this.getTotalUsers(),
      this.getTotalCompanies(),
      this.getTotalTenants(),
      this.getActiveSubscriptions(),
    ]);

    return {
      totalUsers: stats[0],
      totalCompanies: stats[1],
      totalTenants: stats[2],
      activeSubscriptions: stats[3],
    };
  }

  async getSystemHealth(): Promise<SystemHealth> {
    // Implementation for system health checks
  }

  async getAuditLogs(filters: AuditLogFilters): Promise<AuditLog[]> {
    // Implementation for audit logs
  }
}
```

### User Management Interface
```typescript
// src/components/admin/UserManagement.tsx
import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { useUsers } from '@/lib/hooks/useUsers';
import { UserActions } from './UserActions';

export function UserManagement() {
  const [filters, setFilters] = useState<UserFilters>({});
  const { users, loading, error } = useUsers(filters);

  const columns = [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
    {
      id: 'actions',
      cell: ({ row }) => <UserActions user={row.original} />,
    },
  ];

  return (
    <div className="space-y-4">
      <UserFilters filters={filters} onFilterChange={setFilters} />
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
      />
    </div>
  );
}
```

## Tenant Portal Implementation

### Tenant Dashboard
```typescript
// src/app/(tenant)/[tenantId]/dashboard/page.tsx
import { TenantStats } from '@/components/tenant/TenantStats';
import { LeadMetrics } from '@/components/tenant/LeadMetrics';
import { ActivityFeed } from '@/components/tenant/ActivityFeed';
import { TenantGuard } from '@/components/guards/TenantGuard';

export default function TenantDashboard({
  params: { tenantId },
}: {
  params: { tenantId: string };
}) {
  return (
    <TenantGuard tenantId={tenantId}>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TenantStats tenantId={tenantId} />
        <LeadMetrics tenantId={tenantId} />
        <ActivityFeed tenantId={tenantId} />
      </div>
    </TenantGuard>
  );
}
```

### Tenant Management Service
```typescript
// src/lib/services/TenantService.ts
export class TenantService {
  private static instance: TenantService;

  static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  async createTenant(data: CreateTenantData): Promise<string> {
    const tenantRef = doc(collection(db, 'tenants'));
    await setDoc(tenantRef, {
      ...data,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return tenantRef.id;
  }

  async getTenantSettings(tenantId: string): Promise<TenantSettings> {
    const doc = await getDoc(doc(db, 'tenants', tenantId));
    return doc.data()?.settings;
  }

  async updateTenantSettings(
    tenantId: string,
    settings: Partial<TenantSettings>
  ): Promise<void> {
    await updateDoc(doc(db, 'tenants', tenantId), {
      'settings': settings,
      'updatedAt': new Date(),
    });
  }
}
```

### Error Monitoring and Logging

#### Sentry Integration
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
});

export const captureError = (error: Error, context?: any) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

export const setUserContext = (user: User) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};
```

#### Error Logging Service
```typescript
// src/lib/services/ErrorLoggingService.ts
export class ErrorLoggingService {
  private static instance: ErrorLoggingService;

  static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }

  logError(error: Error, metadata: ErrorMetadata) {
    // Log to Firestore
    const errorRef = doc(collection(db, 'errors'));
    await setDoc(errorRef, {
      message: error.message,
      stack: error.stack,
      metadata,
      timestamp: new Date(),
    });

    // Send to Sentry
    captureError(error, metadata);
  }

  async getErrorLogs(filters: ErrorLogFilters): Promise<ErrorLog[]> {
    // Implementation for retrieving error logs
  }
}
```

---

Last Updated: March 14, 2024
Next Review: March 21, 2024 