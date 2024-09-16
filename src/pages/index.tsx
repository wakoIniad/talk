import { useState, useEffect } from 'react';

import styles from './index.module.scss';
import { off } from 'process';

const UI_BORDER_WEIGHT = 5;//px
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
  const { width, height } = getWindowSize();
  const vmin = Math.min(width, height);
  const zeroOneScaleBorderWeight = 1/vmin*1*UI_BORDER_WEIGHT;
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
                style={{ clipPath: `url(#btn_clip_${i})` }}
              ></button>);

              const getPos = (
                f:(rad: number) => number,
                i:number
              ) => {
                const v =
                //return new ObjectNumber(, {'raw': v});
                return [
                  (1+v*(1+zeroOneScaleBorderWeight*2))/2,
                  v,
                ]
                return f(2*Math.PI/uiDivisionCount*i);
              }
              const minorAdjuster = ( original: number, offset: number ) =>
                ( 1 + original * ( 1 + offset ) ) / 2;

              const [ ax, ay, bx, by ] =
                [ { method: Math.cos, index: i },
                  { method: Math.sin, index: i },
                  { method: Math.cos, index: i + 1 },
                  { method: Math.sin, index: i + 1 },
                ].map( ({method, index}: {
                  method: (rad:number)=>number,
                  index: number
                }) => getPos(method, index) );
              const mx = (1-zeroOneScaleBorderWeight)*(ax + bx)/2+0.05;
              const my = 0.9*(ay + by)/2+0.05;

              //const [ ax, ax_raw ] = getPos(Math.cos, i);
              //const [ ay, ay_raw ] = getPos(Math.sin, i);
              //const [ bx, bx_raw ] = getPos(Math.cos, i+1);
              //const [ by, by_raw ] = getPos(Math.sin, i+1);

              svgs.push(
                <svg xmlns="http://www.w3.org/2000/svg">
                  <clipPath id={`btn_clip_${i}`} clipPathUnits="objectBoundingBox">
                    <path d={`M ${mx} ${my} L ${ax} ${ay} A 0.5 0.5 0 0 1 ${bx} ${by} Z`} fill="none"/>
                  </clipPath>
                </svg>
              );
            }
            return [...svgs,...buttons];
          })()
        }
      </div>
    </div>
  );
};

export default Home;

function getWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: -1,
    height: -1,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
    } else {
      return;
    }
  }, []);
  return windowSize;
};

class ObjectNumber extends Number {
  [key: string]: any;
  constructor(main: number,sub: {[key: string]: number} = {}) {
    console.log(sub)
    super(main);
    for( const [key, value] of Object.entries(sub) ) {
      this[key] = value;
    }
  }
}
