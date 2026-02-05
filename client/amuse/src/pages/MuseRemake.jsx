import React, { useMemo, useState, useRef, useEffect } from 'react';
import { StickyNote, Edit3, Save, X, Sparkles, User, Info, BookOpen } from 'lucide-react';
import { useNovel } from '../hooks/useNovel';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorInput, EditorToolbar } from './StudioWriteContent';
import { Sidebar } from '../components/Form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJosa, getServerBaseUrl } from '../api/util';
import { useChatMessage } from '../hooks/useChatMessage';
import { LoadingScreen } from '../components/Spinner';
import { FormatContent } from '../components/Common';

const MuseRemake = () => {
  const { novelId, roomId } = useParams();
  const navigate = useNavigate();
  const [remakeContent, setRemakeContent] = useState('');
  const [userNote, setUserNote] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [isNoteOpen, setIsNoteOpen] = useState(true);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [userInput, setUserInput] = useState('');
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);

  const queryClient = useQueryClient();
  //const cachedMessages = queryClient.getQueryData(['muse', 'chatRoom', 'detail', roomId]);

  const { data: novel, isLoading } = useNovel(novelId, { refetchOnWindowFocus: false });
  const { data, isLoading: isLoadingMessage } = useChatMessage(roomId, {
    enabled: !!roomId,
    refetchOnWindowFocus: false, // 여기서 필드명을 확인하세요!
    select: (rawData) => {
      //console.log(rawData)
      return {
        messageList: rawData.messages || [],
        roomInfo: rawData.roomInfo
      }
    }
  });

  const mainCharacter = useMemo(() => novel?.characters?.find(c => c.role === 'MAIN'), [novel]);
  const { messageList = [], roomInfo = null } = data || {};

  const handleSaveNote = () => {
    if (!userNote.trim()) return;
    setIsEditing(false);
    // TODO: saveNoteMutation.mutate(userNote);
  };

  // 메시지가 추가될 때마다 하단 스크롤
  useEffect(() => {
    console.log(messageList)
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
              {/* 카드 전체 틀: rounded-3xl과 overflow-hidden을 주어 내부 스크롤 시에도 모서리 유지 */}
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
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar space-y-12"
            >
              <div className="max-w-2xl mx-auto min-h-full pb-32">
                {isLoading ? (
                  <div className="text-center text-[#94A3B8] mt-20 animate-pulse">원고를 불러오고 있습니다...</div>
                ) : messageList?.length > 0 ? (
                  messageList.map((msg) => (
                    <div key={msg.id} className="group transition-all duration-500">
                      <div className="mb-12">
                        <p className="text-[#F1F5F9] text-lg leading-[2.2] font-novel whitespace-pre-wrap tracking-wide drop-shadow-sm">
                          <FormatContent text={msg.content} />
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-[#334155] mt-20">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                    <p>새로운 리메이크 이야기를 시작해 보세요.</p>
                  </div>
                )}
              </div>
            </main>

            {/* 유저 노트 플로팅 */}
            <aside className={`w-80 p-6 flex flex-col transition-all duration-300 ${isNoteOpen ? 'translate-x-0' : 'translate-x-[90%] opacity-0'}`}>
              <div className="bg-[#1e293b]/80 backdrop-blur-md border border-[#334155] rounded-2xl flex flex-col h-[500px] shadow-2xl">
                <div className="p-4 border-b border-[#334155]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#4f46e5]">
                    <StickyNote size={18} fill="currentColor" className="opacity-20" />
                    <span className="font-bold text-sm">유저 노트</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isEditing ? (
                      <button onClick={handleSaveNote} className="p-1.5 bg-[#4f46e5] rounded-lg hover:bg-[#4338ca] transition-colors">
                        <Save size={14} />
                      </button>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="p-1.5 bg-[#334155] rounded-lg hover:bg-[#475569] transition-colors text-[#94A3B8]">
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  readOnly={!isEditing}
                  placeholder="AI에게 전달할 특수 설정..."
                  className={`flex-1 p-4 bg-transparent resize-none text-sm leading-relaxed focus:outline-none 
                  ${!isEditing ? 'text-[#94A3B8] opacity-80' : 'text-[#F1F5F9]'}`}
                />
                {!isEditing && (
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
                isNewScenePending={false}
                isRegenPending={false}
                isEditPending={false}
              />
              <EditorInput
                mainCharacter={mainCharacter}
                textareaRef={textareaRef}
                userInput={userInput}
                setUserInput={setUserInput}
                isAutoMode={isAutoMode}
                onSend={() => console.log("전송:", userInput, "유저노트:", userNote)}
                isNewScenePending={false}
                isRegenPending={false}
                isEditPending={false}
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