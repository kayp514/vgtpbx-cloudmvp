'use client'

import { SignUp } from "@tern-secure/nextjs"
import { ternSecureAuth } from '@tern-secure/nextjs'
import { createAuthPbxUser, generateNewAccountId } from "@/app/actions"
import type { FirebaseAuthUser } from '@/lib/db/types'
import { generateUniqueAccountId } from "@/lib/generate-account"

export default function Page() {
  const handleSignUpSuccess= async() => {
    try {
     const currentUser = await ternSecureAuth.currentUser

     if (!currentUser) {
       throw new Error("No user found after signup")
     }

     if (!currentUser.uid || !currentUser.email) {
       throw new Error("Firebase user missing required fields")
     }

     const accountId = await generateUniqueAccountId()

     const firebaseUser: FirebaseAuthUser = {
       uid: currentUser.uid,
       accountId,
       email: currentUser.email!,
       displayName: currentUser.displayName || null,
       photoURL: currentUser.photoURL || null,
       tenantId: currentUser.tenantId || 'default',
       emailVerified: currentUser.emailVerified || false,
       disabled: false,
       phoneNumber: currentUser.phoneNumber || null,
       metadata: {
         creationTime: currentUser.metadata.creationTime,
         lastSignInTime: currentUser.metadata.lastSignInTime,
       },
     }

     console.log('at sign-up page', firebaseUser)

     const result = await createAuthPbxUser(firebaseUser)
     console.log("Database Creation Result:", result)

     if (!result.success) {
       throw new Error(result.error?.message || "Failed to create user record")
     }
   } catch (error) {
     console.error('Error creating user:', error)
     throw error
   }
}

const handleError = (error: Error) => {
  console.error("Sign up error:", error)
  // Handle error (show toast, notification, etc.)
}

return  <SignUp onSuccess={handleSignUpSuccess} onError={handleError} />
}