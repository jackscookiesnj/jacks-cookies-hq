import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const saveUrl = process.env.GOOGLE_DRIVE_SAVE_URL;
  const token = process.env.GOOGLE_DRIVE_SAVE_TOKEN;

  if (!saveUrl || !token) {
    return NextResponse.json(
      { error: "Google Drive saving is not configured yet." },
      { status: 503 },
    );
  }

  const payload = await request.json();
  const result = await fetch(saveUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, token }),
  });

  const text = await result.text();
  let data: unknown = {};
  let parsedJson = true;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    parsedJson = false;
    data = { message: text };
  }

  const helperError =
    data && typeof data === "object" && "error" in data
      ? String((data as { error?: unknown }).error)
      : "";

  if (!result.ok || helperError || !parsedJson) {
    return NextResponse.json(
      { error: helperError || "Google Drive save failed.", detail: data },
      { status: result.ok ? 400 : result.status },
    );
  }

  return NextResponse.json(data);
}
