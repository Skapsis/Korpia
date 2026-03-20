"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Por favor, completa todos los campos." };
  }

  try {
    await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirectTo: "/folder",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email o contraseña incorrectos." };
        default:
          return { error: "Error de autenticación." };
      }
    }

    // Si no es AuthError, es NEXT_REDIRECT de Next.js: re-lanzar para que la redirección funcione
    throw error;
  }

  return null;
}
