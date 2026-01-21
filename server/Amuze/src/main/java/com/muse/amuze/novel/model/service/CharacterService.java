package com.muse.amuze.novel.model.service;

import java.util.List;

import com.muse.amuze.novel.model.entity.Character;

public interface CharacterService {

	/** novelId 맞는 소설 캐릭터 조회 서비스
	 * @param novelId
	 * @return
	 */
	List<Character> findByNovelId(Long novelId);

}
