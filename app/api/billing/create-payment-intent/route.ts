import { NextResponse } from 'next/server';
import { auth } from '@/lib/utils/firebase';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const prisma = new PrismaClient();

export async function POST() {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      include: {
        tenant: true,
      },
    });

    if (!user || !user.tenant) {
      return NextResponse.json({ error: 'User or tenant not found' }, { status: 404 });
    }

    // Create a SetupIntent for updating payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: user.tenant.stripeCustomerId, // Assuming you store this in your tenant model
      payment_method_types: ['card'],
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}