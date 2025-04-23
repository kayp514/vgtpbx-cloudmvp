import { NextResponse } from 'next/server'
import { listBillingPlans } from '@/lib/db/queries'
import { auth } from "@tern-secure/nextjs/server"

export async function GET(request: Request) {
  try {
    const token = await auth()
    if (!token.user?.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const plans = await listBillingPlans()
    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching billing plans:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}