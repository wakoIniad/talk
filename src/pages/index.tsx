import { useState, useEffect } from 'react';

import styles from './index.module.scss';

import Romanizer from './romaji-hira-convert';
import { ButtonLayers, ButtonElement } from './layer-ui'

const UI_BORDER_WEIGHT = 20;//px
let uiDivisionCount = 10;


function uiClicked(args: {id: number, type: string}) {
  const {id, type} = args;
  console.log(id,type)
}

const layer = new ButtonLayers(['', ...'kstnhmyrw'.split('')]
  .map(consonant=>'aiueo'.split('')
    .map(vowel=>Romanizer(consonant+vowel))
    .map(hiragana=>new ButtonElement({name: hiragana, value: hiragana}))
  ).map(hiraganaList=>new ButtonElement({
    name: hiraganaList[0].displayName + "行",
    value: null,
    children: new ButtonLayers(hiraganaList)
  })));
console.log(layer)
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
              ) => f(2*Math.PI/uiDivisionCount*i)/2;

              const [ ax, ay, bx, by, ] =
                [ { method: Math.cos, index: i },
                  { method: Math.sin, index: i },
                  { method: Math.cos, index: i + 1 },
                  { method: Math.sin, index: i + 1 },
                ].map( ({method, index}: {
                  method: (rad:number)=>number,
                  index: number
                }) => getPos(method, index) );
              const mx = (ax + bx)/2 * zeroOneScaleBorderWeight + 0.5;
              const my = (ay + by)/2 * zeroOneScaleBorderWeight + 0.5;

              //const [ ax, ax_raw ] = getPos(Math.cos, i);
              //const [ ay, ay_raw ] = getPos(Math.sin, i);
              //const [ bx, bx_raw ] = getPos(Math.cos, i+1);
              //const [ by, by_raw ] = getPos(Math.sin, i+1);

              svgs.push(
                <svg xmlns="http://www.w3.org/2000/svg">
                  <clipPath id={`btn_clip_${i}`} clipPathUnits="objectBoundingBox">
                    <path d={`M ${mx} ${my} l ${ax} ${ay} a 0.5 0.5 0 0 1 ${bx - ax} ${by - ay} Z`} fill="none"/>
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
