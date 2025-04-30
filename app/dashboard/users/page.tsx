import { UsersClient } from "@/components/users"
import type { PbxUserDisplay } from "@/lib/db/types"
import { cookies } from "next/headers"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

async function getPbxUsers(): Promise<PbxUserDisplay[]> {
  const cookieStore = (await cookies())

  const res = await fetch(`${API_BASE_URL}/api/users`, {
    headers: {
      Cookie: cookieStore.toString(),
    }, 
    cache: 'no-store',
  })

  const response = await res.json()

  if (!res.ok) {
    throw new Error(response.error || "Failed to get users")
  }

  const user = response.data
  const transformedUser: PbxUserDisplay = {
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

  return [transformedUser]
}

export default async function UsersPage() {
  const users = await getPbxUsers()

  return <UsersClient initialUsers={users} />
    //<div className="container py-4">
    //</div>
}
