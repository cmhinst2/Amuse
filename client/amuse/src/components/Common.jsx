/**
* 대사만 찾아 글씨 색 변경해주는 컴포넌트
* @param {string} text - 지문 및 대사가 섞인 원본
*/
export const FormatContent = ({ text }) => {
  if (!text) return "";

  // 큰따옴표로 감싸진 대사 부분을 찾는 정규표현식
  const parts = text.split(/("[^"]*")/g);

  return parts.map((part, index) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      // 대사 부분: 강조색 (로즈색) 적용
      return (
        <span key={index} className="text-[#FB7185] font-semibold">
          {part}
        </span>
      );
    }
    // 지문/설명 부분: 기본색 유지 (약간 흐리게)
    return <span key={index} className="text-[#F1F5F9]">{part}</span>;
  });
};

/** 인용문 컴포넌트 */
export const QuoteContent = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let quoteGroup = [];

  // 인용구 그룹을 하나의 카드로 렌더링하는 내부 함수
  const renderQuoteGroup = (group, key) => (
    <div 
      key={`quote-group-${key}`} 
      className="my-6 p-5 bg-[#1e293b] border-l-4 border-[#FB7185] rounded-r-xl shadow-lg text-ms space-y-3"
    >
      {group.map((line, i) => (
        <div key={i} className="text-[#94A3B8] flex items-start">
          <span className="break-all">{line.replace(/^>\s*/, '').trim()}</span>
        </div>
      ))}
    </div>
  );

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('>')) {
      // '>'로 시작하면 그룹 바구니에 담기
      quoteGroup.push(trimmedLine);
    } else {
      // '>'가 아닌 줄을 만났을 때, 그동안 모인 바구니가 있다면 카드로 렌더링
      if (quoteGroup.length > 0) {
        elements.push(renderQuoteGroup(quoteGroup, index));
        quoteGroup = []; // 바구니 비우기
      }
      
      // 일반 지문 및 대사 처리
      if (trimmedLine.length > 0) {
        elements.push(
          <p key={index} className="min-h-[1.5rem] leading-relaxed mb-4">
            <FormatContent text={line} />
          </p>
        );
      } else {
        // 빈 줄 처리 (여백 유지)
        elements.push(<div key={index} className="h-4" />);
      }
    }
  });

  // 루프가 끝난 후 바구니에 남은 인용구가 있다면 마저 처리 (가장 마지막 줄 처리)
  if (quoteGroup.length > 0) {
    elements.push(renderQuoteGroup(quoteGroup, lines.length));
  }

  return <div className="novel-body">{elements}</div>;
};