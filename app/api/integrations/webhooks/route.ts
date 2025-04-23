import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, type AuthenticatedRequest } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

export const GET = requireRole(['ADMIN', 'MANAGER'])(async (req: AuthenticatedRequest) => {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        tenantId: req.tenant.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
});

export const POST = requireRole(['ADMIN'])(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { name, url, events, enabled } = body;

    // Validate required fields
    if (!name || !url || !events?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Create webhook
    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events,
        enabled: enabled ?? true,
        tenantId: req.tenant.id,
      },
    });

    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
});