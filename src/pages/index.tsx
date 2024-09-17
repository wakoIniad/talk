import { useState, useEffect } from 'react';

import styles from './index.module.scss';

import Romanizer from './romaji-hira-convert';
import { ButtonLayers, ButtonElement } from './layer-ui'

const UI_BORDER_WEIGHT = 20;//px
const UI_FONT_SIZE = 64;//px UI_FONT_SIZE(px) = 1em
const UI_STROKE_WEIGHT = 3;

const uiDivisionCounts = [ 1.001, 10, 30-5 ];

const usingUiInitial = [
  {from: 0, to: uiDivisionCounts[0]},
  {from: 0, to: uiDivisionCounts[1]},
  {from: 0, to:0}
];

const pallet = [
  'rgb(139,27,29)', 'rgb(240,211,0)', 'rgb(10,150,51)', 'rgb(109,183,196)', 'rgb(7,132,186)',
];
const pallet2 = [
  'rgb(246,162,230)', 'rgb(218,162,248)', 'rgb(194,205,250)', 'rgb(153,232,236)', 'rgb(250,255,255)',
];

const UI_RING_WEGIHT_EACH_LAYER = [ 0.3, 0.7, 0.95 ];

const LayerArray = new ButtonLayers(...['', ...'kstnhmyrw'.split('')]
  .map(consonant=>'aiueo'.split('')
    .map(vowel=>Romanizer(consonant+vowel))
    .map(hiragana=>new ButtonElement({name: hiragana, value: hiragana}))
  ).map(hiraganaList=>new ButtonElement({
    name: hiraganaList[0].displayName,
    value: null,
    children: new ButtonLayers(...hiraganaList)
  })));

