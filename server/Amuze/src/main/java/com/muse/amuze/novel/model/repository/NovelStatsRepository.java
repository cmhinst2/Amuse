package com.muse.amuze.novel.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.muse.amuze.novel.model.entity.NovelStats;

public interface NovelStatsRepository extends JpaRepository<NovelStats, Long>{

}
