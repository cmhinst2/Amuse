import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../components/Form";
import { ArrowLeft, Camera, Globe, MessageCircle, Save, Settings, Trash2, X, Plus, ImageIcon, MessageSquareQuote, User, Info } from "lucide-react";
import amuseAPI from "../api/amuseAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CoverImageField } from "../components/CoverImageField";
import { useForm, Controller, Watch } from 'react-hook-form';
import { toast } from "sonner";
import ProfileImageField from "../components/ProfileImageField";
import { getJosa } from "../api/util";
import { useNovel } from "../hooks/useNovel";

export function NovelManagementPage() {
  const { novelId } = useParams(); // url의 novelId 얻어오기
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // <states>
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'dating', 'danger'

  // <data fetch>
  const { data: novel, isLoading: isNovelLoading, isError } = useNovel(novelId, {
    enabled: !!novelId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // RHF
  const { handleSubmit, reset, control, getValues, watch, setValue, formState: { dirtyFields, isSubmitting } } = useForm({
    defaultValues: {
      title: novel.title,
      description: novel.description,
      coverImageUrl: novel.coverImageUrl,
      coverImagePosY: novel.coverImagePosY,
      tags: novel.tags,
      isShared: novel.shared,
      isDelete: novel.delete,
      authorNote: novel.authorNote,
      isAffinityModeEnabled: novel.affinityModeEnabled,
      mainCharId: novel.characters.find((c) => c.role == 'MAIN').id,
      mainCharName: novel.characters.find((c) => c.role == 'MAIN').name,
      profileImageUrl: novel.characters.find((c) => c.role == 'MAIN').profileImageUrl,
      profileImagePosY: novel.characters.find((c) => c.role == 'MAIN').profileImagePosY,
      statusMessage: novel.characters.find((c) => c.role == 'MAIN').statusMessage,
      firstSceneContent: novel.characters.find((c) => c.role == 'MAIN').firstSceneContent || '',
      firstSceneLocation: novel.characters.find((c) => c.role == 'MAIN').firstSceneLocation || '',
      speechExamples: novel.characters.find((c) => c.role == 'MAIN').speechExamples || '',
    }
  });

  const allValues = watch(); // RHF의 모든 상태값
  const mainCharName = watch("mainCharName");
  const coverImageUrl = watch("coverImageUrl"); // RHF 의 coverImageUrl 상태값
  const profileImageUrl = watch("profileImageUrl"); // RHF 의 profileImageUrl 상태값

  // <mutate>
  // 소설 설정 업데이트 요청
  const { mutate: updateNovelSetting } = useMutation({
    mutationFn: (formData) => amuseAPI.patch(`/api/novel/${novelId}/setting`, formData),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ['novelList'] }); // 설정 변경 시 이전 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['novel', novelId] }); // 설정 변경 시 이전 캐시 무효화
      reset(getValues()); // 데이터를 다시 초기값으로 설정 dirtyFields 깨끗히 비움
      toast("소설 설정 업데이트 성공!", {
        style: {
          backgroundColor: '#FB7185',
          color: '#F1F5F9'
        }
      })
    },
    onError: (error) => {
      console.error("저장 실패:", error);
      toast("💥 설정 저장 중 오류 발생", {
        style: {
          backgroundColor: '#ea4747',
          color: '#F1F5F9'
        }
      })
    }
  });

  // 소설 삭제 요청
  const { mutate: deleteNovel } = useMutation({
    mutationFn: (id) => amuseAPI.patch(`/api/novel/${id}/delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novelDetail', novelId] });
      navigate("/studio");
    },
    onError: (error) => {
      console.log(error);
      toast("💥 삭제 중 에러 발생!");
    }
  });

  // 변경 사항 저장 핸들러
  const saveSettingNovel = () => {
    const allValues = getValues();
    const formData = new FormData();

    // DirtyValue(수정된 값만) 추출하여 formData에 File, 일반텍스트 나눠담기
    Object.keys(dirtyFields).forEach((key) => {
      if (dirtyFields[key]) {
        formData.append(key, allValues[key]);
      }
    });

    // 이미 호감도 모드일 때 또는 채팅모드를 활성화로 수정할 때  
    if (allValues['isAffinityModeEnabled'] === true || formData.get('isAffinityModeEnabled') === 'true') {

      // formData에 값이 없는데 allValues에는 있는 경우(이전 Muse 모드에서 작성해둔 내용) 보정
      if (!formData.get('firstSceneContent') && allValues['firstSceneContent']?.trim()) {
        formData.set('firstSceneContent', allValues['firstSceneContent']);
      }
      if (!formData.get('firstSceneLocation') && allValues['firstSceneLocation']?.trim()) {
        formData.set('firstSceneLocation', allValues['firstSceneLocation']);
      }

      // 최종 값 추출 및 검사
      const content = formData.get('firstSceneContent')?.toString().trim() || "";
      const location = formData.get('firstSceneLocation')?.toString().trim() || "";

      if (!content || !location) {
        toast("Muse 모드에서는 첫 장면과 장소가 필수입니다!", {
          style: {
            backgroundColor: '#ea4747',
            color: '#F1F5F9'
          }
        });
        return;
      }
    }

    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    if (formData.entries().next().done) {
      toast("⚠ 변경할 내용이 없습니다!", {
        style: {
          background: '#1e293b',
          color: '#F1F5F9'
        }
      });
      return;
    }

    // 메인 캐릭터의 id는 강제 세팅
    formData.append("mainCharId", novel.characters.find((c) => c.role == 'MAIN').id);
    updateNovelSetting(formData);
  }

  // 영구 삭제 버튼 핸들러
  const handleDelete = () => {
    toast("정말 삭제하시겠습니까?", {
      action: {
        label: "삭제하기",
        onClick: () => deleteNovel(novelId),
      },
      cancel: {
        label: "취소",
        onClick: () => console.log("취소됨"),
      },
      style: {
        background: '#1e293b',
        color: '#F1F5F9',
        border: '1px solid #334155',
        borderLeft: '4px solid #eb1838',
        padding: '15px',
        borderRadius: '12px',
        fontSize: '13px',
      },
      actionButtonStyle: {
        backgroundColor: '#eb1838',
        color: '#ffffff',
        fontWeight: '600',
        padding: '16px',
        borderRadius: '6px',
        fontSize: '14px',
      },
      cancelButtonStyle: {
        backgroundColor: '#334155',
        color: '#94A3B8',
        padding: '16px',
        borderRadius: '6px',
        fontSize: '14px',
      },
      duration: Infinity,
    });
  }

  // 템플릿 가이드 함수
  const handleFillTemplate = () => {
    const currentVal = getValues("speechExamples");

    // 이미 내용이 있다면 덮어쓰기 전 확인
    if (currentVal && !confirm("이미 작성된 내용이 있습니다. 예시 양식으로 덮어쓸까요?")) {
      return;
    }

    const template = `## 호감도가 낮을 때 (0~30%)
- 무뚝뚝하고 짧게 끊는 말투
예시) "됐어. 그냥 가."
- 감정 드러나지 않게 평온한 척
예시) "상관없습니다. 그쪽 일이니까."
- 쌀쌀맞게 거절하는 투
예시) "필요 없어요. 혼자 잘 해왔으니까."

