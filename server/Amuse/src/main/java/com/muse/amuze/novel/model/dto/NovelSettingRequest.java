package com.muse.amuze.novel.model.dto;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter @Setter @ToString
public class NovelSettingRequest {
	private String title;
    private String description;
    private MultipartFile coverImageUrl;
    private Integer coverImagePosY;
    private List<String> tags;
    private Boolean isShared;
    private Boolean isDelete;
    private Boolean isAffinityModeEnabled;
    private Long mainCharId;
    private MultipartFile profileImageUrl;
    private Integer profileImagePosY;
    private String statusMessage;
}
