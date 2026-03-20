import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        console.log("Intentando login con:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = String(credentials.email).trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });
        console.log("Usuario encontrado:", user ? { id: user.id, email: user.email, role: user.role } : null);
        if (!user) {
          return null;
        }
        const isPasswordValid = await bcrypt.compare(
          String(credentials.password),
          user.password
        );
        console.log("¿Contraseña coincide?:", isPasswordValid);
        if (!isPasswordValid) {
          return null;
        }
        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
