import { NextResponse } from 'next/server';
import { auth } from '@/lib/utils/firebase';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

async function getUserAndTenant(authHeader: string) {
  try {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      include: { tenant: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return { user, tenant: user.tenant };
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant } = await getUserAndTenant(authHeader);

    const group = await prisma.userGroup.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            tenantId: tenant.id,
          },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant, user } = await getUserAndTenant(authHeader);

    // Only admins and managers can update groups
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, userIds } = body;

    // Verify the group belongs to the tenant
    const existingGroup = await prisma.userGroup.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            tenantId: tenant.id,
          },
        },
      },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Update group name and members if provided
    const updateData: any = { name };
    if (userIds) {
      // Verify all users belong to the tenant
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          tenantId: tenant.id,
        },
      });

      if (users.length !== userIds.length) {
        return NextResponse.json(
          { error: 'One or more users not found' },
          { status: 400 }
        );
      }

      updateData.users = {
        set: userIds.map((id: string) => ({ id })),
      };
    }

    const updatedGroup = await prisma.userGroup.update({
      where: { id: params.id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant, user } = await getUserAndTenant(authHeader);

    // Only admins and managers can delete groups
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify the group belongs to the tenant
    const existingGroup = await prisma.userGroup.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            tenantId: tenant.id,
          },
        },
      },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Delete the group
    await prisma.userGroup.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}