## 호감도가 보통일 때 (31~70%)
- 살짝 걱정 섞인 무뚝뚝함
예시) "...밥은 먹고 다녀? 얼굴이 왜 그래."
- 장난스럽게 틱틱대기
예시) "또 그러고 다니면 내가 모른 척 못 해줘." 
- 소프트해진 걱정
예시) "늦으면 연락해. 데리러 갈게."

## 호감도가 높을 때 (71~100%)
- 감정을 숨기려다 튀어나오는 솔직함
예시) "...좋아해. 아직도."
- 절박하게 붙잡는 투
예시) "가지 마. 제발... 이번엔 가지 마."
- 허스키하게 속삭이기
예시) "이렇게 가까이 있는데 참는 거 너무 힘들어."
- 질투 섞인 확인
예시) "나만 보는 거 맞지? 다른 놈 생기면 가만 안 둬."`;

    setValue("speechExamples", template, { shouldDirty: true });
  };

  if (isNovelLoading) return <p>Loading...</p>;

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-10 flex h-[70px] items-center justify-between px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
          <h1 className="text-xl font-black text-[#FB7185] tracking-tight shrink-0">
            내 작품 관리
          </h1>
          {activeTab === 'danger' ? <></> :
            <button
              onClick={handleSubmit(saveSettingNovel)}
              className="bg-[#FB7185] hover:bg-[#e15b6f] px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-[#FB7185]/20">
              <Save size={18} /> 변경사항 저장
            </button>}
        </header>

        <div className="max-w-6xl mx-auto flex md:flex-row gap-8 p-6">
          <aside className="w-full md:w-64 space-y-2">
            <button
              onClick={() => setActiveTab('basic')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'basic' ? 'bg-[#1e293b] text-[#FB7185] border border-[#334155]' : 'text-[#94A3B8] hover:bg-[#1e293b]/50'}`}
            >
              <Settings size={20} /> <span className="font-medium">기본 정보 설정</span>
            </button>
            <button
              onClick={() => setActiveTab('dating')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dating' ? 'bg-[#1e293b] text-[#FB7185] border border-[#334155]' : 'text-[#94A3B8] hover:bg-[#1e293b]/50'}`}
            >
              <MessageCircle size={20} /> <span className="font-medium">Remake / Chat 설정</span>
            </button>
            <button
              onClick={() => setActiveTab('danger')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'danger' ? 'bg-[#1e293b] text-red-400 border border-red-900/30' : 'text-[#94A3B8] hover:bg-red-900/10'}`}
            >
              <Trash2 size={20} /> <span className="font-medium">위험 구역</span>
            </button>
          </aside>

          <main className="flex-1 bg-[#1e293b] rounded-2xl border border-[#334155] p-8 shadow-xl">
            {activeTab === 'basic' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Globe className="text-[#FB7185]" /> 작품 공개 설정
                </h2>

                <div className="bg-[#0f172a] p-6 rounded-xl border border-[#334155] flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg">소설 공개 여부</h4>
                    <p className="text-[#94A3B8]">이 설정을 켜면 모든 사용자가 당신의 소설을 읽을 수 있습니다.</p>
                  </div>
                  <Controller
                    name="isShared"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Toggle name="isShared" isEnabled={value} onChange={(key, val) => { onChange(val) }} />
                    )}
                  />
                </div>

                <Controller
                  name="coverImagePosY"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <CoverImageField
                      imageUrl={coverImageUrl}
                      posY={value}
                      onDataChange={(key, val) => {
                        if (key === 'coverImagePosY') {
                          onChange(val);
                        } else if (key === 'coverImageUrl') {
                          setValue('coverImageUrl', val, { shouldDirty: true });
                        }
                      }}
                    />
                  )}
                />
                <Controller
                  name="title"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <InputField label="작품 제목" name='title' value={value} onChange={(e) => onChange(e.target.value)} />
                  )}
                />
                <Controller
                  name="description"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <TextAreaField label="작품 설명" name='description' placeholder='작품 설명을 작성해주세요.' value={value} onChange={(e) => onChange(e.target.value)} />
                  )}
                />

                <Controller
                  name="tags"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <TagField label="태그 관리" name='tags' tags={value} onChange={(key, val) => { onChange(val) }} />
                  )}
                />

                <Controller
                  name="authorNote"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <TextAreaField
                      label="작가의 한마디"
                      name='authorNote'
                      placeholder='독자들에게 전하고 싶은 메시지를 남겨보세요. (예: 매주 화요일 연재됩니다!)'
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      rows={3}
                    />
                  )}
                />

                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <User className="text-[#FB7185]" /> 메인 캐릭터 원본 설정
                    </h2>
                    <span className="text-[10px] bg-[#334155] text-[#94A3B8] px-2 py-0.5 rounded-full border border-[#1e293b]">
                      READ ONLY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="max-h-[350px] bg-[#0f172a] p-5 rounded-xl border border-[#334155] opacity-80 overflow-y-auto custom-scrollbar">
                      <label className="text-[11px] font-bold text-[#FB7185] uppercase tracking-wider">Appearance (외형)</label>
                      <div className="mt-2 text-[#F1F5F9] whitespace-pre-wrap leading-relaxed text-sm">
                        {novel.characters.find(c => c.role === 'MAIN')?.appearance || "등록된 외형 정보가 없습니다."}
                      </div>
                    </div>

                    <div className="max-h-[350px] bg-[#0f172a] p-5 rounded-xl border border-[#334155] opacity-80 overflow-y-auto custom-scrollbar">
                      <label className="text-[11px] font-bold text-[#FB7185] uppercase tracking-wider">Personality (성격 및 특징)</label>
                      <div className="mt-2 text-[#F1F5F9] whitespace-pre-wrap leading-relaxed text-sm">
                        {novel.characters.find(c => c.role === 'MAIN')?.personality || "등록된 성격 정보가 없습니다."}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#94A3B8] italic">
                    * 위 정보는 소설 생성 시 작성된 기본 설정이며, 본 페이지에서는 수정할 수 없습니다.
                  </p>
                </div>

                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="flex items-center gap-2">
                    <Globe size={20} className="text-[#FB7185]" />
                    <h2 className="text-2xl font-bold text-[#F1F5F9]">작품 세계관 설정</h2>
                    <span className="text-[10px] bg-[#334155] text-[#94A3B8] px-2 py-0.5 rounded-full border border-[#1e293b]">
                      READ ONLY
                    </span>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FB7185]/20 to-transparent rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                    <div className="max-h-[300px] relative bg-[#0f172a] border border-[#334155] rounded-2xl p-6 shadow-inner overflow-y-auto custom-scrollbar">
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed text-[#94A3B8] whitespace-pre-wrap">
                        {novel.worldSetting || "등록된 세계관 정보가 없습니다. 소설의 핵심 배경과 규칙이 이곳에 표시됩니다."}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#475569] flex items-center gap-1 px-1">
                    <Info size={12} /> 세계관 설정은 소설 생성 단계에서 확정되며, 관리 페이지에서는 조회만 가능합니다.
                  </p>
                </div>
              </div>


            )}

            {activeTab === 'dating' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MessageCircle className="text-[#FB7185]" /> Muse 모드
                  </h2>
                  <Controller
                    name="isAffinityModeEnabled"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Toggle name="isAffinityModeEnabled" isEnabled={value} onChange={(key, val) => { onChange(val) }} />
                    )}
                  />
                </div>

                <p className="text-[#94A3B8] bg-[#0f172a] p-4 rounded-lg border-l-4 border-[#FB7185]">
                  Muse 모드를 활성화하면 독자들이 내 소설을 리메이크 하거나 메인 캐릭터와 호감도 채팅을 이용할 수 있습니다.
                  설정을 상세히 작성할수록 독자들의 경험이 풍부해집니다.
                </p>

                {allValues.isAffinityModeEnabled && (
                  <div className="pt-6 space-y-8">
                    <Controller
                      name="profileImagePosY"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <ProfileImageField
                          mainCharName={mainCharName}
                          imageUrl={profileImageUrl}
                          posY={value}
                          onDataChange={(key, val) => {
                            if (key === 'profileImagePosY') {
                              onChange(val);
                            } else if (key === 'profileImageUrl') {
                              setValue('profileImageUrl', val, { shouldDirty: true });
                            }
                          }}
                        />
                      )}
                    />
                    <Controller
                      name="statusMessage"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <InputField label="기본 상태 메시지"
                          value={value}
                          placeholder="캐릭터의 성격이 드러나는 상태 메시지를 작성해보세요."
                          name='statusMessage'
                          onChange={(e) => onChange(e.target.value)} />
                      )}
                    />
                    <Controller
                      name="firstSceneContent"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <TextAreaField
                          label="첫 장면 작성"
                          placeholder={`<예시>\n${getJosa(mainCharName, '이', '가')} {사용자}의 손목을 잡으며 멈춰세운다. \n"어디 가려고?"`}
                          value={value}
                          name="firstSceneContent"
                          onChange={(e) => onChange(e.target.value)} />
                      )}
                    />
                    <Controller
                      name="firstSceneLocation"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <InputField label="첫 장면 위치"
                          value={value}
                          placeholder="캐릭터와 처음 만날 위치를 작성해주세요."
                          name='firstSceneLocation'
                          onChange={(e) => onChange(e.target.value)} />
                      )}
                    />
                    <div className="space-y-4 pt-6 border-t border-[#334155]">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-400 flex items-center gap-2">
                          <MessageSquareQuote size={16} className="text-[#FB7185]" />
                          캐릭터 말투 가이드 (Speech Examples)
                        </label>
                        <button
                          type="button"
                          onClick={handleFillTemplate}
                          className="text-[11px] text-[#FB7185] hover:underline underline-offset-4"
                        >
                          예시 양식 불러오기
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* 안내 문구 박스 */}
                        <div className="text-xs text-[#94a3b8] leading-relaxed bg-[#0f172a] p-4 rounded-xl border border-[#334155]">
                          <p className="mb-2 font-bold text-[#F1F5F9]">💡 AI가 관계의 깊이에 따라 다른 목소리를 낼 수 있게 도와주세요.</p>
                          <p>• 호감도 단계별(낮음/보통/높음)로 특징적인 말투와 대사 예시를 적어주세요.</p>
                          <p>• 특정 어미(ex. ~인 거냐?, ~다니까!)나 습관적인 감탄사를 포함하면 더 정확해집니다.</p>
                        </div>

                        <Controller
                          name="speechExamples"
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <textarea
                              value={value}
                              onChange={onChange}
                              rows={12}
                              placeholder={
                                `## 호감도가 낮을 때 (경계/어색)
- 무뚝뚝하고 차가운 말투
예시) "용건만 말해. 바쁘니까."

## 호감도가 보통일 때 (친근/장난)
- 툭툭 내뱉지만 다정한 말투
예시) "밥은 먹었냐? 얼굴이 그게 뭐야."

