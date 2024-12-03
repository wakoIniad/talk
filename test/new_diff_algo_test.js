function diff(t1, t2) {
  matchRanges = [{match:true, text:""}]
  let i = 0;
  let j = 0;
  while( i < t1.length && j < t2.length ) {
    if(t1[i] === t2[j]) {
      matchRanges[matchRanges.length-1].text += t1[i]
      i++;j++;
    } else {
      let pi = 0;
      let pj = 0;
      let u = 0;
      while( i + pi < t1.length && t1[i+pi] !== t2[j] )pi++
      while( j + pj < t2.length && t1[i] !== t2[j+pj] )pj++
      while( i + u < t1.length && j + u < t2.length && t1[i+u] !== t2[j+u] )u++
      switch(Math.min(pi,pj,u)) {
        case pi:
          matchRanges.push({match:false, text:t1.slice(i,i+pi)})
          i+=pi;
          break;
        case pj:
          matchRanges.push({match:false, text:t1.slice(i,i+pi)})
          j+=pj;
          break;
        case u:
          matchRanges.push({match:false, text:t1.slice(i,i+u)})
          i+=u;
          j+=u;
          break;

      }
      matchRanges.push({match:true, text:""})
    }
  }
  return matchRanges
}
console.log(diff("aiueobbbbbbbbbbbbbbbbbbbbAiueoaiueo","aiueonnnnnnnnnaiueoAiueo").filter(f=>f.match))
