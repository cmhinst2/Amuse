import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from "../components/Form";
import axiosAPI from '../api/axiosAPI';
import novelAPI from '../api/novelAPI';

export default function StudioWrite() {
  const navigate = useNavigate();
  const { novelId } = useParams();
  const queryClient = useQueryClient();

  // 상태 관리
  const [step, setStep] = useState(novelId ? 'write' : 'setup');
  const [setupStep, setSetupStep] = useState(1); // 1: 기본정보, 2: 세계관/캐릭터, 3: 시작장면
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [novelData, setNovelData] = useState({
    title: '',
    tags: ['', '', ''],
    description: '',
    characterSettings: 
      "# 공략 대상 (메인 캐릭터)\n- 이름: \n- 성격: \n- 외형 및 특징:\n\n" +
      "# 주인공 (사용자 캐릭터)\n- 이름: \n- 성격: \n- 외형 및 특징: \n\n" +
      "# 세계관 및 기타 설정\n- 배경: \n- 특이사항: \n\n" +
      "# 관계 등급(지인/친구/썸/연인)\n메인캐릭터와 사용자캐릭터의 현재 관계는 '친구' ",
    firstSceneInput: ''
  });

  // 이미지 핸들러
  const handleCoverImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // 일반 텍스트 입력용 (제목, 설명, 세계관 등)
  const handleChange = (e) => {
    const { id, value } = e.target;
    setNovelData(prev => ({ ...prev, [id]: value }));
  };

  // 태그 입력 전용 (index를 인자로 받음)
  const handleTagChange = (index, value) => {
    setNovelData(prev => {
      const newTags = [...prev.tags];
      newTags[index] = value;         
      return { ...prev, tags: newTags };
    });
  };

  // 소설 생성 Mutation
  const createNovelMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();

      // 태그 정제: 사용자가 입력하지 않은 빈 값은 제외하고 서버로 전송
      const filteredTags = data.tags.filter(tag => tag.trim() !== '');

      // 서버 DTO(NovelCreateRequest)와 필드명 일치시키기
      const novelInfo = JSON.stringify({
        title: data.title,
        tags: filteredTags,
        description: data.description,
        characterSettings: data.characterSettings,
        firstScene: data.firstSceneInput
      });

      // Blob 생성 시 한글 깨짐 방지를 위해 UTF-8 명시 (선택사항이나 권장)
      formData.append("novelInfo", new Blob([novelInfo], { type: "application/json;charset=utf-8" }));

      // 서버의 @RequestPart("coverImage")와 이름 맞추기
      if (coverFile) formData.append("coverImage", coverFile);

      const response = await novelAPI.post('/api/novel/write', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (newId) => {
      console.log("생성 성공:", newId);
      queryClient.invalidateQueries(['novels']);
      // 성공 시 새로 생성된 소설 ID로 이동
      navigate(`/studio/write/${newId}`, { replace: true });
      setStep('write');
    },
    onError: () => alert("작품 저장 중 오류가 발생했습니다.")
  });

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setupStep > 1 ? setSetupStep(prev => prev - 1) : navigate('/studio')}
              className="text-[#94A3B8] hover:text-[#FB7185] transition-colors"
            >
              {setupStep === 1 ? '← 나가기' : '← 이전으로'}
            </button>
            <h1 className="text-sm font-bold text-[#FB7185] tracking-widest uppercase">
              {step === 'setup' ? `New Project (Step ${setupStep}/3)` : 'AI Writing Studio'}
            </h1>
          </div>
          {step === 'write' && (
            <button className="px-6 py-2 bg-[#FB7185] text-white font-bold rounded-full text-sm hover:scale-105 transition-transform">
              최종 발행
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto">

            {step === 'setup' && (
              <div className="space-y-10 animate-fadeIn">

                {/* Step 1: 기본 정보 및 커버 */}
                {setupStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <h2 className="text-3xl font-black text-[#F1F5F9]">작품의 첫인상</h2>
                      <p className="text-[#94A3B8]">매력적인 커버와 제목은 독자의 시선을 사로잡습니다.</p>

                      <label htmlFor="cover-upload" className="block mt-6">
                        <div className="aspect-[3/4] bg-[#1e293b] border-2 border-dashed border-[#334155] rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FB7185]/50 transition-all overflow-hidden relative group">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center group-hover:scale-110 transition-transform">
                              <span className="text-[#94A3B8] text-sm">커버 이미지 업로드</span>
                            </div>
                          )}
                          <input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={handleCoverImgChange} />
                        </div>
                      </label>
                    </div>

                    <div className="flex flex-col justify-center space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#FB7185] ml-1">소설 제목</label>
                        <input id="title" type="text" value={novelData.title} onChange={handleChange} placeholder="제목을 입력하세요"
                          className="w-full bg-[#1e293b] border border-[#1e293b] rounded-xl p-4 focus:border-[#FB7185] outline-none transition-all" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#FB7185] ml-1">작품 키워드 (최대 3개)</label>
                        <div className="flex gap-2">
                          {novelData.tags.map((tag, index) => (
                            <input
                              key={index}
                              type="text"
                              placeholder={`태그 ${index + 1}`}
                              value={tag}
                              onChange={(e) => handleTagChange(index, e.target.value)}
                              className="w-1/3 bg-[#1e293b] border border-[#1e293b] rounded-xl p-3 text-sm focus:border-[#FB7185] outline-none transition-all"
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-[#94A3B8] mt-1">* 입력하신 태그로 작품이 분류되어 홈 화면에 노출됩니다.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#FB7185] ml-1">작품 요약(Description)</label>
                        <textarea id="description" value={novelData.description} onChange={handleChange} placeholder="독자에게 보여줄 짧은 소개글"
                          className="w-full h-32 bg-[#1e293b] border border-[#1e293b] rounded-xl p-4 outline-none focus:border-[#FB7185] resize-none" />
                      </div>

                      <button onClick={() => setSetupStep(2)} className="w-full py-4 bg-[#F1F5F9] text-[#0f172a] font-black rounded-2xl hover:bg-[#FB7185] hover:text-white transition-all">
                        다음 단계: 세계관 설정
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: 캐릭터 및 세계관 설정 (DB character_settings) */}
                {setupStep === 2 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black">캐릭터 및 세계관 가이드</h2>
                      <p className="text-[#94A3B8]">AI가 이야기의 일관성을 유지할 수 있도록 상세 설정을 적어주세요. 양식에 맞춰 쓰되 서브 캐릭터는 더 추가할 수 있습니다.</p>
                    </div>
                    <textarea id="characterSettings" value={novelData.characterSettings} onChange={handleChange}
                      placeholder="# 공략 대상 (메인 캐릭터)
- 이름: 이안
- 성격: 과묵하며 까칠한듯 보이지만 의외로 다정한 구석이 있는 츤데레 스타일
- 외형 및 특징: 검정 머리카락, 하늘색 눈, 187cm의 큰 키에 운동으로 다져진 다부진 근육남. 검정 정장을 주로 입는다.

# 주인공 (사용자 캐릭터)
- 이름: 민나나
- 성격: 밝고 당찬 성격에 모난구석 없는 사회성 좋은 테토녀 스타일.
- 외형 및 특징: 진갈색 긴 생머리, 금안, 작고 아담한 체형에 오렌지 체향이 난다.

# 세계관 및 기타 설정
- 배경: 2026년의 현대 시대 배경
- 특이사항: 이안과 민나나는 서로 기억하지는 못하지만 어릴적 같은 병원에 다닌적이 있었다. 그 당시 둘은 타임캡슐을 병원 뒷마당에 묻었고, 아직 그곳에 타임캡슐이 묻혀있다.

# 관계 등급(지인/친구/썸/연인)
메인캐릭터와 사용자캐릭터의 현재 관계는 '친구' 
"
                      className="w-full h-[550px] bg-[#1e293b] resize-none border border-[#334155] rounded-3xl p-8 text-[#F1F5F9] outline-none focus:border-[#FB7185] transition-all scrollbar-thin" />
                    <button onClick={() => setSetupStep(3)} className="w-full py-4 bg-[#F1F5F9] text-[#0f172a] font-black rounded-2xl hover:bg-[#FB7185] hover:text-white">
                      마지막: 첫 장면 작성하기
                    </button>
                  </div>
                )}

                {/* Step 3: 첫 장면 입력 */}
                {setupStep === 3 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-2 text-center">
                      <h2 className="text-3xl font-black">프롤로그의 시작</h2>
                      <p className="text-[#94A3B8]">이야기가 시작되는 역사적인 첫 문장을 입력하세요.</p>
                    </div>
                    <textarea id="firstSceneInput" value={novelData.firstSceneInput} onChange={handleChange}
                      placeholder="앞서 만든 캐릭터를 중심으로, 앞으로 꾸려나갈 이야기의 시작을 작성해보세요."
                      className="w-full h-80 bg-[#1e293b] resize-none border border-[#334155] rounded-[1.5rem] p-6 text-center outline-none focus:border-[#FB7185] transition-all" />
                    <button
                      onClick={() => createNovelMutation.mutate(novelData)}
                      disabled={createNovelMutation.isPending}
                      className="w-full py-5 bg-[#FB7185] text-[#0f172a] font-black text-lg rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 hover:text-white"
                    >
                      {createNovelMutation.isPending ? "세계속으로 뛰어드는 중..." : "그 사람을 만나러가기"}
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* --- 실제 집필 화면 (StudioWriteAI) --- */}
            {step === 'write' && (
              <div className="animate-fadeIn">
                <div className="p-10 bg-[#1e293b] rounded-3xl border border-[#334155]">
                  <p className="text-center text-[#94A3B8]">이곳에서 AI와의 본격적인 집필이 시작됩니다.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

// 집필화면
export function StudioWriteAI() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="p-10 bg-[#1e293b] rounded-3xl border border-[#334155] text-center">
        <h3 className="text-xl font-bold text-[#FB7185] mb-2">집필관 입장 완료</h3>
        <p className="text-[#94A3B8]">이곳에서 AI와의 본격적인 집필이 시작됩니다.</p>
      </div>
    </div>
  );
}