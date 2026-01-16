package com.muse.amuze.novel.model.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.muse.amuze.novel.model.entity.Relationship;

public interface RelationshipRepository extends JpaRepository<Relationship, Long> {
    // 두 캐릭터 사이의 관계 데이터 찾기
    Optional<Relationship> findByCharAIdAndCharBId(Long charAId, Long charBId);
}