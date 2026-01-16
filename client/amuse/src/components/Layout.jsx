
import LoginPage from "../pages/LoginPage";
import { Routes, Route, Navigate } from "react-router-dom";
import KakaoCallback from "./KakaoCallback";
import Header, { Footer } from "./Form";
import useAuthStore from "../store/authStore";
import Home from "../pages/Home";
import Studio from "../pages/Studio";
import StudioWrite, { StudioWriteAI } from "../pages/StudioWritePage";
import Ticket from "../pages/Ticket";
import Favorites from "../pages/Favorites";
import Setting from "../pages/Setting";
import Notice from "../pages/Notice";
import Event from "../pages/Event";


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
                    <Route path="/studio/write" element={<StudioWrite />} />
                    <Route path="/studio/write/:novelId" element={<StudioWriteAI />} />
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
