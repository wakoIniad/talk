import { noteData } from '@/app/api/types/index';//'../../../app/api/types/index'//'../types/index';
function temp(arg: noteData) {

}
import { NextRequest, NextResponse, } from "next/server";

export async function POST(request: NextRequest): NextResponse {
  // POST /api/users リクエストの処理
  const params = await request.json();

  const ID = generateID();
  const MESSAGE = params.mesage;
  const NAME = params.name;
}


export async function DELETE(request: NextRequest): NextResponse {
  // POST /api/users リクエストの処理
  const params = await request.json();

  const ID = params.id;

}

function generateID() {

}
