
import LoginPage from "../pages/LoginPage";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
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
import novelAPI from "../api/novelAPI";
import { LoadingScreen } from "./Spinner";


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
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/ticket" element={<Ticket />} />
                    <Route path="/setting" element={<Setting />} />
                    <Route path="/notice" element={<Notice />} />
                    <Route path="/event" element={<Event />} />
                  </Routes>
                }
              />
            ) : (
              /* 로그인 안 했을 때: 어떤 주소로 들어와도 /login으로 리다이렉트 */
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  );
}


const NovelAuthorGuard = ({ children }) => {
  const { novelId } = useParams();
  const userInfo  = useAuthStore((state) => state.userInfo); // 현재 로그인 유저 정보 (Context 등에서 가져옴)

  // 내가 쓴 소설 데이터 조회
  const { data: novel, isLoading } = useQuery({
    queryKey: ['novel', novelId],
    queryFn: () => novelAPI.get(`/api/novel/${novelId}`).then(res => res.data),
    enabled: !!novelId
  });
  
  console.log(novel);

  if (isLoading) return <LoadingScreen text={'내 소설을 조회 중 입니다...'} />;

  // 작성자가 아니면 홈으로 이동
  if (novel && novel.authorId !== userInfo.id) {
    alert("본인의 소설만 수정할 수 있습니다.");
    return <Navigate to="/" replace />;
  }

  return children;
};