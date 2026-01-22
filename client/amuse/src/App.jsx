import { useState, useRef, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import axiosAPI from './api/axiosAPI';
import useAuthStore from './store/authStore';

function App() {

  // 화면 로딩 상태
  // const [isLoading, setIsLoading] = useState(true);
  // const logout = useAuthStore((state) => state.logout);

  // // 첫 렌더링인지 확인 (StrictMode의 두번 호출 방지)
  // const isFirstRender = useRef(true);

  // // 화면 첫 렌더링 시 토큰 유효한지 확인
  // useEffect(() => {
  //   async function checkAuth() {
  //     try {
  //       await axiosAPI.get("/api/auth/me");

  //     } catch (error) {
  //       if (error.status === 401) {
  //         console.log("인증되지 않은 사용자 : 로그인 페이지로 이동");
  //         localStorage.clear();
  //         logout();
  //       }
  //     }
  //   }

  //   if (isFirstRender.current) {
  //     isFirstRender.current = false;
  //     checkAuth().finally(() => setIsLoading(false));
  //   }

  // }, []);

  // if (isLoading) return null; // 리렌더링 시 깜빡임 방지

  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

export default App
