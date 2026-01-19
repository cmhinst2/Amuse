package com.muse.amuze.novel.model.service;

import org.springframework.web.multipart.MultipartFile;

import com.muse.amuze.novel.model.dto.NovelCreateRequest;
import com.muse.amuze.user.model.entity.User;

public interface AiNovelService {

	/** 소설 새로 시작하기
	 * @param request
	 * @param coverImage
	 * @param user
	 * @return
	 */
	Long createNovel(NovelCreateRequest request, MultipartFile coverImage, User user) throws Exception;


}
