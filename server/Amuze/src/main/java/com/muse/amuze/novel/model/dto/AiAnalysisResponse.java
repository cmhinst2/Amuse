package com.muse.amuze.novel.model.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class AiAnalysisResponse {
	private String summary;
    private int sentiment_delta;
    private List<CharacterStatus> character_status_changes;
    private String new_facts;
    private String scene_sentiment;

    @Getter @Setter
    public static class CharacterStatus {
        private String name;
        private String status;
    }
}
