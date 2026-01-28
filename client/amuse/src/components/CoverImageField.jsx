import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import CoverImageDragger from './CoverImageDragger';
import { getServerBaseUrl } from '../api/converter';

export const CoverImageField = ({ imageUrl, posY, onDataChange }) => {
  // 사용자가 직접 업로드한 파일의 로컬 미리보기 URL만 상태로 관리
  const [localPreview, setLocalPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!imageUrl) return;

    if (imageUrl instanceof File) {
      const objectUrl = URL.createObjectURL(imageUrl);
      setLocalPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setLocalPreview(getServerBaseUrl(imageUrl));
    }
  }, [imageUrl]); // imageUrl이 바뀔 때마다 실행


  const handleEditClick = (e) => {
    e.stopPropagation(); // 드래그 이벤트와 겹치지 않게 방지
    fileInputRef.current?.click();
  };

  // 커버 이미지 변경 핸들러
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
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

      <div className="relative group w-full aspect-[3/4] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-[#334155] hover:border-[#FB7185]">
        <CoverImageDragger
          imageUrl={localPreview}
          initialPosY={posY}
          onChange={onDataChange}
        />
        <button
          type="button"
          onClick={handleEditClick}
          className="absolute bottom-4 right-4 z-20 p-3 bg-[#FB7185] text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
          title="사진 변경"
        >
          <Camera size={20} />
        </button>

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