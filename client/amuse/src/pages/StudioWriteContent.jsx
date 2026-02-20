import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence, m } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import amuseAPI from "../api/amuseAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "../components/Form";
import { Check, Heart, Loader2, Menu, PenLine, RotateCcw, Sparkles, SquarePen, Type, X } from "lucide-react";
import { LoadingScreen } from "../components/Spinner";
import { FormatContent, QuoteContent } from "../components/Common";
import { getJosa, handleAddParentheses } from "../api/util";
import { useTypingEffect } from "../api/useTypingEffect";
import { toast } from 'sonner';
import { useNovel } from "../hooks/useNovel";

// 집필화면
export function StudioWriteContent() {
  const { novelId } = useParams(); // url의 novelId 얻어오기
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // <Refs>
  const mainScrollRef = useRef(null); // 실제 스크롤되는 <main> 태그용
  const bottomRef = useRef(null);     // 맨 아래 도착지점용
  const textareaRef = useRef(null); // textarea Ref
  const isFirstScroll = useRef(true); // 처음 들어왔는지 체크(스크롤용)

  // <States>
  const [userInput, setUserInput] = useState(''); // 사용자 입력 상태값
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 모바일에서 Sidebar 토글용
  const [isAutoMode, setIsAutoMode] = useState(false); // 자동 전개 모드 상태
  const [newlyCreatedSceneId, setNewlyCreatedSceneId] = useState(null); // 새로 생성된 장면 ID 상태값
  const [isEditMode, setIsEditMode] = useState(false); // 편집 상태
  const [editInput, setEditInput] = useState(''); // 편집 입력 상태

  // <Data fetch>
  // 소설 첫 장면 데이터 fetch - 제목, 캐릭터 이름, 호감도 등
  const { data: novelData, isLoading: isNovelLoading, isError } = useNovel(novelId, {
    enabled: !!novelId, // novelId가 있을 때만 실행
    staleTime: 1000 * 60 * 60, // 1시간 데이터를 유지
    gcTime: 1000 * 60 * 120,    // 2시간 후 메모리에서 삭제
  });

  // 이전 소설 장면 fetch
  const { data: scenes = [], isLoading: isScenesLoading } = useQuery({
    queryKey: ['novel', 'scenes', novelId],
    queryFn: () => amuseAPI.get(`/api/novel/${novelId}/scenes`).then(res => res.data),
    enabled: !!novelId,
    staleTime: 1000 * 60 * 5,
    select: (data) => data.map(s => {
      if (s.isOptimistic) { // 낙관적 데이터는 바로 반환
        return s;
      }
      let cleanedContent = s.content || ""; // null이나 undefined 방지
      if (cleanedContent) {
        // 역슬래시 이스케이프 제거 및 개행 처리
        cleanedContent = cleanedContent
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/("[^"]*")/g, ' $1 ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }

      return { ...s, content: cleanedContent };
    })
  });

  // <메모이제이션>
  const mainCharacter = useMemo(() => novelData?.characters?.find(c => c.role === 'MAIN'), [novelData]);

  // <Mutaion>
  // 새로운 신 생성 요청
  const { mutate: generateScene, isPending: isNewScenePending } = useMutation({
    mutationFn: (payload) => amuseAPI.post('/api/novel/generate', payload).then(res => res.data),
    retry: (failureCount, error) => { // 서버에서 에러 발생 시 최대 2번까지 자동으로 다시 시도 
      if (error.response?.status === 500) return false; // 서버 3번 시도에도 500이라면 포기
      if (failureCount < 2) return true; // 네트워크이상, 서버응답 못하는상태 리트라이
      return false;
    },
    retryDelay: 1000, // 1초 뒤에 시도
    onMutate: async (newSceneRequest) => { // 서버에 요청 보내기 직전에 수행
      //cancelQueries는 비동기로 동작 : 현재 실행 중인 데이터 fetching을 강제로 멈추는 것
      // 수동으로 화면 바꿀 거니까, 서버에서 가져오던 건 일단 다 취소
      await queryClient.cancelQueries({ queryKey: ['novel', 'scenes', novelId] });
      const previousScenes = queryClient.getQueryData(['novel', 'scenes', novelId]); // 기존 데이터 스냅샷 저장 (에러 발생 시 복구용)

      // UI 표시 텍스트
      let displayInput = newSceneRequest.content;

      if (!newSceneRequest.content || newSceneRequest.content.trim() === "") { // 입력이 아예 없거나 공백인 경우
        displayInput = "자동 전개 모드(AUTO) : 사용자 입력이 없습니다.";
      } else if (newSceneRequest.mode === 'AUTO') { // 입력은 있는데 모드가 AUTO인 경우 (가이드형 자동 전개)
        displayInput = `자동 전개 모드(AUTO) : ${newSceneRequest.content}`;
      }

      queryClient.setQueryData(['novel', 'scenes', novelId], (old) => [ // 임시 저장 데이터를 리스트에 바로 저장
        ...(old || []),
        {
          id: Date.now(), // 임시 ID
          userInput: displayInput,
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

      // 입력창 초기화
      setUserInput('');
      setIsAutoMode(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    },
    onError: (err, newScene, context) => {
      if (context?.previousScenes) {
        queryClient.setQueryData(['novel', 'scenes', novelId], context.previousScenes);
      }
      toast.error("다시 시도해 주세요", {
        description: `${getJosa(mainCharacter.name, "이", "가")} 대답을 망설이고 있네요`,
        action: {
          label: "확인",
          onClick: () => console.log("Confirm"),
        },
      });
    }
  });

  // 마지막 신 재생성 요청
  const { mutate: reGenerateScene, isPending: isRegenPending } = useMutation({
    mutationFn: (payload) => amuseAPI.post('/api/novel/regenerate', payload).then(res => res.data),
    onMutate: async (reSceneRequest) => {
      await queryClient.cancelQueries({ queryKey: ['novel', 'scenes', novelId] });
      const previousScenes = queryClient.getQueryData(['novel', 'scenes', novelId]);

      // 기존 scene중 해당 sceneId를 가진것을 로딩 중 상태로 변경
      queryClient.setQueryData(['novel', 'scenes', novelId], (old) => {
        return old?.map(s =>
          s.sceneId === reSceneRequest.lastSceneId
            ? { ...s, aiOutput: "새로운 전개를 불러오는 중...", isOptimistic: true }
            : s
        );
      });

      return { previousScenes };
    },
    onSuccess: (updatedScene) => {
      queryClient.setQueryData(['novel', 'scenes', novelId], (old) => {
        return old?.map(s => s.sceneId === updatedScene.sceneId ? updatedScene : s);
      });

      toast.success("서사가 다시 쓰여졌습니다.");
    },
    onError: (err, variables, context) => {
      if (context?.previousScenes) {
        queryClient.setQueryData(['novel', 'scenes', novelId], context.previousScenes);
      }
      toast.error("재생성에 실패했습니다.");
    }
  });

  // 마지막 신 편집 요청
  const { mutate: editGenerateScene, isPending: isEditPending } = useMutation({
    mutationFn: (payload) => amuseAPI.post('/api/novel/editScene', payload).then(res => res.data),
    onSuccess: (updatedScene) => {
      // 캐시에 저장된 데이터를 교체
      queryClient.setQueryData(['novel', 'scenes', novelId], (old) => {
        return old.map(s => s.sceneId === updatedScene.sceneId ? updatedScene : s);
      });
      setIsEditMode(false);
    },
    onError: (err, newScene, context) => {
      toast.error("편집 오류!", {
        description: "다시 시도 해주세요~",
        action: {
          label: "확인",
          onClick: () => console.log("Confirm"),
        },
      });
    }
  });

  // 자동 스크롤 하단 유지
  useEffect(() => {
    console.log("useEffect 수행!");
    if (isScenesLoading || !scenes || scenes.length === 0) return;

    const scrollToBottom = () => {
      if (bottomRef.current) {
        console.log("스크롤 이동 모드:", isFirstScroll.current ? 'auto' : 'smooth');
        bottomRef.current.scrollIntoView({
          behavior: isFirstScroll.current ? 'auto' : 'smooth',
          block: 'end',
        });

        if (isFirstScroll.current) {
          isFirstScroll.current = false;
        }
      }
    };
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [scenes, isScenesLoading]);

  // <Handlers>
  // AI에게 사용자의 내용 전달 or 자동전개 요청
  const handleSend = () => {
    const trimmedInput = userInput.trim();
    if (!isAutoMode && !trimmedInput) return; // 자동모드가 아닌데 사용자 입력 비었을 때

    generateScene({
      novelId: novelData.id,
      mode: isAutoMode ? 'AUTO' : 'USER',
      content: trimmedInput,
      lastSceneId: scenes[scenes.length - 1]?.sceneId, // 마지막 장면 ID (서사 연속성 유지)
    });
    setUserInput(""); // 입력창 초기화
  };

  // AI 응답(마지막 씬) 재생성 핸들러
  const handleRegenerate = (scene) => {
    reGenerateScene({
      novelId: scene.novelId,
      lastSceneId: scene.sceneId
    });
  }

  // 재생성 클릭 시 이벤트 핸들러
  const handleRegenerateClick = (scene) => {

    if (scene.edited) {
      toast.error("이미 수정된 장면입니다", {
        description: "수정된 장면은 재생성 할 수 없어요!",
        style: {
          background: '#4f46e5', // Amuse 카드 배경색
          color: '#F1F5F9',      // 메인 텍스트색
          border: '1px solid #4f46e5', // 로즈 포인트 테두리
        },
        action: {
          label: "확인",
          onClick: () => console.log("Confirm"),
        },
      });
      return;
    }

    if (scene.regenerated) {
      toast("[AI 재생성 요청]", {
        description: "응답을 다시 생성하시겠습니까?",
        duration: Infinity, // 신중한 결정을 위해 자동으로 닫히지 않음
        action: {
          label: "영혼석 -8",
          onClick: () => {
            // [로직 A] 영혼석 차감 API 호출 후 재생성 로직 실행
            useSoulStoneAndRegenerate(scene.sceneId);
          },
        },
        cancel: {
          label: "취소",
          onClick: () => console.log("결제 취소"),
        },
        // 유료 결제이므로 조금 더 눈에 띄는 스타일링
        style: {
          background: '#FB7185',
          border: '1px solid #FB7185', // 로즈 포인트 테두리
          color: '#F1F5F9',
        },
        actionButtonStyle: {
          backgroundColor: '#4f46e5',
          color: '#F1F5F9',
          fontWeight: 'bold',
        },
      });
      return;
    }

    // 처음 재생성하는 경우 (무료 로직)
    handleRegenerate(scene);
  }

  // 편집 내용으로 재요청 핸들러
  const handleSubmitEdit = () => {
    const trimmedInput = editInput.trim();
    if (isEditMode && trimmedInput.length === 0) {
      toast.error("편집 재요청 오류!", {
        description: "내용은 비어있을 수 없어요~",
        action: {
          label: "확인",
          onClick: () => console.log("Confirm"),
        },
      });
      return;
    }

    editGenerateScene({
      novelId: novelData.id,
      content: trimmedInput,
      lastSceneId: scenes[scenes.length - 1]?.sceneId
    });
  }

  // hanlder
  // 편집/일반 상태 변경 핸들러
  const handleEdit = (flag, scene) => {
    if (scene.regenerated) {
      toast.error("재생성 된 장면입니다", {
        description: "재생성된 장면은 수정할 수 없어요!",
        style: {
          background: '#FB7185', // Amuse 카드 배경색
          color: '#F1F5F9',      // 메인 텍스트색
          border: '1px solid #FB7185', // 로즈 포인트 테두리
        },
        action: {
          label: "확인",
          onClick: () => console.log("Confirm"),
        },
      });
      return;
    }

    if (scene.edited) {
      toast.error("이미 수정된 장면입니다", {
        description: "생성된 장면의 수정 기회는 1번뿐이에요!",
        style: {
          background: '#FB7185', // Amuse 카드 배경색
          color: '#F1F5F9',      // 메인 텍스트색
          border: '1px solid #FB7185', // 로즈 포인트 테두리
        },
        action: {
          label: "확인",
          onClick: () => console.log("Confirm"),
        },
      });
      return;
    }

    setIsEditMode(flag);
    setEditInput(scene.content);
  }

  // 로딩 중 스피너
  if (isNovelLoading || isScenesLoading) return <LoadingScreen text={`${getJosa(mainCharacter.name, "을", "를")} 불러오는 중입니다...`} />

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
        </header>

        <main ref={mainScrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto px-6 py-12 space-y-16">
            {scenes.map((scene, index) => {
              const sceneKey = scene.id || scene.sceneId || `scene-${index}`;
              return (
                <div key={sceneKey} className="flex flex-col">
                  <SceneArticle
                    scene={scene}
                    mainCharacter={mainCharacter}
                    checkLastScene={scenes.length - 1 === index}
                    checkNewScene={scene.sceneId === newlyCreatedSceneId}
                    isEditMode={isEditMode}
                    editInput={editInput}
                    setEditInput={setEditInput}
                    mainScrollRef={mainScrollRef}
                    handleSubmitEdit={handleSubmitEdit}
                    isEditPending={isEditPending}
                    mode={'Novel'}
                  />
                  {scenes.length - 1 === index &&
                    <section className="self-end flex gap-3">
                      <button onClick={() => handleEdit(!isEditMode, scene)} className="hover:text-[#FB7185]">
                        {isEditMode ? <X /> : <SquarePen size={20} className="transition-transform duration-300 ease-in-out hover:scale-125" />}
                      </button>
                      <button onClick={() => handleRegenerateClick(scene)} className="hover:text-[#FB7185]">
                        <RotateCcw size={20} className="transition-transform duration-300 ease-in-out hover:scale-125" />
                      </button>
                    </section>
                  }
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
              isNewScenePending={isNewScenePending}
              isRegenPending={isRegenPending}
              isEditPending={isEditPending}
              isAutoMode={isAutoMode}
              setIsAutoMode={setIsAutoMode}
              setUserInput={setUserInput}
              textareaRef={textareaRef}
            />

            <EditorInput
              mainCharacter={mainCharacter}
              textareaRef={textareaRef}
              userInput={userInput}
              setUserInput={setUserInput}
              isAutoMode={isAutoMode}
              isNewScenePending={isNewScenePending}
              isRegenPending={isRegenPending}
              isEditPending={isEditPending}
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
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
}

// 장면 렌더링 컴포넌트
export const SceneArticle = (props) => {
  const { scene, mainCharacter, checkLastScene, checkNewScene, isEditMode,
    editInput, setEditInput, mainScrollRef, handleSubmitEdit, isEditPending, mode } = props;
  const isNewLastScene = checkLastScene && checkNewScene;
  const typingText = useTypingEffect(checkNewScene ? scene.content : "", 25);
  const content = isNewLastScene ? typingText : scene.content;

  // 상태 판별
  const isTyping = isNewLastScene && typingText.length < (scene.content?.length || 0);
  const isPendingAI = scene.isOptimistic; // 서버 응답 대기 중인 낙관적 데이터 유무 판별
  const isRegenerating = scene.isOptimistic; // 재생성 대기 중

  // 사용자 입력값
  // 낙관적 데이터이거나, sequenceOrder가 0이 아닌 서버 데이터일 때
  let hasUserInput = (isPendingAI || scene.sequenceOrder !== 0);
  if (mode == 'Remake') {
    hasUserInput = hasUserInput && scene.metadata?.user_input;
  } else {
    hasUserInput = hasUserInput && scene.userInput;
  }

  return (
    <div key={scene.id} className="mb-5">
      {/* 낙관적 UI 부분 */}
      {hasUserInput && (
        <article className={`bg-[#1e293b] rounded-xl p-4 mb-6 border border-[#334155] transition-all
            ${isPendingAI ? 'opacity-70 border-[#FB7185]/40 ring-1 ring-[#FB7185]/20 shadow-[0_0_15px_rgba(251,113,133,0.1)]' : ''}`}>
          <p className="text-base leading-[1.8] text-[#94A3B8] whitespace-pre-wrap tracking-wide">
            {hasUserInput}
          </p>
        </article>
      )}

      <article className="animate-fadeIn min-h-[24px]">
        {isPendingAI || isRegenerating ? (
          // AI에게 요청 보내고 대기중일때
          <div className="flex items-center gap-2 text-[#FB7185] text-sm animate-pulse">
            <Sparkles size={16} />
            {mainCharacter.name}의 대답을 기다리는 중 입니다...
          </div>
        ) : (
          <>
            {/* 대기가 끝났을 때 -> 수정모드 이면서 마지막 장면 일 때  */}
            {isEditMode && checkLastScene ?
              <div className="flex flex-col w-full group">
                <textarea
                  disabled={isEditPending}
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  className="w-full min-h-[200px] p-4 bg-[#1e293b] text-[#F1F5F9] text-base leading-[1.8] tracking-wide rounded-xl border border-[#334155] 
                 outline-none transition-all duration-300 placeholder:text-[#94A3B8]/50 focus:border-[#FB7185]/50 focus:ring-2 focus:ring-[#FB7185]/10 scrollbar-thin scrollbar-thumb-[#334155] scrollbar-track-transparent resize-none"
                  placeholder="AI가 생성한 내용을 편집합니다."
                />
                <button
                  onClick={() => handleSubmitEdit(scene.id)}
                  disabled={isEditPending} // 로딩 중 클릭 방지
                  className="flex w-full bg-[#FB7185] text-[#F1F5F9] h-[50px] mt-3 rounded-lg justify-center items-center transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isEditPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      <span className="text-sm font-medium">편집 중...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium">확인</p>
                      <Check size={20} />
                    </div>
                  )}
                </button>
              </div>
              :
              <>
                {/* 대기가 끝났을 때 -> 수정모드 아닐 때 */}
                <QuoteContent content={scene.content} />
              </>
            }
          </>
        )}
      </article>
    </div>
  );

};

// 조건부 툴바 컴포넌트
export const EditorToolbar = memo(({ isNewScenePending, isEditPending, isAutoMode, setIsAutoMode, textareaRef, setUserInput, isRegenPending }) => {
  const isPending = isNewScenePending || isEditPending || isRegenPending;

  if (!isPending)
    return (
      <section className="flex items-center gap-2 mb-2">
        {!isAutoMode && (
          <button
            onClick={() => handleAddParentheses(textareaRef, setUserInput)}
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
export const EditorInput = ({ mainCharacter, textareaRef, userInput, setUserInput, isAutoMode, isNewScenePending, isEditPending, isRegenPending, onSend }) => {
  const isPending = isNewScenePending || isEditPending || isRegenPending;

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
