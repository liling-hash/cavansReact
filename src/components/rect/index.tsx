import React, { useRef, useState } from 'react';

import DrawRect from '@/components/rect/rect';
import img from '@@/screenshot.png';
const canvasContainerSize = {
  containerW: 1000,
  containerH: 1000,
  top: 100,
  left: 100,
};

function App() {
  // eslint-disable-next-line no-unused-vars
  const [fileUrl, setfileUrl] = useState<string>(img);
  const chooseArrRef = useRef<any[]>([]);
  const updateChooseArr = (value: number | any, type: any, nextValue: any) => {
    const temp = [...chooseArrRef.current];
    switch (type) {
      case 'push':
        chooseArrRef.current = [...temp, { ...value }];
        break;
      case 'replace':
        temp.splice(value, 1, { ...nextValue });
        chooseArrRef.current = temp;
        break;
      default:
        chooseArrRef.current = [
          ...temp
            .filter((_: any, index: number) => index !== value)
            .map((el: any, index: number) => ({ ...el, name: index + 1 })),
        ];
        break;
    }
  };

  return (
    <div
      style={{ marginTop: canvasContainerSize.top, marginLeft: canvasContainerSize.left }}
    >
      <DrawRect
        canvasContainerSize={canvasContainerSize}
        setChooseArr={updateChooseArr}
        chooseArrRef={chooseArrRef}
        fileUrl={fileUrl}
      />
    </div>
  );
}

export default App;
