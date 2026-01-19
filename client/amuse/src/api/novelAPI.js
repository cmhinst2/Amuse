import axios from "axios";

const novelAPI = axios.create({
  baseURL: "http://localhost/",
  withCredentials: true
});

// 요청 인터셉터 : 서버로 보내기 직전에 가로채서 헤더를 붙임
novelAPI.interceptors.request.use(
  (config) => {
    // 로컬 스토리지에서 토큰 가져오기 (저장하신 위치에 맞게 수정)
    const storageData = JSON.parse(localStorage.getItem('amuse-auth-storage')); 
    
    if (storageData) {
      // 헤더에 토큰 추가
      config.headers.Authorization = `Bearer ${storageData.state.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 : 서버에서 응답오면 가로채서 401, 403인지 검사
novelAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 에러 응답이 왔을 때 실행 (401, 403 등)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error("인증이 만료되었거나 권한이 없습니다. 로그아웃 처리합니다.");
      localStorage.removeItem('amuse-auth-storage');
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default novelAPI;