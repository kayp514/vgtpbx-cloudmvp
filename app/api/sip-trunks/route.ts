import { NextResponse } from 'next/server'
import { listSIPTrunks } from '@/lib/db/queries'
import { auth } from '@tern-secure/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {

    const session = await auth()

    const trunks = await listSIPTrunks()
    return NextResponse.json(trunks)
  } catch (error) {
    console.error('Error fetching SIP trunks:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    const data = await request.json()
    const newTrunk = await prisma.sipTrunk.create({
      data: {
        ...data,
        tenantId: token.tenantId
      }
    })
    
    return NextResponse.json(newTrunk, { status: 201 })
  } catch (error) {
    console.error('Error creating SIP trunk:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}