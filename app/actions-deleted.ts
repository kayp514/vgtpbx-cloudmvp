'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { 
  verifyAuthUser,
 } from '@/lib/db/q'
import { auth } from "@tern-secure/nextjs/server"

interface UpdateDialplanResult {
    success: boolean
    message: string
}


/**
 * Server action to update a dialplan's XML content
 */
export async function updateDialplanXml(
  dialplanId: string,
  xml: string,
  source: 'domain' | 'default'
): Promise<UpdateDialplanResult> {
  try {
    // Get the current user's session
    const session = await auth()
    
    if (!session || !session.user) {
        throw new Error('Unauthorized')
    }

    const uid = session.user.uid

    // Get user mapping to verify domain access
    const userMapping = await verifyAuthUser(uid)
    if (!userMapping.exists || !userMapping.mapping || !userMapping.tenant) {
      throw new Error('User mapping not found')
    }

    // Get the domain mapping for the tenant
    const domainMapping = await prisma.domain_mapping.findFirst({
      where: { tenantId: userMapping.tenant.id }
    })

    if (!domainMapping) {
      throw new Error('Domain mapping not found')
    }

    if (source === 'domain') {
      // Update domain-specific dialplan
      const dialplan = await prisma.pbx_dialplans.findFirst({
        where: {
          id: dialplanId,
          domain_id_id: domainMapping.fullDomainUid // Ensure user has access to this domain
        }
      })

      if (!dialplan) {
        throw new Error('Dialplan not found or access denied')
      }

      // Update the dialplan
      await prisma.pbx_dialplans.update({
        where: { id: dialplanId },
        data: {
          xml,
          updated: new Date(),
          updated_by: uid
        }
      })
    } else {
      // Check if user has permission to update default dialplans
      // You might want to add additional permission checks here
      const dialplan = await prisma.pbx_dialplan_defaults.findUnique({
        where: { id: dialplanId }
      })

      if (!dialplan) {
        throw new Error('Default dialplan not found')
      }

      // Update the default dialplan
      await prisma.pbx_dialplan_defaults.update({
        where: { id: dialplanId },
        data: {
          xml,
          updated: new Date(),
          updated_by: uid
        }
      })
    }

    // Revalidate the dialplans page to reflect changes
    revalidatePath('/dashboard/dialplan/all-dialplan')

    return {
      success: true,
      message: 'Dialplan updated successfully'
    }
  } catch (error) {
    console.error('Error updating dialplan XML:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        message: error.message
      }
    }

    return {
      success: false,
      message: 'An unexpected error occurred while updating the dialplan'
    }
  }
}