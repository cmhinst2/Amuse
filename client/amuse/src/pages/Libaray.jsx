import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Form";
import { toast } from 'sonner';
import { useQuery } from "@tanstack/react-query";
import amuseAPI from "../api/amuseAPI";
import { useEffect, useState } from "react";
import { LoadingScreen } from "../components/Spinner";
import { formatCount, getJosa, getServerBaseUrl } from "../api/util";
import { BookOpen, Eye, Heart, MessageCircle, X } from "lucide-react";
import useAuthStore from "../store/authStore";

export function Library() {
  // store
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  // states
  const [order, setOrder] = useState('lastest'); // lastest, likes, views
  const [page, setPage] = useState(0);
  const [selectedNovel, setSelectedNovel] = useState(null);

  const navigate = useNavigate();

  // data fetch
  const { data: novelList = [], status, fetchStatus, isNovelListLoading } = useQuery({
    queryKey: ['novelList', order, page],
    queryFn: () => amuseAPI.get('api/novel/list', { params: { order, page, size: 10 } })
      .then(res => res.data),
    staleTime: 1000 * 60 * 5,
  });

  const novels = novelList?.content || []; // 안전하게 배열 추출

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
      {isLoggedIn && <Sidebar />}

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
          <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
            <button onClick={() => setOrder("lastest")} className={`${order == 'lastest' && 'text-[#FB7185] font-bold'} hover:text-[#FB7185] transition-colors`}>최신순</button>
            <span className="text-[#334155]">|</span>
            <button onClick={() => setOrder("likes")} className={`${order == 'likes' && 'text-[#FB7185] font-bold'} hover:text-[#FB7185] transition-colors`}>인기순</button>
            <span className="text-[#334155]">|</span>
            <button onClick={() => setOrder("views")} className={`${order == 'views' && 'text-[#FB7185] font-bold'} hover:text-[#FB7185] transition-colors`}>조회순</button>
          </div>
        </header>

        <section className="p-8 flex flex-col gap-10">
          {/* 배너 */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-r from-[#1e293b] to-transparent border border-[#334155]/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FB7185]/20 flex items-center justify-center text-xl">❤️</div>
            <div>
              <p className="font-bold">신규 소식을 놓치지 마세요!</p>
              <p className="text-sm text-[#94A3B8]">관심 등록한 작품은 연재 시 푸시 알림을 보내드립니다.</p>
            </div>
          </div>

          {/* 작품 */}
          <NovelListComponent novels={novels} handler={handleClickNovel} />
          {/* 모달 */}
          {selectedNovel && (
            <NovelActionModal novel={selectedNovel} onClose={() => setSelectedNovel(null)} />
          )}
        </section >
      </main>
    </div >
  )
}

// 작품 리스트 컴포넌트
export const NovelListComponent = ({ novels, handler }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {novels.map((novel, index) => (
        <div
          key={`${novel.id}_${index}`}
          className="group relative flex flex-col transition-all duration-300"
        >
          <div onClick={() => handler(novel)}
            className="cursor-pointer relative z-10 w-full aspect-[3/4] rounded-r-lg overflow-hidden shadow-[10px_10px_20px_rgba(0,0,0,0.5)] group-hover:-translate-y-2 transition-all duration-300">
            {novel.coverImageUrl ? (
              <img
                src={getServerBaseUrl(novel.coverImageUrl)}
                alt={novel.title}
                className="w-full h-full object-cover"
                style={{ objectPosition: `center ${novel.coverImagePosY}%` }}
              />
            ) : (
              <div className="w-full h-full bg-[#1e293b] flex items-center justify-center border border-[#334155]">
                <span className="text-[#FB7185]/20 font-serif italic text-2xl">Amuse</span>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent p-4 flex flex-col justify-end transform transition-transform duration-300 translate-y-4 group-hover:translate-y-0">
              <h1 className="text-xl text-[#F1F5F9] font-bold mb-1 drop-shadow-md">
                {novel.mainChar.name || "미정 캐릭터"}
              </h1>
              <p className="text-[#F1F5F9] text-[13px] leading-snug line-clamp-3 mb-1 font-medium opacity-100 transition-opacity duration-300">
                {novel.description || "Amuse의 신작 소설을 즐기세요."}
              </p>
              <div className="h-[2px] w-6 bg-[#FB7185] rounded-full mt-3 mb-4 shadow-[0_0_8px_#FB7185]" />
            </div>

            <div className="absolute top-3 left-3 right-3 z-30 flex justify-between">
              <span className={`text-[12px] px-2 py-0.5 rounded-md font-bold backdrop-blur-md
                      ${novel.affinityModeEnabled ? 'bg-[#FB7185] text-white' : 'bg-slate-700/80 text-slate-200'}`}>
                Muse {novel.affinityModeEnabled ? 'ON' : 'OFF'}
              </span>
              <span className="flex gap-4 px-2 py-0.5 rounded-md font-bold backdrop-blur-md bg-slate-700/20 text-slate-200">
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
          <div className="mt-4 px-1" >
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
  )
}

// 모달 컴포넌트
export const NovelActionModal = ({ novel, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  // 소설 읽기 페이지로 이동
  const handleReadNovel = () => {
    navigate(`/novels/${novel.id}`);
    onClose();
  };

  // 대화하기 버튼 클릭 핸들러
  const handleStartChat = async (selectedNovel) => {
    navigate(`/muse/description/${selectedNovel.mainChar.id}`);
  };

  // 카드 애니메이션 트리거
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <article onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm overflow-hidden bg-[#1e293b] rounded-2xl border border-[#334155] shadow-2xl animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="z-20 absolute right-4 top-4 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
        >
          <X size={30} />
        </button>

        <div className="p-10 pb-0 text-center">
          <div className="relative aspect-[4/5] mb-5">
            <div className="w-full h-full [filter:drop-shadow(0_10px_20px_rgba(0,0,0,0.6))]">
              <div className="relative w-full h-full bg-[#1e293b] overflow-hidden
                          [clip-path:polygon(0_0,_calc(100%_-_40px)_0,_100%_40px,_100%_100%,_40px_100%,_0_calc(100%_-_40px))]">
                <img
                  src={getServerBaseUrl(novel.coverImageUrl)}
                  alt={novel.title}
                  className={`w-full h-full object-cover transition-transform duration-[2000ms] ease-out ${isVisible ? 'scale-105' : 'scale-125'
                    }`}
                  style={{ objectPosition: `center ${novel.coverImagePosY}%` }}
                />

                <div className={`absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent 
                  transition-all duration-1000 ease-out flex flex-col justify-end p-8 text-left
                  ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                  <p className={`whitespace-pre-wrap break-keep text-[#F1F5F9] text-ms leading-relaxed transition-all duration-1000 delay-300
                    ${isVisible ? '-translate-y-4 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    {novel.description}
                  </p>
                </div>
              </div>

            </div>
          </div>

          <h2 className={`${novel.title.length >= 10 ? 'text-2xl' : 'text-3xl'} font-bold text-[#F1F5F9] mb-4 
            [text-shadow:0_4px_5px_rgba(0,0,0,0.8)]
            tracking-tight whitespace-pre-wrap break-keep`}>{novel.title}</h2>
          <section className="flex gap-2 mb-3 justify-center">
            {novel.tags.map((tag, idx) => (
              <span className="cursor-pointer text-[13px] px-2 rounded-lg text-[#F1F5F9] bg-[#334155] hover:text-[#FB7185]" key={`${tag}_${idx}`}>#{tag}</span>
            ))}
          </section>
          <p className="cursor-pointer text-sm text-[#94A3B8] hover:text-[#FB7185]">@{novel.authorName}</p>
        </div>

        <div className="p-6 flex flex-col gap-3">
          <button
            onClick={handleReadNovel}
            className="flex items-center justify-center gap-3 w-full py-4 bg-[#4f46e5] hover:bg-[#3730a3] text-[#F1F5F9] rounded-xl transition-all font-medium group"
          >
            <BookOpen size={20} className="group-hover:scale-110 transition-transform" />
            소설 읽기
          </button>

          {novel.affinityModeEnabled &&
            <button
              onClick={() => handleStartChat(novel)}
              className="flex items-center justify-center gap-3 w-full py-4 bg-[#FB7185] hover:bg-[#f43f5e] text-white rounded-xl transition-all font-bold shadow-lg shadow-rose-900/20 group"
            >
              <MessageCircle size={20} className="group-hover:animate-bounce" />
              {getJosa(novel.mainChar.name, '을', '를')} Muse로 만들기
            </button>}
        </div>

        {novel.affinityModeEnabled &&
          <div className="bg-[#0f172a]/50 py-3 text-center">
            <p className="text-[12px] text-[#94A3B8]">{getJosa(novel.mainChar.name, '과', '와')}의 대화에서 몰입을 위해 소설 읽기를 추천드려요💕</p>
          </div>}
      </article>

    </div>
  );
};

