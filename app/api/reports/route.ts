import { NextResponse } from 'next/server'
import { listCallRecords } from '@/lib/db/queries'
import { validateToken } from '@/lib/auth-middleware'

export async function GET(request: Request) {
  try {
    const token = await validateToken(request)
    if (!token.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
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
    }

    const records = await listCallRecords(token.tenantId, filters)
    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching call records:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}