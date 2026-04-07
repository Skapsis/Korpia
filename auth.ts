import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function normalizeRole(value: unknown): "ADMIN" | "USER" {
  return typeof value === "string" && value.toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
}

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
          role: normalizeRole(user.role),
          mustChangePassword: user.mustChangePassword === true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = normalizeRole((user as { role?: string }).role);
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword;
      }

      if (
        trigger === "update" &&
        session &&
        typeof (session as { mustChangePassword?: boolean }).mustChangePassword === "boolean"
      ) {
        token.mustChangePassword = (session as { mustChangePassword: boolean }).mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = normalizeRole(token.role);
        (session.user as { mustChangePassword?: boolean }).mustChangePassword =
          token.mustChangePassword === true;
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
