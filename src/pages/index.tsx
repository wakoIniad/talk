const UI_MODE:number = 1;

import React, { useState, useEffect, useRef, ReactNode } from 'react';

import styles from './index.module.scss';

const Romanizer = require('js-hira-kata-romanize');
const r = new Romanizer({
  chouon: Romanizer.CHOUON_ALPHABET
});

import Hiraganizer from './romaji-hira-convert';
import { ButtonLayers, ButtonElement } from './layer-ui'


import localfont from "next/font/local";
import { exitCode, off } from 'process';

const DAKUTEN_UNICODE:string = "\u{3099}"; //濁点

const HANDAKUTEN_UNICODE:string = "\u{309A}"; //半濁点

const ACTIVE_UI_BACKGROUND = 'rgba(220,220,220,1)';

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

const uiDivisionCounts = [ 2, 10, 20, 40 ];

const usingUiInitial = [
  {from: 0, to: 2},
  {from: 0, to: uiDivisionCounts[1]},
  {from: 0, to: 0},
  {from: 0, to: 0},
];

const fontMagnification = [ 1, 1, 1, 0.5 ];
const UI_RING_WEIGHT_EACH_LAYER = [ [0,0.25], [0.25,0.55], [0.5,0.8], [0.7, 1] ];
const UI_TEXT_POS = [ 1, 1.25, 1.4, 1.9 ]

const pallet = [
  '139,27,29', '240,211,0', '10,150,51', '109,183,196', '7,132,186',
];
const pallet2 = [
  '246,162,230', '218,162,248', '194,205,250', '153,232,236', '250,255,255',
];


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
  const [activeButtons, setActiveButtons] = useState([-1,-1,-1,-1]);
  const [messageText, setMssageText] = useState('');
  const touchedId = useRef([-1,-1]);
  const uiGenerated = useRef(false);
  const touchPos = useRef<number[]>([-1,-1]);
  const firstTouch = useRef(true);
  let updateMessageText:string = messageText;

  const [usingCenterUI, setUsingCenterUI] = useState(initialUsingCenterUi);
  //console.log(LineTextParser(messageText));

  const { width, height } = getWindowSize();
  const vmin = Math.min(width, height);

  function makeUsingUIElement(consonant:string, Vowel:string, displayName?: string) {
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

  let optCheckResult:string[] = [];
  function uiTouched(args:uiHandlerInterface) {
    const {rawId, layer} = args;
    const thisTouchId = [loopIndex(uiDivisionCounts[layer], rawId),layer];
    const same = touchedId.current.join(",") !== thisTouchId.join(",");
    if(same) {
      firstTouch.current = false;
    }
    args.options.same = same;
    uiClicked(args);
    //uiClicked(args);
    //uiClicked(args);
    console.log("touchMOVE")
    touchedId.current = thisTouchId;
  }
  function uiClicked(args:uiHandlerInterface) {
    uiHandler(args);
  }

  interface uiHandlerInterface {
    rawId: RawId, layer: number,
    options?: {
      click?: boolean,
      select?: boolean,
      same?: boolean,
    }
  }
  function releaseUiOverLayer(layer: number) {
    const FIXED_LAYER = [0,1];
    for(let i = layer|1;i < usingUI.length;i++) {
      if(FIXED_LAYER.includes(i))continue;
      usingUI[i].to = usingUI[i].from;
    }
    for(let i = ~~layer;i < activeButtons.length;i++) {
      activeButtons[i] = -1;
    }
    setUsingUI([...usingUI]);
    setActiveButtons([...activeButtons]);
  }

  function updateSpaceUI() {
    usingCenterUI.space = new ButtonElement({
      name: 'space',
      value: updateMessageText.slice(-1)+'_'
    });
  }
  function uiHandler(args:uiHandlerInterface) {
    const {rawId, layer, options: { click = false, select = false, same = false } = {}} = args;
    const id = loopIndex(uiDivisionCounts[layer], rawId);
    if(click || select)console.log(id, rawId, layer, usingUI[layer]);
    const inputElm = getUiElementFromLayer(layer,rawId);

    updateMessageText = messageText;

    switch(layer) {
      case 0:
        if(!click) break;
        releaseUiOverLayer(1);
        //usingUI[2].to = usingUI[2].from;

        //activeButtons[1] = -1;
        //activeButtons[2] = -1;

        //setUsingUI([...usingUI]);
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
              if(optCheckResult.length) enableDelete = true;
            }
          }
        }
        if(optCheckResult.length) {/**optを優先の為space&del無効化 */
          if(UI_MODE === 0) {
            usingCenterUI.space = new ButtonElement({
              name: '',
              value: ''
            });

            if(!enableDelete) {/**操作数の最大値が2: １つ以上無効化されるため余る。 */
              usingCenterUI.delete = new ButtonElement({name: '', value: ''});
            }
          } else {
            updateSpaceUI();
          }
        } else {
          updateSpaceUI();
          usingCenterUI.delete = new ButtonElement({name: 'delete', value: ''});
        }

        setUsingCenterUI({...usingCenterUI});
        //setActiveButtons([...activeButtons]);
        break;
      case 1:
        if( activeButtons[1] === id && click) {

          /*activeButtons[1] = -1;
          activeButtons[2] = -1;

          usingUI[2].to = usingUI[2].from;*/
          releaseUiOverLayer(1);

          resetCenterUI("message-control");
        } else if(click || select || activeButtons[1] === -1){

          resetCenterUI("message-control");
          usingUI[2].from = Math.round((uiDivisionCounts[2]/uiDivisionCounts[1]) * id - 2);
          usingUI[2].to = usingUI[2].from+5;
          activeButtons[1] = id;
          //activeButtons[2] = -1;
          releaseUiOverLayer(2.5);
        }

        setUsingUI([...usingUI]);
        setActiveButtons([...activeButtons]);
        break;
      case 2:
        if(same&&!(click||select))break;
        activeButtons[2] = id;
        setActiveButtons([...activeButtons]);

        updateMessageText = messageText+inputElm.displayName;

        optCheckResult = optionableChecker(
          inputElm.value,
          inputElm.displayName,
        );
