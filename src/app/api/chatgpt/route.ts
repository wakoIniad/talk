/*import axios, { AxiosError }  from "axios";
import { NextRequest, NextResponse, } from "next/server";
import {PythonShell} from 'python-shell';

const CHATGPT_TOKEN:string = String(process.env.CHATGPT_TOKEN);
const pyshell = new PythonShell('./call_gpt.py',);
export function GET(request: NextRequest): NextResponse {
  // GET /api/users リクエストの処理
  const params = request.nextUrl.searchParams;
  const message = String(params.get("message"));
  const data: { [key: string]: string } = {
    apikey: CHATGPT_TOKEN,
    message: message,
  }
  pyshell.send(JSON.stringify(data));
  pyshell.on('message',function(parsedMessage){
  });
  return NextResponse.json(
    { response: "Test response." },
    { status: 200 },
  );
}*/

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import axios, { AxiosError }  from "axios";
import { NextRequest, NextResponse, } from "next/server";
import { types } from "util";
import { DiffieHellman } from "crypto";

const OPENAI_API_KEY:string = String(process.env.OPENAI_API_KEY);


const OPENAI_API_BASE = 'https://api.openai.iniad.org/api/v1'

const model = new ChatOpenAI({
  openAIApiKey: OPENAI_API_KEY,
  temperature: 0,
  model: 'gpt-4o',
  configuration: {
    baseURL: OPENAI_API_BASE,
  },
});

export async function GET(request: NextRequest) {
  // GET /api/users リクエストの処理
  const params = request.nextUrl.searchParams;
  const message = String(params.get("message"));
  const modelInput =  [
    new HumanMessage('下記のひらがなのメッセージを文脈を考えたうえで適切に漢字や数字、記号などに変換してください。誤字が含まれる可能性があります。変換結果のみを出力してください。'),
    new HumanMessage(message)
  ]
  const result  = String((await model.invoke(modelInput)).content);
  console.log(result)
  return NextResponse.json(
    { response: result },
    { status: 200 },
  );
}



  /**
   * ：課題
   * ab aab のような場合に indexOfだと動作がおかしくなるかもしれない。最大の一致範囲(M)を返す場合処理順が難しい
   */
// 人間からのメッセージを作成
