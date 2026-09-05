import type { DefaultSession } from 'next-auth';

/**
 * The session callback in `lib/auth/config.ts` copies the JWT subject onto
 * `session.user.id`. NextAuth's own `Session` type has no such field, so it is
 * declared here rather than cast away at each use site.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
