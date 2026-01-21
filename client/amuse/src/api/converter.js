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
