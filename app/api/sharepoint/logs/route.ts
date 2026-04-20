import { NextResponse } from "next/server";

import { syncLogFileToSharePoint } from "@/lib/sharepoint-logs";
import type { SharePointLogRequest } from "@/types/api/sharepoint-logs-route.types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: SharePointLogRequest;

  try {
    payload = (await request.json()) as SharePointLogRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const fileName =
    typeof payload.fileName === "string" ? payload.fileName.trim() : "";
  const content =
    typeof payload.content === "string" ? payload.content : "";

  if (!fileName || !content) {
    return NextResponse.json(
      { error: "fileName and content are required." },
      { status: 400 },
    );
  }

  try {
    const result = await syncLogFileToSharePoint(fileName, content);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "SharePoint sync failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
