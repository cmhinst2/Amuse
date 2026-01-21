import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from "react";
import novelAPI from "../api/novelAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "../components/Form";
import { Heart, Loader2, Menu, PenLine, Sparkles, Type } from "lucide-react";
import { LoadingScreen } from "../components/Spinner";
import { FormatContent } from "../components/Common";
import { getJosa } from "../api/converter";

// 집필화면
export function StudioWriteContent() {
  const { novelId } = useParams(); // url의 novelId 얻어오기
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // <Refs>
  const mainScrollRef = useRef(null); // 실제 스크롤되는 <main> 태그용
  const bottomRef = useRef(null);     // 맨 아래 도착지점용
  const textareaRef = useRef(null); // textarea Ref

  // <States>
  const [userInput, setUserInput] = useState(''); // 사용자 입력 상태값
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 모바일에서 Sidebar 토글용
  const [isAutoMode, setIsAutoMode] = useState(false); // 자동 전개 모드 상태
  const [levelUpData, setLevelUpData] = useState({ isOpen: false, newLevel: '' }); // 레벨업모달 상태값

  // <Data fetch>
  // 소설 첫 장면 데이터 fetch - 제목, 캐릭터 이름, 호감도 등 (TanStack Query)
  const { data: novelData, isLoading: isNovelLoading, isError } = useQuery({
    queryKey: ['novel', novelId],
    queryFn: () => novelAPI.get(`/api/novel/${novelId}`).then(res => res.data),
    enabled: !!novelId, // novelId가 있을 때만 실행
    staleTime: 1000 * 60 * 5, // 5분간 데이터를 유지
  });

  // 이전 소설 장면 fetch
  const { data: scenes = [], isLoading: isScenesLoading } = useQuery({
    queryKey: ['novel', 'scenes', novelId],
    queryFn: () => novelAPI.get(`/api/novel/${novelId}/scenes`).then(res => res.data),
    enabled: !!novelId,
    staleTime: 1000 * 60 * 5,
    select: (data) => data.map(s => {
      // 역슬래시 이스케이프 제거
      let cleanedContent = s.content.replace(/\\"/g, '"');

      // 대사(큰따옴표) 앞뒤로 개행 추가
      // 정규표현식 설명: ("[^"]*") -> 큰따옴표로 시작해서 큰따옴표로 끝나는 덩어리 찾기
      // $1은 찾은 대사 본문을 의미하며, 앞뒤에 \n을 붙임
      cleanedContent = cleanedContent
        .replace(/("[^"]*")/g, '\n\n$1\n\n') // 대사 앞뒤 개행 삽입
        .replace(/\n\s*\n/g, '\n\n')    // 연속된 개행 정리 (너무 많이 벌어지는 것 방지)
        .trim();                         // 앞뒤 불필요한 공백 제거

      return { ...s, content: cleanedContent };
    })
  });

  // <최적화>
  const mainCharacter = useMemo(() =>
    novelData?.characters?.find(c => c.role === 'MAIN') || { name: '캐릭터', affinity: 0 }, [novelData]);
  const relation = useMemo(() => getRelationLevel(mainCharacter.affinity), [mainCharacter.affinity]);

  // <Mutaion(수정 요청처리)>
  const { mutate, isPending } = useMutation({
    mutationFn: (payload) => novelAPI.post('/api/novel/generate', payload).then(res => res.data),
    onSuccess: (newScene) => {
      console.log(newScene);
      // 캐시 업데이트
      queryClient.setQueryData(['novel', 'scenes', novelId], (old) => [...(old || []), newScene]);
      queryClient.setQueryData(['novel', novelId], (oldNovel) => {
        if (!oldNovel) return oldNovel;
        return {
          ...oldNovel,
          characters: oldNovel.characters.map(char =>
            char.role === 'MAIN'
              ? { ...char, affinity: newScene.affinity } // 최신 호감도로 교체
              : char
          )
        };
      });

      // levelUp이 true일때 레벨업 모달호출
      if (newScene.levelUp) {
        document.body.classList.add('flash-effect');
        setTimeout(() => document.body.classList.remove('flash-effect'), 500);
        setLevelUpData({ isOpen: true, newLevel: newScene.relationshipLevel });
      }

      // 입력창 초기화
      setUserInput('');
      setIsAutoMode(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    },
    onError: () => alert(`${getJosa(mainCharacter.name, "이", "가")} 대답을 망설이고 있네요. 다시 시도해 주세요.`)
  });

  // <Effects>
  // 소설 못찾았을 때
  useEffect(() => {
    if (isError) {
      alert("존재하지 않는 소설입니다.");
      navigate('/studio');
    }
  }, [isError, navigate]);

  // 자동 스크롤 하단 유지
  useEffect(() => {
    if (bottomRef.current) {
      const timer = setTimeout(() => {
        // scrollIntoView는 브라우저 레이아웃이 끝난 뒤 실행되어야 정확합니다.
        bottomRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      }, 200); // 애니메이션 시간을 고려해 약간 넉넉히 잡습니다.

      return () => clearTimeout(timer);
    }
  }, [scenes, isPending]); // 데이터 변경,응답 중 상태 모두 감시

  // <Handlers>
  // AI에게 사용자의 내용 전달 or 자동전개 요청
  const handleSend = () => {
    const trimmedInput = userInput.trim();
    if (!isAutoMode && !trimmedInput) return; // 자동모드가 아닌데 사용자 입력 비었을 때

    mutate({
      novelId: novelData.id,
      mode: isAutoMode ? 'AUTO' : 'USER',
      content: trimmedInput,
      lastSceneId: scenes[scenes.length - 1]?.id, // 마지막 장면 ID (서사 연속성 유지)
    });
  };

  // <etcFn>
  // textarea 창 도우미 버튼 핸들러
  const handleAddParentheses = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart: start, selectionEnd: end } = textarea;
    const nextText = userInput.substring(0, start) + '()' + userInput.substring(end);
    setUserInput(nextText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 1);
    }, 0);
  };

  // 로딩 중 스피너
  if (isNovelLoading || isScenesLoading) return <LoadingScreen text={mainCharacter.name ? `${getJosa(mainCharacter.name, "을", "를")} 불러오는 중입니다...` : "세계관을 불러오는 중입니다..."} />

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 flex items-center justify-between px-6 bg-[#1e293b]/80 border-b border-[#1e293b] backdrop-blur-md z-10">
          <div className="flex items-center gap-4 min-w-0">
            <button className="md:hidden text-[#94A3B8] hover:text-[#F1F5F9]" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="font-bold text-lg truncate text-[#F1F5F9]">{novelData?.title} <span className="text-sm font-normal text-slate-400">({mainCharacter.name})</span></h2>
          </div>

          <div className="flex items-center gap-3">
            {/* 관계 등급 */}
            <div className="hidden sm:flex flex-col items-end px-3 border-r border-[#334155]">
              <span className="text-[10px] text-[#94A3B8] uppercase tracking-tighter">Relation</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold" style={{ color: relation.color }}>{relation.level}단계</span>
                <span className="text-sm font-medium text-[#F1F5F9]">{relation.name}</span>
              </div>
            </div>

            {/* 실시간 호감도 점수 */}
            <div className="flex items-center gap-2 bg-[#0f172a]/50 px-3 py-1.5 rounded-full border border-[#334155] shadow-inner">
              <Heart size={14} className="text-[#FB7185] fill-[#FB7185]" />
              <span className="text-sm font-bold text-[#FB7185] tabular-nums">{mainCharacter.affinity}</span>
            </div>
          </div>
        </header>

        <main ref={mainScrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto px-6 py-12 space-y-16">
            {scenes.map((scene) => <SceneArticle key={scene.id} content={scene.content} />)}
            <div className="h-60" />
            <div ref={bottomRef} className="h-1" />
          </div>
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent">
          <div className="max-w-3xl mx-auto">
            <EditorToolbar
              isPending={isPending}
              isAutoMode={isAutoMode}
              setIsAutoMode={setIsAutoMode}
              onAddParentheses={handleAddParentheses}
            />

            <EditorInput
              mainCharacter={mainCharacter}
              textareaRef={textareaRef}
              userInput={userInput}
              setUserInput={setUserInput}
              isAutoMode={isAutoMode}
              isPending={isPending}
              onSend={handleSend}
            />
            <div className="flex items-center justify-center gap-1.5 mt-3 opacity-60">
              <Sparkles size={12} className="text-[#FB7185]" />
              <p className="text-[12px] text-center text-[#94A3B8] opacity-60">
                {isAutoMode
                  ? "현재 자동 전개 모드입니다. 다소 스토리의 일관성이 떨어질 수 있습니다."
                  : "현재 직접 작성 모드입니다. 주인공의 대사와 행동을 직접 결정하세요."}
              </p>
            </div>
          </div>
        </footer>
      </div>

      <LevelModal
        isOpen={levelUpData.isOpen}
        newLevel={levelUpData.newLevel}
        onClose={() => setLevelUpData({ ...levelUpData, isOpen: false })}
      />

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
}

// 장면 렌더링 컴포넌트
const SceneArticle = ({ content }) => (
  <article className="animate-fadeIn">
    <p className="font-novel text-base leading-[1.8] text-[#F1F5F9]/80 whitespace-pre-wrap tracking-wide">
      <FormatContent text={content} />
    </p>
  </article>
);

// 조건부 툴바 컴포넌트
const EditorToolbar = ({ isPending, isAutoMode, setIsAutoMode, onAddParentheses }) => {
  if (!isPending)
    return (<section className="flex items-center gap-2 mb-2">
      {!isAutoMode && (
        <button
          onClick={onAddParentheses}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-[#334155] bg-[#1e293b] text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#F1F5F9]/30 transition-all animate-fadeIn"
        >
          <Type size={14} />
          (지문 입력)
        </button>
      )}
      <button
        onClick={() => setIsAutoMode(!isAutoMode)}
        className={`flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-full border transition-all ${isAutoMode
          ? 'bg-[#FB7185] border-[#FB7185] text-white shadow-[0_0_10px_rgba(251,113,133,0.3)]'
          : 'bg-[#1e293b] border-[#334155] text-[#94A3B8] hover:border-[#FB7185]/50'
          }`}
      >
        <Sparkles size={14} className={isAutoMode ? "animate-pulse" : ""} />
        자동 전개 {isAutoMode ? 'ON' : 'OFF'}
      </button>
    </section>
    )
}

// 조건부 작성창 컴포넌트
const EditorInput = ({ mainCharacter, textareaRef, userInput, setUserInput, isAutoMode, isPending, onSend }) => {
  if (isPending) {
    return (
      <div className="flex p-4 bg-slate-900/50 rounded-lg border border-rose-500/30 animate-pulse">
        <p className="text-rose-400">{getJosa(mainCharacter.name, '이', '가')} 생각에 잠겼습니다...</p>
      </div>
    )
  } else {
    return (
      <div className={`items-center bg-[#1e293b] border rounded-2xl p-2 shadow-2xl flex items-end gap-2 transition-all duration-300
              ${isAutoMode ? 'border-[#FB7185] ring-1 ring-[#FB7185]/30' : 'border-[#334155] focus-within:border-[#FB7185]/50'}`}>
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          // 모드에 따라 placeholder 변경
          placeholder={
            isAutoMode
              ? "원하는 전개를 작성하면 AI가 이야기를 이어갑니다.(선택 사항)"
              : "대사는 그냥 쓰고, 지문은 (괄호) 안에 입력하세요."
          }
          className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-[#F1F5F9] placeholder-[#94A3B8] resize-none p-3 max-h-40 min-h-[52px]"
          rows="1"
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />

        <button
          className={`flex gap-2 p-3 rounded-xl transition-all active:scale-95 disabled:opacity-20 bg-[#FB7185] text-white'
                  ${isPending ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
          onClick={onSend}
          disabled={isPending || (!isAutoMode && !userInput.trim())}
        >
          {isPending ? <Loader2 className="animate-spin" /> :
            <>
              {isAutoMode ? <Sparkles size={18} /> : <PenLine size={18} />}
              <p className='text-sm'>전송</p>
            </>}
        </button>
      </div>
    )
  }
}

// 관계 등급
const getRelationLevel = (score) => {
  if (score >= 300) return { level: 4, name: "연인", color: "#FB7185" }; // 로즈
  if (score >= 200) return { level: 3, name: "썸", color: "#F472B6" };   // 핑크
  if (score >= 100) return { level: 2, name: "친구", color: "#60A5FA" }; // 블루
  return { level: 1, name: "지인", color: "#94A3B8" };               // 슬레이트
};

// 관계 등급 레벨 알림 모달
const LevelModal = ({ isOpen, onClose, newLevel }) => {
  // 등급별 한글 명칭 및 간단한 설명
  const levelInfo = {
    'ACQUAINTANCE': { name: '지인', desc: '서로의 존재를 인지하기 시작했습니다.' },
    'FRIEND': { name: '친구', desc: '함께 있으면 편안한 사이가 되었습니다.' },
    'SOME': { name: '썸', desc: '공기 중에 묘한 긴장감이 흐르기 시작합니다.' },
    'LOVER': { name: '연인', desc: '이제 서로가 없이는 안 되는 사이입니다.' },
  };

  const current = levelInfo[newLevel] || { name: newLevel, desc: '' };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* 배경 흐림 처리 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm"
          />

          {/* 모달 본체 */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#1e293b] border border-[#FB7185]/30 p-8 text-center shadow-2xl"
          >
            {/* 상단 빛 효과 */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#FB7185]/20 blur-[60px]" />

            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FB7185]/10 text-4xl"
            >
              ❤️
            </motion.div>

            <h3 className="mb-2 text-[#94A3B8] text-sm tracking-widest uppercase font-medium">
              Relationship Level Up
            </h3>

            <h2 className="mb-4 text-3xl font-bold text-[#F1F5F9]">
              {current.name}
            </h2>

            <p className="mb-8 text-[#94A3B8] leading-relaxed">
              {current.desc}
            </p>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-[#FB7185] py-4 font-bold text-white transition-all hover:bg-[#e11d48] active:scale-95 shadow-lg shadow-[#FB7185]/20"
            >
              관계를 이어가기
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};