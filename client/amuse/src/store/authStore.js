import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      // 상태
      accessToken: null,
      userInfo: null,
      isLoggedIn: false,

      // 액션
      // 로그인 성공 시 호출
      login: (token, user) => set({ 
        accessToken: token, 
        userInfo: user, 
        isLoggedIn: true 
      }),

      // 로그아웃 시 호출
      logout: () => set({ 
        accessToken: null, 
        userInfo: null, 
        isLoggedIn: false 
      }),

      // 토큰만 갱신할 때 (Refresh)
      setAccessToken: (token) => set({ accessToken: token }),
    }),
    {
      name: 'amuse-auth-storage', // localStorage에 저장될 키 이름
    }
  )
);

export default useAuthStore;