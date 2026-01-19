package com.muse.amuze.novel.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.muse.amuze.novel.model.entity.Novel;

public interface NovelRepository extends JpaRepository<Novel, Long>{

}
