
function diff(t1 , t2) {

  const matchRanges = [ ]
//  const matchRangest2 = []
  let l = 0;
  let r = 0;
  let M = 0;
  let R = 0;// 未探索部分(j基準)の左端
  for(let i = 0; i < t1.length; i+=r ) {
    const c = t1[i];
    const j = t2.indexOf(c, R);
    console.log(i,j,c)
    l = 0; r = 0;
    if( j !== -1 ) {
      // @ts-expect-error ts(2345)
      while( t1[i+r] === t2[j+r] && ! [ t1[i+r] , t2[j+r] ].includes(undefined) )r++;
      // @ts-expect-error ts(2345)
      while(
        t1[i+l-1] === t2[j+l-1] && ! [ t1[i+l-1] , t2[j+l-1] ].includes(undefined) && R<=j+l
      )l--;
      //console.log(i,j,l,r,j+l,j+r)
      //t2基準
      matchRanges.push({
        range: [ R, j+l ],// ここの幅は0になる可能性がある。
        match: false,
      });
      matchRanges.push({
        range: [ j+l, j+r ],
        match: true,
      });
      R = j+r+1;
      // @ts-expect-error ts(2345)
      if( [ t1[i+r] , t2[j+r], t1[i+l] , t2[j+l] ].includes(undefined) )break;
    } else {
      i += 1;
    }
  }
  return matchRanges;
}
res = diff("123345","aiu4512345");
res2 = diff("aiu4512345","123345");
console.log(res,res2);
console.log(res.map(r=> r.match?"aiu4512345".slice(...r.range):""));
console.log(res2.map(r=> r.match?"123345".slice(...r.range):""));

//  console.log

/**
 * range 5-8, match True
 * range 9-7 match false
 * range 7-10 match true
 */
