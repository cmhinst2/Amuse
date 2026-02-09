import React, { useMemo, useState, useRef, useEffect } from 'react';
import { StickyNote, Edit3, Save, X, Sparkles, User, Info, BookOpen, RotateCcw, SquarePen } from 'lucide-react';
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
  const isFirstRender = useRef(true); // 첫 진입 여부 추적

  const queryClient = useQueryClient();

  // fetch
  const { data: novel, isLoading } = useNovel(novelId, { refetchOnWindowFocus: false });
  // 이전 리메이크 장면 fetch
  const { data: { messageList = [], roomInfo = null } = {}, isLoading: isLoadingMessage } = useChatMessage(roomId, {
    enabled: !!roomId,
    refetchOnWindowFocus: false,
    select: (rawData) => {
      const messages = rawData.messages || [];

      const processedMessages = messages.map(msg => {
        // 낙관적 업데이트 데이터는 정제 건너뛰기
        if (msg.isOptimistic) return msg;

        // 텍스트 정제 (원작 소설 로직 이식)
        let cleanedContent = msg.content || "";
        if (cleanedContent) {
          cleanedContent = cleanedContent
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/("[^"]*")/g, ' $1 ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        }

        return {
          ...msg,
          content: cleanedContent,
          isAi: msg.senderType === 'CHARACTER',
          isRemake: msg.messageType === 'REMAKE'
        };
      });

      // 순서 정렬 (sequenceOrder 기준)
      const sortedMessages = [...processedMessages].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

      return {
        messageList: sortedMessages,
        roomInfo: rawData.roomInfo,
        lastMessage: sortedMessages[sortedMessages.length - 1]
      };
    },
  });

  // 메모이제이션
  const mainCharacter = useMemo(() => novel?.characters?.find(c => c.role === 'MAIN'), [novel]);

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
      const queryKey = ['muse', 'chatRoom', 'chatMessages', roomId];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      // UI 표시 텍스트
      let displayInput = newSceneRequest.userInput;
      if (!displayInput || displayInput.trim() === "") { // 입력이 아예 없거나 공백인 경우
        displayInput = "자동 전개 모드(AUTO) : 사용자 입력이 없습니다.";
      } else if (newSceneRequest.mode === 'AUTO') { // 입력은 있는데 모드가 AUTO인 경우 (가이드형 자동 전개)
        displayInput = `자동 전개 모드(AUTO) : ${newSceneRequest.userInput}`;
      }

      // 낙관적 업데이트 수행
      queryClient.setQueryData(queryKey, (old) => {
        const currentMessages = old?.messages || [];
        return {
          ...old,
          messages: [
            ...currentMessages,
            {
              id: Date.now(), // 임시 ID
              content: displayInput,
              senderType: 'USER', // 사용자가 보낸 것이므로 USER
              messageType: 'REMAKE',
              isOptimistic: true, // 로딩 표시용
              sequenceOrder: currentMessages.length + 1,
              createdAt: new Date().toISOString(),
            }
          ]
        };
      });
      return { previousData };
    },
    onSuccess: (newScene) => {
      const queryKey = ['muse', 'chatRoom', 'chatMessages', roomId];
      setNewlyCreatedSceneId(newScene.messageDetail?.id);
      queryClient.invalidateQueries({ queryKey });
      setUserInput('');
      setIsAutoMode(false);
    },
    onError: (err, newScene, context) => {
      setUserInput(newScene.userInput); // 실패 시 이전에 사용자가 입력했던 내용으로 되돌려둠
      const queryKey = ['muse', 'chatRoom', 'chatMessages', roomId];
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("전개 생성에 실패했습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['muse', 'chatRoom', 'chatMessages', roomId]
      });
    }
  });

  // 마지막 신 재생성 요청
  const { mutate: reGenerateScene, isPending: isRegenPending } = useMutation({
    mutationFn: async ({ roomId, id }) => {
      const res = await amuseAPI.post(`/api/muse/rooms/${roomId}/messages/${id}/regenerate`);
      return res.data;
    },
    onMutate: async ({ roomId, id }) => {
      const queryKey = ['muse', 'chatRoom', 'chatMessages', roomId]; // roomId는 상위 컨텍스트에서 가져온다고 가정
      await queryClient.cancelQueries({ queryKey });
      const previousMessages = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        const updatedList = (old.messages || []).map(msg =>
          msg.id === id
            ? { ...msg, content: "AI 작가가 장면을 다시 그리는 중입니다...", isOptimistic: true }
            : msg
        );
        return {
          ...old,
          messages: updatedList
        };
      });
      return { previousMessages, roomId };
    },
    onSuccess: (updatedMsg) => {
      const queryKey = ['muse', 'chatRoom', 'chatMessages', roomId];
      queryClient.setQueryData(queryKey, (old) => {
        return old?.map(msg => msg.id === updatedMsg.id ? updatedMsg : msg);
      });
      toast.success("장면이 성공적으로 다시 쓰여졌습니다.");
    },
    onError: (err, payload, context) => {
      const queryKey = ['muse', 'chatRoom', 'chatMessages', roomId];
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKey, context.previousMessages);
      }
      toast.error("재생성에 실패했습니다. 서버 연결을 확인해주세요.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['muse', 'chatRoom', 'chatMessages', roomId] });
    }
  });

  // 마지막 신 편집 요청
  const { mutate: editGenerateScene, isPending: isEditPending } = useMutation({
    mutationFn: (payload) => amuseAPI.post('/api/muse/editMessage', payload).then(res => res.data),
    onMutate: async (newPayload) => {
      await queryClient.cancelQueries({ queryKey: ['muse', 'chatRoom', 'chatMessages', roomId] });
      const previousMessages = queryClient.getQueryData(['muse', 'chatRoom', 'chatMessages', roomId]);

      // 캐시를 수정 중 상태로 즉시 업데이트
      queryClient.setQueryData(['muse', 'chatRoom', 'chatMessages', roomId], (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: (old.messages || []).map(msg =>
            msg.id === newPayload.id
              ? { ...msg, content: "마지막 장면을 수정 중입니다...", isOptimistic: true }
              : msg
          )
        };
      });

      // 컨텍스트에 스냅샷 저장
      return { previousMessages };
    },

    // 에러 발생 시
    onError: (err, newPayload, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['muse', 'chatRoom', 'chatMessages', roomId], context.previousMessages);
      }
      toast.error("편집 오류!", {
        description: "다시 시도해 주세요.",
      });
    },

    // 성공 혹은 실패 후
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['muse', 'chatRoom', 'chatMessages', roomId] });
      setIsEditMode(false);
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
      toast.error("유저 노트 업데이트 실패");
    },
    onSettled: () => {
      queryClient.invalidateQueries(['muse', 'chatRoom', 'chatMessages', roomId]);
    },
    onSuccess: () => {
      toast.success("유저 노트 업데이트 성공!");
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
    if (!isAutoMode && !trimmedInput) return;

    generateScene({
      roomId: roomId,
      roomMode: 'REMAKE',
      autoMode: isAutoMode ? 'AUTO' : 'USER',
      userInput: trimmedInput,
      lastSceneId: messageList[messageList.length - 1]?.id,
    });
    setUserInput("");
  };

  // AI 응답(마지막 씬) 재생성 핸들러
  const handleRegenerate = (msg) => {
    reGenerateScene({
      roomId: roomId,
      id: msg.id
    });
  }

  // 재생성 클릭 시 이벤트 핸들러
  const handleRegenerateClick = (msg) => {

    if (msg.metadata.is_edited) {
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

    if (msg.metadata.is_regenerated) {
      toast("[AI 재생성 요청]", {
        description: "응답을 다시 생성하시겠습니까?",
        duration: Infinity,
        action: {
          label: "영혼석 -8",
          onClick: () => {
            // 나중에 영혼석 차감 기능 추가
            //useSoulStoneAndRegenerate(msg.roomId);
          },
        },
        cancel: {
          label: "취소",
          onClick: () => console.log("결제 취소"),
        },
        style: {
          background: '#FB7185',
          border: '1px solid #FB7185',
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
    handleRegenerate(msg);
  }

  // 편집 내용으로 재요청 핸들러
  const handleSubmitEdit = (id) => {
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
    // 수정 요청
    editGenerateScene({
      roomId: roomId,
      userInput: trimmedInput,
      lastSceneId: id
      // id: scenes[scenes.length - 1]?.sceneId
    });
  }

  // 편집/일반 상태 변경 핸들러
  const handleEdit = (flag, msg) => {
    if (msg.metadata.is_regenerated) {
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

    if (msg.metadata.is_edited) {
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
    setEditInput(msg.content);
  }

  // useEffect
  // 유저 노트값 세팅
  useEffect(() => {
    if (roomInfo?.userNote) {
      setUserNote(roomInfo.userNote);
    }
  }, [roomInfo?.userNote]);

  // 유저 노트 값에 따른 편집 모드 변경
  useEffect(() => {
    // 데이터가 로드되었고, 기존에 작성된 노트가 없다면 편집 모드로 시작
    if (!isLoadingMessage && (!userNote || userNote.trim() === '')) {
      setIsUserNoteEditing(true);
    }
  }, [isLoadingMessage])

  // 스크롤 관련
  useEffect(() => {
    if (messageList.length > 0 && bottomRef.current) {
      // 페이지에 처음 진입한 경우
      if (isFirstRender.current) {
        bottomRef.current.scrollIntoView({ block: 'end' }); // 즉시(instant) 하단으로 이동
        isFirstRender.current = false; // 플래그 변경
        return;
      }

      // 새로운 장면이 작성 중이거나 추가된 경우
      const scrollBehavior = 'smooth';

      const timer = setTimeout(() => {
        bottomRef.current?.scrollIntoView({
          behavior: scrollBehavior,
          block: 'end',
        });
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [messageList, isLoadingMessage]);

  if (isLoading || isLoadingMessage) return <LoadingScreen text={'불러오는 중...'} />;

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
                        checkLastScene={messageList.length - 1 === index}
                        checkNewScene={msg.id === newlyCreatedSceneId}
                        isEditMode={isEditMode}
                        editInput={editInput}
                        setEditInput={setEditInput}
                        mainScrollRef={mainScrollRef}
                        handleSubmitEdit={handleSubmitEdit}
                        isEditPending={isEditPending}
                      />
                      {messageList.length - 1 === index &&
                        <section className="self-end flex gap-3">
                          <button onClick={() => handleEdit(!isEditMode, msg)} className="hover:text-[#FB7185]">
                            {isEditMode ? <X /> : <SquarePen size={20} className="transition-transform duration-300 ease-in-out hover:scale-125" />}
                          </button>
                          <button onClick={() => handleRegenerateClick(msg)} className="hover:text-[#FB7185]">
                            <RotateCcw size={20} className="transition-transform duration-300 ease-in-out hover:scale-125" />
                          </button>
                        </section>
                      }
                    </div>
                  )
                })}
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
