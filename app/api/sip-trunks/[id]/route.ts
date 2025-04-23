import { NextResponse } from 'next/server'
import { getSIPTrunkById } from '@/lib/db/queries'
import { validateToken } from '@/lib/auth-middleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = await validateToken(request)
    if (!token.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const trunk = await getSIPTrunkById(params.id, token.tenantId)
    if (!trunk) {
      return NextResponse.json(
        { error: 'SIP trunk not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(trunk)
  } catch (error) {
    console.error('Error fetching SIP trunk:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = await validateToken(request)
    if (!token.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const trunk = await prisma.sipTrunk.update({
      where: {
        id: params.id,
        tenantId: token.tenantId
      },
      data
    })

    return NextResponse.json(trunk)
  } catch (error) {
    console.error('Error updating SIP trunk:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = await validateToken(request)
    if (!token.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.sipTrunk.delete({
      where: {
        id: params.id,
        tenantId: token.tenantId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting SIP trunk:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}