function loopIndex( length: number, raw: RawId ):number {
  return (length + raw.parse())%length;
}
const Home = () => {
  const [usingUI, setUsingUI] = useState(usingUiInitial);
  const [activeButtons, setActiveButtons] = useState([-1,-1,-1]);
  const [messageText, setMssageText] = useState('');
  console.log(messageText);

  const { width, height } = getWindowSize();
  const vmin = Math.min(width, height);

  function uiClicked(args: {rawId: RawId, layer: number}) {
    const {rawId, layer} = args;
    const id = loopIndex(uiDivisionCounts[layer], rawId);

    switch(layer) {
      case 0:

        usingUI[2].to = usingUI[2].from;
        setUsingUI([...usingUI]);
        return;
      case 1:
        usingUI[2].from = Math.round((uiDivisionCounts[2]/uiDivisionCounts[1]) * id - 1);
        usingUI[2].to = usingUI[2].from+5;
        setUsingUI([...usingUI]);
        activeButtons[1] = id;
        setActiveButtons([...activeButtons]);
        return;
      case 2:
        const inputElm = getUiElementFromLayer(layer,rawId);
        console.log(layer,rawId,activeButtons[1]);
        setMssageText(messageText+inputElm.value)
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

  function getUiElementFromLayer(layer: number, rawId: RawId):ButtonElement {

    const id = loopIndex(uiDivisionCounts[layer], rawId);
    switch(layer) {
      case 0:
        break;
      case 1:
        return LayerArray[id];
      case 2:
        const rootId = activeButtons[1];
        const arcId = rawId.parse() - usingUI[2].from;
        console.log('arc:'+arcId,rawId.parse(),- usingUI[2].from)
        return LayerArray[rootId].children[arcId];
    }

    return new ButtonElement({name: '', value: ''});
  }

  function rescalePx(npx:number) {
    return 1/vmin*1*npx;
  }

  function makeButton( {
    layer = -1,
    id = -1,
    size = -1,
    using = false,
    styleSettings = {},
  }:Partial<makeButtonInterFace> ) {
    const rescaledBorderWeight = rescalePx(UI_BORDER_WEIGHT) * size;
    const rescaledFontSize = rescalePx(UI_FONT_SIZE);
    const rescaledStrokeWeight = rescalePx(UI_STROKE_WEIGHT);

    const divisionCount = uiDivisionCounts[layer];
    const rawId = new RawId(id);
    id = loopIndex(divisionCount, rawId);

    const activation_flag = using ? 1: 0;

    const getPos = (
      f:(rad: number) => number,
      i:number
    ) => minorAdjuster(f(2*Math.PI/divisionCount*i), 0.5, 0);

    const minorAdjuster = (original:number, delta: number = 1, offset: number = 0)=>
      new Result(offset + delta*original, (raw: number) => raw.toFixed(20));

    const [ ax, ay, bx, by, mx, my] =
      [ { method: Math.cos, index: id },
        { method: Math.sin, index: id },
        { method: Math.cos, index: id + 1 },
        { method: Math.sin, index: id + 1 },
        { method: Math.cos, index: id + 0.5 },
        { method: Math.sin, index: id + 0.5 },
      ].map( ({method, index}: {
        method: (rad:number)=>number,
        index: number
      }) => getPos(method, index) );
    const cx = minorAdjuster(mx.raw, rescaledBorderWeight, 0.5);
    const cy = minorAdjuster(my.raw, rescaledBorderWeight, 0.5);

    const svg =
      using ? <svg xmlns="http://www.w3.org/2000/svg">
        <clipPath id={`btn_clip_${layer}_${id}`} clipPathUnits="objectBoundingBox">
          <path d={`M ${cx.plus(ax)} ${cy.plus(ay)} a 0.5 0.5 0 ${divisionCount >= 2 ? 0 : 1} 1 ${bx.minus(ax)} ${by.minus(ay)} ${divisionCount >= 2 ? `L ${cx} ${cy}` : ''} Z`} fill="none"/>
        </clipPath>
      </svg> : '';

    const tx = minorAdjuster(mx.raw, 1-rescaledFontSize-0.05, 0.5);
    const ty = minorAdjuster(my.raw, 1-rescaledFontSize-0.05, 0.5);
    const svg2 =
      using? <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1 1"
        id={`btn_visual_${layer}_${id}`}
        preserveAspectRatio="xMidYMid meet"
      ><text
        x={`${tx}`} y={`${ty}`}
        font-size={rescaledFontSize/size*0.75} stroke="green" fill="white"
        text-anchor="middle" stroke-width={rescaledStrokeWeight}
        dominant-baseline="middle"
      >
        {getUiElementFromLayer(layer,rawId).displayName}
      </text>
    </svg>: '';


  if(using) {
    //styleSettings.backgroundImage = `url(#btn_visual_${layer}_${id})`;
    styleSettings.clipPath = `url(#btn_clip_${layer}_${id})`;
    if(!styleSettings.opacity)styleSettings.opacity = activation_flag;
  }
  const button =
  <button
    className={`${styles.input_ui_btn} ${styles[`input_ui_btn_${layer}`]}
    ${styles[`input_ui_btn_${layer}_${id}`]}
    ${using ? styles.ExpansionRing : '' }`
    }
    onClick={()=>uiClicked({ layer:layer, rawId:rawId })}
    style={{
      width: `${100*size*activation_flag}%`,
      height: `${100*size*activation_flag}%`,
      visibility: `${using? 'visible': 'hidden'}`,
      ...styleSettings,
    }}
  >{svg2}</button>;
    return { button, svg, svg2:'' };
  }
  return (
    <div className={styles.container}>
      <div id="message_display" className={styles.message_display}>
        {messageText}
      </div>
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

            const svg2s = [
              centerBtn.svg2,
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
                      config.styleSettings.zIndex = 3//5;
                      const palletIndex = j-using.from;
                      config.styleSettings.opacity = 1-(((palletIndex-2)**2)**0.25)/4;
                      config.styleSettings.backgroundColor = pallet[palletIndex];
                    }
                    break;
                }
                const { button, svg, svg2 } = makeButton(config);
                buttons.push(button);
                svgs.push(svg);
                svg2s.push(svg2);
              }
            }


            return [...svgs,...svg2s,...buttons,];
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

  plus(e:Result|number) {
    return new Result(this.raw + (typeof e === 'number' ? e : e.raw), this.callback)
  }

  minus(e:Result|number) {
    return new Result(this.raw - (typeof e === 'number' ? e : e.raw), this.callback)
  }

  div(e:Result|number) {
    return new Result(this.raw / (typeof e === 'number' ? e : e.raw), this.callback)
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

class RawId extends Number {
  raw: number;
  constructor(raw:number) {
    super(raw);
    this.raw = raw;
  }
  parse() {
    return this.raw;
  }
}
