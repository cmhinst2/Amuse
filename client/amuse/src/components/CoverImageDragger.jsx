import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';

const CoverImageDragger = ({ imageUrl, initialPosY, onChange }) => {
  const [posY, setPosY] = useState(initialPosY); // 0~100 사이의 퍼센트 상태
  const nodeRef = useRef(null);

  useEffect(() => {
    setPosY(initialPosY);
  }, [initialPosY]);

  // 드래그 핸들러
  const handleDrag = (e, data) => {
    const containerHeight = nodeRef.current?.offsetHeight || 300;
    const sensitivity = 2; // 감도
    let newPosY = posY - (data.deltaY / containerHeight) * 100 * sensitivity;
    newPosY = Math.max(0, Math.min(100, newPosY));
    setPosY(newPosY);
  };

  // 드래그 종료 핸들러
  const handleStop = () => {
    if (onChange) {
      onChange('coverImagePosY', Math.round(posY));
    }
  }


  return (
    <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-900 rounded-xl group">
      <img
        src={imageUrl}
        alt="Cover"
        className="w-full h-full object-cover pointer-events-none select-none"
        style={{ objectPosition: `center ${posY}%` }}
      />

      <Draggable
        nodeRef={nodeRef}
        axis="y"
        onDrag={handleDrag}
        onStop={handleStop}
        position={{ x: 0, y: 0 }}
      >
        <div
          ref={nodeRef}
          className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
          style={{
            touchAction: 'none', // 모바일 스크롤 방지
            userSelect: 'none',  // 텍스트 선택 방지
            WebkitUserDrag: 'none' // 사파리 등 이미지 드래그 방지
          }}
        >
        </div>
      </Draggable>
    </div>
  );
};

export default CoverImageDragger;