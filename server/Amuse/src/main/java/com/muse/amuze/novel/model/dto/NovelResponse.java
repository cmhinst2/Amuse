package com.muse.amuze.novel.model.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.muse.amuze.novel.model.entity.Character;
import com.muse.amuze.novel.model.entity.CharacterRole;
import com.muse.amuze.novel.model.entity.Novel;
import com.muse.amuze.novel.model.entity.NovelStats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class NovelResponse {
	private Long id;
	private String title; // 제목
	private String description; // 소개글
	private String worldSetting; // 세계관/배경 설정
	private String totalSummary; // 지금까지의 전체 줄거리 요약
	private String authorNote; // 작가 노트
	private String coverImageUrl; // 커버 이미지 Url
	private int coverImagePosY; // 커버 이미지 y축 좌표값
	private String status; // 소설 상태(PROCESS, DONE)
	private boolean isShared; // 공유(연재) 상태
	private SceneInfoDTO lastScene; // 가장 최근 장면 (첫 진입 시에는 첫 장면)
	private LocalDateTime createdAt; // 생성일
	private LocalDateTime updatedAt; // 마지막 수정일
	private LocalDateTime shatredAt; // 공개일
	private boolean isDelete; // 삭제 여부
	private boolean isMuseMode; // Muse 모드 활성화 여부
	private boolean isAdult; // 성인 이용가 여부

	private int authorId; // 작성자 id
	private String authorName; // 작성자 이름
	private String profileImg; // 작성자 프로필이미지

	//private Long mainCharId; // 메인캐릭터 id
	//private String mainCharName; // 메인캐릭터 이름
	private Character mainChar;
	private List<CharacterInfoDTO> characters; // 캐릭터 리스트 (호감도 포함)
	private List<String> tags; // 소설 태그 리스트

	private Long viewCount; // 통계 - 조회수
	private Long likeCount; // 통계 - 좋아요수

	@Getter
	@Builder
	public static class CharacterInfoDTO {
		private Long id;
		private String name; // 캐릭터 이름
		private CharacterRole role; // USER 또는 MAIN
		private String gender; // 캐릭터 성별
		private String appearance; // (소설/뮤즈) 외형
		private String personality; // (소설/뮤즈)성격/특징 (AI 프롬프트용)
		private String profileImageUrl; // 프로필 이미지
		private int profileImagePosY; // (뮤즈)프로필 이미지 좌표
		private String statusMessage; // (뮤즈)프로필 상태메시지
		private String firstSceneContent; // (뮤즈)첫장면 서사
		private String firstSceneLocation; // (뮤즈)첫장면 위치
		private String speechExamples; // 말투 
	}

	@Getter
	@Builder
	public static class SceneInfoDTO {
		private Long id;
		private String content; // AI가 출력한 내용
		private int sequenceOrder; // 장면 순서
	}

	public static NovelResponse of(Novel novel, NovelStats stats, Character mainChar) {
	    return NovelResponse.builder()
	            .id(novel.getId())
	            .authorId(novel.getAuthor().getId())
	            .authorName(novel.getAuthor().getNickname())
	            .profileImg(novel.getAuthor().getProfileImageUrl())
	            .title(novel.getTitle())
	            .description(novel.getDescription())
	            .coverImageUrl(novel.getCoverImageUrl())
	            .coverImagePosY(novel.getCoverImagePosY())
	            .isShared(novel.isShared())
	            .status(novel.getStatus())
	            .createdAt(novel.getCreatedAt())
	            .updatedAt(novel.getUpdatedAt())
	            .tags(new ArrayList<>(novel.getTags()))
	            .mainChar(Character.builder()
	            		.id(mainChar.getId())
	            		.name(mainChar.getName())
	            		.role(CharacterRole.MAIN)
	            		.firstSceneContent(mainChar.getFirstSceneContent())
	            		.firstSceneLocation(mainChar.getFirstSceneLocation())
	            		.build()
	            		)
	            .viewCount(stats != null ? stats.getViewCount() : 0L)
	            .likeCount(stats != null ? stats.getLikeCount() : 0L)
	            .isDelete(novel.isDelete())
	            .isMuseMode(novel.isMuseMode())
							.isAdult(novel.isAdult())
	            .build();
	}
	
}