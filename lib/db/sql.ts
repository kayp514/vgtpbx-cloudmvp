import { Prisma } from '@prisma/client';
import type { DatabaseUserInput } from './types';
import { 
  defaultAccessControls, 
  defaultAccessControlNodes 
} from './switch-data'

export const clientSchemaQueries = {
    insertDomain: (
      tx: any,
      schemaName: string,
      domainId: string,
      domainName: string,
      disabled: boolean,
      description: string,
      updatedBy: string,
      homeSwitch: string | null,
      menuId: string | null,
      portalName: string | null,
      tenantId: string
    ) => tx.$queryRaw`
      INSERT INTO ${Prisma.raw(`"${schemaName}"`)}."pbx_domains" (
        id, name, disabled, description, created, updated,
        "updatedBy", "homeSwitch", "menuId", "portalName", "tenantId"
      ) VALUES (
        ${domainId}::uuid, ${domainName}, ${disabled}, ${description},
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
        ${updatedBy}, ${homeSwitch}::uuid, ${menuId}::uuid, ${portalName}, ${tenantId}
      ) RETURNING *`,

    insertAuthUser: (
      tx: any,
      data: DatabaseUserInput & { tenantId: string}
    ) => tx.$queryRaw`
      INSERT INTO public.auth_user (
        uid, "updatedAt", email, "displayName", "firstName",
        "lastName", avatar, "phoneNumber", "isSuperuser",
        "isAdmin", "isStaff", "emailVerified", disabled,
        "tenantId", "createdAt", "lastSignInAt"
      ) VALUES (
        ${data.uid}, CURRENT_TIMESTAMP, ${data.email}, ${data.displayName},
        ${data.firstName}, ${data.lastName}, ${data.avatar}, ${data.phoneNumber},
        ${data.isSuperuser}, ${data.isAdmin}, ${data.isStaff},
        ${data.emailVerified}, ${data.disabled}, ${data.tenantId},
        CURRENT_TIMESTAMP, ${data.lastSignInAt}
      ) RETURNING *`,

    insertPbxUser: (
      tx: any,
      schemaName: string,
      userUuid: string,
      username: string,
      email: string,
      department: string,
      status: string,
      disabled: boolean,
      updatedBy: string,
      domainId: string,
      authUserId: string
    ) => tx.$queryRaw`
      INSERT INTO ${Prisma.raw(`"${schemaName}"`)}."pbx_users" (
        user_uuid, username, email, department, status,
        disabled, created, updated, "updatedBy",
        "domainId", auth_user_id
      ) VALUES (
        ${userUuid}::uuid, ${username}, ${email}, ${department}, ${status},
        ${disabled}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${updatedBy},
        ${domainId}::uuid, ${authUserId}
      ) RETURNING *`,
    

      insertACLs: (
        tx: any,
        schemaName: string,
      ) => tx.$queryRaw`
        WITH inserted_acls AS (
          INSERT INTO ${Prisma.raw(`"${schemaName}"`)}."pbx_access_controls" (
            id, name, "default", description, synchronised,
            created, updated, "updated_by"
          )
          SELECT * FROM (VALUES
            ${Prisma.join(
              defaultAccessControls.map(
                acl => Prisma.sql`(
                  ${acl.id}::uuid, ${acl.name}, ${acl.default}, ${acl.description}, ${acl.synchronised},
                  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${acl.updated_by}
                )`
              ),
              ','
            )}
          ) AS t RETURNING *
        )
        INSERT INTO ${Prisma.raw(`"${schemaName}"`)}."pbx_access_control_nodes" (
          id, access_control_id_id, type, cidr, domain,
          description, synchronised, created, updated, "updated_by"
        )
        SELECT * FROM (VALUES
          ${Prisma.join(
            defaultAccessControlNodes.map(
              node => Prisma.sql`(
                ${node.id}::uuid, ${node.access_control_id_id}::uuid, ${node.type},
                ${node.cidr}, ${node.domain}, ${node.description}, ${node.synchronised},
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${node.updated_by}
              )`
            ),
            ','
          )}
        ) AS n RETURNING *`,
}