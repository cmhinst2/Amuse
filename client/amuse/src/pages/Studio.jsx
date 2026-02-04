import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Form";
import { useQuery } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";
import amuseAPI from "../api/amuseAPI";
import { LoadingScreen } from "../components/Spinner";
import { BookPlus, Eye, Heart } from "lucide-react";
import { useState } from "react";
import { getServerBaseUrl } from "../api/util";

export default function Studio() {
  const navigate = useNavigate();
  const { id, nickname, profileImage } = useAuthStore((state) => state.userInfo);

  // <Data fetch>
  // 내가 쓴 소설 목록 fetch
  const { data: novelList = [], isLoading: isNovelListLoading, status, fetchStatus } = useQuery({
    queryKey: ['novelList', id],
    queryFn: () => amuseAPI.get(`/api/novel/list/${id}`).then(res => res.data),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  // 만약 fetchStatus가 'paused'라면 네트워크가 끊겼거나 DB 응답이 늦을 때, 또는 데이터 로딩중일 때
  if (fetchStatus === 'fetching' && status === 'pending' || isNovelListLoading) {
    return <LoadingScreen text={`${nickname}님의 소설을 불러오는 중 입니다...`} />;
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
          <div className="flex items-center gap-8 overflow-hidden flex-1">
            <h1 className="text-xl font-black text-[#FB7185] tracking-tight shrink-0">
              내 스튜디오
            </h1>

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
          </div>
        </header>

        <section className="p-8 space-y-12">
          <article className="relative h-64 overflow-hidden rounded-[2rem] border border-[#334155]/30 group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e293b]" />
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#FB7185]/20 blur-[100px] rounded-full group-hover:bg-[#FB7185]/30 transition-all duration-700 mix-blend-screen" />

            <div className="relative z-5 flex flex-col justify-center h-full px-12 space-y-4">
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

          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold border-l-4 border-[#FB7185] pl-4">내 작품 목록</h3>
            </div>
            <NovelList data={novelList} isOwner={true} />
          </div>
        </section>
      </main>
    </div>
  );
}

// 작품 List 컴포넌트 분리
export const NovelList = ({ data, isOwner }) => {
  const navigate = useNavigate();

  // 작품 관리 핸들러
  const handleManageNovel = (novel) => {
    navigate(`/studio/setting/${novel.id}`);
  }

  if (isOwner && data.length == 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 rounded-2xl bg-[#1e293b] border border-[#334155] shadow-xl">
        <div className="mb-6 p-4 rounded-full bg-[#0f172a] border border-[#334155]">
          <BookPlus size={48} className="text-[#94A3B8]" />
        </div>

        <h3 className="text-2xl font-bold text-[#FB7185] mb-2">
          아직 시작되지 않은 이야기
        </h3>
        <p className="text-[#94A3B8] text-center mb-8 leading-relaxed">
          텅 빈 페이지가 당신의 상상력을 기다리고 있습니다. <br />
          첫 번째 서사를 지금 바로 써 내려가 보세요.
        </p>

        <button
          onClick={() => navigate('/studio/write')}
          className="px-8 py-3 bg-[#FB7185] hover:bg-[#e11d48] text-[#F1F5F9] font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/20"
        >
          첫 작품 시작하기
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {data.map((novel, index) => (
        <div
          key={`${novel.id}_${index}`}
          className="group relative flex flex-col transition-all duration-300"
        >
          <div onClick={() => navigate(`/studio/write/${novel.id}`)}
            className="cursor-pointer relative z-10 w-full aspect-[3/4] rounded-r-lg overflow-hidden shadow-[10px_10px_20px_rgba(0,0,0,0.5)] group-hover:shadow-[15px_15px_30px_rgba(251,113,133,0.3)] group-hover:-translate-y-2 transition-all duration-300">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-black/30 to-transparent z-20" />

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

            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent p-4 flex flex-col justify-end translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
              <h1 className="text-[#F1F5F9] font-bold mb-1 ">{novel.mainCharName}</h1>
              <p className="text-[#F1F5F9] text-[13px] leading-snug line-clamp-3 mb-1 font-medium">
                {novel.description || "작성된 작품 설명이 없습니다."}
              </p>
              <div className="h-[2px] w-6 bg-[#FB7185] rounded-full mt-1 mb-2" />
            </div>

            <div className="absolute top-3 left-3 right-3 z-30 flex gap-2">
              {novel.adult && 
              <span className="flex items-center justify-center w-5 h-5 rounded bg-red-600 text-white text-[10px] font-black shadow-lg">
                19
              </span>}
              <span className={`text-[12px] px-2 py-0.5 rounded-md font-bold backdrop-blur-md 
                ${novel.shared ? 'bg-emerald-500/80 text-white' : 'bg-slate-700/80 text-slate-200'}`}>
                {novel.shared ? '연재 중' : '비공개'}
              </span>
              <span className={`text-[12px] px-2 py-0.5 rounded-md font-bold backdrop-blur-md
                ${novel.museMode ? 'bg-[#FB7185] text-white' : 'bg-slate-700/80 text-slate-200'}`}>
                Muse {novel.museMode ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[85%] h-4 bg-black/50 blur-xl rounded-[100%] group-hover:opacity-70 transition-opacity" />

          <div className="mt-4 px-1">
            <div className="flex flex-col">
              <section onClick={() => navigate(`/studio/write/${novel.id}`)} className="flex items-center justify-between mb-2 cursor-pointer ">
                <h4 className="text-base font-bold text-[#F1F5F9] group-hover:text-[#FB7185] transition-colors line-clamp-1">
                  {novel.title}
                </h4>
                <span className={`text-[13px] font-medium px-2 py-0.5 rounded border ${novel.status == 'PROCESS'
                  ? 'text-[#818cf8] border-[#818cf8]/30 bg-[#818cf8]/5'
                  : 'text-[#94A3B8] border-[#334155]'
                  }`}>
                  {novel.status === 'PROCESS' ? '집필 중' : '집필 완료'}
                </span>
              </section>
              <section className="flex gap-2 mb-2">
                {novel.tags.map((tag, idx) => (
                  <span className="text-[12px]" key={`${tag}_${idx}`}>#{tag}</span>
                ))}
              </section>
            </div>
            {
              isOwner &&
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Heart size={14} className={novel.likeCount > 0 ? "fill-[#FB7185] text-[#FB7185]" : "text-[#94A3B8]"} />
                    <span className="text-xs font-medium text-[#94A3B8]">{novel.likeCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={14} className="text-[#94A3B8]" />
                    <span className="text-xs font-medium text-[#94A3B8]">{novel.viewCount}</span>
                  </div>
                </div>

                <button onClick={() => handleManageNovel(novel)} className="text-[13px] font-bold text-[#FB7185] hover:underline">
                  작품 관리 →
                </button>
              </div>
            }
          </div>
        </div>
      ))}
    </div>
  )
}