package com.muse.amuze.novel.model.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.muse.amuze.novel.model.entity.Character;
import com.muse.amuze.novel.model.repository.CharacterRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class CharacterServiceImpl implements CharacterService {
	
	private final CharacterRepository characterRepository;

	@Override
	public List<Character> findByNovelId(Long novelId) {
	    return characterRepository.findByNovelId(novelId);
	}
}
