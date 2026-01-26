package com.muse.amuze.novel.model.dto;

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
public class UserNovelRequest {
    private Long novelId;      // 소설 ID
    private String mode;       // "AUTO" 또는 "USER"
    private String content;    // 유저 입력값
    private Long lastSceneId;  // 마지막 장면 ID (서사 검증용)
}