import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { createOAuthState } from "@/lib/oauthState";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.redirect(new URL("/login", req.url));

  if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error:
          "TikTok isn't configured yet. Set TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET and TIKTOK_REDIRECT_URI.",
      },
      { status: 501 }
    );
  }

  const state = await createOAuthState(userId);
  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", process.env.TIKTOK_CLIENT_KEY);
  authUrl.searchParams.set("scope", "user.info.basic,video.publish");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", process.env.TIKTOK_REDIRECT_URI!);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
