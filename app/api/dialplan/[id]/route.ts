import { NextResponse } from 'next/server'
import { getDialplanRule, updateDialplanRule, deleteDialplanRule } from '@/lib/db/queries'
import { validateToken } from '@/lib/auth-middleware'

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

    const rule = await getDialplanRule(params.id, token.tenantId)
    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error fetching dialplan rule:', error)
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
    const updatedRule = await updateDialplanRule(params.id, data, token.tenantId)
    if (!updatedRule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedRule)
  } catch (error) {
    console.error('Error updating dialplan rule:', error)
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

    const deleted = await deleteDialplanRule(params.id, token.tenantId)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dialplan rule:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}