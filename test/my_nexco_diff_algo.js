function diff(t1, t2) {
  matchRanges = [{match:true, text:""}]
  let i = 0;
  let j = 0;
  let last_i = null;
  let last_j = null;
  while(true) {
    if(t1[i] === t2[j]) {
      matchRanges[matchRanges.length-1].text += t1[i]
      if(i+1 < t1.length)i++;
      if(j+1 < t2.length)j++;
    } else {
      if(last_i === null) {
        last_i = i;
        last_j = j;
        matchRanges.push({match:true, text:""})
      }
      temp_j = t2.indexOf(t1[i],last_j);
      temp_i = t1.indexOf(t2[j],last_i);
      if(t2[j]=='i')console.log("IIII")
      if( temp_j !== -1 && temp_j >= last_j) {
        j = temp_j;
        matchRanges.push({match:false, text:t1.slice(last_i,i)})
        last_i = null;
        last_j = null;
      } else if( temp_j !== -1  && temp_i >= last_i ) {
        i = temp_i;
        matchRanges.push({match:false, text:t1.slice(last_i,i)})
        last_i = null;
        last_j = null;
      }

      if(i+1 < t1.length)i++;
      if(j+1 < t2.length)j++;
    }
    if(i === t1.length-1 && j === t2.length-1) break;
  }
  return matchRanges
}
console.log(diff("aiueobbbbbbbbbbbbbbbbbbbbAiueoaiueo","aiueonnnnnnnnnaiueoAiueo").filter(f=>f.match))
