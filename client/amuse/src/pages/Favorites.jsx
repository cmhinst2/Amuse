import React from 'react';
import { Sidebar } from "../components/Form";

export default function Favorites() {
  // 관심 목록 더미 데이터
  const favoriteNovels = [
    { id: 1, title: '심연의 독자가 깨어날 때', author: '아뮤즈작가', rating: 4.9, genre: '판타지', isNew: true },
    { id: 2, title: '로맨스 장인의 비밀 레시피', author: '달콤필력', rating: 4.8, genre: '로맨스', isNew: false },
    { id: 3, title: '별밤직조공의 은하수', author: '별밤지기', rating: 5.0, genre: 'SF', isNew: false },
    { id: 4, title: '판타지 군주의 귀환', author: '군주님', rating: 4.7, genre: '판타지', isNew: true },
    { id: 5, title: '스토리텔러의 마지막 장', author: '작가A', rating: 4.6, genre: '현대극', isNew: false },
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      {/* 1. 사이드바 유지 */}
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* 2. 헤더 영역 (일관된 디자인) */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-[#FB7185] tracking-tight">관심 목록</h1>
            <span className="px-2 py-0.5 bg-[#1e293b] text-[#94A3B8] text-[10px] font-bold rounded-md border border-[#334155]">
              {favoriteNovels.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
            <button className="hover:text-[#FB7185] transition-colors">최신순</button>
            <span className="text-[#334155]">|</span>
            <button className="hover:text-[#FB7185] transition-colors">업데이트순</button>
          </div>
        </header>

        {/* 3. 섹션 영역 */}
        <section className="p-8 space-y-8">
          {/* 상단 안내 배너 */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-r from-[#1e293b] to-transparent border border-[#334155]/30 flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-[#FB7185]/20 flex items-center justify-center text-xl">❤️</div>
             <div>
                <p className="font-bold">좋아하는 작품의 업데이트 소식을 놓치지 마세요!</p>
                <p className="text-sm text-[#94A3B8]">관심 등록한 작품은 연재 시 푸시 알림을 보내드립니다.</p>
             </div>
          </div>

          {/* 작품 그리드 리스트 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {favoriteNovels.map((novel) => (
              <div key={novel.id} className="group cursor-pointer">
                {/* 작품 커버 이미지 영역 */}
                <div className="relative aspect-[3/4] rounded-2xl bg-[#1e293b] mb-4 overflow-hidden border border-[#1e293b] transition-all duration-500 group-hover:border-[#FB7185]/40 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                  {/* 이미지 플레이스홀더 (실제 서비스 시 img 태그 사용) */}
                  <div className="w-full h-full bg-gradient-to-b from-transparent to-[#0f172a]/90 flex flex-col justify-end p-4">
                    <span className="text-[10px] font-bold text-[#FB7185] mb-1">{novel.genre}</span>
                    <div className="flex items-center gap-1 text-[10px] text-yellow-400">
                      <span>★</span>
                      <span className="text-[#F1F5F9]">{novel.rating}</span>
                    </div>
                  </div>

                  {/* 신규 에피소드 뱃지 */}
                  {novel.isNew && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-[#FB7185] text-[#0f172a] text-[10px] font-black rounded-lg shadow-lg">
                      UP
                    </div>
                  )}

                  {/* 하트 아이콘 (관심 해제 버튼) */}
                  <button className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-xs hover:bg-[#FB7185] transition-colors">
                    ❤️
                  </button>
                </div>

                {/* 작품 정보 */}
                <div className="space-y-1">
                  <h4 className="font-bold text-[#F1F5F9] line-clamp-1 group-hover:text-[#FB7185] transition-colors">
                    {novel.title}
                  </h4>
                  <p className="text-xs text-[#94A3B8]">{novel.author}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 목록이 비어있을 경우 예시 */}
          {favoriteNovels.length === 0 && (
            <div className="py-40 flex flex-col items-center justify-center text-[#334155] space-y-4">
              <div className="text-6xl">empty</div>
              <p className="text-[#94A3B8]">아직 관심 등록한 작품이 없습니다.</p>
              <button className="px-6 py-2 bg-[#1e293b] text-[#F1F5F9] rounded-xl hover:bg-[#FB7185] transition-colors">
                작품 보러가기
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}