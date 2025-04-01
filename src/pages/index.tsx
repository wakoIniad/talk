/**todo:
 * タッチ範囲でかくする
 * 文字にカーソル合わせられるようにする
 *
 */

const UI_MODE:number = 1;

import React, { useState, useEffect, useRef, ReactNode } from 'react';

import styles from './index.module.scss';


import Hiraganizer from './romaji-hira-convert';
import { ButtonLayers, ButtonElement } from './layer-ui'


import localfont from "next/font/local";
import { exitCode, off, send } from 'process';

const LINE_TARGET_NICKNAMES = [ "和田家", "\n友達（※未設定）" ]
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

const LINE_TARGETS_COUNT = 2;


const uiDivisionCounts = [ 2, 10, 20, 40 ];

const usingUiInitial = [
  {from: 0, to: 2},
  {from: 0, to: uiDivisionCounts[1]},
  {from: 0, to: 0},
  {from: 0, to: 0},
];
const consonants_display: string[] = "あ,か,さ,た,な,は,ま,や,ら,わ+ん".split(',');
//const consonants: string = " kstnhmyrw";//スペースは中身無しの文字列に置換する
const decorations: string = "゛゜小";
const decorations_display: string = "゛゜小";
const functions_display: string[] = "削除,🍊".split(',');
const ui_premise = [
  [-1,0,1,2],
  [0],
  [1],
  [-1,0,1,2]
];
const decoration_premise = [
  'かきくけこさしすえそたちつてとはひふへほ',
  'はひふへほ',
  'あいうえおつやゆよ'
]
const hiraganaDict = [
  'あいうえお',
  'かきくけこ',
  'さしすせそ',
  'たちつてと',
  'なにぬねの',
  'はひふへほ',
  'まみむめも',
  'や？ゆ！よ',
  'らりるれろ',
  ['わ','😀','を','😢','ん']
]
const lowerHiraganaDict = {
  'つ':'っ',
  'や':'ゃ',
  'ゆ':'ゅ',
  'よ':'ょ',
  'あ':'ぁ',
  'い':'ぃ',
  'う':'ぅ',
  'え':'ぇ',
  'お':'ぉ',
}
const emojies: string[] =
[
  //'0,1,2,3,4,5,6,7,8,9,'+
  '👍','👎','👈','👉','👆',
  '👇','🤣','','','',
  '','','','','',
  '','','',''
];
const emojiFunctions = '戻る'.split(',');

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
  const lastActivated = useRef([-1,-1]);

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
  const [emojiMode, setEmojiMode] = useState(false);
  let updateMessageText:string = messageText;
  //const lastClickId = useRef([-1,-1]);
  const lastConsonantIndex = useRef(-1);

  const LayerArray = uiInputSets[uiInputMode]

  const [usingCenterUI, setUsingCenterUI] = useState(initialUsingCenterUi);

  //console.log(LineTextParser(messageText));
  //const nowOutputLayer = outputLayer[uiInputMode];

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
    const res = await fetch('/api/discord',config)
    setMssageText("");
    console.log("送信されました～",config);
    console.info(res);

    sendingNow.current = false;
  }

  function newUiHandler(type: number, index: number) {
    if(emojiMode) {
      lastActivated.current[0] = 0;
      lastActivated.current[1] = index;
      if(type === 0) {
        setMssageText( messageText + emojies[index] );
      } else if(type === 1 && index === 0) {
        setEmojiMode(!emojiMode);
      }
      return;
    }
    if(type === 0) {//consonant
      lastConsonantIndex.current = index;
      UpdateApp([]);

      lastActivated.current[0] = 0;
      lastActivated.current[1] = index;
    } else if(type === 1) {//vowel
      if(lastConsonantIndex.current !== -1) {
        const addingHiragana =
          hiraganaDict[lastConsonantIndex.current][index];
        setMssageText( messageText + addingHiragana );
      }

      lastActivated.current[0] = 1;
      lastActivated.current[1] = index;
    } else if(type === 2) {//decoration
      switch(index) {
        case 0:
          setMssageText( messageText + '゛' );
          break;
        case 1:
          setMssageText( messageText + '゜' );
          break;
        case 2:
          const c = messageText.slice(-1);
          setMssageText(
            messageText.slice(0,-1) +

            (lowerHiraganaDict?.[c] ?? c)

          )
          break;
      }

      lastActivated.current[0] = -1;
      lastActivated.current[1] = index;
    } else if(type === 3) {//functions
      switch(index) {
        case 0://delete
          setMssageText( Array.from(messageText).slice(0, -1).join('') );
          break;
        case 1:
          setEmojiMode(!emojiMode);
          break;
      }
    }
  }
  function uiClicked(args:uiHandlerInterface, touch?: boolean) {
    if( !touch ) {
      const {layer, rawId} = args;
      //const thisClickId = [loopIndex(uiDivisionCounts[layer], rawId),layer];
      //const sameClick = lastClickId.current.join(",") === thisClickId.join(",");
      //if(!args.options)args.options = {};
      //args.options.sameClick = sameClick;

      //lastClickId.current = thisClickId;
      console.log("clicked at "+ layer+ rawId)
      newUiHandler(layer, rawId);
    }
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
  const CommentOut = () => {
    return <></>
  }
  const CustomButton = ({ children, layer, rawId, style, ...props }
    : CustomButtonProps&React.ComponentProps<'button'> ) => {

    const buttonRef = useRef<HTMLButtonElement>(null!);


    useEffect(() => {
      const itemElement = buttonRef.current;


      return () => {
      };
    }, []);


    return (
       // 登録したイベントリスナーをrefを使って参照する
      <button ref={buttonRef}
        {...props}
        style={{...style/*, ...additionStyle*/}}
        id={`btn_${layer}_${loopIndex(uiDivisionCounts[layer],rawId)}`}
      >
        {children}
      </button>
    );
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

  function displayCursor(
    nextCursorPosition: number,
    reverseIndex?: boolean,
    positiveIsOpen?: boolean,
  ) {
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
    //return //text.split(new RegExp(`(?<=.)(?!(${decoChars.map(c=>`[${c}]`).join('|')}))`))
    return Array.from(text).filter(f=>f).map((c,i)=> {
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
        onClick={changeLineTarget}>送信先: {
          LINE_TARGET_NICKNAMES[lineTargetId].split('\n').map(name=>[name, <br></br>])
        }</button>
        <span style={{pointerEvents:'none'}} className={`${styles.message_text}`}>
            {[...makeTextWrapper(messageText),'|',makeTextWrapper(afterMessageText+'　'.repeat(16), messageText.length)] }
        </span>
        <div className={styles.function_buttons}>
          <CommentOut>
            <button className={styles.right_ui_buttons} onClick={()=>uiInputModeSetter(0)}>ひらがな</button>
            <button className={styles.right_ui_buttons} onClick={()=>uiInputModeSetter(1)}>数字</button>
            <button className={styles.right_ui_buttons} onClick={()=>uiInputModeSetter(2)}>登録単語</button>
          </CommentOut>
          <button className={styles.right_ui_buttons} onClick={()=>messageTextConverter(messageText+afterMessageText)}>自動文字変換</button>
          <button className={`${styles.line_button}`} onClick={()=>sendToLine(messageText+afterMessageText)}>Discordに送る</button>
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
            const decorationButtonCount = decorations_display.length;
            const functionButtonCount = functions_display.length;
            const buttonCount =
              buttonMatrixHeight * buttonMatrixWidth +
              decorationButtonCount + functionButtonCount;
            for(
              let i = 0;
              i < buttonCount;
              i++
            ) {
              if(emojiMode) {
                if(buttonIndex === buttonCount-1) {
                  buttonType++;
                  buttonIndex = 0;
                }
              }
              else if(
                i === 2 * buttonMatrixWidth ||
                i === 3 * buttonMatrixWidth ||
                i === 3 * buttonMatrixWidth + decorationButtonCount
              ) {
                buttonType++;
                buttonIndex = 0;
              }

              const args = { layer: buttonType, rawId: buttonIndex, options: {
                click: true
              } };
              const button =
                <CustomButton
                  layer={buttonType}
                  rawId={buttonIndex}
                  style={{
                    backgroundColor:
                    lastActivated.current[0] === buttonType &&
                    lastActivated.current[1] === buttonIndex
                    ? "#FFFF00"
                    :ui_premise[buttonType].includes(lastActivated.current[0])
                      ? buttonType === 2
                        ? ( decoration_premise[buttonIndex].includes(messageText.slice(-1))
                          ? '#FFFFFF'
                          : '#999999'
                        )
                      : '#FFFFFF'
                      : '#999999'
                  }}
                  className={`${styles.squre_button_item}`}
                  onClick={()=>uiClicked(args)}
                >
                  <div>{
                    emojiMode
                      ? buttonType === 0
                        ? emojies[buttonIndex]
                        : emojiFunctions[buttonIndex]
                      :buttonType === 0
                        ? consonants_display[buttonIndex]+"行"
                        : buttonType === 1
                        ? (
                            lastConsonantIndex.current !== -1
                            ? hiraganaDict[lastConsonantIndex.current][buttonIndex]
                            : '行を選択！'[buttonIndex]
                          )
                        : buttonType === 2
                        ? decorations_display[buttonIndex]
                        : functions_display[buttonIndex]
                  }</div>
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
