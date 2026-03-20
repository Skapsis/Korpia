import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const SUPERSET_URL = process.env.NEXT_PUBLIC_SUPERSET_URL;
const ADMIN_USERNAME = process.env.SUPERSET_ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.SUPERSET_ADMIN_PASSWORD;

/** Extrae cabecera Cookie a partir de Set-Cookie(s) de la respuesta (Node/undici fetch). */
function extractCookies(res: Response): string {
  const cookies = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : [];
  const cookieStr = res.headers.get("set-cookie");

  if (cookies.length > 0) {
    return cookies.map((c) => c.split(";")[0]).join("; ");
  }
  if (cookieStr) {
    return cookieStr.split(";")[0];
  }
  return "";
}

export async function POST(request: NextRequest) {
  let sessionCookie = "";

  try {
    const session = await auth();
    if (!session?.user) {
      console.log("[Superset token] Sin sesión de aplicación");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const dashboardId = body?.dashboardId as string | undefined;

    if (!dashboardId?.trim()) {
      return NextResponse.json(
        { error: "dashboardId is required" },
        { status: 400 }
      );
    }

    console.log("[Superset token] dashboardId recibido del frontend:", dashboardId);

    if (!SUPERSET_URL || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error("[Superset token] Faltan variables de entorno de Superset");
      return NextResponse.json(
        { error: "Superset is not configured" },
        { status: 500 }
      );
    }

    const baseUrl = SUPERSET_URL.replace(/\/$/, "");

    // --- Paso 1: Login ---
    console.log("[Superset token] Paso 1: POST /api/v1/security/login");
    const loginRes = await fetch(`${baseUrl}/api/v1/security/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        provider: "db",
      }),
    });

    if (!loginRes.ok) {
      const errText = await loginRes.text();
      console.error(
        "[Superset token] Paso 1 falló:",
        loginRes.status,
        errText.slice(0, 500)
      );
      return NextResponse.json(
        { error: "Failed to authenticate with Superset", step: "login" },
        { status: 500 }
      );
    }

    const cookie1 = extractCookies(loginRes);
    if (cookie1) {
      sessionCookie = cookie1;
      console.log(
        "[Superset token] Paso 1: cookies capturadas (preview):",
        sessionCookie.slice(0, 100) + (sessionCookie.length > 100 ? "…" : "")
      );
    } else {
      console.log("[Superset token] Paso 1: sin Set-Cookie en la respuesta de login");
    }

    const loginData = (await loginRes.json()) as { access_token?: string };
    const accessToken = loginData.access_token;

    if (!accessToken) {
      console.error("[Superset token] Paso 1: JSON sin access_token");
      return NextResponse.json(
        { error: "No access token from Superset", step: "login" },
        { status: 500 }
      );
    }
    console.log("[Superset token] Paso 1 OK: access_token recibido");

    // --- Paso 2: CSRF token ---
    console.log("[Superset token] Paso 2: GET /api/v1/security/csrf_token/");
    const csrfHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (sessionCookie) {
      csrfHeaders.Cookie = sessionCookie;
    }

    const csrfRes = await fetch(`${baseUrl}/api/v1/security/csrf_token/`, {
      method: "GET",
      headers: csrfHeaders,
    });

    if (!csrfRes.ok) {
      const errText = await csrfRes.text();
      console.error(
        "[Superset token] Paso 2 falló:",
        csrfRes.status,
        errText.slice(0, 500)
      );
      return NextResponse.json(
        { error: "Failed to get CSRF token from Superset", step: "csrf_token" },
        { status: 500 }
      );
    }

    const cookie2 = extractCookies(csrfRes);
    if (cookie2) {
      sessionCookie = sessionCookie ? `${sessionCookie}; ${cookie2}` : cookie2;
      console.log(
        "[Superset token] Paso 2: cookies acumuladas tras CSRF (preview):",
        sessionCookie.slice(0, 120) + (sessionCookie.length > 120 ? "…" : "")
      );
    } else {
      console.log(
        "[Superset token] Paso 2: sin nuevas Set-Cookie; se mantiene Cookie del paso 1:",
        sessionCookie ? "sí" : "no"
      );
    }

    const csrfJson = (await csrfRes.json()) as { result?: string };
    const csrfToken = csrfJson.result;

    if (!csrfToken) {
      console.error(
        "[Superset token] Paso 2: respuesta sin result:",
        JSON.stringify(csrfJson).slice(0, 300)
      );
      return NextResponse.json(
        { error: "No CSRF token in Superset response", step: "csrf_token" },
        { status: 500 }
      );
    }
    console.log("[Superset token] Paso 2 OK: CSRF token obtenido");

    // --- Paso 3: Guest token (Cookie = paso 1 + paso 2) ---
    console.log("[Superset token] Paso 3: POST /api/v1/security/guest_token/");
    const guestHeaders: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
      "X-CSRFToken": csrfToken,
      "Content-Type": "application/json",
    };
    if (sessionCookie) {
      (guestHeaders as Record<string, string>).Cookie = sessionCookie;
      console.log(
        "[Superset token] Paso 3: enviando header Cookie (longitud):",
        sessionCookie.length
      );
    } else {
      console.warn(
        "[Superset token] Paso 3: sessionCookie vacío — Flask puede rechazar CSRF de sesión"
      );
    }

    const guestTokenBody = {
      user: {
        username: "korpia_guest",
        first_name: "Korpia",
        last_name: "User",
      },
      resources: [
        {
          type: "dashboard",
          id: dashboardId,
        },
      ],
      rls: [],
    };

    console.log(
      "[Superset token] Paso 3 payload resources:",
      JSON.stringify(guestTokenBody.resources)
    );

    const guestRes = await fetch(`${baseUrl}/api/v1/security/guest_token/`, {
      method: "POST",
      headers: guestHeaders,
      body: JSON.stringify(guestTokenBody),
    });

    if (!guestRes.ok) {
      const errText = await guestRes.text();
      console.error(
        "[Superset token] Paso 3 falló:",
        guestRes.status,
        errText.slice(0, 500)
      );
      return NextResponse.json(
        { error: "Failed to get guest token", step: "guest_token" },
        { status: 500 }
      );
    }

    const guestData = (await guestRes.json()) as { token?: string };
    const token = guestData.token;

    if (!token) {
      console.error(
        "[Superset token] Paso 3: respuesta sin token:",
        JSON.stringify(guestData).slice(0, 300)
      );
      return NextResponse.json(
        { error: "No guest token in response", step: "guest_token" },
        { status: 500 }
      );
    }

    console.log("[Superset token] Paso 3 OK: guest token generado");
    return NextResponse.json({ token });
  } catch (e) {
    console.error("[Superset token] Excepción:", e);
    return NextResponse.json(
      { error: "Internal error generating token", step: "exception" },
      { status: 500 }
    );
  }
}
