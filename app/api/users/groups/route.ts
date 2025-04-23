import { NextResponse } from 'next/server';
import { auth } from '@tern-secure/nextjs/server';
import { headers } from 'next/headers';


export async function GET() {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant, user } = await getUserAndTenant(authHeader);

    const groups = await prisma.userGroup.findMany({
      where: {
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

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}