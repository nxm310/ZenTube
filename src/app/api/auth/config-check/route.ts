import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasClientId = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_ID.trim().length > 0 &&
    !process.env.GOOGLE_CLIENT_ID.includes("your-google-client-id")
  );

  const hasClientSecret = Boolean(
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_SECRET.trim().length > 0 &&
    !process.env.GOOGLE_CLIENT_SECRET.includes("your-google-client-secret")
  );

  return NextResponse.json({
    configured: hasClientId && hasClientSecret,
    hasClientId,
    hasClientSecret,
  });
}
