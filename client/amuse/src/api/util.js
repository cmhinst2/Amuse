import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';

// 시간 변경 함수
export const formatChatMessageDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);

  // 오늘일때
  if (isToday(date)) {

    // 상대시간
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    // 절대시간
    //return format(date, 'a h:mm', { locale: ko });
  }

  if (isYesterday(date)) {
    return '어제';
  }

  // 그 외(오래됐을때)
  return format(date, 'MMM d일', { locale: ko });
};

/**
* 한글 받침 여부에 따라 조사를 선택해주는 함수
* @param {string} name - 이름
* @param {string} first - 받침이 있을 때 (을/이/과)
* @param {string} second - 받침이 없을 때 (를/가/와)
*/
export const getJosa = (name, first, second) => {
  if (!name) return "";
  const lastChar = name.charCodeAt(name.length - 1);

  // 한글 범위(가~힣) 내에 있는지 확인
  if (lastChar < 0xAC00 || lastChar > 0xD7A3) return name + second;

  // 받침 유무 확인 (0이면 받침 없음)
  const lastCode = (lastChar - 0xAC00) % 28;
  return lastCode > 0 ? `${name}${first}` : `${name}${second}`;
};

/**
 * 소설 본문 내의 {사용자} 패턴을 찾아 적절한 조사와 함께 닉네임으로 치환
 * @param {string} template - 소설 본문 (ex: "{사용자}은/는 소파에 앉았다.")
 * @param {string} nickname - 사용자 닉네임 (ex: "길동" 또는 "민지")
 */
export const replaceNicknameWithJosa = (template, nickname) => {
  if (!template || !nickname) return template || "";

  // 조사 종류
  const josaMap = {
    '은': '은/는', '는': '은/는',
    '이': '이/가', '가': '이/가',
    '을': '을/를', '를': '을/를',
    '와': '와/과', '과': '와/과',
    '아': '아/야', '야': '아/야'
  };

  // 정규표현식으로  {사용자} 뒤 한글자 찾기(상황에 따라 조사 없을수도있음)
  return template.replace(/{사용자}([은는이가을를와과아야]?)/g, (match, p1) => {
    // 이름 뒤에 글자가 없는 경우 ({사용자})
    if(!p1) return nickname;

    // 조사가 있는 경우 ({사용자}는, {사용자}가)
    const josaType = josaMap[p1];
    if(josaType) {
      const [first, second] = josaType.split('/');
      return getJosa(nickname, first, second);
    }

    // 조사가 없는 경우 ({사용자}, {사용자}의, {사용자}님)
    return nickname + p1;
  })
};



// 서버 이미지 경로 연결 반환 함수
export const getServerBaseUrl = (path) => {
  return `http://localhost${path}`;
}

// 조회수를 K 단위로 변환하는 유틸 함수
export const formatCount = (count) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count;
};

// textarea 창 도우미 버튼 핸들러
export const handleAddParentheses = (ref, setUserInput) => {
  const textarea = ref.current;
  if (!textarea) return;
  
  const { selectionStart: start, selectionEnd: end } = textarea;
  setUserInput((prev) => {
    // 현재 입력된 전체 텍스트(prev)에서 커서 위치를 기준으로 분할 삽입
    const before = prev.substring(0, start);
    const after = prev.substring(end);
    return before + '()' + after;
  });

  // 커서를 괄호 사이()로 이동
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + 1, start + 1);
  }, 0);
};
