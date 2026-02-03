import { Sidebar } from "../components/Form";
import React, { useState, useRef } from 'react';
import { Heart, Send, MapPin, BookOpen, Type, X } from 'lucide-react';
import { getServerBaseUrl, handleAddParentheses } from "../api/util";
import { useParams } from "react-router-dom";
import { useChatRoom } from "../hooks/useChatRoom";
import { LoadingScreen } from "../components/Spinner";
import { FormatContent } from "../components/Common";

export function MuseChat() {
  const { novelId, roomId } = useParams();
  // <Ref>
  const textareaRef = useRef(null);

  // <States>
  const [userInput, setUserInput] = useState(''); // 사용자 입력 상태값
  const [isOpenProfileModal, setIsOpenProfileModal] = useState(false);

  const { data: chatRoom, isLoading, isError } = useChatRoom(roomId);

  if (isLoading) <LoadingScreen text="Muse와의 대화를 불러오는중..." />

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a] gap-10">
        <header className="h-[90px] shrink-0 sticky sticky top-0 z-20 flex items-center justify-center bg-[#0f172a]/95 backdrop-blur-md border-b border-[#1e293b]">
          <div className="min-w-[900px] flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-[#FB7185] tracking-tight">{chatRoom.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <MapPin size={15} className="text-[#2DD4BF]" />
                <span className="text-[15px] text-[#94A3B8]">현재 장소: {chatRoom.currentLocation}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <div className="flex justify-between w-full">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-[#FB7185]/10 text-[#FB7185] border border-[#FB7185]/20 shadow-[0_0_10px_rgba(251,113,133,0.1)]">
                  {chatRoom.relationshipStatus || '낯선 사람'}
                </span>
                <section className="flex items-center gap-2 ">
                  <div className="relative">
                    <Heart size={15} className="text-[#FB7185] fill-[#FB7185] animate-pulse" />
                    <div className="absolute inset-0 bg-[#FB7185] blur-[6px] opacity-40 animate-pulse" />
                  </div>
                  <span className="text-[15px] font-black text-[#F1F5F9] tabular-nums">
                    {chatRoom.currentScore}%
                  </span>
                </section>
              </div>

              <div className="w-48 h-2 bg-[#0f172a] rounded-full overflow-hidden border border-[#334155]/50 p-[1px]">
                <div
                  className="h-full bg-gradient-to-r from-[#FB7185] to-[#f43f5e] rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(251,113,133,0.5)]"
                  style={{ width: `${chatRoom.currentScore}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 flex flex-col min-h-[500px] items-center overflow-y-auto custom-scrollbar p-8 space-y-6">
          <div className="w-[900px]">
            <div className="flex justify-center">
              <span className="bg-[#1e293b] text-[#94A3B8] text-[14px] px-3 py-1 rounded-full border border-[#334155]">
                {chatRoom.name}과의 첫 만남
              </span>
            </div>

            <div className="text-[#94A3B8] text-ms py-10 px-20 whitespace-pre-wrap">
              <FormatContent text={chatRoom.lastMessage} />
            </div>

            <div className="flex gap-3 max-w-[70%] items-start mb-10">
              <div onClick={() => setIsOpenProfileModal(true)}
                className="group w-20 h-20 rounded-full bg-[#334155] shrink-0 border border-[#1e293b] overflow-hidden cursor-pointer transition-all duration-300 hover:border-[#3730a3] hover:shadow-[0_0_15px_rgba(251,113,133,0.4)] hover:scale-105 active:scale-95">
                <img
                  src={getServerBaseUrl(chatRoom.profileImageUrl)}
                  alt="profile"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  style={{ objectPosition: `center ${chatRoom.profileImagePosY}%` }}
                />
              </div>

              <div className="bg-[#4f46e5] p-4 rounded-2xl rounded-tl-none border border-[#334155] shadow-[0_4px_12px_rgba(251,113,133,0.3)]">
                <p className="text-ms leading-relaxed whitespace-pre-wrap">
                  뭐라할까ㄴㅎ ㄴㅇㅎㄴㅇㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎㅎ
                </p>
              </div>
            </div>

            <div className="flex justify-end mb-10">
              <div className="bg-[#1e293b] p-4 rounded-2xl rounded-tr-none shadow-lg max-w-[70%]">
                <p className="text-ms font-medium text-white whitespace-pre-wrap">
                  어쩔티비
                </p>
              </div>
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
        {isOpenProfileModal && <ProfileDetailModal onClose={() => setIsOpenProfileModal(false)} chatRoom={chatRoom} />}
      </main>
    </div>
  );
}

export const ProfileDetailModal = ({ chatRoom, onClose }) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <article
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden bg-[#1e293b] rounded-3xl border border-[#334155] shadow-2xl animate-in fade-in zoom-in duration-300"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-30 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-[#F1F5F9] transition-all"
        >
          <X size={20} />
        </button>

        <div className="relative h-64 w-full bg-[#0f172a] overflow-hidden">
          <img
            src={getServerBaseUrl(chatRoom.profileImageUrl)}
            alt={chatRoom.name}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            style={{ objectPosition: `center ${chatRoom.profileImagePosY}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent" />
        </div>

        <div className="px-6 pb-8 pt-4 flex flex-col items-center text-center">
          <h2 className="text-2xl font-black text-[#F1F5F9] tracking-tight mb-1">
            {chatRoom.name}
          </h2>

          <div className="flex items-center gap-1.5 mb-4">
            <MapPin size={14} className="text-[#2DD4BF]" />
            <span className="text-sm text-[#94A3B8]">{chatRoom.currentLocation}</span>
          </div>

          <div className="w-full bg-[#0f172a]/50 border border-[#334155] rounded-2xl p-4 mb-6 relative">
            <p className="text-[#F1F5F9] text-[15px] leading-relaxed italic">
              "{chatRoom.statusMessage || '상태 메시지가 없습니다.'}"
            </p>
          </div>

          <div className="w-full space-y-3">
            <div className="flex justify-between items-end px-1">
              <div className="flex items-center gap-1.5">
                <Heart size={18} className="text-[#FB7185] fill-[#FB7185]" />
                <span className="text-sm font-bold text-[#FB7185]">Affinity Level</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-[#FB7185]/10 text-[#FB7185] border border-[#FB7185]/20 shadow-[0_0_10px_rgba(251,113,133,0.1)]">
                  {chatRoom.relationshipStatus || '낯선 사람'}
                </span>
              </div>
              <span className="text-xl font-black text-[#F1F5F9]">{chatRoom.currentScore}%</span>
            </div>

            <div className="w-full h-3 bg-[#0f172a] rounded-full p-0.5 border border-[#334155]">
              <div
                className="h-full bg-gradient-to-r from-[#FB7185] to-[#f43f5e] rounded-full shadow-[0_0_10px_rgba(251,113,133,0.4)] transition-all duration-1000"
                style={{ width: `${chatRoom.currentScore}%` }}
              />
            </div>
            <p className="text-[12px] text-[#94A3B8] text-right">
              다음 단계까지 120 EXP 남음
            </p>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-[#FB7185] hover:bg-[#f43f5e] text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20 active:scale-95"
          >
            대화 계속하기
          </button>
        </div>
      </article>
    </div>
  );
};
