package com.muse.amuze.novel.model.dto;

import java.util.List;

import com.muse.amuze.novel.model.entity.CharacterRole;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NovelResponseDTO {
    private Long id;
    private String title; // 제목
    private String description; // 소개글
    private String worldSetting;      // 세계관/배경 설정 
    private String totalSummary;      // 지금까지의 전체 줄거리 요약
    
    // 캐릭터 리스트 (호감도 포함)
    private List<CharacterInfoDTO> characters;
    
    // 가장 최근 장면 (첫 진입 시에는 첫 장면)
    private SceneInfoDTO lastScene;

    @Getter
    @Builder
    public static class CharacterInfoDTO { // DTO 내부에서만 쓰이는 데이터 구조(Nested Static Class)
        private Long id;
        private String name;		// 캐릭터 이름
        private CharacterRole role;          // USER 또는 MAIN
        private int affinity;         // 현재 호감도
        private String personality;   // 성격/특징 (AI 프롬프트용)
    }

    @Getter
    @Builder
    public static class SceneInfoDTO { // DTO 내부에서만 쓰이는 데이터 구조(Nested Static Class)
        private Long id;
        private String content;       // AI가 출력한 내용
        private int sequenceOrder;    // 장면 순서
    }
}