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

export async function GET() {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant } = await getUserAndTenant(authHeader);

    const settings = await prisma.settings.findUnique({
      where: { tenantId: tenant.id },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant } = await getUserAndTenant(authHeader);
    const body = await request.json();

    const settings = await prisma.settings.update({
      where: { tenantId: tenant.id },
      data: {
        timezone: body.timezone,
        language: body.language,
        defaultCallerId: body.defaultCallerId,
        recording: body.recording,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}