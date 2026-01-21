import { useState, useEffect } from 'react';

export const useTypingEffect = (text, speed = 30) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    // 텍스트가 없거나 이미 완료된 경우 방지
    if (!text) return;

    let i = 0;
    setDisplayedText("");

    let timeoutId;
    
    const type = () => {
      if (i < text.length) {
        // charAt 대신 slice를 사용하여 문자열을 안전하게 가져옵니다.
        setDisplayedText(text.slice(0, i + 1));
        i++;
        timeoutId = setTimeout(type, speed);
      }
    };

    type();

    return () => clearInterval(timeoutId); // 언마운트 시 정리
  }, [text, speed]);

  return displayedText;
};