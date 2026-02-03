package com.muse.amuze.novel.model.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor  // 기본 생성자 (JPA, Jackson용)
@AllArgsConstructor // 전체 생성자
@Builder            // 빌더 패턴 적용
public class MyMuseResponse {
	private Long novelId; 			// 소설 ID 
    private Long roomId;             // 채팅방 ID
    private Long characterId;        // 캐릭터 ID
    private String name;             // 캐릭터 이름
    private String profileImageUrl;  // 프로필 사진
    private String statusMessage; 	// 프로필 상태메시지
    private Integer profileImagePosY;// 사진 Y좌표
    private Integer currentScore;    // 호감도 점수
    private String relationshipStatus; // 관계 상태
    private String lastMessage;      // 마지막 대화 내용
    private LocalDateTime lastMessageAt; // 마지막 대화 시간
    private String currentLocation;  // 최근 장소
    private String status;           // 채팅방 상태 (ACTIVE 등)
    private String roomMode;        // 채팅방 모드 (AFFINITY / REMAKE)
    
    private boolean isNovelDeleted;   // 소설 삭제 여부
    private boolean isAffinityEnabled; // 호감도 모드 활성화 여부
    private Integer userId; 			// 사용자 id 
    private String novelTitle;          // 소설 제목
    private String coverImageUrl;
    private Integer coverImagePosY;
}