package com.muse.amuze.novel.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.muse.amuze.novel.model.entity.NovelStats;

public interface NovelStatsRepository extends JpaRepository<NovelStats, Long>{
	
    @Query("SELECT s FROM NovelStats s WHERE s.novelId IN :ids")
    List<NovelStats> findStatsByNovelIds(@Param("ids") List<Long> ids);

	Optional<NovelStats> findByNovelId(Long id);

}
