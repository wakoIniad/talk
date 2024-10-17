

interface DiffResponse {
  range: number[];
  match: boolean;
}

interface IntegrateResponse {
  result: string,
  map: (string|Array<string>)[]
  /**
   * ["確定", [ "選択指1",  "選択指2",  "選択指3",  "選択指1" ], "確定2", "確定3" ]
   * のような感じ
   */
}

function diff(t1: string, t2: string): Array<DiffResponse> {

  const matchRanges: Array<DiffResponse> = [ ]
  let l = 0;
  let r = 0;
  let M = 0;
  let R = 0;// 未探索部分の左端
  for(let i = 0; i < t1.length; i+=r ) {
    const c = t1[i];
    const j = t2.indexOf(c, R);
    if( j !== -1 ) {
      l = 0; r = 0;
      // @ts-expect-error ts(2345)
      while( t1[i+r] === t2[j+r] && ! [ t1[i+r] , t2[j+r] ].includes(undefined) )r++;
      // @ts-expect-error ts(2345)
      while( t1[i+l-1] === t2[j+l-1] && ! [ t1[i+l-1] , t2[j+r-1] ].includes(undefined) )l--;
      console.log(i,j,l,r,j+l,j+r)
      //t2基準
      matchRanges.push({
        range: [ R, j+l ],// ここの幅は0になる可能性がある。
        match: false,
      });
      matchRanges.push({
        range: [ j+l, j+r+1 ],
        match: true,
      });
      R = j+r+1;
      // @ts-expect-error ts(2345)
      if( [ t1[j+r] , t2[j+r], t1[j+l] , t2[j+r] ].includes(undefined) )break;
    } else {
      i += 1;
    }
  }
  return matchRanges;
}
console.log(diff("12345","aiu45"))
