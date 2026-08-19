import { NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/db";
import { verifyOAuthState } from "@/lib/oauthState";
import { getYoutubeOAuthClient } from "@/lib/posters/youtube";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const dashboardUrl = new URL("/dashboard/accounts", req.url);

  if (!code || !state) {
    dashboardUrl.searchParams.set("error", "YouTube authorization was cancelled");
    return NextResponse.redirect(dashboardUrl);
  }

  const userId = await verifyOAuthState(state);
  if (!userId) {
    dashboardUrl.searchParams.set("error", "Your session expired, try connecting again");
    return NextResponse.redirect(dashboardUrl);
  }

  try {
    const oauth2Client = getYoutubeOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const channelRes = await youtube.channels.list({ part: ["snippet"], mine: true });
    const channel = channelRes.data.items?.[0];
    if (!channel?.id) throw new Error("Could not read the YouTube channel");

    await prisma.socialAccount.upsert({
      where: {
        userId_platform_externalId: {
          userId,
          platform: "YOUTUBE",
          externalId: channel.id,
        },
      },
      create: {
        userId,
        platform: "YOUTUBE",
        externalId: channel.id,
        displayName: channel.snippet?.title ?? "YouTube channel",
        accessToken: tokens.access_token ?? "",
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      update: {
        displayName: channel.snippet?.title ?? "YouTube channel",
        accessToken: tokens.access_token ?? "",
        refreshToken: tokens.refresh_token ?? undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });

    dashboardUrl.searchParams.set("connected", "youtube");
    return NextResponse.redirect(dashboardUrl);
  } catch (err) {
    dashboardUrl.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Failed to connect YouTube"
    );
    return NextResponse.redirect(dashboardUrl);
  }
}
