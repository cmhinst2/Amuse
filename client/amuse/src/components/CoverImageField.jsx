import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import CoverImageDragger from './CoverImageDragger';
import { getServerBaseUrl } from '../api/converter';

export const CoverImageField = ({ imageUrl, posY, onDataChange }) => {
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
  }, [imageUrl]);


  const handleEditClick = (e) => {
    e.stopPropagation();
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
        <label className="text-sm font-semibold text-[#94A3B8]">커버 이미지 <span className="text-[12px]">(드래그하여 위치 조정)</span></label>
      </div>

      <div className="relative group w-full aspect-[3/4] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-[#334155] border-4 hover:border-[#FB7185]">
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