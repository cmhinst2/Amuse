package com.muse.amuze.novel.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.muse.amuze.novel.model.entity.Character;

public interface CharacterRepository extends JpaRepository<Character, Long> {
    // 특정 소설에 속한 캐릭터들만 조회
    List<Character> findByNovelId(Long novelId);
}