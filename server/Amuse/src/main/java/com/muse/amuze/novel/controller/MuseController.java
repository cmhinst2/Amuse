package com.muse.amuze.novel.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.muse.amuze.novel.model.dto.ChatRoomRequest;
import com.muse.amuze.novel.model.dto.MyMuseResponse;
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
	 * 사용자의 Muse 리스트 조회
	 * 
	 * @param userId
	 * @return
	 */
	@GetMapping("chat/{userId:[0-9]+}")
	public ResponseEntity<List<MyMuseResponse>> getMyMuseList(@PathVariable("userId") int userId) {
		List<MyMuseResponse> myMuses = museService.getMyMuseList(userId);
		return ResponseEntity.ok(myMuses);
	}

	/** 사용자와 캐릭터의 기존 채팅방 여부 조회
	 * 
	 * @param novelId
	 * @param userId
	 * @return
	 */
	@GetMapping("check/{novelId}/{userId}")
	public ResponseEntity<MyMuseResponse> checkChatRoomByUserId(@PathVariable("novelId") int novelId,
			@PathVariable("userId") int userId) {
		MyMuseResponse reponse = museService.checkChatRoomByUserId(novelId, userId);
		return ResponseEntity.ok(reponse);
	}
	
	/** roomId 여부 확인
	 * 
	 * @param novelId
	 * @param userId
	 * @return
	 */
	@GetMapping("room/{roomId}")
	public ResponseEntity<MyMuseResponse> checkChatRoomByRoomID(@PathVariable("roomId") Long roomId) {
		MyMuseResponse reponse = museService.checkChatRoomByRoomID(roomId);
		log.debug("reponse:: {}", reponse);
		return ResponseEntity.ok(reponse);
	}

	/** 뮤즈 채팅방 생성
	 * @param request
	 * @return
	 */
	@PostMapping("create")
	public ResponseEntity<MyMuseResponse> createChatRoom(@RequestBody ChatRoomRequest request) {
		MyMuseResponse reponse = museService.createChatRoom(request);
		return ResponseEntity.ok(reponse);
	}

}