//        updateMessageText = messageText+;

        if(optCheckResult.length) {/**optを優先の為space&del無効化 */
          releaseUiOverLayer(3);
          usingUI[3].from = 2 * id;
          usingUI[3].to = usingUI[3].from + optCheckResult.length;

//          if(!(click || select))break;
          //updateMessageText = messageText+inputElm.displayName;
          if(UI_MODE === 0) {
            usingCenterUI.space = new ButtonElement({
              name: '',
              value: ''
            })  ;
            if(optCheckResult.length >= 2)usingCenterUI.delete = new ButtonElement({name: '', value: ''});
          } else {
            updateSpaceUI();
          }
        } else {

          if(!(click || select))break;
          if(UI_MODE === 0)resetCenterUI("message-control");

        }

        setUsingCenterUI({...usingCenterUI});
        setUsingUI([...usingUI]);
        break;
      case 3:
        activeButtons[3] = id;
        if(click || select) {//click と select 同時にできないようにする
          if(inputElm.displayName.length > 0) {
            const deleted = messageText.slice(-1);
            updateMessageText = messageText.slice(0,-1)+inputElm.value;

            updateSpaceUI();
          }
        }
        setActiveButtons([...activeButtons]);
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
    let activeFlagCout = 0;
    let useOpt:string[] = [];
    if(['t','k','s','h'].includes(consonant) && !exclude.includes('dakuten')) {
      const display = [hiragana, DAKUTEN_UNICODE].join("");
      usingCenterUI.dakuten = new ButtonElement({
        name: 'dakuten',
        value: display,
      });
      optionIsAvaliable = true;
      activeFlagCout ++;
      useOpt.push("dakuten");
    }
    if(['h'].includes(consonant) && !exclude.includes('handakuten')) {
      const display =  [hiragana, HANDAKUTEN_UNICODE].join("");
      usingCenterUI.handakuten = new ButtonElement({
        name: 'handakuten',
        value: display,
      });
      optionIsAvaliable = true;
      activeFlagCout ++;
      useOpt.push("handakuten");
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
        optionIsAvaliable = true;
        activeFlagCout ++;
        useOpt.push("small");
      }
    }

    return useOpt;
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
    const usableOptions:Array<string> = [];
    switch(layer) {
      case 0:
        ['delete'/*,'dakuten','handakuten','small'*/,'space'].forEach(key=> {
          //if(usingCenterUI[key].displayName.length > 0) {
            usableOptions.push(key);
          //}
        });
        if(usableOptions[id]) {
          const key = usableOptions[id];
          const btnUI = usingCenterUI[key];
          btnUI.color = {
            "delete":"rgb(0,0,0)",
            "dakuten":"rgb(200,0,100)",
            "handakuten":"rgb(0,0,255)",
            "space":"rgb(255,255,255)",
            "small":"rgb(255,255,0)",
          }[key];
          return btnUI;
        };
        break;
      case 1:
        return LayerArray[id];
      case 2:
        const rootId = activeButtons[1];
        const arcId = rawId.parse() - usingUI[2].from;
        return LayerArray[rootId].children[arcId];
      case 3:
        ['dakuten','handakuten','small'].forEach(key=> {
          if(usingCenterUI[key].displayName.length > 0) {
            usableOptions.push(key);
          }
        });
        if(usableOptions[id%2]) {
          const key = usableOptions[id%2];
          const btnUI = usingCenterUI[key];
          btnUI.color = {
            "delete":"rgb(0,0,0)",
            "dakuten":"rgb(200,0,100)",
            "handakuten":"rgb(0,0,255)",
            "space":"rgb(255,255,255)",
            "small":"rgb(255,255,0)",
          }[key];
          return btnUI;
        }
    }

    return new ButtonElement({name: '', value: ''});
  }

  function rescalePx(npx:number) {
    return 1/vmin*1*npx;
  }

  function getDisplayName(layer: number,name: string) {
    if(layer === 3) return {'dakuten':'゛','handakuten':'゜','small':'小'}[name]
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
    const ringInnerRadius = UI_RING_WEIGHT_EACH_LAYER[layer][0]/size
    const [ a2x, a2y, b2x, b2y ] = [ ax, ay, bx, by ].map(
      d => d.mul(ringInnerRadius)
    );
    const cx = minorAdjuster(mx.raw, rescaledBorderWeight, 0.5);
    const cy = minorAdjuster(my.raw, rescaledBorderWeight, 0.5);

    const svg =
      using && divisionCount >= 2 ? <svg
        style={{pointerEvents:'none'}}
        xmlns="http://www.w3.org/2000/svg"
        >
        <clipPath id={`btn_clip_${layer}_${id}`} clipPathUnits="objectBoundingBox">
          <path d={
            `M ${cx.plus(a2x)} ${cy.plus(a2y)}`+
            `a ${[ringInnerRadius,ringInnerRadius].join(" ")} 0 0 1 ${b2x.minus(a2x)} ${b2y.minus(a2y)}`+
            `l ${bx.minus(b2x)} ${by.minus(b2y)}`+
            `a 0.5 0.5 0 0 0 ${ax.minus(bx)} ${ay.minus(by)}`+`Z`

        } fill="none"/>
        </clipPath>
      </svg> : '';

    //const ringWeight = (UI_RING_WEIGHT_EACH_LAYER[layer][1]-UI_RING_WEIGHT_EACH_LAYER[layer][0])/
    //UI_RING_WEIGHT_EACH_LAYER[layer][0];
    const tx = minorAdjuster(mx.raw,
      ringInnerRadius+(1-ringInnerRadius)*0.5*UI_TEXT_POS[layer],
      0.5
    );
    const ty = minorAdjuster(my.raw,
      ringInnerRadius+(1-ringInnerRadius)*0.5*UI_TEXT_POS[layer],
      0.5
    );
    const svg2 =
      using? <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1 1"
        id={`btn_visual_${layer}_${id}`}
        preserveAspectRatio="xMidYMid meet"
        style={{pointerEvents:'none'}}
      ><text
        x={`${tx}`} y={`${ty}`}
        fontSize={`${rescaledFontSize*0.75*8*fontMagnification[layer]}%`} stroke="green" fill="white"
        textAnchor="middle" strokeWidth={rescaledStrokeWeight}
        dominantBaseline="middle"
      >
        {getDisplayName(layer, getUiElementFromLayer(layer,rawId).displayName)}
      </text>
    </svg>: '';


  if(using) {
    //styleSettings.backgroundImage = `url(#btn_visual_${layer}_${id})`;
    styleSettings.clipPath = `url(#btn_clip_${layer}_${id})`;
    if(!styleSettings.opacity)styleSettings.opacity = activation_flag;
    const btnUI = getUiElementFromLayer(layer,rawId);
    if(btnUI.color) {
      styleSettings.background = btnUI.color;
    }
    if(id === activeButtons[layer]) {
      styleSettings.background = ACTIVE_UI_BACKGROUND;
    }
  }

  const button =
    <CustomButton
      layer={layer}
      rawId={rawId}
      className={`${styles.input_ui_btn} ${styles[`input_ui_btn_${layer}`]}
      ${styles[`input_ui_btn_${layer}_${id}`]}
      ${using ? styles.ExpansionRing : '' }`
      }
      onClick={()=>uiClicked({ layer:layer, rawId:rawId, options: {
        click: true
      } })}
      style={{
        width: `${100*size*activation_flag}%`,
        height: `${100*size*activation_flag}%`,
        visibility: `${using? 'visible': 'hidden'}`,
        pointerEvents: `${using? 'auto': 'none'}`,
        ...styleSettings,
      }}
    >
      {svg2}
    </CustomButton>;
    return { button, svg, svg2:'' };
  }

  type CustomButtonProps = {
    layer: number,
    rawId: RawId,
  };

  function idToRawId(id: number, layer: number) {
    const offset = usingUI[layer].from;
    //const OPEN_INDEX_DIRECTION = Math.max(offset/((offset**2)**0.5)||0, 0);
    const len = uiDivisionCounts[Number(layer)];
    //const lenWithSign = OPEN_INDEX_DIRECTION * len;
    return new RawId(
          (Number(id)+(20-offset))%len+offset
    );
  }

  const CustomButton = ({ children, layer, rawId, style, ...props }
    : CustomButtonProps&React.ComponentProps<'button'> )=>{

    const getUiElementTouched = (e: any, etype:string)=> {
        if(e.touches.length) touchPos.current = [e.touches[0].clientX,e.touches[0].clientY];
        const element = document.elementFromPoint(touchPos.current[0],touchPos.current[1]);
        if(etype === "end") {
          touchPos.current = [-1,-1];
          firstTouch.current = true;
        }
        if(element instanceof HTMLElement) {
          const elementId = element.getAttribute('id');
          if(elementId !== null) {
            const [ _type, elmLayer, elmId ] = elementId.split('_');
            uiTouched({
              rawId: idToRawId(Number(elmId),Number(elmLayer)),
              layer: Number(elmLayer), options: {
                click: etype === "start" || firstTouch.current,
                select: etype === "end",
              }
            })
          }
        }
    }
    const buttonRef = useRef<HTMLButtonElement>(null!);
    const handleTouchStart = (e:any)=>getUiElementTouched(e,"start");

    const handleTouchMove = (e:any)=>getUiElementTouched(e,"move");

    const handleTouchEnd = (e:any)=>getUiElementTouched(e,"end");


    useEffect(() => {
      const itemElement = buttonRef.current;
      //itemElement.RemoveAllListeners();
     // itemElement.addEventListener("touchstart", handleTouchStart, { passive: false });
      itemElement.addEventListener("touchmove", handleTouchMove, { passive: false });
      itemElement.addEventListener("touchend", handleTouchEnd, { passive: false });


      return () => {
      };
    }, []);

    const additionStyle:{[key: string]: string} = {}
    /*if(touchedId.join(',') === [loopIndex(uiDivisionCounts[layer], rawId),layer].join(',')) {
      additionStyle.pointerEvents = 'none';
      console.log("events:none")
    }*/
    return (
       // 登録したイベントリスナーをrefを使って参照する
      <button ref={buttonRef}
        {...props}
        style={{...style, ...additionStyle}}
        id={`btn_${layer}_${loopIndex(uiDivisionCounts[layer],rawId)}`}
      >
        {children}
      </button>
    );
  }

  function makeGradationBG(rgb:string,layer:number) {
    const R =
    UI_RING_WEIGHT_EACH_LAYER[layer][0]/
    UI_RING_WEIGHT_EACH_LAYER[layer][1]*0.8;
    const step = 0.2

    const result = `radial-gradient(rgba(${rgb},0) ${R*100}%,`+
    new Array(1/step).fill(0).map((v,i)=>(step+i*step)*100).map(p=>
      `rgba(${rgb},${
        ((Math.log(p/100*Math.E+Math.E)-1)/(Math.log(2*Math.E)-1))**
        (1/8)
      }) ${p + (100-p)*R}%`
    ).join(",");
    return result;
  }
  return (
    <div className={styles.container}>
      <div id="message_display" className={`${styles.message_display} ${PlemolJPReglar.className}`}>
        <span style={{pointerEvents:'none'}} className={`${styles.message_text}`}>
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
                    break;
                  case 2:
                    if(config.using === true) {
                      config.styleSettings = {};
//                      config.styleSettings.zIndex = 5;
                      const palletIndex = j-using.from;
                      config.styleSettings.opacity = 1-(((palletIndex-2)**2)**0.25)/4;
                      if(loopIndex(uiDivisionCounts[i], new RawId(j)) == activeButtons[2]) {
                        config.styleSettings.borderColor = pallet[palletIndex];
                      } else {
                        config.styleSettings.background =
                          makeGradationBG(pallet[palletIndex],i);
                      }
                    }
                    break;
                  case 3:
                    if(config.using === true) {
                      config.styleSettings = {};
                      //config.styleSettings.zIndex = -1;
                    }
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

  mul(e:Result|number) {
    return new Result(this.raw * (typeof e === 'number' ? e : e.raw), this.callback)
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
