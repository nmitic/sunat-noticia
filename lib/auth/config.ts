import type { NextAuthOptions, Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db, adminTable } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';
import { JWT } from 'next-auth/jwt';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const [admin] = await db.select()
          .from(adminTable)
          .where(eq(adminTable.email, credentials.email))
          .limit(1);

        if (!admin) {
          throw new Error('No user found with this email');
        }

        const passwordMatch = await compare(credentials.password, admin.passwordHash);

        if (!passwordMatch) {
          throw new Error('Invalid password');
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        };
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (session.user as any).id = token.sub || '';
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 24 * 60 * 60, // 24 hours
  },
  events: {
    async signIn({ user }) {
      console.log('Admin logged in:', user.email);
    },
  },
};
