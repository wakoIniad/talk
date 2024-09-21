import { NextApiRequest, NextApiResponse } from "next";

const LINE_ACCESS_TOKEN:string = "";

export function handler(request: NextApiRequest, response: NextApiResponse) {


  console.log(request)
  //console.log(request.body)
  response.status(200).json({ res:'ok' })
}
