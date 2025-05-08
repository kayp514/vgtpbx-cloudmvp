import { cache } from 'react';

interface RequestContext {
  profile?: string;
  callerContext?: string;
  huntContext?: string;
  effectiveContext?: string;
}

// Use React cache to store request context within the same request lifecycle
export const getRequestContext = cache((): RequestContext => ({}));

export function setRequestContext(context: Partial<RequestContext>) {
  const currentContext = getRequestContext();
  Object.assign(currentContext, context);
}

// Get the effective context (hunt_context takes precedence over caller_context)
export function getEffectiveContext(): string | undefined {
  const { huntContext, callerContext } = getRequestContext();
  return huntContext || callerContext;
}

// Get the effective profile for directory operations
export function getEffectiveProfile(): string {
  const { profile } = getRequestContext();
  // If no profile is set, we default to 'internal'
  return profile || 'internal';
}