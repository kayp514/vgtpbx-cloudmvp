import { NextResponse } from 'next/server';
import { listMessages } from '@/lib/db/queries';
import { validateToken } from '@/lib/auth-middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const token = await validateToken(request);
    if (!token.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      ...(searchParams.get('startDate') && {
        createdAt: {
          gte: new Date(searchParams.get('startDate')!)
        }
      }),
      ...(searchParams.get('endDate') && {
        createdAt: {
          lte: new Date(searchParams.get('endDate')!)
        }
      }),
      ...(searchParams.get('status') && {
        status: searchParams.get('status')
      }),
      ...(searchParams.get('direction') && {
        direction: searchParams.get('direction')
      })
    };

    const messages = await listMessages(token.tenantId, filters);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = await validateToken(request);
    if (!token.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const newMessage = await prisma.message.create({
      data: {
        ...data,
        tenantId: token.tenantId,
        status: 'pending'
      }
    });

    // TODO: Integrate with SMS provider to actually send the message
    // This would update the message status to 'sent' or 'failed'
    
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}