## 호감도가 높을 때 (애정/집착)
- 부드럽고 솔직해진 말투
예시) "가지 마. 그냥... 내 옆에 계속 있어주면 안 돼?"`
                              }
                              className="w-full bg-[#0f172a] border border-[#334155] rounded-2xl p-6 focus:border-[#fb7185] outline-none leading-relaxed transition-all placeholder:text-slate-600 custom-scrollbar"
                            />
                          )}
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-red-400">작품 삭제</h2>
                <div className="p-6 border border-red-900/30 bg-red-900/10 rounded-xl">
                  <p className="text-red-200">
                    작품을 삭제하면 모든 소설 내용, 대화 내역, Muse 데이터가 영구히 삭제됩니다.
                    이 작업은 되돌릴 수 없습니다.
                  </p>
                  <button onClick={handleDelete}
                    className="mt-4 bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg font-bold text-white transition-all">
                    영구 삭제 요청
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </main>
    </div>
  );
}

const Toggle = ({ isEnabled, name, onChange, color = 'bg-emerald-500' }) => (
  <button type="button" onClick={() => onChange(name, !isEnabled)} className={`w-14 h-7 rounded-full relative transition-colors ${isEnabled ? color : 'bg-slate-600'}`}>
    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isEnabled ? 'left-8' : 'left-1'}`} />
  </button>
);

