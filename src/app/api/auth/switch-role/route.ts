import { NextResponse } from 'next/server';
import { RBACService } from '@/lib/services/rbac';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { RoleType } from '@/lib/types/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check for user session and custom id property
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    const { roleId, companyId, tenantId } = await request.json();

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const rbacService = RBACService.getInstance();
    
    // Verify that the user has the requested role
    const userRole = await rbacService.getUserRole(userId);
    
    if (!userRole) {
      return NextResponse.json(
        { error: 'User role not found' },
        { status: 404 }
      );
    }
    
    const hasRole = userRole.roleId === roleId && 
                   userRole.companyId === (companyId || null) && 
                   userRole.tenantId === (tenantId || null);

    if (!hasRole) {
      return NextResponse.json(
        { error: 'User does not have the requested role' },
        { status: 403 }
      );
    }

    // Update the active role in the session
    // Since updateActiveRole doesn't exist, use another method like updateRole
    await rbacService.updateRole(userId, {
      roleId: roleId as RoleType,
      companyId,
      tenantId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error switching role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 