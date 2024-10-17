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
  model: 'gpt-4o-mini',
  configuration: {
    baseURL: OPENAI_API_BASE,
  },
});


function diff(t1: string, t2: string): Array<DiffResponse> {

  const matchRanges: Array<DiffResponse> = [ ]
  let l = 0;
  let r = 0;
  let M = 0;
  let R = 0;// 未探索部分の左端
  for(let i = 0; i < t1.length; i+=r ) {
    const c = t1[i];
    const j = t2.indexOf(c, i);
    l = -1; r = 1;
    // @ts-expect-error ts(2345)
    while( t2[j+r] === t1[i+r] && ! [ t1[j+r] , t2[j+r] ].includes(undefined) )r++;
    // @ts-expect-error ts(2345)
    while( t2[j+l] === t1[i+l] && ! [ t1[j+l] , t2[j+r] ].includes(undefined) )l--;
    // @ts-expect-error ts(2345)
    if( [ t1[j+r] , t2[j+r], t1[j+l] , t2[j+r] ].includes(undefined) )break;
    matchRanges.push({
      range: [ R, l ],// ここの幅は0になる可能性がある。
      match: false,
    })
    matchRanges.push({
      range: [ l, r+1 ],
      match: true,
    });
    R = r+1;
  }
  return matchRanges;
}
console.log(diff("12345","aiu45"))

function integrate(validations:string[], threshold = 1):IntegrateResponse {
  for( const v1 in validations ) {
    for( const v2 in validations ) {
      if(v1 == v2) continue;
      diff(v1,v2);
    }
  }
  return { /** 仮: 送信時以外の返信の場合 */
    result: "私ははっていました。",//一致度合いが閾値より下の場合は勘違い防止のためデフォルトのテキストを使用する
    map: ["私", [ "は貼って",  "は這って",  "は張って",  "ははって言" ], "いました", [ "。", ".", "" ] ]
  };
}

export async function GET(request: NextRequest): NextResponse {
  // GET /api/users リクエストの処理
  const params = request.nextUrl.searchParams;
  const message = String(params.get("message"));
  const modelInput =  [
    new HumanMessage(message),
    new HumanMessage('上記のひらがなのメッセージを文脈を考えたうえで適切に漢字や数字、記号などに変換してください。誤字が含まれる可能性があります。')
  ]
  const result  = String((await model.invoke(modelInput)).content);
  const result2 = String((await model.invoke(modelInput)).content);
  const result3 = String((await model.invoke(modelInput)).content);

  integrate([result,result2,result3])
  return NextResponse.json(
    { response: "Test response." },
    { status: 200 },
  );
}



  /**
   * ：課題
   * ab aab のような場合に indexOfだと動作がおかしくなるかもしれない。最大の一致範囲(M)を返す場合処理順が難しい
   */
// 人間からのメッセージを作成
const messages = [
  new HumanMessage("Hello!"),
  new HumanMessage("What can you do?")
];
