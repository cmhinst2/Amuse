import { Sidebar } from "../components/Form";
import useAuthStore from "../store/authStore";

export default function Event() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  // 이벤트 더미 데이터
  const events = [
    {
      id: 1,
      title: "신규 작가 응원 프로젝트",
      period: "2026.01.01 - 2026.01.31",
      status: "진행중",
      imageColor: "from-rose-500 to-orange-400",
      description: "첫 작품을 등록하시는 모든 작가님께 웰컴 티켓 50장을 드립니다."
    },
    {
      id: 2,
      title: "AI와 함께하는 문학 밤샘",
      period: "2026.01.15 - 2026.02.15",
      status: "진행중",
      imageColor: "from-indigo-600 to-[#FB7185]",
      description: "AI 재탄생 기능을 활용해 에피소드를 작성하고 한정판 프로필 테두리를 받으세요."
    },
    {
      id: 3,
      title: "지난 겨울, 우리가 사랑한 소설",
      period: "2025.12.01 - 2025.12.31",
      status: "종료",
      imageColor: "from-slate-700 to-slate-900",
      description: "2025년 연말 결산 이벤트. 당첨자 발표가 완료되었습니다."
    }
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      {isLoggedIn && <Sidebar />}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* 헤더 영역 */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
          <h1 className="text-xl font-black text-[#FB7185] tracking-tight">이벤트</h1>
          <div className="flex gap-4 text-xs font-bold">
            <button className="text-[#FB7185] border-b-2 border-[#FB7185] pb-1">진행중</button>
            <button className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors pb-1">종료</button>
          </div>
        </header>

        {/* 이벤트 콘텐츠 영역 */}
        <section className="p-8 max-w-6xl mx-auto space-y-12">
          
          {/* 하이라이트 이벤트 (가장 큰 배너) */}
          <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden group cursor-pointer border border-[#334155]/30">
            <div className={`absolute inset-0 bg-gradient-to-r ${events[0].imageColor} opacity-80 group-hover:scale-105 transition-transform duration-700`} />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            
            <div className="relative h-full flex flex-col justify-center px-12 space-y-4">
              <span className="w-fit px-4 py-1 bg-white text-[#0f172a] text-[10px] font-black rounded-full uppercase">HOT EVENT</span>
              <h2 className="text-3xl md:text-5xl font-black leading-tight">
                {events[0].title}
              </h2>
              <p className="text-white/80 max-w-md text-sm md:text-base leading-relaxed">
                {events[0].description}
              </p>
              <p className="text-xs font-medium text-white/60 italic">{events[0].period}</p>
            </div>
          </div>

          {/* 이벤트 그리드 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.slice(1).map((event) => (
              <div 
                key={event.id}
                className="group relative rounded-[2rem] bg-[#1e293b] border border-[#334155]/30 overflow-hidden hover:border-[#FB7185]/50 transition-all shadow-xl"
              >
                {/* 상단 이미지 영역 */}
                <div className={`h-48 bg-gradient-to-br ${event.imageColor} relative overflow-hidden`}>
                   <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                   {event.status === "종료" && (
                     <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-center">
                        <span className="px-6 py-2 border-2 border-[#334155] text-[#94A3B8] font-black rounded-xl rotate-[-10deg]">FINISHED</span>
                     </div>
                   )}
                </div>

                {/* 하단 텍스트 영역 */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      event.status === "진행중" ? "bg-[#FB7185]/20 text-[#FB7185]" : "bg-[#334155] text-[#94A3B8]"
                    }`}>
                      {event.status}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] font-medium">{event.period}</span>
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-[#FB7185] transition-colors">{event.title}</h3>
                  <p className="text-sm text-[#94A3B8] line-clamp-2">{event.description}</p>
                </div>
              </div>
            ))}
          </div>

        </section>
      </main>
    </div>
  );
}