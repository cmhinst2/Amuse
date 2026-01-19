package com.muse.amuze.novel.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AiNovelResponse {
    private String ai_output;
    private int affinity_delta;
    private String reason;
}