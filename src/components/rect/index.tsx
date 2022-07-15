/* eslint-disable no-unused-vars */
import classNames from 'classnames';
import React, { MutableRefObject, useEffect, useRef, useState } from 'react';

import delall from '../resources/delall.svg';
import delIcon from '../resources/delIcon.svg';
import draw from '../resources/draw.svg';
import styles from './index.module.less';
type rectObject = { [k: string]: number };

const regexOfTranslate = /(-?\d+(\.\d+)?)/g;
const imageW = 15; //  delete Icon
const imageH = 15; //  delete Icon
const minW = 50; // this is rect min width
const minH = 50; // this is rect min height
const cavansMinW = 100;
const cavansMinH = 100;
const textPosition = 20;
const tempImg = document.createElement('img');
let x0: number;
let y0: number;
let x1: number;
let y1: number;
let endX0: number;
let endY0: number;
let endX1: number;
let endY1: number | null;
let inRectObejct: rectObject | null;
let moveFlag = false;
let drawFlag = false;
let scale = 1;
let realRatio: number; // real ratio
let cW: number;
let cH: number;
let drawRatio: number;
let canvasRect: HTMLCanvasElement;
let backgroundImg: HTMLImageElement;
let canvasWidth: number;
let canvasHeight: number;
let preCanvasWidth: number;
let wheelPreRatioX: number;
let wheelPreRatioY: number;
let keyBool = false;
let dragStartX: number;
let dragStartY: number;

interface IProps {
  canvasContainerSize: {
    containerW: number;
    containerH: number;
    top: number;
    left: number;
  };
  setChooseArr(
    v: number | rectObject,
    type: 'replace' | 'delete' | 'push',
    nextValue?: Object,
  ): void;
  chooseArrRef: MutableRefObject<any[]>;
  fileUrl: string;
}

