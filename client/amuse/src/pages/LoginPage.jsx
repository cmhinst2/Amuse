const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;
import kakaoIcon from '../assets/kakao_icon.png';
import amuse from "../assets/vec_amuse_logo.png";

const KAKAO_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize` +
  `?client_id=${KAKAO_REST_API_KEY}` +
  `&redirect_uri=${REDIRECT_URI}` +
  `&response_type=code`;

export default function LoginPage() {

  const handleKakaoLogin = () => {
    let kakaoUrl = KAKAO_AUTH_URL;
    const lastLogout = localStorage.getItem("lastLogoutTime");
    const ONE_HOUR = 60 * 60 * 1000;  // 1시간 
  
    if (lastLogout && (Date.now() - parseInt(lastLogout) > ONE_HOUR)) {
      // 로그아웃 한지 1시간이 지났다면 강제로 ID/PW를 입력하게 함
      kakaoUrl += "&prompt=login";
    }

    window.location.href = kakaoUrl;
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm p-12 bg-slate-800 border border-slate-800 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <div className="text-center mb-12">
          <h2 className="text-xs tracking-[0.4em] text-[#94A3B8] uppercase mb-4">Welcome to</h2>
          <h1 className="text-4xl font-black text-[#FB7185] tracking-tight">AMUSE</h1>
        </div>

        <button
          onClick={handleKakaoLogin}
          className="mb-4 w-full flex items-center justify-center gap-3 bg-white/90 hover:bg-[#ffffff] text-[#3c1e1e] py-3 px-4 rounded-sm text-sm font-medium transition-all"
        >
          <img
            src={amuse}
            alt="amuse"
            className="w-5 h-5"
          />
          Amuse 회원 가입
        </button>
        <button
          onClick={handleKakaoLogin}
          className="w-full flex items-center justify-center gap-3 bg-[#f9e000]/90 hover:bg-[#f9e000] text-[#3c1e1e] py-3 px-4 rounded-sm text-sm font-medium transition-all"
        >
           <img
            src={kakaoIcon}
            alt="kakao"
            className="w-5 h-5"
          />
          카카오 로그인
        </button>
        
        <p className="mt-8 text-center text-xs text-[#94A3B8] tracking-widest leading-relaxed">
          당신의 문장이 예술이 되는 순간
        </p>
      </div>
    </div>
  );
}
