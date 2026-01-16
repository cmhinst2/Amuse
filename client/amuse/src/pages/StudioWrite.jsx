import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from "../components/Form";

export default function StudioWrite() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 상태 관리: 기존 작품 여부에 따라 단계를 결정
  const [step, setStep] = useState(location.state?.isExisting ? 'write' : 'setup');
  const [writingStep, setWritingStep] = useState(1); // 1: 캐릭터/장르, 2: 첫장면, 3: 집필
  
  // 데이터 상태
  const [novelData, setNovelData] = useState({
    title: "",
    genre: "로맨스",
    characters: "",
    coverImage: null,
    firstScene: "",
    currentInput: "",
    aiResponse: "",
    fullStory: [] // {user: string, ai: string} 형태의 기록
  });

  const [isAiLoading, setIsAiLoading] = useState(false);

  // AI에게 전송하는 로직 (경우 1의 5번, 경우 2의 2번)
  const handleSendToAi = async () => {
    setIsAiLoading(true);
    // TODO: API 연동 (유저 입력 novelData.currentInput 전달)
    setTimeout(() => {
      const mockAiResponse = "심연 속에서 들려오는 그녀의 목소리는 마치 부서지는 유리 파편처럼 날카롭고도 처연했다. 그는 멈춰 서서 그 소리의 궤적을 쫓았다...";
      setNovelData(prev => ({ ...prev, aiResponse: mockAiResponse }));
      setIsAiLoading(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <header className="px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/studio')} className="text-[#94A3B8] hover:text-[#FB7185]">← 나가기</button>
            <h1 className="text-sm font-bold text-[#FB7185]">
              {step === 'setup' ? `작품 설정 (${writingStep}/2)` : 'AI 협업 집필관'}
            </h1>
          </div>
          {step === 'write' && (
            <button className="px-6 py-2 bg-[#FB7185] text-[#0f172a] font-bold rounded-full text-sm">최종 발행</button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-4xl mx-auto">
            
            {/* --- 경우 1: 새 작품 설정 단계 --- */}
            {step === 'setup' && (
              <div className="space-y-8 animate-fadeIn">
                {writingStep === 1 ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-black">1. 작품의 뼈대 구성하기</h2>
                    {/* 이미지 업로드 & 장르 선택 (경우 1-3) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="aspect-[3/4] bg-[#1e293b] border-2 border-dashed border-[#334155] rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FB7185]/50 transition-all">
                        <span className="text-[#94A3B8]">커버 이미지 업로드</span>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-[#94A3B8]">장르 선택</label>
                        <select className="w-full bg-[#1e293b] border border-[#334155] rounded-xl p-3 outline-none focus:border-[#FB7185]">
                          <option>로맨스</option>
                          <option>판타지</option>
                          <option>BL/GL</option>
                          <option>무협</option>
                        </select>
                        {/* 주요 캐릭터 작성 (경우 1-1) */}
                        <label className="block text-sm font-bold text-[#94A3B8] pt-4">주요 캐릭터 설정 (AI 가이드)</label>
                        <textarea 
                          placeholder="주인공의 성격, 외양, 비밀 등을 적어주세요."
                          className="w-full h-40 bg-[#1e293b] border border-[#334155] rounded-xl p-4 outline-none focus:border-[#FB7185] resize-none"
                        />
                      </div>
                    </div>
                    <button onClick={() => setWritingStep(2)} className="w-full py-4 bg-[#F1F5F9] text-[#0f172a] font-black rounded-2xl">다음 단계로</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-black">2. 첫 장면 작성</h2>
                    <p className="text-[#94A3B8]">이 이야기가 시작되는 역사적인 첫 문장을 입력해주세요.</p>
                    <textarea 
                      onChange={(e) => setNovelData({...novelData, firstScene: e.target.value})}
                      className="w-full h-64 bg-[#1e293b] border border-[#334155] rounded-[2rem] p-8 text-lg outline-none focus:border-[#FB7185]"
                      placeholder="폭풍우가 치던 그날 밤, 성문을 두드린 것은 사람이 아니었다..."
                    />
                    <button onClick={() => setStep('write')} className="w-full py-4 bg-[#FB7185] text-[#0f172a] font-black rounded-2xl">집필 시작하기</button>
                  </div>
                )}
              </div>
            )}

            {/* --- 경우 1-4, 1-5, 1-6 / 경우 2: 집필 단계 --- */}
            {step === 'write' && (
              <div className="space-y-10 pb-20">
                {/* 1-4: 유저가 작성한 첫 장면(또는 이전 기록) 출력 */}
                <div className="bg-[#1e293b]/50 border border-[#334155]/30 rounded-[2rem] p-8 space-y-4">
                  <span className="text-[10px] font-bold text-[#FB7185] uppercase tracking-widest">Story Timeline</span>
                  <p className="text-lg leading-relaxed text-[#94A3B8] italic">"{novelData.firstScene || "불러온 이전 이야기..."}"</p>
                </div>

                {/* AI 응답 결과 (경우 1-5) */}
                {novelData.aiResponse && (
                  <div className="bg-[#FB7185]/5 border border-[#FB7185]/20 rounded-[2rem] p-8 animate-slideUp">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-[#FB7185]">✨ AI가 재탄생시킨 장면</span>
                      <button onClick={() => setNovelData({...novelData, aiResponse: ""})} className="text-[10px] text-[#94A3B8] hover:underline underline-offset-4">수정하기(다시 쓰기)</button>
                    </div>
                    {/* 1-6: 수정 로직을 위해 내용을 직접 편집 가능하게 설계 */}
                    <textarea 
                      value={novelData.aiResponse}
                      onChange={(e) => setNovelData({...novelData, aiResponse: e.target.value})}
                      className="w-full bg-transparent text-xl leading-relaxed text-[#F1F5F9] focus:outline-none resize-none h-40"
                    />
                  </div>
                )}

                {/* 입력 폼 (경우 1-4, 경우 2-1) */}
                <div className="fixed bottom-10 left-[350px] right-20">
                   <div className="relative max-w-4xl mx-auto">
                    <textarea 
                      value={novelData.currentInput}
                      onChange={(e) => setNovelData({...novelData, currentInput: e.target.value})}
                      placeholder="다음 장면을 입력하여 AI와 함께 이야기를 이어가세요..."
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-3xl p-6 pr-20 shadow-2xl focus:border-[#FB7185] outline-none resize-none h-32"
                    />
                    <button 
                      onClick={handleSendToAi}
                      disabled={isAiLoading}
                      className="absolute right-4 bottom-4 px-6 py-2 bg-[#FB7185] text-[#0f172a] font-bold rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isAiLoading ? "AI 생각 중..." : "장면 생성"}
                    </button>
                   </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}