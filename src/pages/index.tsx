import { useState, useEffect } from 'react';

import styles from './index.module.scss';

const Romanizer = require('js-hira-kata-romanize');
const r = new Romanizer({
  chouon: Romanizer.CHOUON_ALPHABET
});

import Hiraganizer from './romaji-hira-convert';
import { ButtonLayers, ButtonElement } from './layer-ui'


import localfont from "next/font/local";
import { exitCode } from 'process';

const DAKUTEN_UNICODE:string = "\u{3099}"; //濁点

const HANDAKUTEN_UNICODE:string = "\u{309A}"; //半濁点

const SEPARATOR:string = '‎'; //0幅空白

const PlemolJPReglar = localfont({
  src: "./font/PlemolJP_HS/PlemolJPHS-Regular.ttf",
  weight: '400',
  variable: "--plemol-jphs-regular",
 });
 const PlemolJPBold = localfont({
  src: "./font/PlemolJP_HS/PlemolJPHS-Bold.ttf",
  weight: '400',
  variable: "--plemol-jphs-bold",
 });
 const PlemolJPText = localfont({
  src: "./font/PlemolJP_HS/PlemolJPHS-Text.ttf",
  weight: '400',
  variable: "--plemol-jphs-text",
 });


const UI_BORDER_WEIGHT = 20;//px
const UI_FONT_SIZE = 85;//px UI_FONT_SIZE(px) = 1em
const UI_STROKE_WEIGHT = 3;

const uiDivisionCounts = [ 2, 10, 30-5 ];

const usingUiInitial = [
  {from: 0, to: 2},
  {from: 0, to: uiDivisionCounts[1]},
  {from: 0, to:0}
];

const pallet = [
  'rgb(139,27,29)', 'rgb(240,211,0)', 'rgb(10,150,51)', 'rgb(109,183,196)', 'rgb(7,132,186)',
];
const pallet2 = [
  'rgb(246,162,230)', 'rgb(218,162,248)', 'rgb(194,205,250)', 'rgb(153,232,236)', 'rgb(250,255,255)',
];

const UI_RING_WEIGHT_EACH_LAYER = [ [0,0.25], [0.25,0.6], [0.6,1] ];

const LayerArray = new ButtonLayers(...['', ...'kstnhmyrw'.split('')]
  .map(consonant=>'aiueo'.split('')
    .map(vowel=>
      new ButtonElement({name: Hiraganizer(consonant+vowel), value: consonant+vowel}))
  ).map(hiraganaList=>new ButtonElement({
    name: hiraganaList[0].displayName,
    value: null,
    children: new ButtonLayers(...hiraganaList)
  })));

function loopIndex( length: number, raw: RawId ):number {
  return (length + raw.parse())%length;
}

const initialUsingCenterUi:{[key:string]: ButtonElement}= {
  dakuten: new ButtonElement({name: '', value: ''}),
  handakuten: new ButtonElement({name: '', value: ''}),
  small: new ButtonElement({name: '', value: ''}),

  space: new ButtonElement({name: 'space', value: '_'}),
  delete: new ButtonElement({name: 'delete', value: ''}),
}

function LineTextParser(text:string) {
  text = text.replaceAll('_',' ');
  return text;
}

