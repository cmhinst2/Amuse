package com.muse.amuze.novel.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AiNovelResponse {
    private String content; // 소설 본문
    private String keyEvent; // 이번 조각의 핵심 사건
    private int affinityScore; // 계산된 현재 호감도 (0~100)
    private String summary; // 현재까지의 짧은 요약
}