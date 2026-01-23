import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Sidebar } from "../components/Form";
import novelAPI from '../api/novelAPI';
import { Plus, Shield, Trash2, UserCircle, Users } from 'lucide-react';

// 세팅화면
export default function StudioWriteSetting() {
  const navigate = useNavigate();
  const { novelId } = useParams();
  const queryClient = useQueryClient();

  // <States>
  const [step, setStep] = useState(novelId ? 'write' : 'setup');
  const [setupStep, setSetupStep] = useState(1); // 1: 기본정보, 2: 세계관/캐릭터, 3: 시작장면
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [novelData, setNovelData] = useState({
    title: '',
    tags: ['', '', ''],
    description: '',
    worldSetting: '', // 세계관 전용 필드
    characters: [
      { name: '', role: 'MAIN', gender: 'M', personality: '', appearance: '' }, // 기본 메인 캐릭터
      { name: '', role: 'USER', gender: 'F', personality: '', appearance: '' }  // 기본 사용자 캐릭터
    ],
    relationshipLevel: 'ACQUAINTANCE',
    firstSceneInput: ''
  });

  // <Handlers>
  // 캐릭터 추가 핸들러 (SUB 캐릭터)
  const addSubCharacter = () => {
    setNovelData(prev => ({
      ...prev,
      characters: [...prev.characters, { name: '', role: 'SUB', gender: 'M', personality: '', appearance: '' }]
    }));
  };

  // 캐릭터 삭제 핸들러
  const removeCharacter = (index) => {
    if (index < 2) return; // 메인과 유저는 삭제 불가
    setNovelData(prev => ({
      ...prev,
      characters: prev.characters.filter((_, i) => i !== index)
    }));
  };

  // 캐릭터 정보 변경 핸들러
  const handleCharacterChange = (index, field, value) => {
    console.log("test", index, field, value);
    setNovelData(prev => {
      const newChars = [...prev.characters];
      newChars[index][field] = value;
      return { ...prev, characters: newChars };
    });
  };

  // 일반 텍스트 입력용 (제목, 설명, 세계관 등)
  const handleChange = (e) => {
    const { id, value } = e.target;
    setNovelData(prev => ({ ...prev, [id]: value }));
  };

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

  // 태그 입력 전용 (index를 인자로 받음)
  const handleTagChange = (index, value) => {
    setNovelData(prev => {
      const newTags = [...prev.tags];
      newTags[index] = value;
      return { ...prev, tags: newTags };
    });
  };

  // 다음단계 핸들러
  const handleNextStep = (step) => {
    const hasValidTag = novelData.tags.some(tag => tag.trim() !== '');
    if (step == 2) { // 2번으로 넘어가기 위함
      if (novelData.title.trim().length == 0 || novelData.description.trim().length == 0) {
        alert("제목과 소개글을 작성해주세요!");
        return;
      }
      if (!hasValidTag) {
        alert("태그를 최소 하나 이상 입력해주세요!");
        return;
      }
      return setSetupStep(2);
    }

    if (step == 3) {
      const checkCharsValid = novelData.characters.every(char => {
        return char.name.trim() !== '' &&
          char.appearance.trim() !== '' &&
          char.personality.trim() !== '';
      });

      if (!checkCharsValid) {
        alert("모든 캐릭터의 이름, 외형 및 특징, 성격 및 배경설정을 입력해주세요.");
        return;
      }

      if (novelData.worldSetting.trim().length == 0) {
        alert("세계관 및 기타 설정을 입력해주세요.");
        return;
      }
      return setSetupStep(3);
    }


  }


  // <Mutations>
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
        worldSetting: data.worldSetting, // 추가된 세계관
        characters: data.characters,     // 구조화된 리스트 전송
        firstScene: data.firstSceneInput
      });

      // Blob 생성 시 한글 깨짐 방지를 위해 UTF-8 명시 (선택사항이나 권장)
      formData.append("novelInfo", new Blob([novelInfo], { type: "application/json;charset=utf-8" }));
      if (coverFile) formData.append("coverImage", coverFile);

      const response = await novelAPI.post('/api/novel/write', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (newId) => {
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
                        <label className="text-xs font-bold text-[#FB7185] ml-1">작품 소개글</label>
                        <textarea id="description" value={novelData.description} onChange={handleChange} placeholder="독자에게 보여줄 짧은 소개글"
                          className="w-full h-32 bg-[#1e293b] border border-[#1e293b] rounded-xl p-4 outline-none focus:border-[#FB7185] resize-none" />
                      </div>

                      <button onClick={() => handleNextStep(2)} className="w-full py-4 bg-[#F1F5F9] text-[#0f172a] font-black rounded-2xl hover:bg-[#FB7185] hover:text-white transition-all">
                        다음 단계: 세계관 설정
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: 캐릭터 및 세계관 설정 (DB character_settings) */}
                {setupStep === 2 && (
                  <div className="space-y-10 animate-fadeIn">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-[#F1F5F9]">Character & World</h2>
                      <p className="text-[#94A3B8]">이야기를 이끌어갈 인물들과 그들이 살아갈 세계를 정의합니다.</p>
                    </div>

                    {/* 캐릭터 리스트 섹션 */}
                    <div className="space-y-6">
                      {novelData.characters.map((char, index) => (
                        <div key={index} className="relative p-6 bg-[#1e293b] rounded-3xl border border-[#334155] group hover:border-[#FB7185]/50 transition-all">
                          <div className="flex items-center gap-3 mb-4">
                            {char.role === 'MAIN' && <Shield className="w-5 h-5 text-[#FB7185]" />}
                            {char.role === 'USER' && <UserCircle className="w-5 h-5 text-blue-400" />}
                            {char.role === 'SUB' && <Users className="w-5 h-5 text-green-400" />}
                            <span className="text-xs font-bold tracking-widest uppercase text-[#94A3B8]">
                              {char.role === 'MAIN' ? 'Target Character' : char.role === 'USER' ? 'User Persona' : 'Sub Character'}
                            </span>
                            {index >= 2 && (
                              <button onClick={() => removeCharacter(index)} className="absolute top-6 right-6 text-[#94A3B8] hover:text-red-400">
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              placeholder="이름"
                              value={char.name}
                              onChange={(e) => handleCharacterChange(index, 'name', e.target.value)}
                              className="bg-[#0f172a] border border-[#334155] rounded-xl p-3 outline-none focus:border-[#FB7185]"
                            />
                            <select value={char.gender} onChange={(e) => handleCharacterChange(index, 'gender', e.target.value)}
                              className="w-full bg-[#0f172a] border border-[#334155] text-[#F1F5F9] rounded-xl p-3 outline-none 
                              appearance-none cursor-pointer transition-all
                              focus:border-[#FB7185] focus:ring-1 focus:ring-[#FB7185]
                              hover:bg-[#1e293b]">
                              <option value='M'>남성</option>
                              <option value='F'>여성</option>
                            </select>
                            <textarea
                              placeholder="외형 및 특징"
                              value={char.appearance}
                              onChange={(e) => handleCharacterChange(index, 'appearance', e.target.value)}
                              className="md:col-span-2 bg-[#0f172a] border border-[#334155] rounded-xl p-3 h-24 resize-none outline-none focus:border-[#FB7185]"
                            />
                            <textarea
                              placeholder="성격 및 배경 설정"
                              value={char.personality}
                              onChange={(e) => handleCharacterChange(index, 'personality', e.target.value)}
                              className="md:col-span-2 bg-[#0f172a] border border-[#334155] rounded-xl p-3 h-24 resize-none outline-none focus:border-[#FB7185]"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={addSubCharacter}
                        className="w-full py-4 border-2 border-dashed border-[#334155] rounded-2xl text-[#94A3B8] hover:border-[#FB7185] hover:text-[#FB7185] transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={20} /> 서브 캐릭터 추가하기
                      </button>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-[#1e293b]">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-[#F1F5F9]">초기 관계 설정</h3>
                        <span className="text-xs text-[#94A3B8]">소설 시작 시점의 관계입니다.</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { id: 'ACQUAINTANCE', label: '지인', desc: '예의와 거리감' },
                          { id: 'FRIEND', label: '친구', desc: '편안함과 장난' },
                          { id: 'SOME', label: '썸', desc: '설렘과 긴장' },
                          { id: 'LOVER', label: '연인', desc: '신뢰와 애정' }
                        ].map((rel) => (
                          <button
                            key={rel.id}
                            onClick={() => setNovelData(prev => ({ ...prev, relationshipLevel: rel.id }))}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${novelData.relationshipLevel === rel.id
                              ? 'border-[#FB7185] bg-[#FB7185]/10 shadow-[0_0_15px_rgba(251,113,133,0.3)]'
                              : 'border-[#1e293b] bg-[#1e293b] hover:border-[#334155]'
                              }`}
                          >
                            <span className={`font-bold ${novelData.relationshipLevel === rel.id ? 'text-[#FB7185]' : 'text-[#F1F5F9]'}`}>
                              {rel.label}
                            </span>
                            <span className="text-[10px] text-[#94A3B8] mt-1">{rel.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 세계관 설정 섹션 */}
                    <div className="space-y-4 pt-6 border-t border-[#1e293b]">
                      <h3 className="text-lg font-bold text-[#F1F5F9]">세계관 및 기타 설정</h3>
                      <textarea
                        id="worldSetting"
                        value={novelData.worldSetting}
                        onChange={handleChange}
                        placeholder="이야기의 배경이 되는 시대, 장소, 특이 규칙 등을 입력하세요."
                        className="w-full h-40 bg-[#1e293b] border border-[#334155] rounded-2xl p-6 outline-none focus:border-[#FB7185] resize-none"
                      />
                    </div>

                    <button onClick={() => handleNextStep(3)} className="w-full py-4 bg-[#F1F5F9] text-[#0f172a] font-black rounded-2xl hover:bg-[#FB7185] hover:text-white transition-all">
                      다음 단계: 첫 장면 작성하기
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
                      onClick={() => {
                        if (novelData.firstSceneInput.trim().length == 0) {
                          alert("첫 장면을 작성해주세요.");
                          return;
                        }
                        return createNovelMutation.mutate(novelData)
                      }}
                      disabled={createNovelMutation.isPending}
                      className="w-full py-5 bg-[#FB7185] text-[#0f172a] font-black text-lg rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 hover:text-white"
                    >
                      {createNovelMutation.isPending ? "세계속으로 뛰어드는 중..." : "세계속으로 DIVE"}
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* --- 실제 집필 화면 (StudioWriteAI) --- 
            {step === 'write' && (
              <div className="animate-fadeIn">
                <div className="p-10 bg-[#1e293b] rounded-3xl border border-[#334155]">
                  <p className="text-center text-[#94A3B8]">이곳에서 AI와의 본격적인 집필이 시작됩니다.</p>
                </div>
              </div>
            )}*/}

          </div>
        </div>
      </main>
    </div>
  );
}
