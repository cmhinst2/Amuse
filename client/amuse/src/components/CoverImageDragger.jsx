import React, { useState, useRef, useEffect } from 'react';
import { Move } from 'lucide-react';

const CoverImageDragger = ({ imageUrl, initialPosY = 50, onChange }) => {
  const [posY, setPosY] = useState(initialPosY);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startPosY, setStartPosY] = useState(0);
  const containerRef = useRef(null);

  // 외부에서 이미지가 바뀌거나 초기값이 바뀔 때 동기화
  useEffect(() => {
    setPosY(initialPosY);
  }, [initialPosY, imageUrl]);

  // 마우스 드래그 할 때 mousedown 이벤트 핸들러
  const handleMouseDown = (e) => {
    e.preventDefault(); // 브라우저 기본 드래그 이벤트 막기(이미지 복사되는 현상)
    setIsDragging(true);
    setStartY(e.clientY);
    setStartPosY(posY);
  };

  // 마우스 드래그 시 mousemove 이벤트 핸들러
  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const deltaY = e.clientY - startY;
    const containerHeight = containerRef.current.offsetHeight;
    const movementScale = 2; 
    let newPosY = startPosY - (deltaY / containerHeight) * 100 * movementScale;
    newPosY = Math.max(0, Math.min(100, newPosY));
    setPosY(Math.round(newPosY));
  };

  // 마우스 드래그 시 mouseup 이벤트 핸들러
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      console.log("posY ::" , posY) // 고쳐야함
      onChange('coverImagePosY', Math.round(posY));
    }
  };

  // 마우스가 컨테이너 밖으로 나가도 드래그가 멈추도록 설정
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#0f172a] border-2 
          ${isDragging ? 'border-[#FB7185] cursor-ns-resize' : 'border-[#334155] cursor-move'} 
          group transition-colors duration-300`}
      >
        <img 
          src={imageUrl} 
          alt="Cover"
          draggable={false} // 브라우저 기본 드래그 방지
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{ objectPosition: `center ${posY}%` }}
        />

        {/* 안내 레이어 */}
        {!isDragging && (
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="bg-[#1e293b]/80 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
              <Move className="text-white" size={24} />
            </div>
          </div>
        )}

        {/* 가이드 라인 (드래그 시에만 표시) */}
        {isDragging && (
          <div className="absolute inset-0 pointer-events-none border-y border-white/20 flex items-center">
            <div className="w-full h-[1px] bg-white/20"></div>
          </div>
        )}
      </div>
  );
};

export default CoverImageDragger;