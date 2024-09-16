import { useState, useEffect } from 'react';

import styles from './index.module.scss';

let uiDivisionCount = 4;
styles.uiDivisionCount = uiDivisionCount;

/**
 * ブラウザ側処理
 *
Next.js はPre-redndering(SSR,SSG)がサポートされているので、
Hooksでブラウザ側にしか存在しないグローバルオブジェクトのwindowやdocumentを参照する場合には必ず
windowが存在するか確認する
(https://zenn.dev/developanda/articles/daf34873fe4ef4)

また、scssのコンパイルなどはブラウザ側で実行されるわけではないと思われるので、ブラウザ側で取得した情報は
useStateなどで共有する
 */
if (typeof window !== "undefined") {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  const screenWidth = window.innerWidth();
  const screenHeight = window.innerHeight();
  styles.screenWidth = screenWidth;
  styles.screenHeight = screenHeight;
}


function uiClicked(args: {id: number, type: string}) {
  const {id, type} = args;
  console.log(id,type)
}

const Home = () => {
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
            for(let i = 0;i < uiDivisionCount;i++) {
              buttons.push(
              <button
                className={`${styles.input_ui_btn} ${styles[`input_ui_btn_circumference_${i}`]}`}
                onClick={()=>uiClicked({ type:"ring", id:i })}
              ></button>);
            }
            return buttons;
          })()
        }
      </div>
    </div>
  );
};

export default Home;

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}
