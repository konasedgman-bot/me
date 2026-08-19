import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { createOAuthState } from "@/lib/oauthState";
import { getYoutubeOAuthClient } from "@/lib/posters/youtube";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.redirect(new URL("/login", req.url));

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error:
          "YouTube isn't configured yet. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI.",
      },
      { status: 501 }
    );
  }

  const state = await createOAuthState(userId);
  const oauth2Client = getYoutubeOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    state,
  });

  return NextResponse.redirect(url);
}
