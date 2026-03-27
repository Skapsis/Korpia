import { NextResponse } from "next/server";
import { auth } from "@/auth";

type SupersetLoginResponse = {
  access_token?: string;
};

type SupersetGuestTokenResponse = {
  token?: string;
};

type RlsRule = {
  clause: string;
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = typeof session?.user?.id === "string" ? session.user.id : "";
    const userRole = typeof session?.user?.role === "string" ? session.user.role : "USER";
    const userEmail =
      typeof session?.user?.email === "string" && session.user.email.trim().length > 0
        ? session.user.email
        : "guest@korpia.local";

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { dashboardId?: string };
    const dashboardId = typeof body.dashboardId === "string" ? body.dashboardId.trim() : "";

    if (!dashboardId) {
      return NextResponse.json({ error: "dashboardId is required" }, { status: 400 });
    }

    const rlsRules: RlsRule[] = [];
    if (userRole !== "ADMIN") {
      const safeEmail = userEmail.replace(/'/g, "''");
      rlsRules.push({ clause: `username = '${safeEmail}'` });
    }

    const supersetUrl = process.env.SUPERSET_URL?.trim();
    const adminUsername = process.env.SUPERSET_ADMIN_USERNAME?.trim();
    const adminPassword = process.env.SUPERSET_ADMIN_PASSWORD?.trim();

    if (!supersetUrl || !adminUsername || !adminPassword) {
      return NextResponse.json({ guestToken: "mock_token", token: "mock_token", mock: true });
    }

    const baseUrl = supersetUrl.replace(/\/$/, "");

    const loginRes = await fetch(`${baseUrl}/api/v1/security/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: adminUsername,
        password: adminPassword,
        provider: "db",
      }),
    });

    if (!loginRes.ok) {
      const loginError = await loginRes.text();
      return NextResponse.json(
        { error: "Superset login failed", details: loginError.slice(0, 250) },
        { status: 500 }
      );
    }

    const loginData = (await loginRes.json()) as SupersetLoginResponse;
    if (!loginData.access_token) {
      return NextResponse.json({ error: "Superset access_token missing" }, { status: 500 });
    }

    const guestRes = await fetch(`${baseUrl}/api/v1/security/guest_token/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${loginData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: {
          username: userEmail,
          first_name: typeof session?.user?.name === "string" ? session.user.name : "Korpia",
          last_name: "User",
        },
        resources: [{ type: "dashboard", id: dashboardId }],
        rls: rlsRules,
      }),
    });

    if (!guestRes.ok) {
      const guestError = await guestRes.text();
      return NextResponse.json(
        { error: "Superset guest_token failed", details: guestError.slice(0, 250) },
        { status: 500 }
      );
    }

    const guestData = (await guestRes.json()) as SupersetGuestTokenResponse;
    if (!guestData.token) {
      return NextResponse.json({ error: "Superset guest token missing" }, { status: 500 });
    }

    return NextResponse.json({ guestToken: guestData.token, token: guestData.token, mock: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
