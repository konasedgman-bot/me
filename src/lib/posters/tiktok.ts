import type { Poster, PostVideoInput, PostVideoResult } from "./types";

const API_BASE = "https://open.tiktokapis.com/v2";

export const tiktokPoster: Poster = {
  async post(input: PostVideoInput): Promise<PostVideoResult> {
    const initRes = await fetch(`${API_BASE}/post/publish/video/init/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: input.title.slice(0, 150),
          privacy_level: process.env.TIKTOK_PRIVACY_LEVEL ?? "SELF_ONLY",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: input.videoBytes.length,
          chunk_size: input.videoBytes.length,
          total_chunk_count: 1,
        },
      }),
    });

    const initJson = await initRes.json();
    if (!initRes.ok || !initJson?.data?.upload_url) {
      throw new Error(
        `TikTok init failed: ${initRes.status} ${JSON.stringify(initJson)}`
      );
    }

    const { publish_id, upload_url } = initJson.data;

    const uploadRes = await fetch(upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": input.mime,
        "Content-Range": `bytes 0-${input.videoBytes.length - 1}/${input.videoBytes.length}`,
      },
      body: new Uint8Array(input.videoBytes),
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => "");
      throw new Error(`TikTok upload failed: ${uploadRes.status} ${text}`);
    }

    return { platformPostId: publish_id };
  },
};
