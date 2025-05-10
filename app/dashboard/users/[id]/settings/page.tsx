import { UserEdit } from "@/components/user-edit"
import { cookies } from "next/headers"
import type { PbxUserDisplay } from "@/lib/db/types"
import { notFound } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

async function getUser(
  id: string
): Promise<PbxUserDisplay> {
  const cookieStore = await cookies()

  const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    if (res.status === 404) {
      notFound()
    }
    throw new Error('Failed to fetch user')
  }

  const response = await res.json()
  const user = response.data

  return {
    id: user.pbxUser.id,
    auth_user_id: user.pbxUser.auth_user_id,
    username: user.pbxUser.username,
    email: user.pbxUser.email,
    status: user.pbxUser.status,
    disabled: user.pbxUser.disabled,
    auth_user: {
      displayName: user.authUser.user.displayName,
      firstName: user.authUser.user.firstName,
      lastName: user.authUser.user.lastName,
      isAdmin: user.authUser.user.isAdmin,
      isSuperuser: user.authUser.user.isSuperuser,
      isStaff: user.authUser.user.isStaff,
      avatar: user.authUser.user.avatar
    },
    role: user.authUser.user.isSuperuser 
      ? 'superuser' 
      : user.authUser.user.isAdmin 
      ? 'admin' 
      : user.authUser.user.isStaff 
      ? 'staff' 
      : 'member'
  }
}

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default async function EditUserPage({ 
  params 
}: EditUserPageProps) {
  const { id } = await params
  const user = await getUser(id)

  return <UserEdit initialUser={user} />
}
