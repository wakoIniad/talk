/**todo:
 * タッチ範囲でかくする
 * 文字にカーソル合わせられるようにする
 *
 */

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
import { exitCode, off, send } from 'process';

const LINE_TARGET_NICKNAMES = [ "和田家", "友達" ]
const LINE_TARGET_COLORS = [ "#89BDDE", "#f8b500" ]

const DAKUTEN_UNICODE:string = "\u{3099}"; //濁点

const HANDAKUTEN_UNICODE:string = "\u{309A}"; //半濁点
const decoChars = [DAKUTEN_UNICODE, HANDAKUTEN_UNICODE];

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

const LINE_TARGETS_COUNT = 2;


const uiDivisionCounts = [ 2, 10, 20, 40 ];

const usingUiInitial = [
  {from: 0, to: 2},
  {from: 0, to: uiDivisionCounts[1]},
  {from: 0, to: 0},
  {from: 0, to: 0},
];

const outputLayer = [2,1]
const decorationLayer = [3,-1]

const fontMagnification = [ 1, 1, 1, 0.5 ];
const UI_RING_WEIGHT_EACH_LAYER = [ [0,0.25], [0.25,0.55], [0.5,0.8], [0.7, 1] ];
const UI_TEXT_POS = [ 1, 1.25, 1.4, 1.9 ]

const pallet = [
  '139,27,29', '240,211,0', '10,150,51', '109,183,196', '7,132,186',
];
const pallet2 = [
  '246,162,230', '218,162,248', '194,205,250', '153,232,236', '250,255,255',
];

const LayerArray_hiragana = new ButtonLayers(...['', ...'kstnhmyr'.split('')]
  .map(consonant=>'aiueo'.split('')
    .map(vowel=>
      new ButtonElement({name: Hiraganizer(consonant+vowel), value: consonant+vowel}))
  ).map(hiraganaList=>new ButtonElement({
    name: hiraganaList[0].displayName,
    value: null,
    children: new ButtonLayers(...hiraganaList)
  })));
LayerArray_hiragana[7] = new ButtonElement({
    name: 'や+', value: null,
    children: new ButtonLayers(
      ...'ya|yu|yo|,|.'.split('|').map(h=>new ButtonElement({name:Hiraganizer(h), value: h})
    ))
  })
LayerArray_hiragana.push(new ButtonElement({
  name: 'わ+', value: null,
  children: new ButtonLayers(
    ...'wa|wo|nn|-|?|!'.split('|').map(h=>new ButtonElement({name:Hiraganizer(h), value: h})
  ))
}))

const LayerArray_numbers = new ButtonLayers(...'0123456789'.split('').map(n=>
  new ButtonElement({name: n, value: n})
));

const uiInputSets = [LayerArray_hiragana,LayerArray_numbers]

