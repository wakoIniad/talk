import axios, { AxiosError }  from "axios";
import { NextRequest, NextResponse, } from "next/server";

const LINE_ACCESS_TOKENS = [ process.env.LINE_ACCESS_TOKEN1, process.env.LINE_ACCESS_TOKEN2 ];
export function GET(request: NextRequest): NextResponse {
  // GET /api/users リクエストの処理
  const params = request.nextUrl.searchParams;
  const query = params.get("query");

  return NextResponse.json(
    { response: "Test response." },
    { status: 200 },
  );
}
export async function POST(request: NextRequest): Promise<NextResponse> {
  // POST /api/users リクエストの処理
  const params = await request.json();
  const config = {
    'headers': {
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKENS[params.target],
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  };
  const data = {
    'message': params.message
  };
  try {
    const result = await axios.post( "https://notify-api.line.me/api/notify", data, config);
    console.log('送信済み:',result);
    return NextResponse.json(
      { response: "success" },
      { status: 200 },
    );
  } catch(e) {
    if (axios.isAxiosError(e)) {
      console.error('外部API呼び出しエラー',e);
      console.log(params,LINE_ACCESS_TOKENS);
      return NextResponse.json(
        { response: "error" },
        { status: 502 },
      );
    } else {
      console.error('予期しないエラー',e);
      console.log(params,LINE_ACCESS_TOKEN);
      return NextResponse.json(
        { response: "error" },
        { status: 500 },
      );
    }
  }
}
