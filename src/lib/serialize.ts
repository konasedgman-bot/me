import type { VideoProject } from "@prisma/client";

export function serializeProject(project: VideoProject) {
  const { videoData, ...rest } = project;
  return {
    ...rest,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    hasVideo: !!videoData,
    playbackUrl: videoData ? `/api/videos/${project.id}/file` : project.videoUrl,
  };
}

export type SerializedProject = ReturnType<typeof serializeProject>;
