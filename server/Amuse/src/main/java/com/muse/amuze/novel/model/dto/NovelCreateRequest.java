package com.muse.amuze.novel.model.dto;

import java.util.List;

import com.muse.amuze.novel.model.entity.CharacterRole;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class NovelCreateRequest {
    private String title;
    private String description;
    private List<String> tags;
    private String firstScene;
    
    // 구조화된 캐릭터 리스트 추가
    private List<CharacterRequest> characters;

    @Getter @Setter
    public static class CharacterRequest {
        private String name;
        private CharacterRole role; // "MAIN", "USER", "SUB"
        private String gender; // "M", "F"
        private String personality;
        private String appearance;
    }
}