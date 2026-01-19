package com.muse.amuze.novel.model.dto;

import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class NovelCreateRequest {
	private String title;
	private List<String> tags;
    private String description;
    private String characterSettings;
    private String firstScene;
}