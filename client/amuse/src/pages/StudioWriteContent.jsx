import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import novelAPI from "../api/novelAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "../components/Form";
import { Heart, Loader2, Menu, PenLine, Sparkles, Type } from "lucide-react";
import { LoadingScreen } from "../components/Spinner";
import { FormatContent } from "../components/Common";
import { getJosa } from "../api/converter";
import { useTypingEffect } from "../api/useTypingEffect";

// 관계 레벨 설정
const RELATION_CONFIG = {
  ACQUAINTANCE: {
    level: 1,
    name: "지인",
    desc: "서로의 존재를 인지하기 시작했습니다.",
    color: "#94A3B8",
    threshold: 0,
  },
  FRIEND: {
    level: 2,
    name: "친구",
    desc: "함께 있으면 편안한 사이가 되었습니다.",
    color: "#60A5FA",
    threshold: 100,
  },
  SOME: {
    level: 3,
    name: "썸",
    desc: "공기 중에 묘한 긴장감이 흐르기 시작합니다.",
    color: "#F472B6",
    threshold: 200,
  },
  LOVER: {
    level: 4,
    name: "연인",
    desc: "이제 서로가 없이는 안 되는 사이입니다.",
    color: "#FB7185",
    threshold: 300,
  },
};

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
  const [newlyCreatedSceneId, setNewlyCreatedSceneId] = useState(null); // 새로 생성된 장면 ID 상태값

  // <Data fetch>
  // 소설 첫 장면 데이터 fetch - 제목, 캐릭터 이름, 호감도 등 (TanStack Query)
  const { data: novelData, isLoading: isNovelLoading, isError } = useQuery({
    queryKey: ['novel', novelId], // 구독
    queryFn: () => novelAPI.get(`/api/novel/${novelId}`).then(res => res.data),
    enabled: !!novelId, // novelId가 있을 때만 실행
    staleTime: 1000 * 60 * 60, // 5분간 데이터를 유지
    gcTime: 1000 * 60 * 120,    // 2시간 후 메모리에서 삭제
  });

  // 이전 소설 장면 fetch
  const { data: scenes = [], isLoading: isScenesLoading } = useQuery({
    queryKey: ['novel', 'scenes', novelId], // 구독
    queryFn: () => novelAPI.get(`/api/novel/${novelId}/scenes`).then(res => res.data),
    enabled: !!novelId,
    staleTime: 1000 * 60 * 5,
    select: (data) => data.map(s => {
      if (s.isOptimistic) { // 낙관적 데이터는 바로 반환
        return s;
      }

      // 서버 데이터(AI의 응답값) 가공
      // 역슬래시 이스케이프 제거
      let cleanedContent = s.content || ""; // null이나 undefined 방지

      if (cleanedContent) {
        // 역슬래시 이스케이프 제거 및 개행 처리
        cleanedContent = cleanedContent
          .replace(/\\"/g, '"')
          .replace(/("[^"]*")/g, '\n\n$1\n\n')
          .replace(/\n\s*\n/g, '\n\n')
          .trim();
      }

      return { ...s, content: cleanedContent };
    })
  });

  // <메모이제이션>
  const mainCharacter = useMemo(() => novelData?.characters?.find(c => c.role === 'MAIN') || { name: '캐릭터', affinity: 0 }, [novelData]);
  const relation = useMemo(() => getRelationLevel(mainCharacter.affinity), [mainCharacter.affinity]);

  // <Mutaion(수정 요청처리)>
  const { mutate: generateScene, isPending } = useMutation({
    mutationFn: (payload) => novelAPI.post('/api/novel/generate', payload).then(res => res.data),
    onMutate: async (newSceneRequest) => { // 서버에 요청 보내기 직전에 수행
      //cancelQueries는 비동기로 동작 : 현재 실행 중인 데이터 fetching을 강제로 멈추는 것
      // 수동으로 화면 바꿀 거니까, 서버에서 가져오던 건 일단 다 취소
      await queryClient.cancelQueries({ queryKey: ['novel', 'scenes', novelId] });
      const previousScenes = queryClient.getQueryData(['novel', 'scenes', novelId]); // 기존 데이터 스냅샷 저장 (에러 발생 시 복구용)
      queryClient.setQueryData(['novel', 'scenes', novelId], (old) => [ // 임시 저장 데이터를 리스트에 바로 저장
        ...(old || []),
        {
          id: Date.now(), // 임시 ID
          userInput: newSceneRequest.content || "(자동 전개 중...)",
          aiOutput: "", // AI 응답 대기 상태
          isOptimistic: true, // UI에서 로딩 스피너 등을 보여주기 위한 플래그
          sequenceOrder: (old?.length || 0) + 1 // 순서 임시 부여
        }
      ]);
      return { previousScenes };
    },
    onSuccess: (newScene) => { // 성공 시
      setNewlyCreatedSceneId(newScene.sceneId); // 방금 생성된 새로운 장면 ID 저장

      // 낙관적 업데이트 임시 데이터 제거, 진짜 데이터를 넣기
      queryClient.setQueryData(['novel', 'scenes', novelId], (old) => {
        const filteredOld = old?.filter(s => !s.isOptimistic) || [];
        return [...filteredOld, newScene];
      });

      // 최신 호감도로 교체
      queryClient.setQueryData(['novel', novelId], (oldNovel) => {
        if (!oldNovel) return oldNovel;
        return {
          ...oldNovel,
          characters: oldNovel.characters.map(char =>
            char.role === 'MAIN'
              ? { ...char, affinity: newScene.affinity }
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
    onError: (err, newScene, context) => {
      if (context?.previousScenes) {
        queryClient.setQueryData(['novel', 'scenes', novelId], context.previousScenes);
      }
      alert(`${getJosa(mainCharacter.name, "이", "가")} 대답을 망설이고 있네요. 다시 시도해 주세요.`);
    }
  });
  /**
   * 사용자: "전송" 클릭.
onMutate:
서버 데이터 가져오던 거 멈춰 (cancelQueries)
현재 화면 데이터 백업해둬 (previousScenes)
화면에 내가 쓴 글 일단 바로 보여줘 (setQueryData)
서버: (전송 중...)
결과 A (성공): onSuccess가 실행되어 서버에서 준 진짜 ID와 데이터를 화면에 덮어씌움.
결과 B (실패): onError가 실행되어 아까 백업해둔 previousScenes로 화면을 원상복구함.
   * 
   * 
   */

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
    if (!isScenesLoading && scenes.length > 0 && mainScrollRef.current) {
      const timer = setTimeout(() => {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({
            behavior: scenes.length <= 1 ? 'auto' : 'smooth', // 첫 장면이면 즉시, 아니면 부드럽게
            block: 'end',
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scenes, isPending, isScenesLoading]); // isScenesLoading 추가!

  // <Handlers>
  // AI에게 사용자의 내용 전달 or 자동전개 요청
  const handleSend = () => {
    const trimmedInput = userInput.trim();
    if (!isAutoMode && !trimmedInput) return; // 자동모드가 아닌데 사용자 입력 비었을 때

    generateScene({
      novelId: novelData.id,
      mode: isAutoMode ? 'AUTO' : 'USER',
      content: trimmedInput,
      lastSceneId: scenes[scenes.length - 1]?.id, // 마지막 장면 ID (서사 연속성 유지)
    });
  };

  // <etcFn>
  // textarea 창 도우미 버튼 핸들러
  const handleAddParentheses = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart: start, selectionEnd: end } = textarea;
    const nextText = userInput.substring(0, start) + '()' + userInput.substring(end);
    setUserInput(nextText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 1);
    }, 0);
  }, []);

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
            {scenes.map((scene, index) => {
              const sceneKey = scene.id || scene.sceneId || `scene-${index}`;
              return (
                <div key={sceneKey}>
                  <SceneArticle scene={scene} shouldType={scenes.length - 1 === index && scene.sceneId === newlyCreatedSceneId} mainScrollRef={mainScrollRef} />
                </div>
              )
            }
            )}
            <div className="h-40" />
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
const SceneArticle = ({ scene, shouldType, mainScrollRef }) => {
  // shouldType이 true일 때만 타이핑 훅을 실행하고, 아니면 원본 그대로 노출
  const typingText = useTypingEffect(shouldType ? scene.content : "", 25);
  const content = shouldType ? typingText : scene.content;

  // 상태 판별
  const isTyping = shouldType && typingText.length < (scene.content?.length || 0);
  const isPendingAI = scene.isOptimistic; // 서버 응답 대기 중인 낙관적 데이터 유무 판별

  // 사용자 입력값
  // 낙관적 데이터이거나, sequenceOrder가 0이 아닌 서버 데이터일 때
  const hasUserInput = (isPendingAI || scene.sequenceOrder !== 0) && scene.userInput;

  useEffect(() => {
    if (isTyping && mainScrollRef.current) {
      const scrollContainer = mainScrollRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [typingText, isTyping, isPendingAI, mainScrollRef]);

  return (
    <div key={scene.id} className="mb-10">
      {/* 사용자 입력 영역: 낙관적 상태일 때도 즉시 나타남 */}
      {hasUserInput && (
        <article className={`bg-[#1e293b] rounded-xl p-4 mb-6 border border-[#334155] transition-all
          ${isPendingAI ? 'opacity-70 border-[#FB7185]/40 ring-1 ring-[#FB7185]/20 shadow-[0_0_15px_rgba(251,113,133,0.1)]' : ''}`}>
          <p className="text-base leading-[1.8] text-[#94A3B8] whitespace-pre-wrap tracking-wide">
            {scene.userInput}
          </p>
        </article>
      )}

      {/* AI 응답 영역 */}
      <article className="animate-fadeIn min-h-[24px]">
        {isPendingAI ? (
          /* 낙관적 UI: AI가 생각 중일 때 보여줄 로딩 표시 */
          <div className="flex items-center gap-2 text-[#FB7185] text-sm italic animate-pulse">
            <Sparkles size={16} />
            AI가 장면을 구상 중입니다...
          </div>
        ) : (
          /* 실제 서버 데이터 노출 */
          <>
            <p className="font-novel text-base leading-[1.8] text-[#F1F5F9]/80 whitespace-pre-wrap tracking-wide">
              <FormatContent text={content} />
              {isTyping && (
                <span className="inline-block w-1 h-5 ml-1 bg-[#FB7185] animate-pulse align-middle" />
              )}
            </p>
          </>
        )}
      </article>
    </div>
  );
};

// 조건부 툴바 컴포넌트
const EditorToolbar = memo(({ isPending, isAutoMode, setIsAutoMode, onAddParentheses }) => {
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
});

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
      <div className={`flex items-stretch bg-[#1e293b] border rounded-2xl p-2 shadow-2xl flex items-end gap-2 transition-all duration-300
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
          className={`flex items-center gap-2 p-3 rounded-xl transition-all active:scale-95 disabled:opacity-20 bg-[#FB7185] text-white'
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

// 현재 소설 관계 등급 조회 (점수 기반)
const getRelationLevel = (score) => {
  return Object.values(RELATION_CONFIG)
    .sort((a, b) => b.threshold - a.threshold) // 높은 점수부터 비교
    .find(r => score >= r.threshold) || RELATION_CONFIG.ACQUAINTANCE;
};

// 관계 등급 레벨 알림 모달
const LevelModal = ({ isOpen, onClose, newLevel }) => {
  const current = RELATION_CONFIG[newLevel] || RELATION_CONFIG.ACQUAINTANCE;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#1e293b] border p-8 text-center shadow-2xl"
            style={{ borderColor: `${current.color}44` }} // 등급 색상을 테두리에 반영 (투명도 44 추가)
          >
            {/* 상단 빛 효과 - 등급 색상에 따라 변함 */}
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 blur-[60px] opacity-20"
              style={{ backgroundColor: current.color }}
            />

            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl"
              style={{ backgroundColor: `${current.color}15` }} // 배경에 살짝 색상 가미
            >
              {current.level === 4 ? '❤️' : current.level === 3 ? '✨' : '⭐'}
            </motion.div>

            <h3 className="mb-2 text-[#94A3B8] text-sm tracking-widest uppercase font-medium">
              Relationship Level Up
            </h3>

            <h2 className="mb-4 text-3xl font-bold text-[#F1F5F9]">
              <span style={{ color: current.color }}>{current.name}</span>
            </h2>

            <p className="mb-8 text-[#94A3B8] leading-relaxed">
              {current.desc}
            </p>

            <button
              onClick={onClose}
              className="w-full rounded-xl py-4 font-bold text-white transition-all active:scale-95 shadow-lg"
              style={{
                backgroundColor: current.color,
                boxShadow: `0 10px 15px -3px ${current.color}33`
              }}
            >
              관계를 이어가기
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};