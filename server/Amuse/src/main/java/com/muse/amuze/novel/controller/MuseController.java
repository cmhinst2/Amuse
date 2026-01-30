package com.muse.amuze.novel.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.muse.amuze.novel.model.dto.MyMuseReponse;
import com.muse.amuze.novel.model.service.MuseService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/muse")
@Tag(name = "Muse Controller", description = "Muse API")
@RequiredArgsConstructor
@Slf4j
public class MuseController {
	
	private final MuseService museService;

	/** 
	 * @param userId
	 * @return
	 */
	@GetMapping("{userId:[0-9]+}")
	public ResponseEntity<List<MyMuseReponse>> getMyMuseList(@PathVariable("userId") int userId) {
		List<MyMuseReponse> myMuses = museService.getMyMuseList(userId);
		return ResponseEntity.ok(myMuses);
	}
	
	/** 현재 로그인한 회원과 소설속 캐릭터 채팅방이 있는지 체크
	 * @param novelId
	 * @param userId
	 * @return
	 */
	@GetMapping("check/{novelId}/{userId}")
	public ResponseEntity<MyMuseReponse> checkChatRoomByUserId(@PathVariable("novelId") int novelId, @PathVariable("userId") int userId) {
		MyMuseReponse reponse = museService.checkChatRoomByUserId(novelId, userId);
		log.debug("reponse:: {}", reponse);
		return ResponseEntity.ok(reponse);
	}
}
