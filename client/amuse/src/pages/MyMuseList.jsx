import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Form";
import { MessageCircle, Heart, ChevronRight, Clock, BookOpen, MapPin } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import amuseAPI from "../api/amuseAPI";
import useAuthStore from "../store/authStore";
import { LoadingScreen } from "../components/Spinner";
import { formatChatMessageDate, getServerBaseUrl } from "../api/util";

export function MyMuseList() {
  const navigate = useNavigate();
  const { id, nickname } = useAuthStore((state) => state.userInfo);

  // <Data Fetch>
  const { data: myMuses = [], isLoading, status, fetchStatus } = useQuery({
    queryKey: ['muse', 'chatRoom', 'list', id],
    queryFn: () => amuseAPI.get(`/api/muse/chat/${id}`).then(res => res.data),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  if (fetchStatus === 'fetching' && status === 'pending' || isLoading) {
    return <LoadingScreen text={`${nickname}님의 뮤즈들을 불러오는 중 입니다...`} />;
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 bg-[#0f172a]/95 backdrop-blur-md border-b border-[#1e293b]">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-[#FB7185] tracking-tight">나의 Muse</h1>
            <p className="text-[#94A3B8] text-sm mt-1">당신과 특별한 서사를 쌓아가는 캐릭터들입니다.</p>
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-[#1e293b] rounded-full text-xs font-bold text-[#F1F5F9] border border-[#334155]">
              총 {myMuses.length}명의 뮤즈
            </div>
          </div>
        </header>

        <section className="p-8 max-w-5xl mx-auto">
          {myMuses.length > 0 ? (
            <div className="grid gap-4">
              {myMuses.map((muse, idx) => (
                <div
                  key={`${muse.roomId}_${idx}`}
                  onClick={() => navigate(`/muse/${muse.novelId}/chat/${muse.roomId}`)}
                  className="group bg-[#1e293b]/50 hover:bg-[#1e293b] border border-[#334155] hover:border-[#FB7185]/50 rounded-2xl p-5 transition-all cursor-pointer flex items-center gap-6 shadow-lg hover:shadow-[0_0_20px_rgba(251,113,133,0.1)]"
                >
                  <div className="shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#334155] group-hover:border-[#FB7185] transition-colors">
                      
                      {muse.roomMode === 'AFFINITY'? 
                      <img src={getServerBaseUrl(muse.profileImageUrl)}
                        alt={muse.name}
                        style={{ objectPosition: `center ${muse.profileImagePosY}%` }}
                        className="w-full h-full object-cover" /> :
                        <img src={getServerBaseUrl(muse.coverImageUrl)}
                        alt={muse.name}
                        style={{ objectPosition: `center ${muse.coverImagePosY}%` }}
                        className="w-full h-full object-cover" />
                      }
                      
                    </div>
                  </div>

                  <div className="flex flex-col flex-1">
                    <div className="flex-1 min-w-0">
                      {muse.roomMode === 'AFFINITY' ?
                        <>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-[#F1F5F9] group-hover:text-[#FB7185] transition-colors">
                              {muse.name}
                            </h3>
                            <span className="flex items-center gap-1 text-[11px] text-[#94A3B8] bg-[#0f172a] px-2 py-0.5 rounded-full border border-[#334155]/30">
                              <Heart size={10} className="text-[#FB7185] fill-[#FB7185]" />
                              {muse.currentScore}%
                            </span>
                            <span className="text-[11px] text-[#94A3B8] bg-[#0f172a] px-2 py-0.5 rounded-full">{muse.relationshipStatus}</span>
                          </div>
                          <p className="text-[#94A3B8] text-sm line-clamp-1 mb-2 italic">
                            "{muse.lastMessage}"
                          </p>
                        </>
                        :
                        <>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-[#F1F5F9] group-hover:text-blue-400 transition-colors">
                              {muse.novelTitle} Remake
                            </h3>
                          </div>
                          <p className="text-[#F1F5F9]/70 text-sm line-clamp-1 mb-2 font-medium">
                            {muse.lastSummary || "새로운 이야기가 시작되었습니다."}
                          </p>
                        </>
                      }
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-[#475569]">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />{formatChatMessageDate(muse.lastMessageAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {muse.currentLocation || "시작 지점"}
                      </span>
                      {muse.room_mode === 'REMAKE' && (
                        <span className="ml-auto text-[#FB7185] font-bold tracking-tighter uppercase text-[9px]">
                          Remake Mode
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-[#334155] group-hover:text-[#FB7185] transition-colors">
                    <ChevronRight size={24} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div className="w-20 h-20 bg-[#1e293b] rounded-full flex items-center justify-center mb-6 text-[#334155]">
                <Heart size={40} />
              </div>
              <h3 className="text-xl font-bold text-[#F1F5F9] mb-2">아직 당신의 뮤즈가 없네요</h3>
              <p className="text-[#94A3B8] mb-8">도서관에서 마음에 드는 소설을 읽고<br />캐릭터와 대화를 시작해보세요.</p>
              <button
                onClick={() => navigate('/library')}
                className="px-6 py-3 bg-[#FB7185] hover:bg-[#f43f5e] text-white rounded-xl font-bold transition-all shadow-lg"
              >
                도서관으로 가기
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
