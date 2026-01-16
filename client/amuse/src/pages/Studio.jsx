import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Form";

export default function Studio() {
  const navigate = useNavigate();

  // 더미 데이터
  const myNovels = [
    { id: 1, title: '심연의 독자가 깨어날 때', status: '연재중', updates: '24화', likes: 1240 },
    { id: 2, title: 'Amuse와 함께하는 리액트', status: '완결', updates: '50화', likes: 890 },
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      {/* 1. 사이드바 (공통 유지) */}
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* 2. 헤더 영역 (Home 구조와 동일하게 유지) */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
          <div className="flex items-center gap-8 overflow-hidden flex-1">
            <h1 className="text-xl font-black text-[#FB7185] tracking-tight shrink-0">
              내 스튜디오
            </h1>

            {/* 작가 활동 통계 캐러셀 (Home의 작가 캐러셀 구조 재활용) */}
            <div className="relative flex overflow-hidden max-w-3xl group">
              <div className="flex animate-scroll whitespace-nowrap gap-4 py-1">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    {[
                      { label: "누적 조회수", value: "12.8k" },
                      { label: "총 좋아요", value: "2,130" },
                      { label: "신규 구독", value: "+12" },
                      { label: "댓글 알림", value: "5건" }
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e293b] border border-[#334155] hover:border-[#FB7185]/50 transition-colors"
                      >
                        <span className="text-[#FB7185] text-[10px]">📊</span>
                        <span className="text-xs font-bold text-[#94A3B8]">{stat.label}:</span>
                        <span className="text-xs font-bold text-[#F1F5F9]">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0f172a] to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0f172a] to-transparent z-10" />
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={() => navigate('/studio/write')}
              className="px-5 py-2 text-sm font-bold transition-all rounded-full bg-[#FB7185] text-[#0f172a] hover:scale-105 shadow-[0_0_15px_rgba(251,113,133,0.2)]"
            >
              새 작품 집필 +
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FB7185] to-[#334155] p-[2px]">
              <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center font-bold text-[#FB7185]">
                W
              </div>
            </div>
          </div>
        </header>

        {/* 3. 섹션 영역 */}
        <section className="p-8 space-y-12">
          {/* 배너: Home의 Editor's Pick 구조 재활용 */}
          <article className="relative h-64 overflow-hidden rounded-[2rem] border border-[#334155]/30 group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e293b]" />
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#FB7185]/20 blur-[100px] rounded-full group-hover:bg-[#FB7185]/30 transition-all duration-700 mix-blend-screen" />

            <div className="relative z-10 flex flex-col justify-center h-full px-12 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold tracking-[0.2em] text-emerald-400 uppercase">
                  Writing Status
                </span>
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-[#F1F5F9]">
                  오늘도 당신의 <span className="text-[#FB7185]">이야기</span>를 <br />
                  기다리는 독자들이 있습니다.
                </h2>
                <p className="text-[#94A3B8] max-w-lg leading-relaxed text-sm">
                  최근 업데이트 이후 '심연의 독자' 작품의 조회수가 15% 상승했습니다.
                </p>
              </div>
            </div>
          </article>

          {/* 작품 리스트 (Home의 그리드 구조 변형) */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold border-l-4 border-[#FB7185] pl-4">내 연재 목록</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {myNovels.map((novel) => (
                <div onClick={() => navigate('/studio/write')}
                  key={novel.id} 
                  className="flex cursor-pointer items-center justify-between p-6 bg-[#1e293b] rounded-[2rem] border border-[#1e293b] hover:border-[#FB7185]/40 transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-20 bg-[#0f172a] rounded-xl border border-[#334155] flex items-center justify-center overflow-hidden">
                      <div className="text-xl font-serif italic text-[#FB7185]/30 group-hover:text-[#FB7185]/60 transition-colors">A</div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#F1F5F9] group-hover:text-[#FB7185] transition-colors">{novel.title}</h4>
                      <div className="flex gap-3 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#334155] text-[#94A3B8] font-bold uppercase tracking-wider">{novel.status}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0f172a] text-[#94A3B8] font-bold">{novel.updates}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="hidden md:block text-right">
                      <p className="text-xs text-[#94A3B8] uppercase font-bold tracking-tighter">Likes</p>
                      <p className="text-lg font-black text-[#F1F5F9]">{novel.likes.toLocaleString()}</p>
                    </div>
                    <button className="px-6 py-2 text-sm font-bold bg-[#334155] text-[#F1F5F9] rounded-xl hover:bg-[#F1F5F9] hover:text-[#0f172a] transition-all">
                      작품 관리
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}