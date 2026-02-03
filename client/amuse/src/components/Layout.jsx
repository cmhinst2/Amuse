
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
import MuseDescription from "../pages/MuseDescription";
import MuseRemake from "../pages/MuseRemake";
import { useChatRoom } from "../hooks/useChatRoom";
import { useCharacter } from "../hooks/useCharacter";
import { useNovel } from "../hooks/useNovel";


export default function Layout() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col h-full w-full overflow-y-auto">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/kakao/callback" element={<KakaoCallback />} />

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
                    <Route path="/muse/description/:characterId" element={<CharacterAuthGuard><MuseDescription /></CharacterAuthGuard>} />
                    <Route path="/muse/:novelId/chat/:roomId" element={<MuseAuthGuard><MuseChat /></MuseAuthGuard>} />
                    <Route path="/muse/:novelId/novel/:roomId" element={<MuseAuthGuard><MuseRemake /></MuseAuthGuard>} />
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

  const { data: novel, isLoading, isError } = useNovel(novelId, {
    retry: false,
    staleTime: 1000 * 60 * 60,
    enabled: !!novelId && !!userInfo?.id
  });

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

// Muse 모드 판별 가드 컴포넌트
const MuseAuthGuard = ({ children }) => {
  const { novelId, roomId } = useParams();
  const navigate = useNavigate();
  const { id: currentUserId } = useAuthStore((state) => state.userInfo);

  // 소설 데이터 조회(Muse 모드 유무 확인)
  const { data: novel, isLoading: isNovelLoading, isError: isNovelError } = useNovel(novelId, {
    retry: false,
    staleTime: 1000 * 60 * 60,
    enabled: !!novelId
  });

  // 채팅방 상세 정보 조회 (권한 및 존재 확인)
  const { data: chatRoom, isLoading: isRoomLoading, isError: isRoomError } = useChatRoom(roomId);

  useEffect(() => {
    if (isNovelLoading || isRoomLoading) return; // 로딩중 제외

    // 소설이나 채팅방이 DB에 없는 경우
    if (isNovelError || isRoomError || !chatRoom || !novel) {
      alert("접근할 수 없는 경로입니다.");
      navigate('/library', { replace: true });
      return;
    }

    // Muse 모드 활성화 여부
    if (!novel.affinityModeEnabled) {
      alert("Muse 모드가 지원되지 않는 소설입니다!");
      navigate('/library', { replace: true });
      return;
    }

    // 리다이렉트 (roomId가 없는데 서버에서 찾은 경우 == 도서관에서 대화하기 클릭 시)
    if (!roomId && chatRoom && chatRoom !== '') {
      navigate(`/muse/${novelId}/chat/${chatRoom.roomId}`, { replace: true });
      return;
    }

    // URL의 roomId로 가져온 방의 주인이 내가 아니라면 퇴출
    if (String(chatRoom.userId) !== String(currentUserId)) {
      alert("본인의 채팅방만 접근 가능합니다.");
      navigate('/muse', { replace: true });
      return;
    }

    // 모든 식별자가 서로 일치하는지 종합 검증(url강제 접근시 소설id,방id,사용자id 모두 일치 확인)
    const isRightAccess =
      String(chatRoom.novelId) === String(novelId) &&
      String(chatRoom.roomId) === String(roomId) &&
      String(chatRoom.userId) === String(currentUserId);

    if (!isRightAccess) {
      alert("올바르지 않은 접근 경로이거나 권한이 없습니다.");
      navigate('/muse', { replace: true });
      return;
    }


  }, [novel, chatRoom, isNovelError, isRoomError, currentUserId, navigate, isNovelLoading, isRoomLoading]);

  return (novel?.affinityModeEnabled && chatRoom) ? children : null;
}

// Character 판별 가드 컴포넌트
const CharacterAuthGuard = ({ children }) => {
  const { characterId } = useParams();
  const navigate = useNavigate();

  // 해당 id의 캐릭터가 있는지, 호감도 모드를 지원 유무 확인
  const { data: character, isLoading, isError, isSuccess } = useCharacter(characterId, {
    enabled: !!characterId,
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;

    if (isError || !character) {
      alert("존재하지 않는 캐릭터이거나 접근 권한이 없습니다.");
      navigate('/library', { replace: true });
      return;
    }

    if (character && !character.affinityModeEnabled) {
      alert("이 캐릭터는 호감도 모드를 지원하지 않습니다.");
      navigate('/library', { replace: true });
    }

  }, [character, isError, isLoading, navigate])

  if (isLoading) return <LoadingScreen text={'캐릭터 정보를 조회 중 입니다...'} />;

  return isSuccess && character?.mainChar.id ? children : null;
}