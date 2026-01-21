package com.muse.amuze.novel.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.muse.amuze.novel.model.entity.StoryScene;

public interface StorySceneRepository extends JpaRepository<StoryScene, Long>{

	 Optional<StoryScene> findFirstByNovelIdOrderBySequenceOrderDesc(Long novelId);
	
	List<StoryScene> findTop3ByNovelIdOrderBySequenceOrderDesc(Long id);

	StoryScene findTopByNovelIdOrderByIdDesc(Long novelId);
	
	List<StoryScene> findByNovelIdOrderByIdAsc(Long novelId);

	@Query("SELECT s.keyEvent FROM StoryScene s WHERE s.novel.id = :novelId ORDER BY s.id ASC")
	List<String> findAllKeyEventsByNovelId(@Param("novelId") Long novelId);


}
