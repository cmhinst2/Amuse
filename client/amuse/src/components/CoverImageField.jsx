import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import CoverImageDragger from './CoverImageDragger';

export const CoverImageField = ({ imageUrl, posY, onDataChange }) => {
  // 사용자가 직접 업로드한 파일의 로컬 미리보기 URL만 상태로 관리
  const [localPreview, setLocalPreview] = useState(null);
  const fileInputRef = useRef(null);

  const displayImageUrl = localPreview || imageUrl;

  // 이미지 
  const handleEditClick = (e) => {
    e.stopPropagation(); // 드래그 이벤트와 겹치지 않게 방지
    fileInputRef.current?.click();
  };

  // 커버 이미지 변경 핸들러
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // 2. 브라우저 메모리에 임시 URL 생성 (FileReader보다 빠르고 가볍습니다)
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);

      // 3. 부모에게는 실제 파일 객체를 전달 (나중에 Mutation에서 보낼 용도)
      onDataChange('coverImageUrl', file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-[#94A3B8]">커버 이미지</label>
        {localPreview && (
          <span className="text-xs text-[#FB7185] animate-pulse">새 이미지 적용 중...</span>
        )}
      </div>

      <div className="relative group w-full aspect-[3/4] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-[#334155]">
        {/* 1. 순수 드래그 컴포넌트 (이미지만 꽉 차게) */}
        <CoverImageDragger
          imageUrl={displayImageUrl}
          initialPosY={posY}
          onChange={onDataChange}
          isOnlyImage={true} // 이미지만 렌더링하도록 프롭 추가 (선택사항)
        />

        {/* 2. 사진 변경 버튼 - 이제 이미지 우측 하단에 정확히 위치함 */}
        <button
          type="button"
          onClick={handleEditClick}
          className="absolute bottom-4 right-4 z-10 p-3 bg-[#FB7185] text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
          title="사진 변경"
        >
          <Camera size={20} />
        </button>

        {/* 3. 숨겨진 인풋 */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      <p className='text-sm font-semibold text-[#FB7185]'>3:4 비율의 이미지를 추천해요</p>
    </div>

  );
};