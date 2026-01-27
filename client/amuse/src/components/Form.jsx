import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuthStore from '../store/authStore';
import axiosAPI from '../api/axiosAPI';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const store = useAuthStore((state) => state.userInfo);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const user = {
    nickname: store?.nickname,
    profileImg: store?.profileImage || null, // 이미지가 없을 때를 대비
  };

  const handleLogout = async () => {
    try {
      await axiosAPI.post("/api/auth/logout", {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

    } catch (error) {
      console.error("로그아웃 중 문제 발생 :", error);
    } finally {
      setIsMenuOpen(false);
      logout();
      navigate('/login'); // 로그인 페이지로 이동 시 사용
    }
  };

  // 드롭다운 외부 클릭 시 닫기 로직
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-[#0f172a]/80 backdrop-blur-md border-b border-[#1e293b] px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-10">
        <Link to="/" className="text-2xl font-black text-[#FB7185] tracking-tight">
          AMUSE
        </Link>

        <nav className="hidden md:flex gap-8 text-[13px] tracking-widest text-[#94A3B8]">
          <Link to="/library" className="hover:text-[#F1F5F9] transition-colors">도서관</Link>
          <Link to="/notice" className="hover:text-[#F1F5F9] transition-colors">공지사항</Link>
          <Link to="/event" className="hover:text-[#F1F5F9] transition-colors">이벤트</Link>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        {/* 검색창 영역 */}
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="이야기를 찾아보세요"
            className="w-56 bg-[#1e293b] text-xs text-[#F1F5F9] pl-4 pr-10 py-2 rounded-full border border-[#334155] 
            focus:outline-none focus:border-[#FB7185] transition-all placeholder:text-[#94A3B8]"
          />
        </div>

        {/* 알림 버튼 */}
        {!isLoggedIn ?
          <button className="text-[#FB7185] font-bold" onClick={() => navigate('/login')}>로그인</button> :
          <button className="text-[#94A3B8] hover:text-[#FB7185] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        }

        {/* --- 사용자 프로필 & 드롭다운 영역 --- */}
        {store?.nickname &&
          <div className="relative z-[60]" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 pl-3 py-1 pr-1 rounded-full bg-[#1e293b] border border-[#334155] hover:border-[#FB7185]/50 transition-all focus:outline-none"
            >
              <span className="hidden lg:block text-xs font-bold text-[#F1F5F9]">{user.nickname}</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FB7185] to-[#334155] p-[2px]">
                <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden">
                  {user.profileImg ? (
                    <img src={user.profileImg} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-[#FB7185]">A</span>
                  )}
                </div>
              </div>
            </button>

            {/* 로그아웃 드롭다운 메뉴 */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-44 bg-[#1e293b] border border-[#334155] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-2 animate-fadeIn z-[70] overflow-hidden">
                <div className="px-4 py-2 border-b border-[#334155]/50 mb-1">
                  <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">Account</p>
                  <p className="text-xs font-bold text-[#F1F5F9] truncate">{user.nickname}</p>
                </div>

                <Link
                  to="/setting"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-xs text-[#F1F5F9] hover:bg-[#334155] transition-colors"
                >
                  마이페이지 설정
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-[#334155] transition-colors mt-1"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        }
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#0f172a] border-t border-slate-800 py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-slate-500 text-sm">
          © 2026 <span className="text-slate-300 font-bold">AMUSE</span> Inc. All rights reserved.
        </div>
        <div className="flex gap-6 text-xs text-slate-500 font-medium">
          <a href="#" className="hover:text-slate-300 transition-colors">이용약관</a>
          <a href="#" className="hover:text-slate-300 transition-colors">개인정보처리방침</a>
          <a href="#" className="hover:text-slate-300 transition-colors">고객센터</a>
        </div>
      </div>
    </footer>
  );
}

export function Sidebar() {

  const menuItems = [
    { name: '홈', path: '/' },
    { name: '나의 Muse', path: '/muse' },
    { name: '내 스튜디오', path: '/studio' },
    { name: '관심 목록', path: '/favorites' },
    { name: '티켓', path: '/ticket' },
    { name: '설정', path: '/setting' }
  ];

  return (
    <aside className="w-60 h-full bg-[#1e293b] border-r border-[#334155]/20 flex flex-col pt-10">
      <div className="flex-1 px-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-4 px-4 py-3 text-sm font-bold tracking-[0.1em] transition-all rounded-xl
                  ${isActive
                    ? 'bg-[#334155] text-[#FB7185] shadow-lg' // 활성화 시: 입력창색 배경 + 로즈색 글씨
                    : 'text-[#94A3B8] hover:bg-[#334155]/50 hover:text-[#F1F5F9]' // 비활성 시: 보조 텍스트색
                  }
                `}
              >
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}