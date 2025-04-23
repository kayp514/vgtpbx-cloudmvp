import { NextResponse } from 'next/server';
import { auth } from '@tern-secure/nextjs/server';

const testCases = [
  {
    number: '+1(555)1234567',
    type: 'US Local Number'
  },
  {
    number: '5551234567',
    type: '10-digit Number'
  },
  {
    number: '+15551234567',
    type: 'US Number with Country Code'
  },
  {
    number: '*98',
    type: 'Voicemail Access'
  },
  {
    number: '2345678901',
    type: 'US Number without +1'
  },
  {
    number: '+441234567890',
    type: 'UK Number'
  },
  {
    number: '*721234567',
    type: 'Call Forward'
  },
  {
    number: '1001',
    type: 'Extension'
  },
  {
    number: '+6598765432',
    type: 'International Number'
  }
];

export async function POST(request: Request) {
  try {
    const { user } = await auth();
    if (!user?.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { pattern } = await request.json();
    
    if (!pattern) {
      return NextResponse.json(
        { error: 'Pattern is required' },
        { status: 400 }
      );
    }

    try {
      const regex = new RegExp(pattern);
      const results = testCases.map(test => ({
        number: test.number,
        type: test.type,
        matches: regex.test(test.number)
      }));

      const matchCount = results.filter(r => r.matches).length;

      return NextResponse.json({
        success: true,
        message: `Pattern is valid and matches ${matchCount} test cases`,
        results,
        suggestedPatterns: [
          '^\\d{4}$',
          '^\\+1(\\d{3})\\d{7}$',
          '^\\*\\d{2}\\d*$',
          '^\\+[1-9]\\d{6,14}$'
        ]
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid regular expression pattern' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error testing pattern:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}