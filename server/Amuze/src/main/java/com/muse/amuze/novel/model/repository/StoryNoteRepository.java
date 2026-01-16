package com.muse.amuze.novel.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.muse.amuze.novel.model.entity.StoryNote;

public interface StoryNoteRepository extends JpaRepository<StoryNote, Long> {
    // 특정 소설의 활성화된 노트만 조회
    List<StoryNote> findByNovelIdAndIsActiveTrue(Long novelId);
}