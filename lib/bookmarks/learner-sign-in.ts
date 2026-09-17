import { buildLoginRedirectPath } from "../auth/redirects";

/**
 * Task B integration seam for the Save button.
 * Does not implement authentication. Routes through Task B's learner login
 * helper so `/login?next=` stays in one place.
 */
export function learnerSignInHref(returnTo: string): string {
  return buildLoginRedirectPath(returnTo);
}
