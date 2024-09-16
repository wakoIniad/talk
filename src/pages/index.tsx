import { useState, useEffect } from 'react';

import styles from './index.module.scss';

import Romanizer from './romaji-hira-convert';
import { ButtonLayers, ButtonElement } from './layer-ui'

const UI_BORDER_WEIGHT = 20;//px
let uiDivisionCount = 10;
const UI_DIVISION_COUNT_EACH_LAYER = [ 1, 5, 5 ];


function uiClicked(args: {id: number, layer: number}) {
  const {id, layer} = args;
  console.log(id,layer)
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

  function makeButton( layer:number, i:number, size:number ) {
    const reScaledBorderWeight = 1/vmin*1*UI_BORDER_WEIGHT * size
    const DIVISION_COUNT = UI_DIVISION_COUNT_EACH_LAYER[layer];
    const button =
      <button
        className={`${styles.input_ui_btn} ${styles[`input_ui_btn_${layer}`]} ${styles[`input_ui_btn_${layer}_${i}`]}`}
        onClick={()=>uiClicked({ layer:layer, id:i })}
        style={{
          clipPath: `url(#btn_clip_${layer}_${i})`,
          width: `${100*size}%`,
          height: `${100*size}%`
        }}
      ></button>;

      const getPos = (
        f:(rad: number) => number,
        i:number
      ) => f(2*Math.PI/DIVISION_COUNT*i)/2;

      const [ ax, ay, bx, by, ] =
        [ { method: Math.cos, index: i },
          { method: Math.sin, index: i },
          { method: Math.cos, index: i + 1 },
          { method: Math.sin, index: i + 1 },
        ].map( ({method, index}: {
          method: (rad:number)=>number,
          index: number
        }) => getPos(method, index) );
      const mx = (ax + bx)/2 * reScaledBorderWeight + 0.5;
      const my = (ay + by)/2 * reScaledBorderWeight + 0.5;

      const svg =
        <svg xmlns="http://www.w3.org/2000/svg">
          <clipPath id={`btn_clip_${layer}_${i}`} clipPathUnits="objectBoundingBox">
            <path d={`M ${mx} ${my} l ${ax} ${ay} a 0.5 0.5 0 ${size >= 2 ? 0 : 1} 1 ${bx - ax} ${by - ay} Z`} fill="none"/>
          </clipPath>
        </svg>;
      return { button, svg };
  }
  return (
    <div className={styles.container}>
      <div className={styles.input_ui_container}>
        {
          (function(){
            const centerBtn = makeButton(0, 0, 0.5);
            const buttons = [
              centerBtn.button,
            ];

            const svgs = [
              centerBtn.svg,
            ];

            /*for(let i = 0;i < uiDivisionCount;i++) {
              const { button, svg } = makeButton(i,1,0.8);
              buttons.push(button);
              svgs.push(svg);
            }*/
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
