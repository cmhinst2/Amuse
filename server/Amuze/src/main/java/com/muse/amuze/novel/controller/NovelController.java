package com.muse.amuze.novel.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.muse.amuze.novel.model.dto.NovelCreateRequest;
import com.muse.amuze.novel.model.service.AiNovelService;
import com.muse.amuze.user.model.entity.User;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/novel")
@Tag(name = "Novel Controller", description = "Novel API")
@RequiredArgsConstructor
@Slf4j
public class NovelController {

	private final AiNovelService aiNovelService;

	/** 새 소설 작성하기
	 * @param request
	 * @param coverImage
	 * @param userDetails
	 * @return
	 * @throws Exception 
	 */
	@PostMapping(value = "/write", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<Long> createNovel(@RequestPart("novelInfo") NovelCreateRequest request,
			@RequestPart(value = "coverImage", required = false) MultipartFile coverImage,
			@AuthenticationPrincipal User user // 현재 로그인한 작가 정보
	) throws Exception {
		
		Long novelId = aiNovelService.createNovel(request, coverImage, user);
		return ResponseEntity.ok(novelId);
	}

}
