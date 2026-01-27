package com.muse.amuze.novel.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.muse.amuze.novel.model.dto.UserNovelRequest;
import com.muse.amuze.novel.model.entity.Novel;
import com.muse.amuze.novel.model.entity.StoryScene;

public interface StorySceneRepository extends JpaRepository<StoryScene, Long>{

	Optional<StoryScene> findFirstByNovelIdOrderBySequenceOrderDesc(Long novelId);
	
	List<StoryScene> findByNovelIdOrderBySequenceOrderDesc(Long novelId, PageRequest of);
	
	StoryScene findTopByNovelIdOrderByIdDesc(Long novelId);
	
	List<StoryScene> findByNovelIdOrderByIdAsc(Long novelId);

	@Query("SELECT s.keyEvent FROM StoryScene s WHERE s.novel.id = :novelId ORDER BY s.id ASC")
	List<String> findAllKeyEventsByNovelId(@Param("novelId") Long novelId);

	@Modifying(clearAutomatically = true) // 수정쿼리로 인식(행의 갯수 반환) - 쿼리 실행 후 수정전 값 비우기
	@Query("UPDATE StoryScene s SET s.aiOutput = :content WHERE s.novel.id = :novelId AND s.id = :lastSceneId")
	int updateContentByNovelIdAndSceneId(@Param("novelId") Long novelId, 
									    @Param("lastSceneId") Long lastSceneId, 
									    @Param("content") String content);

	Optional<StoryScene> findByNovelIdAndId(Long novelId, Long lastSceneId);

	




}
