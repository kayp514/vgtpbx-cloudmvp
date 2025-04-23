import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, firebaseUid } = body;

    // Create the tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        schema: `vgtpbx_${firebaseUid.slice(0, 8)}`,
        planId: 'free', // Default plan, you might want to make this configurable
        settings: {
          create: {
            timezone: 'UTC',
            language: 'en',
          },
        },
        users: {
          create: {
            email,
            firebaseUid,
            role: 'ADMIN',
          },
        },
      },
      include: {
        users: true,
        settings: true,
      },
    });

    return NextResponse.json(tenant);
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}