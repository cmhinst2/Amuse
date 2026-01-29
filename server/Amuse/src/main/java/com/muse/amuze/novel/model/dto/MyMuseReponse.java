package com.muse.amuze.novel.model.dto;

import java.time.LocalDateTime;

public record MyMuseReponse(
		Long roomId, // 채팅방 ID - chat_room
		Long characterId, // 캐릭터 ID - chat_room / character
		String name, // 캐릭터 이름 - character
		String profileImageUrl, // 프로필 사진 - character
		Integer profileImagePosY, // 사진 Y좌표 (0~100) - character
		Integer currentScore, // 호감도 (가장 최신 로그의 점수) - character_affinity_log
		String relationshipStatus, // 관계 상태 (낯선 사람, 연인 등) -  chat_room
		String lastMessage, // 마지막 대화 내용 - chat_message
		LocalDateTime lastMessageAt, // 마지막 대화 시간 - chat_room
		String currentLocation, // 최근 장소 - chat_room
		String status // 활성화 여부 - chat_room
) {}