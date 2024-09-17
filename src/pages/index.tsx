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
const UI_FONT_SIZE = 64;//px UI_FONT_SIZE(px) = 1em
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

const UI_RING_WEGIHT_EACH_LAYER = [ 0.35, 0.7, 0.95 ];

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
  text = text.replace('_',' ');
  return text;
}

const Home = () => {
  const [usingUI, setUsingUI] = useState(usingUiInitial);
  const [activeButtons, setActiveButtons] = useState([-1,-1,-1]);
  const [messageText, setMssageText] = useState('');
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
  let optCheckResult:boolean = false;
  function uiClicked(args: {rawId: RawId, layer: number}) {
    const {rawId, layer} = args;
    const id = loopIndex(uiDivisionCounts[layer], rawId);
    console.log('id',id,'layer',layer);
    const inputElm = getUiElementFromLayer(layer,rawId);

    let updateText:string = messageText;

    switch(layer) {
      case 0:

        usingUI[2].to = usingUI[2].from;
        setUsingUI([...usingUI]);
        let enableDelete = false;

        if(inputElm.displayName.length > 0) {
          const deleted = messageText.slice(-1);
          updateText = messageText.slice(0,-1)+inputElm.value;

          Object.keys(usingCenterUI).forEach(key=> {
            usingCenterUI[key] = new ButtonElement({name: '', value:''});
          });

          if(inputElm.displayName === 'delete') {
            const hiragana = updateText.slice(-1);
            console.log(hiragana,r.romanize(hiragana).toLowerCase());
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
            console.log(enableDelete);
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
            value: updateText.slice(-1)+'_'
          });
          usingCenterUI.delete = new ButtonElement({name: 'delete', value: ''});
        }

        if(enableDelete) {/**操作数の最大値が2: １つ以上無効化されるため余る。 */
          usingCenterUI.delete = new ButtonElement({name: 'delete', value: ''});
        }
        break;
      case 1:
        usingUI[2].from = Math.round((uiDivisionCounts[2]/uiDivisionCounts[1]) * id - 1);
        usingUI[2].to = usingUI[2].from+5;
        setUsingUI([...usingUI]);
        activeButtons[1] = id;
        activeButtons[2] = -1;
        setActiveButtons([...activeButtons]);
        break;
      case 2:
        updateText = messageText+inputElm.displayName;

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
          usingCenterUI.space = new ButtonElement({
            name: 'space',
            value: updateText.slice(-1)+'_'
          });
          usingCenterUI.delete = new ButtonElement({name: 'delete', value: ''});
        }
        break;
    }

    setMssageText(updateText);
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
    if(['k','s','d','h'].includes(consonant) && !exclude.includes('dakuten')) {
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

    setUsingCenterUI({...usingCenterUI});
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
        ['dakuten','handakuten','small','space','delete',].forEach(key=> {
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
    return {'dakuten':'濁点','handakuten':'半濁点','small':'小文字',
            'space':'空白','delete':'削除',
    }?.[name] || '';
  }

  function makeButton( {
    layer = -1,
    id = -1,
    size = -1,
    using = false,
    styleSettings = {},
  }:Partial<makeButtonInterFace> ) {
    const rescaledBorderWeight = rescalePx(UI_BORDER_WEIGHT) * size;
    const rescaledFontSize = rescalePx(UI_FONT_SIZE) / size;
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

    const tx = minorAdjuster(mx.raw, 1-rescaledFontSize, 0.5);
    const ty = minorAdjuster(my.raw, 1-rescaledFontSize, 0.5);
    const svg2 =
      using? <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1 1"
        id={`btn_visual_${layer}_${id}`}
        preserveAspectRatio="xMidYMid meet"
      ><text
        x={`${tx}`} y={`${ty}`}
        font-size={rescaledFontSize*0.75} stroke="green" fill="white"
        text-anchor="middle" stroke-width={rescaledStrokeWeight}
        dominant-baseline="middle"
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
        {messageText}
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
                  size: UI_RING_WEGIHT_EACH_LAYER[i],
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