const DrawRect: React.FC<IProps> = (props) => {
  const { canvasContainerSize, setChooseArr, chooseArrRef, fileUrl } = props;

  const canvasRectRef = useRef(null);
  const backgroundImgRef = useRef(null);
  const [canStart, setCanStart] = useState(false);
  const [canvasW, setCavansW] = useState(0);
  const [canvasH, setCavansH] = useState(0);
  const [actionImg, setactionImg] = useState(0);
  const [translateX, setTX] = useState(0);
  const [translateY, setTY] = useState(0);

  const [relImageWH, setRIWH] = useState({ relImageH: 0, relImageW: 0 });

  const startRect = (isCanStart = true) => {
    const ctx = canvasRect.getContext('2d') as CanvasRenderingContext2D;
    ctx.strokeStyle = '#3fced9';
    ctx.font = ' small-caps lighter 12px Roboto';
    ctx.fillStyle = '#3fced9';
    const delIcon = document.getElementById('delIcon') as HTMLImageElement;
    if (!isCanStart) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      canvasRect.style.cursor = 'default';
    }
    const strokeTextAndImage = (
      igx: number,
      igy: number,
      rx: number,
      ry: number,
      text: any,
      tx: number,
      ty: number,
      ex: number,
      ey: number,
    ) => {
      if (ex - rx >= minW && ey - ry >= minH) {
        ctx.drawImage(delIcon, igx, igy, imageW, imageH);
      }
      ctx.fillRect(rx, ry, textPosition, textPosition);
      ctx.strokeStyle = '#fff';
      ctx.strokeText(text as string, tx - 2, ty);
      ctx.strokeStyle = '#3fced9';
    };
    const draw = (obj?: { [k: string]: number | string }) => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      if (obj) {
        chooseArrRef.current.forEach(({ endX0, endY0, endX1, endY1, name }) => {
          if (
            obj &&
            (obj.endX0 !== endX0 ||
              obj.endY0 !== endY0 ||
              obj.endX1 !== endX1 ||
              obj.endY1 !== endY1)
          ) {
            ctx.strokeRect(endX0, endY0, endX1 - endX0, endY1 - endY0);
            strokeTextAndImage(
              endX1 - textPosition,
              endY0 + textPosition / 4,
              endX0,
              endY0,
              name,
              endX0 + textPosition / 2.5,
              endY0 + textPosition / 1.5,
              endX1,
              endY1,
            );
          }
        });
      } else {
        chooseArrRef.current.forEach(({ endX0, endY0, endX1, endY1, name }) => {
          ctx.strokeRect(endX0, endY0, endX1 - endX0, endY1 - endY0);
          strokeTextAndImage(
            endX1 - textPosition,
            endY0 + textPosition / 4,
            endX0,
            endY0,
            name,
            endX0 + textPosition / 2.5,
            endY0 + textPosition / 1.5,
            endX1,
            endY1,
          );
        });
      }
    };

    const isInRect = (xas: number, yas: number, canSplice = true) => {
      for (let i = 0; i < chooseArrRef.current.length; i++) {
        const e = chooseArrRef.current[i];
        if (e.endX0 < xas && xas < e.endX1 && e.endY0 < yas && yas < e.endY1) {
          const t = {
            ...e,
            endX0,
            endY0,
            endX1,
            endY1,
            x: endX0 / scale,
            y: endY0 / scale,
          };
          if (canSplice) {
            setChooseArr(i, 'replace', t);
            return t;
          }
          return e;
        }
      }
    };

    const isDel = (xas: number, yas: number, canSplice = true) => {
      for (let i = chooseArrRef.current.length - 1; i >= 0; i--) {
        const e = chooseArrRef.current[i];
        const { endX1, endY0 } = e;
        if (endX1 - imageW < xas && xas < endX1 && endY0 < yas && yas < endY0 + imageH) {
          if (canSplice) {
            setChooseArr(i, 'delete');
            draw();
          }
          return true;
        }
      }
    };

    const mousedown = (e: { clientX: number; clientY: number }) => {
      x0 = e.clientX - canvasRect.getBoundingClientRect().left;
      y0 = e.clientY - canvasRect.getBoundingClientRect().top;
      endY1 = null;
      inRectObejct = isInRect(x0, y0, false);
      if (isDel(x0, y0)) {
        canvasRect.style.cursor = 'default';
        return;
      }
      if (inRectObejct) {
        drawFlag = false;
        canvasRect.style.cursor = 'move';
      } else {
        drawFlag = true;
      }
    };

    const mousemove = (e: { clientX: number; clientY: number }) => {
      x1 = e.clientX - canvasRect.getBoundingClientRect().left;
      y1 = e.clientY - canvasRect.getBoundingClientRect().top;
      canvasRect.style.cursor = 'crosshair';
      if (drawFlag) {
        const tx = x1 - x0;
        const ty = y1 - y0;
        if (
          // isboundary?
          !(tx < 0 && x0 - minW < 0) &&
          !(ty < 0 && y0 - minH < 0) &&
          !(tx > 0 && x0 + minW > canvasWidth) &&
          !(ty > 0 && y0 + minH > canvasHeight) &&
          tx !== 0 &&
          ty !== 0
        ) {
          draw();
          const pw = tx > 0 ? (tx > minW ? tx : minW) : Math.abs(tx) > minW ? tx : -minW;
          const ph = ty > 0 ? (ty > minH ? ty : minH) : Math.abs(ty) > minH ? ty : -minH;
          endX0 = pw > 0 ? x0 : x0 + pw;
          endY0 = ph > 0 ? y0 : y0 + ph;
          endX1 = pw < 0 ? x0 : x0 + pw;
          endY1 = ph < 0 ? y0 : y0 + ph;
          ctx.strokeRect(x0, y0, pw, ph);
          strokeTextAndImage(
            endX1 - textPosition,
            endY0 + textPosition / 4,
            endX0,
            endY0,
            chooseArrRef.current.length + 1,
            endX0 + textPosition / 2.5,
            endY0 + textPosition / 1.5,
            endX1,
            endY1,
          );
        }
      } else if (isInRect(x1, y1, false) || inRectObejct) {
        canvasRect.style.cursor = 'move'; // move
        if (isDel(x1, y1, false)) {
          canvasRect.style.cursor = 'default';
        }
        if (inRectObejct) {
          moveFlag = true;
          draw(inRectObejct);
          const w = inRectObejct.endX1 - inRectObejct.endX0;
          const h = inRectObejct.endY1 - inRectObejct.endY0;
          const tx = x1 - x0 + inRectObejct.endX0;
          const ty = y1 - y0 + inRectObejct.endY0;
          const tx1 = tx + w;
          const ty1 = ty + h;
          endX0 = tx < 0 ? 0 : tx1 > canvasWidth ? canvasWidth - w : tx;
          endY0 = ty < 0 ? 0 : ty1 > canvasHeight ? canvasHeight - h : ty;
          endX1 = tx < 0 ? w : tx1 > canvasWidth ? canvasWidth : tx1;
          endY1 = ty < 0 ? h : ty1 > canvasHeight ? canvasHeight : ty1;
          ctx.strokeRect(endX0, endY0, w, h);
          strokeTextAndImage(
            endX1 - textPosition,
            endY0 + textPosition / 4,
            endX0,
            endY0,
            inRectObejct.name,
            endX0 + textPosition / 2.5,
            endY0 + textPosition / 1.5,
            endX1,
            endY1,
          );
        }
      }
    };

    const mouseup = () => {
      if (drawFlag && endX0 >= 0 && endY0 >= 0 && endX1 && endY1) {
        const t = {
          endX0,
          endY0,
          endX1,
          endY1,
          name: chooseArrRef.current.length + 1,
          height: (endY1 - endY0) / scale,
          width: (endX1 - endX0) / scale,
          x: endX0 / scale,
          y: endY0 / scale,
        };
        setChooseArr(t, 'push');
      } else if (moveFlag) {
        isInRect(x0, y0);
      }
      inRectObejct = null;
      drawFlag = false;
      moveFlag = false;
    };
    canvasRect.onmouseleave = () => {
      canvasRect.onmousedown = null;
      canvasRect.onmousemove = null;
      canvasRect.onmouseup = null;
    };

    canvasRect.onmouseenter = () => {
      canvasRect.onmousedown = isCanStart ? mousedown : null;
      canvasRect.onmousemove = isCanStart ? mousemove : null;
      canvasRect.onmouseup = isCanStart ? mouseup : null;
    };

    return { draw, onmouseenter: canvasRect.onmouseenter };
  };
  const initCavansWidthAndHeight = () => {
    canvasWidth = realRatio > drawRatio ? cW : cH * realRatio;
    canvasHeight = realRatio > drawRatio ? cW / realRatio : cH;
    scale = canvasWidth / relImageWH.relImageW;
    preCanvasWidth = canvasWidth;
    setCavansW(canvasWidth);
    setCavansH(canvasHeight);
    setTX((cW - canvasWidth) / 2);
    setTY((cH - canvasHeight) / 2);
    canvasRect.style.transform = `translate(${(cW - canvasWidth) / 2}px,${
      (cH - canvasHeight) / 2
    }px)`;
    backgroundImg.style.transform = `translate(${(cW - canvasWidth) / 2}px,${
      (cH - canvasHeight) / 2
    }px)`;
  };
  const scaleCavans = (e: { clientX: number; clientY: number }, bigOrSmall: boolean) => {
    const sizeW = relImageWH.relImageW * (bigOrSmall ? -0.1 : 0.1);
    const sizeH = relImageWH.relImageH * (bigOrSmall ? -0.1 : 0.1);
    wheelPreRatioX = (e.clientX - canvasRect.getBoundingClientRect().left) / canvasWidth;
    wheelPreRatioY = (e.clientY - canvasRect.getBoundingClientRect().top) / canvasHeight;
    const tx = translateX + wheelPreRatioX * sizeW;
    const ty = translateY + wheelPreRatioY * sizeH;
    setTX(tx);
    setTY(ty);
    canvasRect.style.transform = ` translate(${tx}px,${ty}px) `;
    backgroundImg.style.transform = ` translate(${tx}px,${ty}px) `;
    canvasWidth = relImageWH.relImageW * scale;
    canvasHeight = relImageWH.relImageH * scale;
    const preRatio = canvasWidth / preCanvasWidth;
    chooseArrRef.current = chooseArrRef.current.map((el) => ({
      ...el,
      endX0: el.endX0 * preRatio,
      endX1: el.endX1 * preRatio,
      endY0: el.endY0 * preRatio,
      endY1: el.endY1 * preRatio,
    }));

    preCanvasWidth = canvasWidth;
    setCavansW(canvasWidth);
    setCavansH(canvasHeight);
  };

  const dragCavans = () => {
    let isDown = false;
    let tx: React.SetStateAction<number>;
    let ty: React.SetStateAction<number>;
    let stx: number;
    let sty: number;

    const dragDown = (e: { clientX: number; clientY: number }) => {
      if (keyBool) {
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        isDown = true;
        const [nx, ny] = canvasRect.style?.transform?.match(regexOfTranslate) || [0, 0];
        stx = Number(nx);
        sty = Number(ny);
      }
    };
    const dragMove = (e: { clientX: any; clientY: any }) => {
      if (keyBool && isDown) {
        tx = stx + e.clientX - dragStartX;
        ty = sty + e.clientY - dragStartY;
        canvasRect.style.transform = `translate(${tx}px,${ty}px)`;
        backgroundImg.style.transform = `translate(${tx}px,${ty}px)`;
      }
    };
    document.onkeydown = (e) => {
      if (keyBool) return;
      if (e.code === 'Space') {
        keyBool = true;
        canvasRect.style.cursor = 'move';
        canvasRect.onmousedown = dragDown;
        canvasRect.onmousemove = dragMove;
        canvasRect.onmouseup = null;
      }
    };
    document.onkeyup = () => {
      canvasRect.style.cursor = 'default';
      (startRect(canStart) as any).onmouseenter();
      keyBool = false;
      isDown = false;
      setTX(tx);
      setTY(ty);
    };
  };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const delta = (e.nativeEvent as any).wheelDelta > 0 ? 1 : -1;
    if (delta > 0) {
      if (scale <= 2) {
        scale += 0.1;
        scaleCavans(e, true);
      }
    } else if (delta < 0) {
      if (
        scale >= 0.2 &&
        canvasRect.offsetWidth >= cavansMinW &&
        canvasRect.offsetHeight >= cavansMinH
      ) {
        scale -= 0.1;
        scaleCavans(e, false);
      }
    }
  };
  const getImageSize = () => {
    tempImg.src = fileUrl;
    document.body.appendChild(tempImg);
    tempImg.onload = () => {
      const rh = tempImg.offsetHeight;
      const rw = tempImg.offsetWidth;
      setRIWH({ relImageH: rh, relImageW: rw });
      realRatio = rw / rh;
      document.body.removeChild(tempImg);
    };
  };

  useEffect(() => {
    // first
    // when fileUrl change or canvasContainerSize change
    if (fileUrl && canvasContainerSize?.containerW && canvasContainerSize?.containerH) {
      cW = canvasContainerSize.containerW; // container
      cH = canvasContainerSize.containerH;
      drawRatio = cW / cH; // drawRatio
      getImageSize();
      chooseArrRef.current = [];
    }
  }, [fileUrl, canvasContainerSize]);

  useEffect(() => {
    // second
    if (
      canvasRectRef.current &&
      backgroundImgRef.current &&
      relImageWH.relImageW &&
      relImageWH.relImageH
    ) {
      canvasRect = canvasRectRef.current;
      backgroundImg = backgroundImgRef.current;
      initCavansWidthAndHeight();
    }
  }, [canvasRectRef, backgroundImgRef, relImageWH]);

  useEffect(() => {
    // third
    // when canvasWidth  change or canStart change
    if (canvasW && canvasH) {
      // reDraw
      startRect(canStart).draw();
      dragCavans();
    }
  }, [canvasW, canvasH, canStart]);

  return (
    <div
      style={{
        width: canvasContainerSize.containerW,
        height: canvasContainerSize.containerH,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <img id="delIcon" alt="" src={delIcon} className="hidden" />
      <img
        ref={backgroundImgRef}
        className={styles.drawRect}
        alt=""
        src={fileUrl}
        width={canvasW}
        height={canvasH}
      />
      <canvas
        onWheel={(e) => {
          onWheel(e);
        }}
        ref={canvasRectRef}
        className={styles.drawRect}
        width={canvasW}
        height={canvasH}
      >
        Your browser does not support the HTML5 canvas tag.
      </canvas>
      <div className={styles.action}>
        <span
          className={classNames(
            styles.actionImgContainer,
            actionImg === 1 ? styles.actionImg : '',
          )}
        >
          <img
            title="draw"
            src={draw}
            onClick={() => {
              setCanStart(true);
              setactionImg(1);
            }}
            alt=""
          />
        </span>
        <span
          className={classNames(
            'mgl-16',
            styles.actionImgContainer,
            actionImg === 2 ? styles.actionImg : '',
          )}
        >
          <img
            title="delete all"
            src={delall}
            onClick={() => {
              chooseArrRef.current = [];
              setCanStart(false);
              setactionImg(2);
            }}
            alt=""
          />
        </span>
      </div>
    </div>
  );
};

export default DrawRect;
