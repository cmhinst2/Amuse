import { Sidebar } from "../components/Form";

export default function Home() {

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
          <div className="flex items-center gap-8 overflow-hidden flex-1">
            <h1 className="text-xl font-black text-[#FB7185] tracking-tight shrink-0">
              이번주 작가
            </h1>

            {/* 무한 흐르는 작가 캐러셀 영역 */}
            <div className="relative flex overflow-hidden max-w-3xl group">
              <div className="flex animate-scroll whitespace-nowrap gap-4 py-1">
                {/* 작가 리스트 (두 번 반복하여 끊김 없는 루프 구현) */}
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    {["아뮤즈작가", "로맨스장인", "판타지군주", "별밤직조공", "스토리텔러"].map((writer, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e293b] border border-[#334155] hover:border-[#FB7185]/50 transition-colors cursor-pointer"
                      >
                        <span className="text-[#FB7185] text-[10px]">✍</span>
                        <span className="text-xs font-bold text-[#F1F5F9]">{writer}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* 좌우 그라데이션 마스크 (부드럽게 사라지는 효과) */}
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0f172a] to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0f172a] to-transparent z-10" />
            </div>
          </div>
        </header>

        <section className="p-8 space-y-12">
          <article className="relative h-80 overflow-hidden rounded-[2rem] border border-[#334155]/30 group">
            {/* 배경 그라데이션 레이어 */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e293b]" />

            {/* 로즈 포인트 빛 효과 (Radial Gradient) */}
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#FB7185]/30 blur-[120px] rounded-full group-hover:bg-[#FB7185]/50 group-hover:blur-[80px] transition-all duration-700 mix-blend-screen" />

            {/* 콘텐츠 영역 */}
            <div className="relative z-5 flex flex-col justify-center h-full px-12 space-y-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FB7185] rounded-full animate-pulse" />
                <span className="text-xs font-bold tracking-[0.2em] text-[#FB7185] uppercase">
                  Editor's Pick
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-black text-[#F1F5F9] leading-tight">
                  심연의 독자가 <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F1F5F9] to-[#94A3B8]">
                    깨어날 때
                  </span>
                </h2>
                <p className="text-[#94A3B8] text-lg max-w-lg leading-relaxed">
                  기억을 잃은 작가, 그리고 그가 쓴 소설대로 <br />
                  흘러가는 기이한 현실 속으로 여러분을 초대합니다.
                </p>
              </div>

              <button className="w-fit px-8 py-3 bg-[#F1F5F9] text-[#0f172a] font-bold rounded-xl hover:bg-[#FB7185] hover:text-[#F1F5F9] transition-all duration-300">
                지금 바로 읽기
              </button>
            </div>

            {/* 장식용 요소 (오른쪽 하단 아이콘 느낌) */}
            <div className="absolute bottom-8 right-12 opacity-20 group-hover:opacity-40 transition-opacity">
              <div className="text-8xl font-serif italic text-[#FB7185]">"</div>
            </div>
          </article>
          {/* ----------------------------------- */}

          {/* 소설 리스트 섹션 */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold border-l-4 border-[#FB7185] pl-4">인기 급상승</h3>
              <button className="text-sm text-[#94A3B8] hover:text-[#FB7185]">전체보기 &gt;</button>
            </div>

            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-[3/4] rounded-2xl bg-[#1e293b] mb-4 overflow-hidden border border-[#1e293b] transition-all duration-500 group-hover:border-[#FB7185]/40 group-hover:-translate-y-3">
                    <div className="w-full h-full bg-gradient-to-t from-[#0f172a]/80 to-transparent flex items-end p-4">
                      <span className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase">Premium</span>
                    </div>
                  </div>
                  <h4 className="font-bold text-[#F1F5F9] mb-1 line-clamp-1 group-hover:text-[#FB7185] transition-colors">
                    Amuse 오리지널 소설 {i}
                  </h4>
                  <p className="text-sm text-[#94A3B8]">작가 아뮤즈</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )

}

