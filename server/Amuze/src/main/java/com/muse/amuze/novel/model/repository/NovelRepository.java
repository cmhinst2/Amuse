package com.muse.amuze.novel.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.muse.amuze.novel.model.entity.Novel;

public interface NovelRepository extends JpaRepository<Novel, Long> {
    // 특정 상태(PROCESS)인 소설 목록만 가져오기
    List<Novel> findByStatus(String status);
}