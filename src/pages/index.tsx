import { useState, useEffect } from 'react';

import styles from './index.module.scss';

import Romanizer from './romaji-hira-convert';
import { ButtonLayers, ButtonElement } from './layer-ui'

const UI_BORDER_WEIGHT = 40;//px

const uiDivisionCounts = [ 1.001, 10, 30-5 ];

const usingUiInitial = [
  {from: 0, to: 1},
  {from: 0, to: 10},
  {from: 0, to:0}
];

const pallet = [
  'rgb(139,27,29)', 'rgb(240,211,0)', 'rgb(10,150,51)', 'rgb(109,183,196)', 'rgb(7,132,186)',
];
const pallet2 = [
  'rgb(246,162,230)', 'rgb(218,162,248)', 'rgb(194,205,250)', 'rgb(153,232,236)', 'rgb(250,255,255)',
];

const UI_RING_WEGIHT_EACH_LAYER = [ 0.35, 0.7, 1 ];

const layer = new ButtonLayers(['', ...'kstnhmyrw'.split('')]
  .map(consonant=>'aiueo'.split('')
    .map(vowel=>Romanizer(consonant+vowel))
    .map(hiragana=>new ButtonElement({name: hiragana, value: hiragana}))
  ).map(hiraganaList=>new ButtonElement({
    name: hiraganaList[0].displayName + "行",
    value: null,
    children: new ButtonLayers(hiraganaList)
  })));

function loopIndex( length: number, n: number ) {
  return (length + n)%length;
}
const Home = () => {
  const [usingUI, setUsingUI] = useState(usingUiInitial);

  const { width, height } = getWindowSize();
  const vmin = Math.min(width, height);

  function uiClicked(args: {id: number, layer: number}) {
    const {id, layer} = args;

    switch(layer) {
      case 0:

        usingUI[2].to = usingUI[2].from;
        setUsingUI([...usingUI]);
        return;
      case 1:
        usingUI[2].from = Math.round((uiDivisionCounts[2]/uiDivisionCounts[1]) * id - 1);
        usingUI[2].to = usingUI[2].from+5;
        setUsingUI([...usingUI]);
        return;
      case 2:
        return;
    }
  }

  interface makeButtonInterFace {
    layer: number;
    id: number;
    size: number;
    using: boolean;
    styleSettings?: {[key:string]:any}
  }

  function makeButton( {
    layer = -1,
    id = -1,
    size = -1,
    using = false,
    styleSettings = {},
  }:Partial<makeButtonInterFace> ) {
    const divisionCount = uiDivisionCounts[layer];
    id = loopIndex(divisionCount, id);
    const reScaledBorderWeight = 1/vmin*1*UI_BORDER_WEIGHT * size;
    const activation_flag = using ? 1: 0;

    const button =
      <button
        className={`${styles.input_ui_btn} ${styles[`input_ui_btn_${layer}`]}
        ${styles[`input_ui_btn_${layer}_${id}`]}
        ${using ? styles.ExpansionRing : '' }`
        }
        onClick={()=>uiClicked({ layer:layer, id:id })}
        style={{
          clipPath: `url(#btn_clip_${layer}_${id})`,
          width: `${100*size*activation_flag}%`,
          height: `${100*size*activation_flag}%`,
          opacity: activation_flag,
          visibility: `${using? 'visible': 'hidden'}`,
          ...styleSettings,
        }}
      ></button>;

    const getPos = (
      f:(rad: number) => number,
      i:number
    ) => minorAdjuster(f(2*Math.PI/divisionCount*i), 0.5, 0);

    const minorAdjuster = (original:number, delta: number = 1, offset: number = 0)=>
      new Result(offset + delta*original, (raw: number) => raw.toFixed(20));

    const [ ax, ay, bx, by, ] =
      [ { method: Math.cos, index: id },
        { method: Math.sin, index: id },
        { method: Math.cos, index: id + 1 },
        { method: Math.sin, index: id + 1 },
      ].map( ({method, index}: {
        method: (rad:number)=>number,
        index: number
      }) => getPos(method, index) );
    const mx = minorAdjuster(ax.plus(bx).raw, reScaledBorderWeight/2, 0.5);
    const my = minorAdjuster(ay.plus(by).raw, reScaledBorderWeight/2, 0.5);

    const svg =
      <svg xmlns="http://www.w3.org/2000/svg">
        <clipPath id={`btn_clip_${layer}_${id}`} clipPathUnits="objectBoundingBox">
          <path d={`M ${mx.plus(ax)} ${my.plus(ay)} a 0.5 0.5 0 ${divisionCount >= 2 ? 0 : 1} 1 ${bx.minus(ax)} ${by.minus(ay)} ${divisionCount >= 2 ? `L ${mx} ${my}` : ''} Z`} fill="none"/>
        </clipPath>
      </svg>;
    return { button, svg };
  }
  return (
    <div className={styles.container}>
      <div className={styles.input_ui_container}>
        {
          (function(){
            const centerBtn = makeButton({layer:0, id:0, size:0.35, using:true});
            const buttons = [
              centerBtn.button,
            ];

            const svgs = [
              centerBtn.svg,
            ];

            for(let i = 0;i < usingUI.length; i++) {
              const using = usingUI[i];
              for(let j = using.from;j < using.from + uiDivisionCounts[i];j++) {
                const config:{[key:string]:any} = {
                  layer: i,
                  id: j,
                  size: UI_RING_WEGIHT_EACH_LAYER[i],
                  using: (using.from <= j) && (j < using.to)
                }
                switch(i) {
                  case 2:
                    if(config.using === true) {
                      config.styleSettings = {};

                      const palletIndex = j-using.from;
                      config.styleSettings.backgroundColor = pallet[palletIndex];
                    }
                    break;
                }
                const { button, svg } = makeButton(config);
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
