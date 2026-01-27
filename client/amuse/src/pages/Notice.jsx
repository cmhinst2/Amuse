import React, { useState } from 'react';
import { Sidebar } from "../components/Form";
import useAuthStore from '../store/authStore';

export default function Notice() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [expandedId, setExpandedId] = useState(null); // 아코디언 형식 상태값
  // 공지사항 더미 데이터
  const [notices] = useState([
    {
      id: 1,
      tag: "공지",
      title: "Amuse 서비스 점검 안내 (1월 20일)",
      date: "2026.01.16",
      isImportant: true,
      content: "안정적인 서비스 제공을 위해 서버 점검이 진행될 예정입니다. 점검 시간 동안은 서비스 이용이 제한되오니 양해 부탁드립니다."
    },
    {
      id: 2,
      tag: "이벤트",
      title: "신년 맞이 티켓 증정 이벤트 당첨자 발표",
      date: "2026.01.14",
      isImportant: false,
      content: "이벤트에 참여해주신 모든 작가님들께 감사드립니다. 당첨되신 분들께는 개별 티켓이 지급되었습니다."
    },
    {
      id: 3,
      tag: "업데이트",
      title: "스튜디오 AI 재탄생 기능 고도화 업데이트 완료",
      date: "2026.01.10",
      isImportant: false,
      content: "작가님들의 피드백을 반영하여 AI 문학적 재탄생 로직이 더욱 정교해졌습니다. 지금 확인해보세요!"
    }
  ]);

  const toggleNotice = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">

      {isLoggedIn && <Sidebar />}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* 헤더 영역 */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">

          <h1 className="text-xl font-black text-[#FB7185] tracking-tight">공지사항</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="공지 검색"
                className="bg-[#1e293b] text-xs px-4 py-2 rounded-full border border-[#334155] focus:outline-none focus:border-[#FB7185] transition-all"
              />
            </div>
          </div>
        </header>

        {/* 공지사항 목록 섹션 */}
        <section className="p-8 max-w-5xl mx-auto space-y-4">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`group border border-[#334155]/30 rounded-[1.5rem] transition-all duration-300 overflow-hidden ${expandedId === notice.id ? 'bg-[#1e293b]' : 'bg-[#1e293b]/50 hover:bg-[#1e293b]'
                }`}
            >
              {/* 공지 제목 줄 */}
              <button
                onClick={() => toggleNotice(notice.id)}
                className="w-full px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${notice.isImportant ? 'bg-[#FB7185] text-[#0f172a]' : 'bg-[#334155] text-[#94A3B8]'
                    }`}>
                    {notice.tag}
                  </span>
                  <h3 className={`font-bold transition-colors ${expandedId === notice.id ? 'text-[#FB7185]' : 'text-[#F1F5F9] group-hover:text-[#FB7185]'
                    }`}>
                    {notice.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6">
                  <span className="text-xs text-[#94A3B8] font-medium">{notice.date}</span>
                  <span className={`transform transition-transform duration-300 ${expandedId === notice.id ? 'rotate-180 text-[#FB7185]' : 'text-[#334155]'}`}>
                    ▼
                  </span>
                </div>
              </button>

              {/* 공지 상세 내용 (아코디언) */}
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedId === notice.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-8 pb-8 pt-2 text-[#94A3B8] leading-relaxed text-sm border-t border-[#334155]/20 mt-2">
                  <div className="bg-[#0f172a]/50 p-6 rounded-2xl">
                    {notice.content}
                    <div className="mt-6 flex justify-end">
                      <p className="text-[10px] text-[#334155] font-bold">Amuse Operations Team</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 더 보기 버튼 또는 페이지네이션 */}
          <div className="flex justify-center pt-8">
            <button className="px-8 py-3 text-sm font-bold text-[#94A3B8] hover:text-[#FB7185] transition-colors border border-[#334155] rounded-xl hover:border-[#FB7185]/50">
              이전 공지 더보기
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}