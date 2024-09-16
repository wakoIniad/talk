import { useState, useEffect } from 'react';

import styles from './index.module.scss';

import Romanizer from './romaji-hira-convert';
import { ButtonLayers, ButtonElement } from './layer-ui'

const UI_BORDER_WEIGHT = 20;//px

const UI_DIVISION_COUNT_EACH_LAYER = [ 1.001, 10, 20 ];
const USING_UI_COUNT_EACH_LAYER = [
  {from: 0, to: 1},
  {from: 0, to: 10},
  {from: 0, to:20}
];

const UI_RING_WEGIHT_EACH_LAYER = [ 0.35, 0.7, 1 ];


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
      ) => minorAdjuster(f(2*Math.PI/DIVISION_COUNT*i), 0.5, 0);

      const minorAdjuster = (original:number, delta: number = 1, offset: number = 0)=>
        new Result(offset + delta*original, (raw: number) => raw.toFixed(20));

      const [ ax, ay, bx, by, ] =
        [ { method: Math.cos, index: i },
          { method: Math.sin, index: i },
          { method: Math.cos, index: i + 1 },
          { method: Math.sin, index: i + 1 },
        ].map( ({method, index}: {
          method: (rad:number)=>number,
          index: number
        }) => getPos(method, index) );
      const mx = minorAdjuster(ax.plus(bx).raw, reScaledBorderWeight/2, 0.5);
      const my = minorAdjuster(ay.plus(by).raw, reScaledBorderWeight/2, 0.5);

      const svg =
        <svg xmlns="http://www.w3.org/2000/svg">
          <clipPath id={`btn_clip_${layer}_${i}`} clipPathUnits="objectBoundingBox">
            <path d={`M ${mx.plus(ax)} ${my.plus(ay)} a 0.5 0.5 0 ${DIVISION_COUNT >= 2 ? 0 : 1} 1 ${bx.minus(ax)} ${by.minus(ay)} ${DIVISION_COUNT >= 2 ? `L ${mx} ${my}` : ''} Z`} fill="none"/>
          </clipPath>
        </svg>;
      return { button, svg };
  }
  return (
    <div className={styles.container}>
      <div className={styles.input_ui_container}>
        {
          (function(){
            const centerBtn = makeButton(0, 0, 0.35);
            const buttons = [
              centerBtn.button,
            ];

            const svgs = [
              centerBtn.svg,
            ];

            for(let i = 0;i < USING_UI_COUNT_EACH_LAYER.length; i++) {
              const USING_UI = USING_UI_COUNT_EACH_LAYER[i];
              for(let j = USING_UI.from;j < USING_UI.to;j++) {
                const { button, svg } = makeButton(i, j, UI_RING_WEGIHT_EACH_LAYER[i]);
                buttons.push(button);
                svgs.push(svg);
              }
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

class Result extends String {
  public raw: any;
  callback: (input: any) => string;
  constructor(raw: any, callback:(input: any)=>string) {
    super(callback(raw));
    this.raw = raw;
    this.callback = callback;
  }

  plus(e:Result) {
    return new Result(this.raw + e.raw,this.callback);
  }

  minus(e:Result) {
    return new Result(this.raw - e.raw,this.callback);
  }
}

class ResultAsNumber extends Number {
  public result: any;
  callback: (input: Number) => any;
  constructor(raw: Number, callback:(input: any)=>any) {
    super(raw);
    this.result = callback(raw);
    this.callback = callback;
  }
  calc(target: ResultAsNumber, calcFunc: (input: ResultAsNumber) => Number) {
    return new ResultAsNumber(calcFunc(this), this.callback);
  }
}
