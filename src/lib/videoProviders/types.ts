export interface GeneratedVideo {
  data: Buffer;
  mime: string;
  durationSec: number;
}

export interface VideoProvider {
  name: string;
  generate(prompt: string): Promise<GeneratedVideo>;
}
