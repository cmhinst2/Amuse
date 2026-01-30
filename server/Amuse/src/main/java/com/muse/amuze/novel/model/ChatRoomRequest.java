package com.muse.amuze.novel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoomRequest {
	private Integer userId;
	private Long novelId;
	private Long characterId;
	private String userNickname;
	private Integer scenarioId;
	private Integer scenarioStep;
	private String firstSceneContent; // 조사 처리된 첫장면
	private String firstSceneLocation;
}
