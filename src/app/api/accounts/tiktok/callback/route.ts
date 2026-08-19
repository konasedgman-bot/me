import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyOAuthState } from "@/lib/oauthState";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const dashboardUrl = new URL("/dashboard/accounts", req.url);

  if (!code || !state) {
    dashboardUrl.searchParams.set("error", "TikTok authorization was cancelled");
    return NextResponse.redirect(dashboardUrl);
  }

  const userId = await verifyOAuthState(state);
  if (!userId) {
    dashboardUrl.searchParams.set("error", "Your session expired, try connecting again");
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      throw new Error(tokenJson.error_description ?? "TikTok token exchange failed");
    }

    const userRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",
      { headers: { Authorization: `Bearer ${tokenJson.access_token}` } }
    );
    const userJson = await userRes.json();
    const info = userJson?.data?.user;
    if (!info?.open_id) throw new Error("Could not read the TikTok profile");

    await prisma.socialAccount.upsert({
      where: {
        userId_platform_externalId: {
          userId,
          platform: "TIKTOK",
          externalId: info.open_id,
        },
      },
      create: {
        userId,
        platform: "TIKTOK",
        externalId: info.open_id,
        displayName: info.display_name ?? "TikTok account",
        accessToken: tokenJson.access_token,
        refreshToken: tokenJson.refresh_token ?? null,
        tokenExpiry: tokenJson.expires_in
          ? new Date(Date.now() + tokenJson.expires_in * 1000)
          : null,
      },
      update: {
        displayName: info.display_name ?? "TikTok account",
        accessToken: tokenJson.access_token,
        refreshToken: tokenJson.refresh_token ?? undefined,
        tokenExpiry: tokenJson.expires_in
          ? new Date(Date.now() + tokenJson.expires_in * 1000)
          : null,
      },
    });

    dashboardUrl.searchParams.set("connected", "tiktok");
    return NextResponse.redirect(dashboardUrl);
  } catch (err) {
    dashboardUrl.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Failed to connect TikTok"
    );
    return NextResponse.redirect(dashboardUrl);
  }
}
