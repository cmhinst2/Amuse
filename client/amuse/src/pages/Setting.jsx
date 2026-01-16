import React, { useState } from 'react';
import { Sidebar } from "../components/Form";
import useAuthStore from '../store/authStore';

export default function Setting() {
  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const store = useAuthStore((state) => state.userInfo);

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
          <h1 className="text-xl font-black text-[#FB7185] tracking-tight">설정</h1>
          <button className="px-5 py-2 text-sm font-bold bg-[#FB7185] text-[#0f172a] rounded-full hover:scale-105 transition-transform">
            저장하기
          </button>
        </header>

        {/* 3. 섹션 영역 */}
        <section className="p-8 max-w-4xl mx-auto space-y-10">

          {/* 프로필 설정 섹션 */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-l-4 border-[#FB7185] pl-4">프로필 설정</h3>
            <div className="bg-[#1e293b] rounded-[2rem] p-8 border border-[#334155]/30 flex flex-col md:flex-row items-center gap-8">
              <ProfileSetting />

              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-2 uppercase tracking-widest">닉네임</label>
                  <input
                    type="text"
                    placeholder="아뮤즈_작가"
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 outline-none focus:border-[#FB7185] transition-colors"
                    value={store.nickname}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-2 uppercase tracking-widest">이메일</label>
                  <input
                    type="email"
                    value="user@amuse.com"
                    disabled
                    className="w-full bg-[#0f172a]/50 border border-[#334155] rounded-xl px-4 py-3 text-[#334155] cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 앱 설정 섹션 */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-l-4 border-[#FB7185] pl-4">앱 설정</h3>
            <div className="bg-[#1e293b] rounded-[2rem] border border-[#334155]/30 divide-y divide-[#334155]/30 overflow-hidden">
              {/* 푸시 알림 토글 */}
              <div className="flex items-center justify-between p-6">
                <div>
                  <p className="font-bold">푸시 알림</p>
                  <p className="text-xs text-[#94A3B8]">관심 작품 업데이트 및 이벤트 소식을 받습니다.</p>
                </div>
                <button
                  onClick={() => setIsPushEnabled(!isPushEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isPushEnabled ? 'bg-[#FB7185]' : 'bg-[#334155]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPushEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* 테마 설정 (현재는 다크모드 고정 가정) */}
              <div className="flex items-center justify-between p-6">
                <div>
                  <p className="font-bold">테마 설정</p>
                  <p className="text-xs text-[#94A3B8]">현재 다크모드가 적용 중입니다.</p>
                </div>
                <span className="text-xs font-bold text-[#FB7185] bg-[#FB7185]/10 px-3 py-1 rounded-full">Dark Mode Only</span>
              </div>
            </div>
          </div>

          {/* 계정 관리 섹션 */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-l-4 border-[#FB7185] pl-4">계정 관리</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-6 bg-[#1e293b] border border-[#334155]/30 rounded-2xl text-left hover:border-rose-500/50 transition-colors group">
                <p className="font-bold text-rose-400 group-hover:text-rose-500">로그아웃</p>
                <p className="text-xs text-[#94A3B8]">현재 기기에서 세션을 종료합니다.</p>
              </button>
              <button className="p-6 bg-[#1e293b] border border-[#334155]/30 rounded-2xl text-left hover:border-[#334155] transition-colors">
                <p className="font-bold text-[#94A3B8]">회원 탈퇴</p>
                <p className="text-xs text-[#334155]">계정과 모든 기록을 삭제합니다.</p>
              </button>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}

export function ProfileSetting() {
  // 1. 이미지 상태 관리 (기존 이미지가 있다면 초기값으로 설정 가능)
  const profileImage = useAuthStore((state) => state.userInfo.profileImage);
  const [profileImg, setProfileImg] = useState(profileImage);

  // 2. 이미지 변경 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // 브라우저 내 임시 URL 생성
      const reader = new FileReader();

      reader.onloadend = () => {
        setProfileImg(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="relative group">
        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#FB7185] to-[#334155] p-[3px]">
          <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center text-3xl font-black overflow-hidden">
            {/* 3. 상태(profileImage)에 따라 미리보기 렌더링 */}
            {profileImg ? (
              <img
                src={profileImg}
                alt="Preview"
                className="w-full h-full object-cover animate-fadeIn"
              />
            ) : (
              <span className="text-[#FB7185]">A</span>
            )}
          </div>
        </div>

        {/* 4. label의 htmlFor와 input의 id를 연결하여 버튼 클릭 시 파일창 열기 */}
        <label
          htmlFor="profile-upload"
          className="absolute bottom-0 right-0 w-10 h-10 bg-[#334155] border-2 border-[#0f172a] rounded-full flex items-center justify-center hover:bg-[#FB7185] transition-colors cursor-pointer shadow-lg group-hover:scale-110"
        >
          <span className="text-sm text-white">📷</span>
        </label>
        <input
          id="profile-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
        />
      </div>

      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium text-[#F1F5F9]">이미지 변경</p>
        <p className="text-xs text-[#94A3B8]">권장 사이즈: 512x512px (JPG, PNG)</p>
      </div>
    </>
  );
}