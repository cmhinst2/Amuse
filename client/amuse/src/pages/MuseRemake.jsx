import React, { useMemo, useState, useRef, useEffect } from 'react';
import { StickyNote, Edit3, Save, X, Sparkles, User, Info, BookOpen } from 'lucide-react';
import { useNovel } from '../hooks/useNovel';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorInput, EditorToolbar, SceneArticle } from './StudioWriteContent';
import { Sidebar } from '../components/Form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJosa, getServerBaseUrl } from '../api/util';
import { useChatMessage } from '../hooks/useChatMessage';
import { LoadingScreen } from '../components/Spinner';
import { FormatContent } from '../components/Common';
import { toast } from 'sonner';
import amuseAPI from '../api/amuseAPI';

const MuseRemake = () => {
  const { novelId, roomId } = useParams();
  const [userNote, setUserNote] = useState('');
  const [isUserNoteEditing, setIsUserNoteEditing] = useState(true);
  const [isNoteOpen, setIsNoteOpen] = useState(true);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [newlyCreatedSceneId, setNewlyCreatedSceneId] = useState(null); // 새로 생성된 장면 ID 상태값
  const [isEditMode, setIsEditMode] = useState(false); // 편집 상태
  const [editInput, setEditInput] = useState(''); // 편집 입력 상태
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);     // 맨 아래 도착지점용
  const mainScrollRef = useRef(null); // 실제 스크롤되는 <main> 태그용

  const queryClient = useQueryClient();
  //const cachedMessages = queryClient.getQueryData(['muse', 'chatRoom', 'detail', roomId]);

  // fetch
  const { data: novel, isLoading } = useNovel(novelId, { refetchOnWindowFocus: false });
  const { data, isLoading: isLoadingMessage } = useChatMessage(roomId, {
    enabled: !!roomId,
    refetchOnWindowFocus: false,
    select: (rawData) => {
      return {
        messageList: rawData.messages || [],
        roomInfo: rawData.roomInfo
      }
    }
  });

  // 메모이제이션
  const mainCharacter = useMemo(() => novel?.characters?.find(c => c.role === 'MAIN'), [novel]);
  const { messageList = [], roomInfo = null } = data || {};

  // <Mutaion>
  // 새로운 신 생성 요청
  const { mutate: generateScene, isPending: isNewScenePending } = useMutation({
    mutationFn: (payload) => amuseAPI.post('/api/muse/create/message', payload).then(res => res.data),
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

      // 호감도 세팅
      queryClient.setQueryData(['novel', novelId], (oldNovel) => {
        if (!oldNovel) return oldNovel;
        return {
          ...oldNovel,
          characters: oldNovel.characters.map(char =>
            char.role === 'MAIN' ? { ...char, affinity: updatedScene.affinity } : char
          )
        };
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

  // 유저 노트 저장 요청
  const { mutate: saveNoteMutation, isPending: isEditUserNotePending } = useMutation({
    mutationFn: ({ roomId, note }) => amuseAPI.patch('/api/muse/editUserNote', { roomId, note }).then(res => res.data),
    onMutate: async ({ roomId, note }) => {
      await queryClient.cancelQueries(['muse', 'chatRoom', 'chatMessages', roomId]);
      const previousData = queryClient.getQueryData(['muse', 'chatRoom', 'chatMessages', roomId]);
      queryClient.setQueryData(['muse', 'chatRoom', 'chatMessages', roomId], (old) => {
        if (!old) return old;
        return {
          ...old,
          roomInfo: { ...old.roomInfo, userNote: note }
        };
      });
      return { previousData };
    },
    onError: (err, newNote, context) => {
      queryClient.setQueryData(['muse', 'chatRoom', 'chatMessages', roomId], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['muse', 'chatRoom', 'chatMessages', roomId]);
    },
    onSuccess: () => {
      setIsUserNoteEditing(false)
    }
  });

  // <Handlers>
  // 유저노트 저장 핸들러
  const handleSaveUserNote = () => {
    if (!userNote.trim()) return;
    saveNoteMutation({ roomId, note: userNote });
  };

  // AI에게 사용자의 내용 전달 or 자동전개 요청
  const handleSend = () => {
    const trimmedInput = userInput.trim();
    if (!isAutoMode && !trimmedInput) return; // 자동모드가 아닌데 사용자 입력 비었을 때

    console.log(messageList)
    console.log(roomInfo)
    generateScene({
      roomId: roomInfo.roomId,
      roomMode: 'REMAKE',
      autoMode: isAutoMode ? 'AUTO' : 'USER',
      userInput: trimmedInput,
      lastSceneId: messageList[messageList.length - 1]?.id, // 마지막 챗 ID (서사 연속성 유지)
    });
    setUserInput(""); // 입력창 초기화
  };

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

  // useEffect
  // 유저 노트값 세팅
  useEffect(() => {
    if (data?.roomInfo?.userNote) {
      setUserNote(data.roomInfo.userNote);
    }
  }, [data?.roomInfo?.userNote]);

  // 유저 노트 값에 따른 편집 모드 변경
  useEffect(() => {
    if (userNote == '') {
      setIsUserNoteEditing(true)
    } else {
      setIsUserNoteEditing(false)
    }
  }, [userNote])

  // 메시지가 추가될 때마다 하단 스크롤
  useEffect(() => {
    if (!isLoadingMessage && messageList.length > 0 && mainScrollRef.current) {
      const timer = setTimeout(() => {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({
            behavior: messageList.length <= 1 ? 'auto' : 'smooth', // 첫 장면이면 즉시, 아니면 부드럽게
            block: 'end',
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messageList]);

  if (isLoading || isLoadingMessage) return <LoadingScreen text={'소설 불러오는 중...'} />;

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden relative">
      <div className="flex w-full h-full relative z-10 bg-transparent">
        <div className="relative z-50 transform transition-transform duration-300 md:relative md:translate-x-0 -translate-x-full">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <header className="h-16 flex items-center justify-between px-6 bg-[#1e293b]/40 border-b border-[#334155]/30 backdrop-blur-xl">
            <div className="flex items-center gap-4 min-w-0">
              <h2 className="font-black text-lg truncate tracking-tight">
                <span className="text-[#4f46e5] mr-2">REMAKE:</span>
                {novel?.title}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {novel?.tags?.map((tag, idx) => (
                  <span key={idx} className="text-[13px] px-2.5 py-1 rounded-2xl bg-[#334155]/30 text-[#64748b] border border-[#334155]/50">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </header>

          <div className="flex-1 flex relative overflow-hidden">
            <aside className="hidden xl:flex flex-col w-80 p-6 shrink-0 h-full">
              <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-[#334155]/50 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-full max-h-[calc(100vh-160px)]">

                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <div className="relative aspect-[3/4] w-full shrink-0">
                    <img
                      src={getServerBaseUrl(novel?.coverImageUrl)}
                      alt={mainCharacter?.name}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: `center ${mainCharacter?.profileImagePosY}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="text-[10px] bg-[#FB7185] text-white px-2 py-0.5 rounded-full font-bold uppercase mb-1 inline-block">
                        Main Character
                      </span>
                      <h3 className="text-xl font-black text-[#F1F5F9]">{mainCharacter?.name}</h3>
                      <p className="text-sm text-[#94A3B8] leading-relaxed italic pl-4 border-l border-[#334155] break-keep mt-2">
                        {novel?.description || "등록된 줄거리가 없습니다."}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-[#FB7185] rounded-full" />
                        <span className="text-[11px] font-black text-[#FB7185] uppercase tracking-widest">Character personality</span>
                      </div>
                      <div className="bg-[#0f172a]/40 rounded-2xl p-4 border border-[#334155]/30">
                        <p className="text-[13px] text-[#94A3B8] leading-relaxed break-keep whitespace-pre-wrap">
                          {mainCharacter.personality}
                        </p>
                      </div>
                    </div>

                    <div className="h-[1px] w-full bg-[#334155]/50" />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-[#4f46e5] rounded-full" />
                        <span className="text-[11px] font-black text-[#4f46e5] uppercase tracking-widest">World Setting</span>
                      </div>
                      <div className="bg-[#0f172a]/40 rounded-2xl p-4 border border-[#334155]/30">
                        <p className="text-[13px] text-[#94A3B8] leading-relaxed break-keep whitespace-pre-wrap">
                          {novel?.worldSetting || "세계관 설정이 정의되지 않았습니다."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <main
              ref={mainScrollRef}
              className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar space-y-12"
            >
              <div className="max-w-3xl mx-auto min-h-full pb-32">
                {messageList.map((msg, index) => {
                  const msgKey = msg.id || msg.sequenceOrder || `msg-${index}`;
                  return (
                    <div key={msgKey} className="flex flex-col">
                      <SceneArticle
                        scene={msg}
                        mainCharacter={mainCharacter}
                        checkLastScene={msg.length - 1 === index}
                        checkNewScene={msg.sequenceOrder === newlyCreatedSceneId}
                        isEditMode={isEditMode}
                        editInput={editInput}
                        setEditInput={setEditInput}
                        mainScrollRef={mainScrollRef}
                        handleSubmitEdit={null}
                        isEditPending={null}
                      />
                      {msg.length - 1 === index &&
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
                })}
                <div className="h-40" />
                <div ref={bottomRef} className="h-1" />
              </div>
            </main>

            <aside className={`w-80 p-6 flex flex-col transition-all duration-300 ${isNoteOpen ? 'translate-x-0' : 'translate-x-[90%] opacity-0'}`}>
              <div className="bg-[#1e293b]/80 backdrop-blur-md border border-[#334155] rounded-2xl flex flex-col h-[500px] shadow-2xl">
                <div className="p-4 border-b border-[#334155]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#4f46e5]">
                    <StickyNote size={18} fill="currentColor" className="opacity-20" />
                    <span className="font-bold text-sm">유저 노트</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isUserNoteEditing ? (
                      <button onClick={handleSaveUserNote} className="p-1.5 bg-[#4f46e5] rounded-lg hover:bg-[#4338ca] transition-colors">
                        <Save size={14} />
                      </button>
                    ) : (
                      <button onClick={() => setIsUserNoteEditing(true)} className="p-1.5 bg-[#334155] rounded-lg hover:bg-[#475569] transition-colors text-[#94A3B8]">
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  readOnly={!isUserNoteEditing}
                  placeholder="예시)
##관계
{캐릭터}는 {유저}와 소꿉친구 사이이다.

##최하단 포맷
>현재 날짜:
>{캐릭터}의 속마음:
>{캐릭터}의 옷차림:
>{캐릭터}가 {유저}에게 고백할 확률:"
                  className={`flex-1 p-4 bg-transparent resize-none text-sm leading-relaxed focus:outline-none 
                  ${!isUserNoteEditing ? 'text-[#94A3B8] opacity-80' : 'text-[#F1F5F9]'}`}
                />
                {!isUserNoteEditing && (
                  <div className="p-3 bg-[#0f172a]/40 text-[10px] text-center text-[#4f46e5] font-bold tracking-widest uppercase">
                    Note Synced with AI
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* 푸터 영역 (입력창) */}
          <footer className="p-6 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent relative z-20">
            <div className="max-w-3xl mx-auto">
              <EditorToolbar
                isAutoMode={isAutoMode}
                setIsAutoMode={setIsAutoMode}
                setUserInput={setUserInput}
                textareaRef={textareaRef}
                isNewScenePending={isNewScenePending}
                isRegenPending={isRegenPending}
                isEditPending={isEditPending}
              />
              <EditorInput
                mainCharacter={mainCharacter}
                textareaRef={textareaRef}
                userInput={userInput}
                setUserInput={setUserInput}
                isAutoMode={isAutoMode}
                onSend={handleSend}
                isNewScenePending={isNewScenePending}
                isRegenPending={isRegenPending}
                isEditPending={isEditPending}
              />
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <Sparkles size={12} className="text-[#4f46e5]" />
                <p className="text-[11px] text-[#94A3B8] font-medium tracking-tight">
                  {isAutoMode
                    ? "현재 자동 전개 모드입니다. 유저 노트의 설정이 우선 반영됩니다."
                    : "현재 직접 작성 모드입니다. 원작의 흐름을 자유롭게 비틀어보세요."}
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default MuseRemake;