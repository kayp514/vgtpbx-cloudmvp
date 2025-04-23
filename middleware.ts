// middleware.ts
import { ternSecureMiddleware, createRouteMatcher } from '@tern-secure/nextjs/server';

const publicPaths = createRouteMatcher(['/sign-in', '/sign-up', '/api/xmlhandler/:path*'])

export const config = {
  matcher: ['/v0/:path*', '/dashboard/:path*', '/api/:path*'],
};

export default ternSecureMiddleware(async (auth, request) => {
  if(!publicPaths(request)) {
    await auth.protect()
  }

})