import { NextRequest, NextResponse, } from "next/server";

export function GET(request: NextRequest): NextResponse {
  // GET /api/users リクエストの処理
  const params = request.nextUrl.searchParams;
  const query = params.get("query");

  return NextResponse.json(
    { response: "Test response." },
    { status: 200 },
  );
}
