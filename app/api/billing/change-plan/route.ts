import { NextResponse } from 'next/server';
import { auth } from '@/lib/utils/firebase';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Verify the plan exists
    const plan = await prisma.billingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Update tenant's plan
    const updatedTenant = await prisma.tenant.update({
      where: {
        users: {
          some: {
            firebaseUid: decodedToken.uid,
          },
        },
      },
      data: {
        planId: planId,
      },
      include: {
        billingPlan: true,
      },
    });

    // In a production environment, you would also:
    // 1. Update the subscription in Stripe
    // 2. Handle prorated charges
    // 3. Update usage limits based on the new plan

    return NextResponse.json({
      success: true,
      plan: updatedTenant.billingPlan,
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    return NextResponse.json(
      { error: 'Failed to change plan' },
      { status: 500 }
    );
  }
}