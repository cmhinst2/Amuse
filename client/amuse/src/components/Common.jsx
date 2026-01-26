/**
* 대사만 찾아 글씨 색 변경해주는 컴포넌트
* @param {string} text - 지문 및 대사가 섞인 원본
*/
export const FormatContent = ({text}) => {
  if (!text) return "";
  
  // 큰따옴표로 감싸진 대사 부분을 찾는 정규표현식
  const parts = text.split(/("[^"]*")/g);

  return parts.map((part, index) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      // 대사 부분: 강조색 (로즈색) 적용
      return (
        <span key={index} className="font-novel-bold text-[#FB7185] drop-shadow-[0_0_1px_rgba(251,113,133,0.5)]">
          {part}
        </span>
      );
    }
    // 지문/설명 부분: 기본색 유지 (약간 흐리게)
    return <span key={index} className="text-[#F1F5F9]/70">{part}</span>;
  });
};