const Home = () => {
  const [usingUI, setUsingUI] = useState(usingUiInitial);
  const [activeButtons, setActiveButtons] = useState([-1,-1,-1]);
  const [messageText, setMssageText] = useState('');
  let updateMessageText:string = messageText;

  const [usingCenterUI, setUsingCenterUI] = useState(initialUsingCenterUi);
  console.log(LineTextParser(messageText));
  /*const [usingUIExtension, setUsingUIExtension] = useState(new ButtonLayers());
  console.log(messageText);*/

  const { width, height } = getWindowSize();
  const vmin = Math.min(width, height);

  function makeUsinUIElement(consonant:string, Vowel:string, displayName?: string) {
    const hiraganaList = Vowel.split('')
    .map(vowel=> new ButtonElement({
      name: Hiraganizer(consonant+vowel),
      value: consonant+vowel
    }));

    return new ButtonElement({
      name: displayName? displayName : hiraganaList[0].displayName,
      value: null,
      children: new ButtonLayers(...hiraganaList)
    });
  }

  async function sendToLine(message: string) {
    console.log("送信中...")

    const config = {
      'method' : 'post',
      'headers': { "Content-Type": "application/json" },
      'body': JSON.stringify({ 'message': LineTextParser(message) }),
    };
    const res = await fetch('/api/line',config)
    setMssageText("");
    console.log("送信されました～");
    console.info(res);
  }

  let optCheckResult:boolean = false;
  function uiClicked(args: {rawId: RawId, layer: number}) {
    const {rawId, layer} = args;
    const id = loopIndex(uiDivisionCounts[layer], rawId);
    console.log('id',id,'layer',layer);
    const inputElm = getUiElementFromLayer(layer,rawId);

    updateMessageText = messageText;

    switch(layer) {
      case 0:

        usingUI[2].to = usingUI[2].from;
        setUsingUI([...usingUI]);
        let enableDelete = false;

        if(inputElm.displayName.length > 0) {
          const deleted = messageText.slice(-1);
          updateMessageText = messageText.slice(0,-1)+inputElm.value;

          resetCenterUI("default");

          if(inputElm.displayName === 'delete') {
            const hiragana = updateMessageText.slice(-1);
            if(hiragana) {
              optCheckResult = optionableChecker(
                r.romanize(hiragana).toLowerCase(),
                hiragana,
                {
                  exclude:
                    deleted === DAKUTEN_UNICODE ? ['dakuten']:
                    deleted === HANDAKUTEN_UNICODE ?  ['handakuten']
                  :['dakuten','handakuten','small'],
                }
              );
              if(optCheckResult) enableDelete = true;
            }
          }
        }
        if(optCheckResult) {/**optを優先の為space&del無効化 */
          usingCenterUI.space = new ButtonElement({
            name: '',
            value: ''
          });
          usingCenterUI.delete = new ButtonElement({name: '', value: ''});
        } else {
          usingCenterUI.space = new ButtonElement({
            name: 'space',
            value: updateMessageText.slice(-1)+'_'
          });
          usingCenterUI.delete = new ButtonElement({name: 'delete', value: ''});
        }

        if(enableDelete) {/**操作数の最大値が2: １つ以上無効化されるため余る。 */
          usingCenterUI.delete = new ButtonElement({name: 'delete', value: ''});
        }
        setUsingCenterUI({...usingCenterUI});
        break;
      case 1:
        if( activeButtons[1] === id ) {

          activeButtons[1] = -1;
          activeButtons[2] = -1;

          usingUI[2].to = usingUI[2].from;

          resetCenterUI("message-control");
        } else {
          usingUI[2].from = Math.round((uiDivisionCounts[2]/uiDivisionCounts[1]) * id - 1);
          usingUI[2].to = usingUI[2].from+5;
          setUsingUI([...usingUI]);
          activeButtons[1] = id;
          activeButtons[2] = -1;
        }

        setActiveButtons([...activeButtons]);
        break;
      case 2:
        updateMessageText = messageText+inputElm.displayName;

        activeButtons[2] = id;
        setActiveButtons([...activeButtons]);

        optCheckResult = optionableChecker(
          inputElm.value,
          inputElm.displayName,
        );

        if(optCheckResult) {/**optを優先の為space&del無効化 */
          usingCenterUI.space = new ButtonElement({
            name: '',
            value: ''
          });
          usingCenterUI.delete = new ButtonElement({name: '', value: ''});
        } else {
          resetCenterUI("message-control");


        }
        setUsingCenterUI({...usingCenterUI});
        break;
    }

    setMssageText(updateMessageText);
  }

  function resetCenterUI(mode: string) {
    Object.keys(usingCenterUI).forEach(key=> {
      usingCenterUI[key] = new ButtonElement({name: '', value:''});
    });

    switch(mode) {
      case 'message-control':
        usingCenterUI.space = new ButtonElement({
          name: 'space',
          value: updateMessageText.slice(-1)+'_'
        });
        usingCenterUI.delete = new ButtonElement({name: 'delete', value: ''});
        break;
      case 'character-modify':
        break;
      default:
        break;
    }
  }

  function optionableChecker(
    romaji:string,
    hiragana:string,
    options?:{
      exclude?:Array<string>,
    }
  ) {
    const exclude = options?.exclude || [];
    const [ consonant, vowel ] = romaji.split('');
    let optionIsAvaliable = false;
    if(['t','k','s','h'].includes(consonant) && !exclude.includes('dakuten')) {
      const display = [hiragana, DAKUTEN_UNICODE].join("");
      usingCenterUI.dakuten = new ButtonElement({
        name: 'dakuten',
        value: display,
      });
      optionIsAvaliable = true;
    }
    if(['h'].includes(consonant) && !exclude.includes('handakuten')) {
      const display =  [hiragana, HANDAKUTEN_UNICODE].join("");
      usingCenterUI.handakuten = new ButtonElement({
        name: 'handakuten',
        value: display,
      });
      optionIsAvaliable = true;
    }
    if(['t','y'].includes(consonant) && !exclude.includes('small')) {
      let flag = false;
      if('t' === consonant && 'u' === vowel) {
        flag = true;
      }
      if('y' === consonant && ['a', 'u', 'o'].includes(vowel)) {
        flag = true;
      }
      if(flag) {
        const value = 'l'+romaji;
        usingCenterUI.small = new ButtonElement({
          name: 'small',
          value: Hiraganizer(value),
        });
      }
      optionIsAvaliable = true;
    }

    return optionIsAvaliable;
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
        const usableOptions:Array<string> = [];
        ['dakuten','handakuten','small','delete','space'].forEach(key=> {
          if(usingCenterUI[key].displayName.length > 0) {
            usableOptions.push(key);
          }
        });
        const key = usableOptions[id];
        if(key) return usingCenterUI[key];
        break;
      case 1:
        return LayerArray[id];
      case 2:
        const rootId = activeButtons[1];
        const arcId = rawId.parse() - usingUI[2].from;
        return LayerArray[rootId].children[arcId];
    }

    return new ButtonElement({name: '', value: ''});
  }

  function rescalePx(npx:number) {
    return 1/vmin*1*npx;
  }

  function getDisplayName(layer: number,name: string) {
    if(layer)return name;
    return {'dakuten':'濁','handakuten':'丸','small':'小',
            'space':'空','delete':'削',
    }?.[name] || '';
  }

  function makeButton( {
    layer = -1,
    id = -1,
    size = -1,
    using = false,
    styleSettings = {},
  }:Partial<makeButtonInterFace> ) {
    const rescaledBorderWeight = rescalePx(UI_BORDER_WEIGHT) * size;//SVG上の値
    const rescaledFontSize = rescalePx(UI_FONT_SIZE) / size;//HTML上の値
    const rescaledStrokeWeight = rescalePx(UI_STROKE_WEIGHT);

    const divisionCount = uiDivisionCounts[layer];
    const rawId = new RawId(id);
    id = loopIndex(divisionCount, rawId);

    const activation_flag = using ? 1: 0;

    /*const obj:{[key: any]:number} = {a:1,b:2};
    const key:keyof typeof obj = "a" as keyof typeof obj;
    obj[key]*/

/*    const obj:{[key: any]:number} = {a:1,b:2};
   // const key1:string = "a";
   // obj[key1]

    const key2 = ["a"] as (keyof typeof obj)[];
    obj[key2[0]];

    //((arg: keyof typeof obj)=>obj[arg])(key2);
    ((arg)=>obj[arg[0]])(key2);*/

    //const obj:{[key: any]:number} = {a:1,b:2};
   // const key1:string = "a";
   // obj[key1]

   const obj:{[key: any]:number} = {a:()=>1,b:()=>2};
   const key1:(keyof typeof obj)[] = ["a"] as (keyof typeof obj)[];
   obj[key1[0]];


   const obj3:{[key: any]:number} = {a:()=>1};
   const key3:keyof typeof obj = "a" as keyof typeof obj;
   const f = obj[key3] as Function
   f();

    const key2 = ["cos"] as (keyof typeof Math)[];
    const a = (Math[key2[0]]);

    //((arg: keyof typeof obj)=>obj[arg])(key2);
    ((arg)=>Math[arg[0]])(key2);

    const getPos = (
      i:number,
    ) => (([ "cos", "sin" ] as (keyof typeof Math)[]).map(
      (
        fName: keyof typeof Math
      ) => minorAdjuster((Math[fName] as Function)(2*Math.PI/divisionCount*i), 0.5, 0)
    ));

    const minorAdjuster = (original:number, delta: number = 1, offset: number = 0)=>
      new Result(offset + delta*original, (raw: number) => raw.toFixed(20));

    const [ a1x, a1y, b1x, b1y, mx, my] =
      [ id ,
        id + 1 ,
        id + 0.5 ,
      ].map( ({method, index}: {
        method: (rad:number)=>number,
        index: number
      }) => getPos(method, index) );
    const [ a2x, a2y, b2x, b2y ] =
    const cx = minorAdjuster(mx.raw, rescaledBorderWeight, 0.5);
    const cy = minorAdjuster(my.raw, rescaledBorderWeight, 0.5);

    const svg =
      using && divisionCount >= 2 ? <svg xmlns="http://www.w3.org/2000/svg">
        <clipPath id={`btn_clip_${layer}_${id}`} clipPathUnits="objectBoundingBox">
          <path d={`M ${cx.plus(ax.div(size))} ${cy.plus(ay.div(size))} a 0.5 0.5 0 0 1 ${bx.minus(ax)} ${by.minus(ay)} L ${cx} ${cy} Z`} fill="none"/>
        </clipPath>
      </svg> : '';

    const tx = minorAdjuster(mx.raw, 1-rescaledFontSize*1, 0.5);
    const ty = minorAdjuster(my.raw, 1-rescaledFontSize*1, 0.5);
    const svg2 =
      using? <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1 1"
        id={`btn_visual_${layer}_${id}`}
        preserveAspectRatio="xMidYMid meet"
      ><text
        x={`${tx}`} y={`${ty}`}
        fontSize={rescaledFontSize*0.75} stroke="green" fill="white"
        textAnchor="middle" strokeWidth={rescaledStrokeWeight}
        dominantBaseline="middle"
      >
        {getDisplayName(layer,getUiElementFromLayer(layer,rawId).displayName)}
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
      <div id="message_display" className={`${styles.message_display} ${PlemolJPReglar.className}`}>
        <span className={`${styles.message_text}`}>
            {messageText}
        </span>
        <button className={`${styles.line_button}`} onClick={()=>sendToLine(messageText)}>LINEに送る</button>
      </div>
      <div className={styles.my_note}>
        ここに、単語登録機能・単語カード機能・メモ機能などを入れる予定。
      </div>
      <div className={styles.input_ui_container}>
        {
          (function(){
            const buttons = [
            ];

            const svgs = [
            ];

            const svg2s = [
            ];

            for(let i = 0;i < usingUI.length; i++) {
              const using = usingUI[i];
              for(let j = using.from;j < using.from + uiDivisionCounts[i];j++) {
                const config:{[key:string]:any} = {
                  layer: i,
                  id: j,
                  size: UI_RING_WEIGHT_EACH_LAYER[i][1],
                  using: (using.from <= j) && (j < using.to)
                }
                switch(i) {
                  case 1:
                    if(loopIndex(uiDivisionCounts[i], new RawId(j)) === activeButtons[i]) {
                      config.styleSettings = {};
                      config.styleSettings.backgroundColor = 'rgba(220,220,220,1)'
                    }
                    break;
                  case 2:
                    if(config.using === true) {
                      config.styleSettings = {};
                      config.styleSettings.zIndex = 3//5;
                      const palletIndex = j-using.from;
                      config.styleSettings.opacity = 1-(((palletIndex-2)**2)**0.25)/4;
                      config.styleSettings.backgroundColor = pallet[palletIndex];
                      if(loopIndex(uiDivisionCounts[i], new RawId(j)) == activeButtons[2]) {
                        config.styleSettings.backgroundColor = 'rgba(220,220,220,1)';
                        config.styleSettings.borderColor = pallet[palletIndex];
                      }
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

//rawIdとIdと混同ミスを防ぐため！！！
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

/*class SafetyVariable {
  constructor(value) {
    this.value = value;
  }
}*/

function createSafetyVariable<T>(value: T):new (...args: any[]) => {} {
  return class extends (Object.getPrototypeOf(value).constructor) {
    constructor(value: T) {
      super(value);
    }
  }
}
