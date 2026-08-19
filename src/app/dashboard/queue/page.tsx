import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { serializeProject } from "@/lib/serialize";
import QueueClient from "./QueueClient";

export default async function QueuePage() {
  const userId = await requireUserId();
  const projects = await prisma.videoProject.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return <QueueClient initialProjects={projects.map(serializeProject)} />;
}
