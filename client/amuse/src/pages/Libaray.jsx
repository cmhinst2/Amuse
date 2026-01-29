import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Form";
import useAuthStore from "../store/authStore";
import { toast } from 'sonner';
import { useQuery } from "@tanstack/react-query";
import novelAPI from "../api/novelAPI";
import { useState } from "react";
import { LoadingScreen } from "../components/Spinner";
import { formatCount, getServerBaseUrl } from "../api/converter";
import { Eye, Heart } from "lucide-react";

export function Library() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [order, setOrder] = useState('lastest'); // lastest, likes, views
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const { data: novelList = [], isLoading, isError, status, fetchStatus, isNovelListLoading } = useQuery({
    queryKey: ['novelList', order, page],
    queryFn: () => novelAPI.get('api/novel/list', { params: { order, page, size: 10 } })
      .then(res => res.data),
    staleTime: 1000 * 60 * 5,
  });

  const novels = novelList?.content || []; // 안전하게 배열 추출

  // 소설 표지 클릭 핸들러
  const handleClickNovel = () => {
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
  }

  if (fetchStatus === 'fetching' && status === 'pending' || isNovelListLoading) {
    return <LoadingScreen text="Amuse 접속 중" />;
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      {isLoggedIn && <Sidebar />}

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* 정렬 헤더 */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
          <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
            <button onClick={() => setOrder("lastest")} className={`${order == 'lastest' && 'text-[#FB7185] font-bold'} hover:text-[#FB7185] transition-colors`}>최신순</button>
            <span className="text-[#334155]">|</span>
            <button onClick={() => setOrder("likes")} className={`${order == 'likes' && 'text-[#FB7185] font-bold'} hover:text-[#FB7185] transition-colors`}>인기순</button>
            <span className="text-[#334155]">|</span>
            <button onClick={() => setOrder("views")} className={`${order == 'views' && 'text-[#FB7185] font-bold'} hover:text-[#FB7185] transition-colors`}>조회순</button>
          </div>
        </header>

        <section className="p-8 space-y-8">
          {/* 배너 */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-r from-[#1e293b] to-transparent border border-[#334155]/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FB7185]/20 flex items-center justify-center text-xl">❤️</div>
            <div>
              <p className="font-bold">신규 소식을 놓치지 마세요!</p>
              <p className="text-sm text-[#94A3B8]">관심 등록한 작품은 연재 시 푸시 알림을 보내드립니다.</p>
            </div>
          </div>

          {/* 작품 리스트 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {novels.map((novel, index) => (
              <div
                key={`${novel.id}_${index}`}
                className="group relative flex flex-col transition-all duration-300"
              >
                <div onClick={() => navigate(`/studio/write/${novel.id}`)}
                  className="cursor-pointer relative z-10 w-full aspect-[3/4] rounded-r-lg overflow-hidden shadow-[10px_10px_20px_rgba(0,0,0,0.5)] group-hover:-translate-y-2 transition-all duration-300">
                  {novel.coverImageUrl ? (
                    <img
                      src={getServerBaseUrl(novel.coverImageUrl)}
                      alt={novel.title}
                      className="w-full h-full object-cover object-top"
                      style={{ objectPosition: `center ${novel.coverImagePosY}%` }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1e293b] flex items-center justify-center border border-[#334155]">
                      <span className="text-[#FB7185]/20 font-serif italic text-2xl">Amuse</span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent p-4 flex flex-col justify-end translate-y-full translate-y-0">
                    <h1 className="text-xl text-[#F1F5F9] font-bold mb-1">{novel.mainCharName}</h1>
                    <p className="text-[#F1F5F9] text-[13px] leading-snug line-clamp-3 mb-1 font-medium">
                      {novel.description || "Amuse의 신작 소설을 즐기세요."}
                    </p>
                    <div className="h-[2px] w-6 bg-[#FB7185] rounded-full mt-1 mb-2" />
                  </div>

                  <div className="absolute top-3 left-3 right-3 z-30 flex justify-between">
                    <span className={`text-[12px] px-2 py-0.5 rounded-md font-bold backdrop-blur-md
                      ${novel.affinityModeEnabled ? 'bg-[#FB7185] text-white' : 'bg-slate-700/80 text-slate-200'}`}>
                      Chat {novel.affinityModeEnabled ? 'ON' : 'OFF'}
                    </span>
                    <span className="flex gap-4">
                      <div className="flex items-center gap-1">
                        <Heart size={15} />
                        <span className="text-sm font-medium text-[#F1F5F9]">{formatCount(novel.likeCount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye size={15} />
                        <span className="text-sm font-medium text-[#F1F5F9]">{formatCount(novel.viewCount)}</span>
                      </div>
                    </span>
                  </div>
                </div>

                <div div className="mt-4 px-1" >
                  <div className="flex flex-col">
                    <section onClick={() => navigate(`/studio/write/${novel.id}`)} className="flex items-center justify-between mb-4 cursor-pointer ">
                      <h4 className="text-xl font-bold text-[#F1F5F9] group-hover:text-[#FB7185] transition-colors line-clamp-1">
                        {novel.title}
                      </h4>
                      <span className={`text-[13px] font-medium px-2 py-0.5 rounded border ${novel.status == 'PROCESS'
                        ? 'text-[#2DD4BF] border-[#2DD4BF]/30 bg-[#10B981]/5'
                        : 'text-[#94A3B8] border-[#334155]'
                        }`}>
                        {novel.status === 'PROCESS' ? '연재 중' : '완결'}
                      </span>
                    </section>
                    <section className="flex gap-2 mb-2">
                      {novel.tags.map((tag, idx) => (
                        <span className="text-[13px] px-2 rounded-lg text-[#F1F5F9] bg-[#4f46e5]" key={`${tag}_${idx}`}>#{tag}</span>
                      ))}
                    </section>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section >
      </main >
    </div >
  )
}