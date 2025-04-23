import { NextResponse } from 'next/server'
import { listDialplanRules } from '@/lib/db/queries'
import { auth } from "@tern-secure/nextjs/server"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const tenantId = "default "

export async function GET(request: Request) {
  try {
    const { user } = await auth()

    if (!user?.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const rules = await listDialplanRules(tenantId)
    return NextResponse.json(rules)
  } catch (error) {
    console.error('Error fetching dialplan rules:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { user }= await auth()
    if (!user?.uid){
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const newRule = await prisma.dialplanRule.create({
      data: {
        ...data,
        tenantId: tenantId
      }
    })
    
    return NextResponse.json(newRule, { status: 201 })
  } catch (error) {
    console.error('Error creating dialplan rule:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}