package com.muse.amuze.novel.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.muse.amuze.novel.model.entity.Chapter;

public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    // 특정 소설의 챕터를 번호 순서대로 조회
    List<Chapter> findByNovelIdOrderByChapterNumAsc(Long novelId);
}