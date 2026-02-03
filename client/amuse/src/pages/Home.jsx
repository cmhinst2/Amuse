import { useState } from "react";
import { Sidebar } from "../components/Form";
import { useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { LoadingScreen } from "../components/Spinner";
import amuseAPI from "../api/amuseAPI";
import useAuthStore from "../store/authStore";
import { NovelActionModal, NovelListComponent } from "./Libaray";
import banner from "../assets/이벤트배너5.png";

export default function Home() {
  const navigate = useNavigate();
  
  // store
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  // states
  const [order, setOrder] = useState('likes'); // lastest, likes, views
  const [page, setPage] = useState(0);
  const [selectedNovel, setSelectedNovel] = useState(null);

  // data fetch
  const { data: novelList = [], status, fetchStatus, isNovelListLoading } = useQuery({
    queryKey: ['novelList', order, page],
    queryFn: () => amuseAPI.get('api/novel/list', { params: { order, page, size: 10 } })
      .then(res => res.data),
    staleTime: 1000 * 60 * 5,
  });

  const novels = novelList?.content || [];

  // handlers
  // 소설 표지 클릭 핸들러
  const handleClickNovel = (novel) => {
    if (!isLoggedIn) { // 로그인 안되어있을 때 
      toast("로그인이 필요한 서비스입니다.", {
        description: "로그인 페이지로 이동하시겠습니까?",
        duration: Infinity, // 신중한 결정을 위해 자동으로 닫히지 않음
        action: {
          label: "로그인",
          onClick: () => {
            navigate("/login");
          },
        },
        cancel: {
          label: "취소",
          onClick: () => console.log("취소"),
        },
        style: {
          background: '#1e293b',
          color: '#F1F5F9',
          border: '1px solid #334155',
          minWidth: '400px',
          fontSize: '15px',
        },
        actionButtonStyle: {
          backgroundColor: '#4f46e5',
          color: '#F1F5F9',
          fontWeight: 'bold',
        },
      });
      return;
    }

    // 로그인 되었을 때
    setSelectedNovel(novel);
  }

  if (fetchStatus === 'fetching' && status === 'pending' || isNovelListLoading) {
    return <LoadingScreen text="Amuse 접속 중" />;
  }



  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
          <div className="flex items-center gap-8 overflow-hidden flex-1">
            <h1 className="text-xl font-black text-[#FB7185] tracking-tight shrink-0">
              이번주 작가
            </h1>

            <div className="relative flex overflow-hidden max-w-3xl group">
              <div className="flex animate-scroll whitespace-nowrap gap-4 py-1">
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
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0f172a] to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0f172a] to-transparent z-10" />
            </div>
          </div>
        </header>

        <section className="p-8 space-y-12">
          <article className="relative h-80 overflow-hidden rounded-[2rem] border border-[#334155]/30 group">
            <img
              src={banner} 
              alt="Banner Background"
              className="absolute inset-0 w-full h-full object-cover object-[center_28%]
              transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/80 to-transparent z-1" />

            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#FB7185]/20 blur-[120px] rounded-full group-hover:bg-[#FB7185]/30 transition-all duration-700 mix-blend-screen z-2" />

            <div className="relative z-10 flex flex-col justify-center h-full px-12 space-y-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FB7185] rounded-full animate-pulse" />
                <span className="text-xs font-bold tracking-[0.2em] text-[#FB7185] uppercase">
                  ON My Muse
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-black text-[#F1F5F9] leading-tight">
                  내 최애 소설 속 캐릭터를<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F1F5F9] to-[#94A3B8]">
                    나의 Muse로 만들어보세요
                  </span>
                </h2>
                <p className="text-[#94A3B8] text-lg max-w-lg leading-relaxed">
                  도서관에 공개된 Muse On 모드의 소설에서 <br />
                  내 최애 캐릭터와 이야기를 나누거나 새로운 전개를 펼쳐보세요
                </p>
              </div>

              <button onClick={() => navigate('/library')} className="w-fit px-8 py-3 bg-[#F1F5F9] text-[#0f172a] font-bold rounded-xl hover:bg-[#FB7185] hover:text-[#F1F5F9] transition-all duration-300 shadow-lg shadow-black/20">
                지금 바로 Deep Dive
              </button>
            </div>

            <div className="absolute bottom-8 right-12 opacity-20 group-hover:opacity-40 transition-opacity z-10">
              <div className="text-8xl font-serif italic text-[#FB7185]">"</div>
            </div>
          </article>

          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold border-l-4 border-[#FB7185] pl-4">인기 급상승</h3>
              <button className="text-sm text-[#94A3B8] hover:text-[#FB7185]">전체보기 &gt;</button>
            </div>

            <NovelListComponent novels={novels} handler={handleClickNovel} />
            {selectedNovel && (
              <NovelActionModal novel={selectedNovel} onClose={() => setSelectedNovel(null)} />
            )}
          </div>
        </section>
      </main>
    </div>
  )

}

