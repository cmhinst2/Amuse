package com.muse.amuze.novel.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.muse.amuze.novel.model.entity.Character;
import com.muse.amuze.novel.model.entity.CharacterRole;

public interface CharacterRepository extends JpaRepository<Character, Long>{

	List<Character> findByNovelId(Long novelId);

	Character findByNovelIdAndRole(Long id, CharacterRole main);

	@Query("SELECT c FROM Character c WHERE c.novel.id IN :novelIds AND c.role = 'MAIN'")
	List<Character> findMainCharactersByNovelIds(@Param("novelIds") List<Long> novelIds);

}
