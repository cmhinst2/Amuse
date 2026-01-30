import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../components/Form";
import { ArrowLeft, Camera, Globe, MessageCircle, Save, Settings, Trash2, X, Plus, ImageIcon } from "lucide-react";
import amuseAPI from "../api/amuseAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CoverImageField } from "../components/CoverImageField";
import { useForm, Controller, Watch } from 'react-hook-form';
import { toast } from "sonner";
import ProfileImageField from "../components/ProfileImageField";
import { getJosa } from "../api/converter";

export function NovelManagementPage() {
  const { novelId } = useParams(); // url의 novelId 얻어오기
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // <states>
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'dating', 'danger'

  // <data fetch>
  const { data: novel, isLoading: isNovelLoading, isError } = useQuery({
    queryKey: ['novel', novelId],
    queryFn: () => amuseAPI.get(`/api/novel/${novelId}`).then(res => res.data),
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
      isAffinityModeEnabled: novel.affinityModeEnabled,
      mainCharId: novel.characters.find((c) => c.role == 'MAIN').id,
      mainCharName: novel.characters.find((c) => c.role == 'MAIN').name,
      profileImageUrl: novel.characters.find((c) => c.role == 'MAIN').profileImageUrl,
      profileImagePosY: novel.characters.find((c) => c.role == 'MAIN').profileImagePosY,
      statusMessage: novel.characters.find((c) => c.role == 'MAIN').statusMessage,
      firstSceneContent: novel.characters.find((c) => c.role == 'MAIN').firstSceneContent || '',
      firstSceneLocation: novel.characters.find((c) => c.role == 'MAIN').firstSceneLocation || ''
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
      queryClient.invalidateQueries({ queryKey: ['novelDetail', novelId] }); // 설정 변경 시 이전 캐시 무효화
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
              <MessageCircle size={20} /> <span className="font-medium">호감도 채팅 모드</span>
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
              </div>
            )}

            {activeTab === 'dating' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MessageCircle className="text-[#FB7185]" /> 호감도 채팅 모드
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
                  이 모드를 활성화하면 독자들이 메인 캐릭터와 1:1 채팅을 할 수 있습니다.
                  캐릭터의 성격 설정에 따라 AI가 대화하며 호감도를 쌓습니다.
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
                          placeholder={`<예시>\n(${getJosa(mainCharName,'이','가')} 당황한 {사용자}의 손목을 잡으며 멈춰세운다.) \n"어디 가려고?"`}
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
                  </div>
                )}
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-red-400">작품 삭제</h2>
                <div className="p-6 border border-red-900/30 bg-red-900/10 rounded-xl">
                  <p className="text-red-200">
                    작품을 삭제하면 모든 소설 내용, 대화 내역, 호감도 데이터가 영구히 삭제됩니다.
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
    <label className="text-sm font-semibold text-[#94A3B8]">{label}</label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-[#F1F5F9] focus:border-[#FB7185] outline-none" />
  </div>
);

const TextAreaField = ({ label, value, name, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-[#94A3B8]">{label}</label>
    <textarea
      placeholder={placeholder}
      rows="4"
      name={name}
      onChange={onChange}
      value={value}
      className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-[#F1F5F9] focus:border-[#FB7185] outline-none resize-none" />
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