import { Sidebar } from "../components/Form";
import React, { useState, useRef, useEffect } from 'react';
import { Heart, Send, MapPin, BookOpen, Info, Type } from 'lucide-react';
import { handleAddParentheses } from "../api/util";
import { useQuery } from "@tanstack/react-query";

export function MuseChat() {
  // const { novelId, characterId } = useParams();
  // <Ref>
  const textareaRef = useRef(null);

  // <States>
  const [userInput, setUserInput] = useState(''); // 사용자 입력 상태값

  // <Data fetch>
  // const { data, isError, error } = useQuery({
  //   queryKey: ['muse', 'chatRoom', 'detail', roomId],
  //   queryFn: fetchChatRoom,
  //   retry: false // 404 에러일 경우 굳이 재시도할 필요가 없으므로
  // });

  // if (isError) {
  //   // 서비스에서 던진 "해당 채팅방을 찾을 수 없습니다" 메시지가 출력됨
  //   alert(error.response?.data?.message || "채팅방을 찾을 수 없습니다.");
  // }

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a]">
        <header className="h-[70px] shrink-0 sticky sticky top-0 z-20 flex items-center justify-between px-8 py-4 bg-[#0f172a]/95 backdrop-blur-md border-b border-[#1e293b]">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-[#FB7185] tracking-tight">캐릭터 이름</h1>
            <div className="flex items-center gap-2 mt-1">
              <MapPin size={12} className="text-[#2DD4BF]" />
              <span className="text-[11px] text-[#94A3B8]">현재 장소: 도서관 휴게실</span>
            </div>
          </div>

          {/* 호감도 게이지 섹션 */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-[#FB7185] fill-[#FB7185] animate-pulse" />
              <span className="text-sm font-bold text-[#F1F5F9]">호감도 65%</span>
            </div>
            <div className="w-48 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#FB7185] to-[#f43f5e] w-[65%]" />
            </div>
          </div>
        </header>

        <section className="flex-1 flex flex-col min-h-[500px] overflow-y-auto custom-scrollbar p-8 space-y-6">
          {/* 시스템 메시지/시나리오 시작 */}
          <div className="flex justify-center">
            <span className="bg-[#1e293b] text-[#94A3B8] text-[11px] px-3 py-1 rounded-full border border-[#334155]">
              시나리오 #1: 우연한 만남이 시작되었습니다.
            </span>
          </div>

          {/* 지문 (ACTION) 예시 */}
          <div className="flex justify-center italic text-[#94A3B8] text-sm py-2">
            (그녀는 책장을 넘기다 말고 고개를 들어 당신을 빤히 바라본다.)
          </div>

          {/* 캐릭터 대사 (TALK) 예시 */}
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-[#334155] shrink-0 border border-[#FB7185]/30 overflow-hidden">
              <img src="/api/placeholder/100/100" alt="profile" />
            </div>
            <div className="bg-[#1e293b] p-4 rounded-2xl rounded-tl-none border border-[#334155] shadow-lg">
              <p className="text-sm leading-relaxed">
                "어라, 여기서 또 보네요? 혹시 저 따라오신 거예요?"
              </p>
            </div>
          </div>

          {/* 사용자 대답 예시 */}
          <div className="flex justify-end">
            <div className="bg-[#FB7185] p-4 rounded-2xl rounded-tr-none shadow-[0_4px_12px_rgba(251,113,133,0.3)] max-w-[80%]">
              <p className="text-sm font-medium text-white">
                "아니요, 저도 이 책을 찾으러 왔을 뿐인데요."
              </p>
            </div>
          </div>
        </section>

        {/* 하단 입력부 */}
        <footer className="shrink-0 p-6 border-t border-[#1e293b]">
          <div className="max-w-4xl mx-auto relative flex flex-col items-center gap-3">
            <section className="flex w-full gap-2">
              {/* !상황, !속마음 */}
              <button
                onClick={() => handleAddParentheses(textareaRef, setUserInput)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-[#334155] bg-[#1e293b] text-[#94A3B8] hover:bg-[#4f46e5] hover:text-[#F1F5F9] hover:border-[#F1F5F9]/30 transition-all animate-fadeIn"
              >
                <Type size={14} />
                (행동 입력)
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-[#334155] bg-[#1e293b] text-[#94A3B8] hover:bg-[#4f46e5] hover:text-[#F1F5F9] hover:border-[#F1F5F9]/30 transition-all animate-fadeIn">상황</button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-[#334155] bg-[#1e293b] text-[#94A3B8] hover:bg-[#4f46e5] hover:text-[#F1F5F9] hover:border-[#F1F5F9]/30 transition-all animate-fadeIn">속마음</button>
            </section>
            <section className="flex w-full gap-3">
              <button className="p-2 text-[#94A3B8] hover:text-[#FB7185] transition-colors">
                <BookOpen size={25} />
              </button>
              <div className="flex-1 relative">
                <input
                  ref={textareaRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  type="text"
                  placeholder="(괄호) 안에 행동을 입력할 수 있어요"
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-full py-3 px-6 pr-12 focus:outline-none focus:border-[#FB7185] focus:ring-1 focus:ring-[#FB7185] transition-all text-sm"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#FB7185] rounded-full text-white hover:bg-[#f43f5e] transition-all shadow-lg">
                  <Send size={16} />
                </button>
              </div>
            </section>
          </div>
        </footer>
      </main>
    </div>
  );
}
