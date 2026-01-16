import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosAPI from "../api/axiosInterceptor.js";
import axios from "axios";
import useAuthStore from "../store/authStore.js";

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

export default function KakaoCallback() {
  const navigate = useNavigate();
  const isProcessed = useRef(false);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code"); // 발급받은 인가코드 얻어오기

    if (code && !isProcessed.current) {
      isProcessed.current = true;
      sendOauthToken(code);
    }
  }, []);

  // 카카오 토큰 발급 받기
  const sendOauthToken = async (code) => {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('client_id', KAKAO_REST_API_KEY);
      params.append('redirect_uri', REDIRECT_URI);
      params.append('code', code);

      const response = await axios.post("https://kauth.kakao.com/oauth/token", params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      });

      const result = response.data;
      getUserInfo(result.access_token, result.refresh_token); // 사용자 정보 조회 요청

    } catch (error) {
      console.error("카카오로 토큰 전송 중 에러 발생");
    }
  }

  // 카카오 사용자 정보 조회
  const getUserInfo = async (kakaoAccessToken) => {
    try {
      const response = await axios.get("https://kapi.kakao.com/v2/user/me", {
        headers: {
          Authorization: `Bearer ${kakaoAccessToken}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      });

      const kakaoUser = response.data;

      // 사용자 정보 추출 내용 - KakaoLoginRequest DTO 와 매핑
      const loginRequest = {
        email: kakaoUser.kakao_account?.email || `${kakaoUser.id}@kakao.com`,
        nickname: kakaoUser.kakao_account.profile.nickname,
        socialId: String(kakaoUser.id),
        profileImage: kakaoUser.kakao_account.profile.profile_image_url
      }

      sendInfoToAmuseServer(loginRequest);

    } catch (error) {
      console.error("카카오 유저정보 조회 실패:", error);
      navigate('/login');
    }
  }

  // Amuse 서버에 로그인 요청
  const sendInfoToAmuseServer = async (loginRequest) => {
    try {
      // 아까 만든 Spring Boot의 AuthController 호출
      const response = await axiosAPI.post("/api/auth/kakao", loginRequest);
      const { accessToken } = response.data;
      const { nickname, profileImage, email } = loginRequest;

      // store 저장
      login(accessToken, { nickname, profileImage, email });
      navigate('/'); // 메인으로 이동
      
    } catch (error) {
      console.error("Amuse 서버 로그인 실패:", error);
      alert("서버 연결에 실패했습니다.");
      navigate('/login');
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#0f172a] text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FB7185] mb-4"></div>
      <p className="text-slate-400 font-medium text-lg">기록을 불러오는 중입니다...</p>
      <p className="text-slate-500 text-sm mt-2">잠시만 기다려주세요.</p>
    </div>
  );
}