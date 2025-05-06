import { NextResponse } from 'next/server'
import { auth } from "@tern-secure/nextjs/server"
import { getAllDialplans } from '@/lib/db/dialplan'


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const searchTerm = searchParams.get('search') || undefined
    const enabled = searchParams.get('enabled') === 'true'
    
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const uid = session.user.uid

    const skip = (page - 1) * limit

    const { domainDialplans, defaultDialplans, total } = await getAllDialplans({
      uid,
      skip,
      take: limit,
      searchTerm
    })

    return NextResponse.json({
      data: {
        domain: domainDialplans,
        default: defaultDialplans,
      },
      pagination: {
        total,
        page,
        limit,
      }
    })
  } catch (error) {
    console.error('Error fetching dialplan rules:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}