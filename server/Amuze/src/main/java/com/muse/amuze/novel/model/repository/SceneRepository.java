package com.muse.amuze.novel.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.muse.amuze.novel.model.entity.Scene;

public interface SceneRepository extends JpaRepository<Scene, Long> {
    // 특정 챕터의 장면들을 순서대로 조회
    List<Scene> findByChapterIdOrderBySequenceOrderAsc(Long chapterId);
}