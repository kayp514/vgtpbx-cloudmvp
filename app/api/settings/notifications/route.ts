import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, type AuthenticatedRequest } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

export const GET = requireRole(['ADMIN', 'MANAGER', 'USER'])(async (req: AuthenticatedRequest) => {
  try {
    const settings = await prisma.notificationSettings.findUnique({
      where: {
        tenantId: req.tenant.id,
      },
    });

    if (!settings) {
      // Create default settings if none exist
      const defaults = {
        missedCallEnabled: true,
        missedCallChannels: ['email'],
        voicemailEnabled: true,
        voicemailChannels: ['email'],
        messageEnabled: true,
        messageChannels: ['email'],
        templates: {
          missedCall: "You missed a call from {{from}} at {{time}}",
          voicemail: "New voicemail from {{from}} ({{duration}}): {{transcript}}",
          message: "New message from {{from}}: {{message}}"
        }
      };

      const newSettings = await prisma.notificationSettings.create({
        data: {
          ...defaults,
          tenantId: req.tenant.id,
        },
      });

      return NextResponse.json(newSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
});

export const PUT = requireRole(['ADMIN', 'MANAGER'])(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const {
      missedCallEnabled,
      missedCallChannels,
      voicemailEnabled,
      voicemailChannels,
      messageEnabled,
      messageChannels,
      templates,
    } = body;

    // Validate channels
    const validChannels = ['email', 'sms'];
    const allChannels = [
      ...(missedCallChannels || []),
      ...(voicemailChannels || []),
      ...(messageChannels || []),
    ];

    if (allChannels.some(channel => !validChannels.includes(channel))) {
      return NextResponse.json(
        { error: 'Invalid notification channel' },
        { status: 400 }
      );
    }

    // Update settings
    const settings = await prisma.notificationSettings.upsert({
      where: {
        tenantId: req.tenant.id,
      },
      update: {
        missedCallEnabled,
        missedCallChannels,
        voicemailEnabled,
        voicemailChannels,
        messageEnabled,
        messageChannels,
        templates,
      },
      create: {
        tenantId: req.tenant.id,
        missedCallEnabled,
        missedCallChannels,
        voicemailEnabled,
        voicemailChannels,
        messageEnabled,
        messageChannels,
        templates,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
});