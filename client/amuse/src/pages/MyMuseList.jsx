import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Form";
import { MessageCircle, Heart, ChevronRight, Clock } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import amuseAPI from "../api/amuseAPI";
import useAuthStore from "../store/authStore";
import { LoadingScreen } from "../components/Spinner";

export function MyMuseList() {
  const navigate = useNavigate();
  const { id, nickname } = useAuthStore((state) => state.userInfo);

  // <Data Fetch>
  const { data: myMuses = [], isLoading, status, fetchStatus } = useQuery({
    queryKey: ['muse', 'chatRoom', 'list', id],
    queryFn: () => amuseAPI.get(`/api/muse/${id}`).then(res => res.data),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const myMusesDummy = [
    {
      id: 1,
      novelId: 101,
      characterName: "엘리나 프레데릭",
      lastMessage: "오늘 날씨가 참 좋네요. 같이 산책이라도 갈까요?",
      lastChatTime: "10분 전",
      affinity: 85,
      profileImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
      location: "황실 정원"
    },
    // ... 더 많은 뮤즈 데이터
  ];

  if (fetchStatus === 'fetching' && status === 'pending' || isLoading) {
    return <LoadingScreen text={`${nickname}님의 뮤즈들을 불러오는 중 입니다...`} />;
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* 헤더 */}
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

        {/* 컨텐츠 영역 */}
        <section className="p-8 max-w-5xl mx-auto">
          {myMuses.length > 0 ? (
            <div className="grid gap-4">
              {myMuses.map((muse) => (
                <div
                  key={muse.id}
                  onClick={() => navigate(`/muse/${muse.novelId}/chat/${muse.id}`)}
                  className="group relative bg-[#1e293b]/50 hover:bg-[#1e293b] border border-[#334155] hover:border-[#FB7185]/50 rounded-2xl p-5 transition-all cursor-pointer flex items-center gap-6 shadow-lg hover:shadow-[0_0_20px_rgba(251,113,133,0.1)]"
                >
                  {/* 캐릭터 프로필 이미지 */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#334155] group-hover:border-[#FB7185] transition-colors">
                      <img src={muse.profileImg} alt={muse.characterName} className="w-full h-full object-cover" />
                    </div>
                    {/* 온라인/활동 표시 점 */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2DD4BF] border-4 border-[#0f172a] rounded-full shadow-lg" />
                  </div>

                  {/* 정보 섹션 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-[#F1F5F9] group-hover:text-[#FB7185] transition-colors">
                        {muse.characterName}
                      </h3>
                      <span className="flex items-center gap-1 text-[11px] text-[#94A3B8] bg-[#0f172a] px-2 py-0.5 rounded-full">
                        <Heart size={10} className="text-[#FB7185] fill-[#FB7185]" />
                        {muse.affinity}%
                      </span>
                    </div>
                    <p className="text-[#94A3B8] text-sm line-clamp-1 mb-2">
                      {muse.lastMessage}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-[#475569]">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {muse.lastChatTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={12} /> 최근 장소: {muse.location}
                      </span>
                    </div>
                  </div>

                  {/* 화살표 아이콘 */}
                  <div className="shrink-0 text-[#334155] group-hover:text-[#FB7185] transition-colors">
                    <ChevronRight size={24} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State (뮤즈가 없을 때) */
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
