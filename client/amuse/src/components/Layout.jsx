
import LoginPage from "../pages/LoginPage";
import { Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import KakaoCallback from "./KakaoCallback";
import Header, { Footer } from "./Form";
import useAuthStore from "../store/authStore";
import Home from "../pages/Home";
import Studio from "../pages/Studio";
import Ticket from "../pages/Ticket";
import Favorites from "../pages/Favorites";
import Setting from "../pages/Setting";
import Notice from "../pages/Notice";
import Event from "../pages/Event";
import StudioWriteSetting from "../pages/StudioWriteSetting";
import { StudioWriteContent } from "../pages/StudioWriteContent";
import { useQuery } from "@tanstack/react-query";
import amuseAPI from "../api/amuseAPI";
import { LoadingScreen } from "./Spinner";
import { Library } from "../pages/Libaray";
import { NovelManagementPage } from "../pages/NovelManagementPage";
import { MuseChat } from "../pages/MuseChat";
import { MyMuseList } from "../pages/MyMuseList";
import { useEffect } from "react";


export default function Layout() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col h-full w-full overflow-y-auto">
          <Routes>
            {/* 공개 경로 */}
            <Route path="/login" element={<LoginPage />} />

            {/* 카카오 콜백 페이지 */}
            <Route path="/auth/kakao/callback" element={<KakaoCallback />} />

            {/* 로그인 조건부 라우팅 */}
            {isLoggedIn ? (
              <Route
                path="/*"
                element={
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/studio" element={<Studio />} />
                    <Route path="/studio/write" element={<StudioWriteSetting />} />
                    <Route path="/studio/write/:novelId" element={<NovelAuthorGuard><StudioWriteContent /></NovelAuthorGuard>} />
                    <Route path="/studio/setting/:novelId" element={<NovelAuthorGuard><NovelManagementPage /></NovelAuthorGuard>} />
                    <Route path="/muse" element={<MyMuseList />} />
                    <Route path="/muse/:novelId/chat/:userId" element={<ChatAuthGuard><MuseChat /></ChatAuthGuard>} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/ticket" element={<Ticket />} />
                    <Route path="/setting" element={<Setting />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/notice" element={<Notice />} />
                    <Route path="/event" element={<Event />} />
                  </Routes>
                }
              />
            ) : (
              /* 로그인 안 했을 때: / (메인)으로 들어오면 /login으로 리다이렉트 */
              // <Route path="/" element={<Navigate to="/login" replace />} />
              <>
                <Route path="/" element={<Library />} />
                <Route path="/library" element={<Library />} />
                <Route path="/notice" element={<Notice />} />
                <Route path="/event" element={<Event />} />
              </>
            )}
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  );
}

// 소설 작성자 판별 가드 컴포넌트
const NovelAuthorGuard = ({ children }) => {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const userInfo = useAuthStore((state) => state.userInfo); // 현재 로그인 유저 정보

  const { data: novel, isLoading, isError } = useQuery({
    queryKey: ['novel', novelId],
    queryFn: async () => {
      const res = await amuseAPI.get(`/api/novel/${novelId}`);
      return res.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 60,
    enabled: !!novelId && !!userInfo?.id,
  });

  console.log(novel);
  useEffect(() => {
    if (isError) {
      alert("존재하지 않거나 삭제된 소설입니다.");
      navigate(-1);
    }
    if (novel && userInfo && novel.authorId !== userInfo.id) {
      alert("본인의 소설만 수정할 수 있습니다.");
      navigate(-1);
    }
  }, [isError, novel, userInfo, navigate]);


  if (isLoading) return <LoadingScreen text={'내 소설을 조회 중 입니다...'} />;

  if (isError || !novel || novel.authorId !== userInfo.id) {
    return null;
  }

  return children;
};

// Chat 모드 판별 가드 컴포넌트
const ChatAuthGuard = ({ children }) => {
  const { novelId, userId } = useParams();
  const navigate = useNavigate();
  const { id: currentUserId } = useAuthStore((state) => state.userInfo);

  // 소설 데이터 조회
  const { data: novel, isLoading: isNovelLoading, isError: isNovelError } = useQuery({
    queryKey: ['novel', novelId],
    queryFn: () => amuseAPI.get(`/api/novel/${novelId}`).then(res => res.data),
    retry: false,
    staleTime: 1000 * 60 * 60,
    enabled: !!novelId,
  });
  
  // 채팅방 존재 여부 조회 - 실제로 해당 소설(캐릭터)과 채팅방이 생성되어 있는지
  const { data: chatRoom, isLoading: isChatLoading, isError: isChatError } = useQuery({
    queryKey: ['muse', 'chatRoom', novelId, userId],
    queryFn: async() => {
      console.log("채팅방 존재 여부 조회중")
      const resp = await amuseAPI.get(`/api/muse/check/${novelId}/${userId}`);
      console.log(resp.data)
      return resp.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
    enabled: !!novelId && userId === String(currentUserId) && !!novel,
  });

  useEffect(() => {
    // 현재 로그인한 유저와 url 상 입력된 userId가 일치하는지 확인
    if (userId !== String(currentUserId)) {
      alert("잘못된 접근입니다.");
      navigate(-1);
      return;
    }

    // novelId의 소설이 있는지 확인
    if (isNovelError) {
      alert("존재하지 않거나 삭제된 소설입니다.");
      navigate(-1);
      return;
    }

    // novelId의 소설이 호감도 모드가 활성상태인지 확인
    if (novel && !novel.affinityModeEnabled) {
      alert("호감도 모드가 지원되지 않는 소설입니다!");
      navigate('/library', { replace: true });
      return;
    }

    // 채팅방 권한 확인
    if (isChatError || chatRoom == '') {
      alert("대화 기록이 없거나 접근 권한이 없습니다. 먼저 도서관에서 뮤즈와 대화하기를 진행해주세요.");
      navigate('/library', { replace: true });
    }

  }, [userId, currentUserId, isNovelError, novel, isChatError, navigate, chatRoom]);

  if (isNovelLoading || isChatLoading) {
    return <LoadingScreen text="내 Muse와의 연결을 확인 중..." />;
  }

  return chatRoom != '' && novel?.affinityModeEnabled ? children : null;
}