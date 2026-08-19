export interface PostVideoInput {
  accessToken: string;
  refreshToken: string | null;
  videoBytes: Buffer;
  mime: string;
  title: string;
  caption: string;
}

export interface PostVideoResult {
  platformPostId: string;
}

export interface Poster {
  post(input: PostVideoInput): Promise<PostVideoResult>;
}
