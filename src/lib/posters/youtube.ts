import { google } from "googleapis";
import { Readable } from "node:stream";
import type { Poster, PostVideoInput, PostVideoResult } from "./types";

export function getYoutubeOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export const youtubePoster: Poster = {
  async post(input: PostVideoInput): Promise<PostVideoResult> {
    const oauth2Client = getYoutubeOAuthClient();
    oauth2Client.setCredentials({
      access_token: input.accessToken,
      refresh_token: input.refreshToken ?? undefined,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const res = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: input.title.slice(0, 100) || "AI generated short",
          description: input.caption,
          categoryId: "22",
        },
        status: {
          privacyStatus:
            (process.env.YOUTUBE_DEFAULT_PRIVACY as
              | "public"
              | "unlisted"
              | "private") ?? "public",
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: Readable.from(input.videoBytes),
      },
    });

    const id = res.data.id;
    if (!id) throw new Error("YouTube upload did not return a video id");
    return { platformPostId: id };
  },
};
