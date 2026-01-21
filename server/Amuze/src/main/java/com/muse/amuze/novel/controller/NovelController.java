package com.muse.amuze.novel.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.muse.amuze.novel.model.dto.NovelCreateRequest;
import com.muse.amuze.novel.model.dto.NovelResponseDTO;
import com.muse.amuze.novel.model.dto.StorySceneResponse;
import com.muse.amuze.novel.model.dto.UserNovelRequest;
import com.muse.amuze.novel.model.entity.Character;
import com.muse.amuze.novel.model.entity.Novel;
import com.muse.amuze.novel.model.entity.StoryScene;
import com.muse.amuze.novel.model.service.CharacterService;
import com.muse.amuze.novel.model.service.NovelService;
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

	private final NovelService novelService;
	private final CharacterService characterService;

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
		
		Long novelId = novelService.createNovel(request, coverImage, user);
		return ResponseEntity.ok(novelId);
	}

	/** novelId에 맞는 소설 불러오기
	 * @param novelId
	 * @return
	 */
	@GetMapping("{novelId:[0-9]+}")
	public ResponseEntity<NovelResponseDTO> getNovel(@PathVariable("novelId") Long novelId) {
		Novel novel = novelService.findNovelById(novelId);
		List<Character> characters = characterService.findByNovelId(novelId);
		StoryScene lastScene = novelService.findLastSceneByNovelId(novelId);
		
		return ResponseEntity.ok(NovelResponseDTO.builder()
	            .id(novel.getId())
	            .title(novel.getTitle())
	            .description(novel.getDescription())
	            .totalSummary(novel.getTotalSummary())
	            .characters(characters.stream()
	                    .map(c -> NovelResponseDTO.CharacterInfoDTO.builder()
	                            .id(c.getId())
	                            .name(c.getName())
	                            .role(c.getRole())
	                            .affinity(c.getAffinity())
	                            .build())
	                    .toList())
	            .lastScene(NovelResponseDTO.SceneInfoDTO.builder()
	                    .id(lastScene.getId())
	                    .content(lastScene.getAiOutput())
	                    .sequenceOrder(lastScene.getSequenceOrder())
	                    .build())
	            .build());
	}
	
	
	/** 다음 장면 생성하기(AI)
	 * @param novelRequest : {content: "", lastSceneId : 1, mode: "AUTO", novelId: 1}
	 * @return
	 */
	@PostMapping("generate")
	public ResponseEntity<StorySceneResponse> generateNextScene(@RequestBody UserNovelRequest novelRequest) throws Exception{
		StorySceneResponse response = novelService.generateNextScene(novelRequest);
        return ResponseEntity.ok(response);
	}
	
	/** 해당 소설 모든 기록 불러오기
	 * @param novelId
	 * @return
	 */
	@GetMapping("{novelId}/scenes")
	public ResponseEntity<List<StorySceneResponse>> getScenes(@PathVariable("novelId") Long novelId) {
	    List<StorySceneResponse> scenes = novelService.getScenes(novelId);
	    return ResponseEntity.ok(scenes);
	}
}
