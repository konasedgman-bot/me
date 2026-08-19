import { NextResponse } from "next/server";
import { runSchedulerCycle } from "@/lib/scheduler";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSchedulerCycle();
  return NextResponse.json(result);
}
