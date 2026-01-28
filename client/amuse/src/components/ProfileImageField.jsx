import { useEffect, useRef, useState } from "react";
import ProfileImageDragger from "./ProfileImageDragger";
import { Camera } from 'lucide-react';
import { getServerBaseUrl } from '../api/converter';

export default function ProfileImageField({ mainCharName, imageUrl, posY, onDataChange }) {
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
      onDataChange('profileImageUrl', file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div className="w-64 h-64 rounded-full border-[#FB7185]/50 border-4 hover:border-[#FB7185] overflow-hidden bg-[#0f172a] shadow-xl">
          <ProfileImageDragger
            imageUrl={localPreview}
            initialPosY={posY}
            onChange={onDataChange}
          />
        </div>

        <button
          type="button"
          onClick={handleEditClick}
          className="absolute bottom-5 right-5 bg-[#334155] p-2 rounded-full border border-[#FB7185] hover:bg-[#FB7185] text-[#F1F5F9] transition-colors shadow-lg z-10"
        >
          <Camera size={30} />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-[#F1F5F9]">{mainCharName} 프로필 <span className="text-[12px]">(드래그하여 위치 조정)</span></p>
        <p className="text-xs text-[#94A3B8] mt-1">채팅에 사용될 프로필 사진을 등록해주세요.</p>
      </div>
    </div>

  );
}