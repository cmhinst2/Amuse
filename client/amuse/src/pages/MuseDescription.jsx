import React, { useState } from 'react'
import { Sidebar } from '../components/Form'
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, MessageCircle, Heart, ChevronLeft, Quote, MapPin, X, UserCircle, ArrowRight } from 'lucide-react';
import { getJosa, getServerBaseUrl, replaceNicknameWithJosa } from '../api/util';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import amuseAPI from '../api/amuseAPI';
import { toast } from 'sonner';
import { useCharacter } from '../hooks/useCharacter';

const MuseDescription = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // state
  const [activeSlide, setActiveSlide] = useState(0);
  const { id, nickname } = useAuthStore(state => state.userInfo);
  const [isNicknameOpen, setIsNicknameOpen] = useState(false);

  // data fetch
  const { data, isLoading } = useCharacter(characterId, {
    enabled: !!characterId,
    staleTime: 1000 * 60 * 5,
  });

  const novel = data;
  const character = data?.mainChar;

  const slides = [
    { url: novel?.coverImageUrl, pos: novel?.coverImagePosY, label: 'Cover' },
    { url: character?.profileImageUrl, pos: character?.profileImagePosY, label: 'Profile' }
  ];

  // mutate
  // Muse 채팅방 생성
  const { mutate: createChatRoom } = useMutation({
    mutationFn: (nickname) => {
      const processedContent = replaceNicknameWithJosa(
        novel.mainChar.firstSceneContent,
        nickname
      );
      return amuseAPI.post(`/api/muse/create`, {
        userId: id,
        novelId: novel.id,
        characterId: novel.mainChar.id,
        userNickname: nickname,
        scenarioId: 1,
        scenarioStep: 0,
        firstSceneLocation: novel.mainChar.firstSceneLocation,
        firstSceneContent: processedContent
      });
    },
    onSuccess: (newRoom) => {
      const { roomId, novelId, userId } = newRoom.data;
      queryClient.setQueryData(['muse', 'chatRoom', 'detail', String(roomId)], newRoom.data);
      queryClient.invalidateQueries({ queryKey: ['muse', 'chatRoom', 'list', userId] }); // 뮤즈리스트 캐시 무효화
      navigate(`/muse/${novelId}/chat/${roomId}`);
    },
    onError: (error) => {
      console.error("실제 발생한 에러:", error);
      toast("💥 채팅방 생성 중 오류 발생", {
        style: {
          backgroundColor: '#ea4747',
          color: '#F1F5F9'
        }
      })
    }
  });

  // 채팅 방 생성 및 이동
  const handleCreateChatRoom = (nickname) => {
    createChatRoom(nickname);
  }

  // 리메이크 설명 화면으로 이동
  const handleRemakeNovel = () => {
    navigate(`/muse/${novel.id}/novel/${roomId}`);
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="relative h-[70vh] min-h-[600px] w-full overflow-hidden bg-[#020617]">

          <AnimatePresence mode="wait">
            <motion.img
              key={`bg-${activeSlide}`}
              src={getServerBaseUrl(slides[activeSlide].url)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-[80px]"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/20 via-[#0f172a]/40 to-[#0f172a]" />

          <div className="relative h-full max-w-7xl mx-auto px-12 flex items-center gap-20 z-10">

            <div className="relative shrink-0">
              <div className="relative w-[340px] aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.7)] border border-white/5 bg-slate-900">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeSlide}
                    src={getServerBaseUrl(slides[activeSlide].url)}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: `center ${slides[activeSlide].pos}%` }}
                  />
                </AnimatePresence>
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#1e293b]/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
                <button onClick={() => setActiveSlide(0)} className={`w-2 h-2 rounded-full transition-all ${activeSlide === 0 ? 'w-6 bg-[#fb7185]' : 'bg-slate-600'}`} />
                <button onClick={() => setActiveSlide(1)} className={`w-2 h-2 rounded-full transition-all ${activeSlide === 1 ? 'w-6 bg-[#fb7185]' : 'bg-slate-600'}`} />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col justify-center flex-1 space-y-8"
            >
              <div className="flex flex-wrap gap-2 text-sm font-medium text-[#fb7185]/80">
                {novel?.tags.map((tag, idx) => (
                  <span key={idx} className="text-lg bg-[#fb7185]/10 px-3 py-1 rounded-full border border-[#fb7185]/20">
                    # {tag}
                  </span>
                ))}
              </div>
              <div className="space-y-4">
                <h1 className="text-7xl font-black text-white tracking-tighter leading-[0.9]">
                  {activeSlide === 0 ? novel?.title : character.name}
                </h1>
                <p className="text-xl text-slate-300 font-medium leading-relaxed max-w-2xl italic">
                  {activeSlide === 0 ? novel?.description : '"' + character.statusMessage + '"'}
                </p>
              </div>

              <div className="flex gap-5 pt-4">
                <button onClick={() => setIsNicknameOpen(true)} className="flex-1 max-w-[200px] h-16 bg-[#fb7185] hover:bg-[#f43f5e] text-white rounded-2xl font-black text-lg shadow-2xl shadow-rose-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                  <MessageCircle fill="currentColor" size={20} /> 채팅하기
                </button>
                <button onClick={() => handleRemakeNovel()} className="flex-1 max-w-[200px] h-16 bg-[#1e293b] hover:bg-[#334155] text-[#F1F5F9] rounded-2xl font-black text-lg border border-[#334155] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                  <BookOpen size={20} /> 리메이크 시작
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-12 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

            <div className="lg:col-span-2 space-y-16">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl font-black text-white">시놉시스</h2>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-[#fb7185] to-transparent opacity-30" />
                </div>
              </div>

              <div className="group relative p-10 bg-[#1e293b]/30 rounded-[2.5rem] border border-[#334155] hover:border-[#fb7185]/30 transition-all duration-500">
                <Quote className="absolute top-8 right-10 text-[#fb7185] opacity-20 group-hover:opacity-40 transition-opacity" size={60} />

                <h3 className="text-[#94a3b8] text-xs font-black uppercase tracking-[0.3em] mb-8">First Scene Preview</h3>

                <p className="text-xl leading-[2] text-slate-200 whitespace-pre-wrap">
                  {replaceNicknameWithJosa(character?.firstSceneContent, nickname)}
                </p>

                <div className="mt-12 pt-8 border-t border-[#334155] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#94a3b8] font-bold">
                    <MapPin size={18} className="text-[#fb7185]" />
                    <span>{character?.firstSceneLocation}</span>
                  </div>
                  <span className="text-[10px] text-[#fb7185] font-black tracking-widest bg-[#fb7185]/10 px-3 py-1 rounded-full border border-[#fb7185]/20">
                    NARRATIVE MODE
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="sticky top-8 p-8 bg-gradient-to-b from-[#1e293b]/80 to-[#1e293b]/40 rounded-[2.5rem] border border-[#334155] backdrop-blur-xl shadow-2xl">
                <h4 className="text-[#94a3b8] text-[10px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#fb7185] shadow-[0_0_8px_#fb7185]" />
                  Author & Insights
                </h4>

                <div className="space-y-10">
                  <div className="flex items-center gap-5 group/author">
                    <div className="relative">
                      <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#fb7185] to-purple-600 rounded-full blur opacity-20 group-hover/author:opacity-60 transition duration-500" />
                      <div className="relative w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-[#fb7185] to-[#334155]">
                        <div className="w-full h-full rounded-full bg-[#0f172a] overflow-hidden">
                          <img
                            src={novel?.profileImg || "/default-avatar.png"}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/author:scale-110"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[#94a3b8] text-[10px] font-black mb-0.5">WRITTEN BY</div>
                      <div className="text-xl font-black text-white group-hover/author:text-[#fb7185] transition-colors">
                        {novel?.authorName}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-[#94a3b8]">
                      <span>AUTHOR'S COMMENT</span>
                      <span className="text-[#fb7185]">OFFICIAL</span>
                    </div>
                    <div className="relative p-6 rounded-3xl bg-[#0f172a]/60 border border-[#334155] group-hover:border-[#fb7185]/20 transition-all">
                      <p className="text-[15px] text-slate-400 leading-relaxed italic">
                        {novel?.authorNote || "작가의 한 마디가 등록되지 않았습니다."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <NicknameInputModal
        isOpen={isNicknameOpen}
        characterName={novel.mainChar.name}
        onClose={() => setIsNicknameOpen(false)}
        onConfirm={(nickname) => {
          handleCreateChatRoom(nickname);
          setIsNicknameOpen(false);
        }}
      />
    </div>
  )
}

// 닉네임 입력용 모달
const NicknameInputModal = ({ isOpen, onClose, onConfirm, characterName }) => {
  const [nickname, setNickname] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2) {
      alert("닉네임은 최소 2글자 이상이어야 합니다.");
      return;
    }
    onConfirm(trimmedNickname);
  };



  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#334155] rounded-full flex items-center justify-center text-[#FB7185]">
              <UserCircle size={40} />
            </div>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-[#F1F5F9] mb-2">
              당신의 이름은 무엇인가요?
            </h3>
            <p className="text-[#94A3B8] text-sm">
              <span className="text-[#FB7185] font-semibold">{getJosa(characterName, '이', '가')}</span> 당신을 부를 이름이 됩니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요 (2~10자)"
                maxLength={10}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-5 py-4 text-[#F1F5F9] outline-none focus:border-[#FB7185] ring-inset focus:ring-1 focus:ring-[#FB7185] transition-all placeholder:text-[#94A3B8]"
              />
            </div>

            <button
              type="submit"
              disabled={nickname.trim().length < 2}
              className="w-full bg-[#FB7185] hover:bg-[#e11d48] active:scale-[0.98] disabled:bg-[#334155] disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              뮤즈 만들기 시작
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MuseDescription
