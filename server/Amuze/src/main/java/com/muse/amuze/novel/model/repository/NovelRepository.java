package com.muse.amuze.novel.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.muse.amuze.novel.model.entity.Novel;

public interface NovelRepository extends JpaRepository<Novel, Long>{

	@EntityGraph(attributePaths = {"author", "tags"})
    @Query("SELECT n FROM Novel n " +
           "WHERE n.author.id = :userId " +
           "ORDER BY n.id DESC")
    List<Novel> findNovelsByAuthorId(@Param("userId") int userId);

}
