import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Sidebar } from "../components/Form";
import { useMutation } from '@tanstack/react-query';

export default function StudioWrite() {
  const navigate = useNavigate();
  const { novelId } = useParams(); // URL 파라미터로 novelId 수신
  const characterPlaceholder = `예시를 참고하여 캐릭터 정보를 입력해주세요.

예시)
# {캐릭터1}의 정보
성격 : 과묵하고 단답을 하는 습관이 있으나 정이 많음
외형 : 키 182cm, 슬렌더, 갈색머리에 검정색 눈동자
과거 : 5살때 양부모에게 입양 되었음
비밀 : {캐릭터2}와 남매 관계이지만 {캐릭터2}에게 숨기고있음
`;

  // 상태 관리: 기존 작품 여부에 따라 단계를 결정
  const [step, setStep] = useState(novelId ? 'write' : 'setup');
  const [writingStep, setWritingStep] = useState(1);
  const [novelData, setNovelData] = useState({
    title: "",
    genre: "",
    characters: "",
    firstScene: "",
    currentInput: "",
    aiResponse: "",
    fullStory: [] // {user: string, ai: string} 형태의 기록
  });
  const [coverFile, setCoverFile] = useState(null); // 실제 서버 전송용 File 객체
  const [previewUrl, setPreviewUrl] = useState(null); // 브라우저 화면 표시용 URL

  useEffect(() => {
    if (novelId) {
      setStep('write');
      // axios.get(`/api/novels/${novelId}`)
    }
  }, [novelId]);

  // 이미지 변경 핸들러
  const handleCoverImgChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setCoverFile(file);
      const reader = new FileReader();

      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  // 상태값 세팅
  const handleChangeState = (e) => {
    const { id, value } = e.target;
    setNovelData(prev => ({ ...prev, [id]: value }))
  };

  const createNovelMutation = useMutation({
    mutationFn: async (newNovelData) => {
      const formData = new FormData();
      const novelInfo = JSON.stringify({
        title: newNovelData.title,
        genre: newNovelData.genre,
        characters: newNovelData.characters,
        firstScene: newNovelData.firstScene
      });
      formData.append("novelInfo", new Blob([novelInfo], { type: "application/json" }));

      if (coverFile) {
        formData.append("coverImage", coverFile);
      }
      console.log(formData); // 왜 비어있찌

      const response = await axios.post('/api/novels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data; // 서버에서 준 신규 ID
    },
    onSuccess: (newId) => {
      navigate(`/studio/write/${newId}`, { replace: true });
      setStep('write');
    },
    onError: () => {
      alert("작품 저장 중 오류가 발생했습니다.");
    }
  });

  // 집필시작 버튼 클릭 핸들러
  const handleStartWriting = () => {
    createNovelMutation.mutate(novelData);
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <header className="px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={writingStep === 1 ? () => navigate('/studio') : () => setWritingStep(1)} className="text-[#94A3B8] hover:text-[#FB7185]">
              {writingStep === 1 ? '← 나가기' : '← 이전으로'}
            </button>
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
                      <label htmlFor="cover-upload" className="block h-full">
                        <div className="aspect-[3/4] bg-[#1e293b] border-2 border-dashed border-[#334155] rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FB7185]/50 transition-all overflow-hidden relative">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Cover Preview"
                              className="w-full h-full object-cover animate-fadeIn"
                            />
                          ) : (
                            <div className="flex flex-col items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#94A3B8] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="text-[#94A3B8]">커버 이미지 업로드</span>
                            </div>
                          )}

                          <input
                            id="cover-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleCoverImgChange}
                          />
                        </div>
                      </label>
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <label htmlFor="title" className="text-[#FB7185] font-bold text-sm ml-1">
                            소설 제목
                          </label>
                          <input
                            id="title"
                            name="title" // novelData의 key와 일치
                            type="text"
                            value={novelData.title}
                            onChange={handleChangeState}
                            placeholder="제목 작성"
                            className="w-full bg-[#1e293b] border border-[#334155] rounded-xl p-3 text-[#F1F5F9] outline-none focus:border-[#FB7185] transition-all"
                          />
                        </div>
                        <label className="block text-sm font-bold text-[#FB7185]">장르 선택</label>
                        <select
                          id='genre'
                          className="w-full bg-[#1e293b] border border-[#334155] rounded-xl p-3 outline-none focus:border-[#FB7185]"
                          value={novelData.genre} // 현재 선택된 값 동기화
                          onChange={handleChangeState}
                        >
                          <option value="ROMANCE_DAILY">로맨스/일상</option>
                          <option value="ROMANCE_FANTASY">로맨스판타지/판타지</option>
                          <option value="ACTION">액션/조직물</option>
                          <option value="SCHOOL">학원물</option>
                          <option value="MARTIAL_ARTS">무협/시대극</option>
                          <option value="MYSTERY">미스테리/스릴러</option>
                          <option value="BL_GL">BL/GL</option>
                        </select>
                        {/* 주요 캐릭터 작성 (경우 1-1) */}
                        <label className="block text-sm font-bold text-[#FB7185] pt-4">주요 캐릭터 설정 (AI 가이드)</label>
                        <textarea
                          id='characters'
                          placeholder={characterPlaceholder}
                          className="w-full h-80 bg-[#1e293b] border border-[#334155] rounded-xl p-4 outline-none focus:border-[#FB7185] resize-none 
                          overflow-y-auto scrollbar-thin scrollbar-thumb-[#334155] scrollbar-track-transparent"
                          value={novelData.characters}
                          onChange={handleChangeState}
                        />
                      </div>
                    </div>
                    <button onClick={() => setWritingStep(2)} className="w-full py-4 bg-[#F1F5F9] text-[#0f172a] font-black rounded-2xl hover:bg-[#FB7185] hover:text-[#fff]">다음 단계로</button>
                  </div>
                ) : (
                  // 2단계
                  <div className="space-y-6">
                    <h2 className="text-2xl font-black">2. 첫 장면 작성</h2>
                    <p className="text-[#94A3B8]">이 이야기가 시작되는 역사적인 첫 문장을 입력해주세요.</p>
                    <textarea
                      id='firstScene'
                      value={novelData.firstScene}
                      onChange={handleChangeState}
                      className="w-full h-64 bg-[#1e293b] border border-[#334155] rounded-[2rem] p-8 text-lg outline-none focus:border-[#FB7185]"
                      placeholder="폭풍우가 치던 그날 밤, 나를 데리러 온 것은 낯선 어른이었다..."
                    />
                    <button onClick={handleStartWriting} className="w-full py-4 bg-[#FB7185] text-[#0f172a] font-black rounded-2xl hover:bg-[#FB7185] hover:text-[#fff]">집필 시작하기</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export function StudioWriteAI() {
  return (
    <div>이제 시작</div>
  )
}