function loopIndex( length: number, raw: number ):number {
  return (length + raw)%length;
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
  const [ _ , UpdateApp ] = useState([])

  const [ lineTargetId, setLineTargetId ] = useState(0);//0: family, 1: friend
  const [usingUI, setUsingUI] = useState(usingUiInitial);
  const [activeButtons, setActiveButtons] = useState([-1,-1,-1,-1]);
  const [messageText, setMssageText] = useState('');
  const [afterMessageText, setAfterMssageText] = useState('');
  const sendingNow = useRef(false);
  const touchedId = useRef([-1,-1]);
  const uiGenerated = useRef(false);
  const touchPos = useRef<number[]>([-1,-1]);
  const firstTouch = useRef(true);
  const containerRef = useRef(null!);
  const [uiInputMode, setUiInputMode] = useState(0);
  const [ cursorPosition, setCursorPosition ] = useState(0);// 注意： 最後のインデックスから逆方向に0, 1, 2と振られる！
  let updateMessageText:string = messageText;
  const lastClickId = useRef([-1,-1]);

  const LayerArray = uiInputSets[uiInputMode]

  const [usingCenterUI, setUsingCenterUI] = useState(initialUsingCenterUi);

  //console.log(LineTextParser(messageText));
  const nowOutputLayer = outputLayer[uiInputMode];

  const { width, height } = getWindowSize();
  const vmin = Math.min(width, height);

  async function gptConverter(messageText: string) {
    const result = await fetch(`/api/chatgpt?message=${messageText}`);
    const parsed = await result.json();
    return parsed.response
  }

  async function messageTextConverter(messageText: string){
    const result = await gptConverter(messageText)
    setMssageText(result)
  }


  function insertChar(c: string,text: string = messageText , at: number = cursorPosition) {
    return text.slice(0, -at-1) + c + text.slice(-at-1, -1)
  }
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
    if(sendingNow.current)return;
    sendingNow.current = true;
    const converted = await gptConverter(message);
    console.log("送信中...")

    const config = {
      'method' : 'post',
      'headers': { "Content-Type": "application/json" },
      'body': JSON.stringify({ 'message': `${LineTextParser(message)}\nAI自動変換後：${converted}`, 'target': lineTargetId }),
    };
    const res = await fetch('/api/line',config)
    setMssageText("");
    console.log("送信されました～",config);
    console.info(res);

    sendingNow.current = false;
  }

  let optCheckResult:string[] = [];
  let lastTouchedTime = useRef<number>(-1);
  function uiTouched(args:uiHandlerInterface) {
    const {rawId, layer} = args;
    const thisTouchId = [loopIndex(uiDivisionCounts[layer], rawId),layer];
    const same = touchedId.current.join(",") === thisTouchId.join(",");
    if(!same) {
      firstTouch.current = false;
    }
    if(!args.options)args.options = {};
    args.options.same = same;
    uiClicked(args, true);
    //uiClicked(args);
    //uiClicked(args);
    console.log("touchMOVE");
    touchedId.current = thisTouchId;
  }
  function uiClicked(args:uiHandlerInterface, touch?: boolean) {
    if( !touch ) {
      const {rawId, layer} = args;
      const thisClickId = [loopIndex(uiDivisionCounts[layer], rawId),layer];
      const sameClick = lastClickId.current.join(",") === thisClickId.join(",");
      if(!args.options)args.options = {};
      args.options.sameClick = sameClick;

      lastClickId.current = thisClickId;
      console.log(sameClick)
    }
    uiHandler(args);
  }

  interface uiHandlerInterface {
    rawId: number, layer: number,
    options?: {
      click?: boolean,
      select?: boolean,
      same?: boolean,
      sameClick?: boolean,
    }
  }
  function releaseUiLayerOver(layer: number) {
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

    const {rawId, layer, options: { click = false, select = false, same = false, sameClick = false } = {}} = args;


    const now = Date.now();
    if(lastTouchedTime.current !== -1 && now - lastTouchedTime.current < 200 && sameClick) {
      return;
    }
    lastTouchedTime.current = now;


    const id = loopIndex(uiDivisionCounts[layer], rawId);
    if(click || select)console.log(id, rawId, layer, usingUI[layer]);
    const inputElm = getUiElementFromLayer(layer, rawId);

    updateMessageText = messageText;
    switch(layer) {
      case 0:
        if(!click) break;
        releaseUiLayerOver(1);
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
        if(nowOutputLayer === 1) {
          updateMessageText = messageText+inputElm.displayName;
//          updateMessageText =  insertChar(inputElm.displayName.repeat(2),messageText, cursorPosition)
          //console.log(11,updateMessageText)
        } else
        if( activeButtons[1] === id && click) {

          /*activeButtons[1] = -1;
          activeButtons[2] = -1;

          usingUI[2].to = usingUI[2].from;*/
          releaseUiLayerOver(1);

          resetCenterUI("message-control");
        } else if(click || select || activeButtons[1] === -1){

          resetCenterUI("message-control");
          usingUI[2].from = Math.round((uiDivisionCounts[2]/uiDivisionCounts[1]) * id - 2);
          usingUI[2].to = usingUI[2].from+5;
          activeButtons[1] = id;
          //activeButtons[2] = -1;
          releaseUiLayerOver(2.5);
        }

        setUsingUI([...usingUI]);
        setActiveButtons([...activeButtons]);
        break;
      case 2:
        //if(same&&!(click||select))break;
        console.log(same,click,select);
        activeButtons[2] = id;
        setActiveButtons([...activeButtons]);

        updateMessageText = messageText+inputElm.displayName;

        //updateMessageText =  insertChar(inputElm.displayName.repeat(2),messageText, cursorPosition)
          //console.log(22,updateMessageText)

        optCheckResult = optionableChecker(
          inputElm.value,
          inputElm.displayName,
        );
//        updateMessageText = messageText+;

        if(optCheckResult.length) {/**optを優先の為space&del無効化 */
          if(activeButtons[3] !== -1)releaseUiLayerOver(3);
          usingUI[3].from = 2 * id;
          usingUI[3].to = usingUI[3].from + optCheckResult.length;
          if(!(click||select)) {
            for(let key of optCheckResult) {
              usingCenterUI[key].value = messageText.slice(-1) + usingCenterUI[key].value
            }
          }

//          if(!(click || select))break;
          //updateMessageText = messageText+inputElm.displayName;
          if(UI_MODE === 0) {
            usingCenterUI.space = new ButtonElement({
              name: '',
              value: ''
            });
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
    console.log(updateMessageText)
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
    if((['t','y','a'].includes(consonant) || ['a','i','u','e','o'].includes(consonant)) && !exclude.includes('small')) {
      let flag = false;
      if(['a','i','u','e','o'].includes(consonant)) {
        flag = true
      }
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
  //const characters: string =
  //  "あいうえお\nかきくけこ\nさしすせそ\nたちつてと\nなにぬねの\nはひふへほ\n"+
  //  "まみむめも\nや゛ゆ゜よ\nらりるれろ\nわ小を_ん";
  const characters: string =
    "あかさたなはまやらわ\n"+
    "あいうえお";
  interface makeButtonInterFace {
    layer: number;
    id: number;
    size: number;
    using: boolean;
    styleSettings?: {[key:string]:any}
  }

  function getUiElementFromLayer(layer: number, rawId: number):ButtonElement {

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
        const arcId = rawId - usingUI[2].from;
        return LayerArray[rootId]?LayerArray[rootId].children[arcId]:null;
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
/*
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
*/
  type CustomButtonProps = {
    layer: number,
    rawId: number,
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
    : CustomButtonProps&React.ComponentProps<'button'> ) => {

    const getUiElementTouched = (e: any, etype:string) => {
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
            rawId: Number(elmId),
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
  function changeLineTarget() {
    if(LINE_TARGETS_COUNT === 1 + lineTargetId) {
      setLineTargetId(0);
    } else {
      setLineTargetId(1 + lineTargetId);
    }
  }
  function requestFullscreen(e: any) {    // 全画面表示をリクエストするメソッドを取得
    if(document.fullscreenElement)return;
    e = containerRef.current
    const method = e.requestFullscreen || e.webkitRequestFullscreen || e.mozRequestFullScreen || e.msRequestFullscreen;
    if (method) {
      method.call(e); // 全画面表示をリクエスト
    }

  }

  function uiInputModeSetter(mode: number) {
    if(mode >= 2) {
      console.log('未実装です')
      return;
    }
    releaseUiLayerOver(1)
    setUiInputMode(mode)
  }

  function moveCursorPositionTo(d: number) {
    displayCursor(cursorPosition-d);
  }
  function displayCursor(
    nextCursorPosition: number,
    reverseIndex?: boolean,
    positiveIsOpen?: boolean,
  ) {
    //setMssageText(messageText);
    //setAfterMssageText(afterMessageText);
    //return text.slice(0, -at-1) + c + text.slice(-at-1, -1)
    const fullText = messageText + afterMessageText;
    if(reverseIndex) nextCursorPosition = fullText.length - 1 - nextCursorPosition
    //const nextCursorPosition = ;
    const l = fullText.length+1;
    const cursor = positiveIsOpen
      ? Math.min(nextCursorPosition, fullText.length)
      : (l+(nextCursorPosition%l))%l;
    const firstHalf = fullText.slice(0,fullText.length-cursor);
    const lastHalf = fullText.slice(fullText.length-cursor);
    setCursorPosition(cursor);
    setMssageText(firstHalf);
    setAfterMssageText(lastHalf);

  }
  function cursorPositionIs(i: number) {
    displayCursor(i-1, true, true);
  }
  function makeTextWrapper(text: string, offset=0) {
    return text.split(new RegExp(`(?<=.)(?!(${decoChars.map(c=>`[${c}]`).join('|')}))`)).filter(f=>f).map((c,i)=> {
      return <span style={{
        position: 'relative',
        width: 'fit-content',
        height: '1em',
        pointerEvents: 'auto',
      }}>{c}<span style={{
        position: 'absolute',
        width: '50%',
        height: '100%',
        left: 0,
      }} onClick={()=>cursorPositionIs(offset+i)}></span><span style={{
        position: 'absolute',
        width: '50%',
        height: '100%',
        right: 0,
      }} onClick={()=>cursorPositionIs(offset+i+1)}></span></span>
    })
  }
  return (
    <div className={styles.container} onClick={requestFullscreen} ref={containerRef}>
      <div id="message_display" className={`${styles.message_display} ${PlemolJPReglar.className}`}>
        <button className={`${styles.line_change_target_btn}`}
        style={{background: LINE_TARGET_COLORS[lineTargetId]}}
        onClick={changeLineTarget}>送信先: {LINE_TARGET_NICKNAMES[lineTargetId]}</button>
        <span style={{pointerEvents:'none'}} className={`${styles.message_text}`}>
            {[...makeTextWrapper(messageText),'|',makeTextWrapper(afterMessageText+'　'.repeat(16), messageText.length)] }
        </span>
        <div className={styles.function_buttons}>
          <button className={styles.right_ui_buttons} onClick={()=>uiInputModeSetter(0)}>ひらがな</button>
          <button className={styles.right_ui_buttons} onClick={()=>uiInputModeSetter(1)}>数字</button>
          <button className={styles.right_ui_buttons} onClick={()=>uiInputModeSetter(2)}>登録単語</button>
          <button className={styles.right_ui_buttons} onClick={()=>messageTextConverter(messageText)}>自動文字変換</button>
          <button className={`${styles.line_button}`} onClick={()=>sendToLine(messageText)}>LINEに送る</button>
        </div>
        <br/>
        <div className={styles.left_bottom_ui_container}>
        </div>
      </div>
      <div className={styles.input_ui_container}>
        {
          (function(){
            const buttons = [
            ];

            //const svgs = [
            //];

            //const svg2s = [
            //];
            /**
             * 濁点候補・半濁点候補がある場合は全て表示する
             * あかさたなはまやらわー＞2段
             * 濁点なし・濁点・半濁点ー＞３段
             */
            let buttonType = 0;
            let buttonIndex = 0;
            const buttonMatrixWidth = 5;
            const buttonMatrixHeight = 3;
            for(let i = 0;i < buttonMatrixHeight * buttonMatrixWidth; i++) {
              if(
                i === 2 * buttonMatrixWidth ||
                //i === 3 * buttonMatrixWidth ||
                //i === 4 * buttonMatrixWidth
              ) {
                buttonType++;
                buttonIndex = 0;
              }

              const button =
                <CustomButton
                  layer={buttonType}
                  rawId={buttonIndex}
                  className={`${styles.squre_button_item}`}
                  onClick={()=>uiClicked({ layer: buttonType, rawId: buttonIndex, options: {
                    click: true
                  } })}
                >
                  <div>a</div>
                </CustomButton>;
              buttons.push(button);
              buttonIndex++;
            }
            return buttons;
            //for(let i = 0;i < usingUI.length; i++) {
            //  const using = usingUI[i];
            //  for(let j = using.from;j < using.from + using.to;j++) {
            //    const config:{[key:string]:any} = {
            //      layer: i,
            //      id: j,
            //      size: UI_RING_WEIGHT_EACH_LAYER[i][1],
            //      using: (using.from <= j) && (j < using.to)
            //    }
            //    switch(i) {
            //      case 1:
            //        break;
            //      case 2:
            //        if(config.using === true) {
            //          config.styleSettings = {};
//          //            config.styleSettings.zIndex = 5;
            //          const palletIndex = j-using.from;
            //          config.styleSettings.opacity = 1-(((palletIndex-2)**2)**0.25)/4;
            //          if(loopIndex(uiDivisionCounts[i], new RawId(j)) == activeButtons[2]) {
            //            config.styleSettings.borderColor = pallet[palletIndex];
            //          } else {
            //            config.styleSettings.background =
            //              makeGradationBG(pallet[palletIndex],i);
            //          }
            //        }
            //        break;
            //      case 3:
            //        if(config.using === true) {
            //          config.styleSettings = {};
            //          //config.styleSettings.zIndex = -1;
            //        }
            //    }
//
            //    if(!getUiElementFromLayer(i,new RawId(j)))continue;
            //    //const button =
            //    //    <CustomButton
            //    //      layer={layer}
            //    //      rawId={rawId}
            //    //      className={`${styles.input_ui_btn} ${styles[`input_ui_btn_${layer}`]}
            //    //      ${styles[`input_ui_btn_${layer}_${id}`]}
            //    //      ${using ? styles.ExpansionRing : '' }`
            //    //      }
            //    //      onClick={()=>uiClicked({ layer:layer, rawId:rawId, options: {
            //    //        click: true
            //    //      } })}
            //    //    >
            //    //      <div></div>
            //    //    </CustomButton>;
            //    const { button, svg, svg2 } = makeButton(config);
            //    buttons.push(button);
            //    svgs.push(svg);
            //    svg2s.push(svg2);
            //  }
            //}


            //return [...svgs,...svg2s,...buttons,];
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
