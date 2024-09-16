import { useState, useEffect } from 'react';

import styles from './index.module.scss';

let uiDivisionCount = 4;

/**
 * ブラウザ側処理
 *
Next.js はPre-redndering(SSR,SSG)がサポートされているので、
Hooksでブラウザ側にしか存在しないグローバルオブジェクトのwindowやdocumentを参照する場合には必ず
windowが存在するか確認する もしくは useEffect
(https://zenn.dev/developanda/articles/daf34873fe4ef4)

また、scssのコンパイルなどはブラウザ側で実行されるわけではないと思われるので、ブラウザ側で取得した情報は
useStateなどで共有する
 */



function uiClicked(args: {id: number, type: string}) {
  const {id, type} = args;
  console.log(id,type)
}

const Home = () => {
  return (
    <div className={styles.container}>
      <div className={styles.input_ui_container}>
        {
          (function(){
            const buttons = [
              <button
                className={`${styles.input_ui_btn} ${styles.input_ui_btn_center}`}
                onClick={()=>uiClicked({ type:"center", id:uiDivisionCount })}
              ></button>
            ];

            const svgs = [

            ];
            for(let i = 0;i < uiDivisionCount;i++) {
              buttons.push(
              <button
                className={`${styles.input_ui_btn} ${styles[`input_ui_btn_circumference_${i}`]}`}
                onClick={()=>uiClicked({ type:"ring", id:i })}
              ></button>);

              const getPos = (
                f:(rad: number) => number,
                i:number
              ) => (1+f(2*Math.PI/uiDivisionCount*i))/2;
              /*
              const xa = (1+Math.sin(Math.PI/uiDivisionCount * i))/2;
              const ya = (1+Math.sin(Math.PI/uiDivisionCount * i))/2;
              const xb = (1+Math.sin(Math.PI/uiDivisionCount * (i + 1)))/2;
              const yb = (1+Math.sin(Math.PI/uiDivisionCount * (i + 1)))/2;
              */

              const xa = getPos(Math.sin, i);
              const ya = getPos(Math.cos, i);
              const xb = getPos(Math.sin, i+1);
              const yb = getPos(Math.cos, i+1);
              svgs.push(
                <svg width="100" height="100">
                    <clipPath id={`btn_clip_${i}`} clipPathUnits="objectBoundingBox">
                      <path d={`M 0.5 0.5 L ${xa} ${ya} A 0.5 0.5 0 0 ${xb} ${yb} L Z`} fill="none"/>
                    </clipPath>
                </svg>
              );
            }
            return [...buttons,...svgs];
          })()
        }
      </div>
    </div>
  );
};

export default Home;