const InputField = ({ label, value, name, placeholder, onChange }) => (
  <div className="space-y-2">
    <label className={`${label === '첫 장면 위치' ? 'text-[#FB7185]' : 'text-[#F1F5F9]'} text-sm font-semibold text-[#94A3B8]`}>
      {label === '첫 장면 위치' ? '* ' + label : label}
    </label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-[#F1F5F9] focus:border-[#FB7185] outline-none`} />
  </div>
);

const TextAreaField = ({ label, value, name, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className={`${label === '첫 장면 작성' ? 'text-[#FB7185]' : 'text-[#F1F5F9]'} text-sm font-semibold text-[#94A3B8]`}>
      {label === '첫 장면 작성' ? '* ' + label : label}
    </label>
    <textarea
      placeholder={placeholder}
      rows="4"
      name={name}
      onChange={onChange}
      value={value || ""}
      className={`w-full bg-[#0f172a] text-[#F1F5F9] border border-[#334155] rounded-xl p-3 focus:border-[#FB7185] outline-none resize-none`} />
  </div>
);

const TagField = ({ label, tags, onChange, name }) => {
  const [inputValue, setInputValue] = useState('');

  // 태그 추가 핸들러
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 폼 제출 방지

      if (tags.length >= 3) {
        toast("⚠ 태그는 3개까지만 등록 가능합니다!", {
          style: {
            background: '#1e293b',
            color: '#F1F5F9',
            border: '#1e293b'
          }
        })
        setInputValue("");
        return;
      }
      addTag();
    }
  };

  // 태그 추가 함수
  const addTag = () => {
    const trimmedValue = inputValue.trim();

    // 중복 방지 및 빈 값 방지
    if (trimmedValue && !tags.includes(trimmedValue)) {
      const newTags = [...tags, trimmedValue];
      onChange(name, newTags); // 부모의 formData 업데이트
      setInputValue('');
    }
  };

  // 태그 삭제 로직
  const removeTag = (indexToRemove) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    onChange(name, newTags);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#94A3B8]">{label}</label>

      <div className="flex flex-wrap gap-2 p-3 bg-[#0f172a] border border-[#334155] rounded-xl focus-within:border-[#FB7185] transition-all">
        {tags?.map((tag, index) => (
          <span
            key={index}
            className="flex items-center gap-1 px-3 py-1 bg-[#1e293b] border border-[#FB7185]/30 text-[#F1F5F9] text-sm rounded-full group"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-[#94A3B8] hover:text-[#FB7185] transition-colors"
            >
              <X size={14} />
            </button>
          </span>
        ))}

        <div className="flex-1 min-w-[120px] flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="태그 입력 후 Enter"
            className="w-full bg-transparent border-none outline-none text-sm text-[#F1F5F9] placeholder:text-[#475569]"
          />
        </div>
      </div>
      <p className="text-xs text-[#475569]">최대 3개까지 등록 가능합니다.</p>
    </div>
  );
};