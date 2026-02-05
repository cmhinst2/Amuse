package com.muse.amuze.novel.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.muse.amuze.novel.model.dto.ChatMessageRequest;
import com.muse.amuze.novel.model.dto.ChatMessageResponse;
import com.muse.amuze.novel.model.dto.ChatRoomRequest;
import com.muse.amuze.novel.model.dto.MyMuseResponse;
import com.muse.amuze.novel.model.dto.NovelResponse;
import com.muse.amuze.novel.model.dto.UserNoteRequest;
import com.muse.amuze.novel.model.service.MuseService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMethod;

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
	@GetMapping("list/{userId:[0-9]+}")
	public ResponseEntity<List<MyMuseResponse>> getMyMuseList(@PathVariable("userId") int userId) {
		List<MyMuseResponse> myMuses = museService.getMyMuseList(userId);
		return ResponseEntity.ok(myMuses);
	}

	/**
	 * 사용자와 캐릭터의 기존 채팅방 여부 조회
	 * 
	 * @param novelId
	 * @param userId
	 * @return
	 */
	@GetMapping("check/{novelId}/{userId}")
	public ResponseEntity<MyMuseResponse> checkChatRoomByUserId(@PathVariable("novelId") int novelId,
			@PathVariable("userId") int userId) {
		MyMuseResponse response = museService.checkChatRoomByUserId(novelId, userId);
		return ResponseEntity.ok(response);
	}

	/**
	 * roomId 여부 확인
	 * 
	 * @param novelId
	 * @param userId
	 * @return
	 */
	@GetMapping("room/{roomId}")
	public ResponseEntity<MyMuseResponse> checkChatRoomByRoomID(@PathVariable("roomId") Long roomId) {
		MyMuseResponse response = museService.checkChatRoomByRoomID(roomId);
		return ResponseEntity.ok(response);
	}

	/**
	 * 뮤즈 채팅/리메이크 방 생성
	 * 
	 * @param request
	 * @return
	 */
	@PostMapping("create")
	public ResponseEntity<MyMuseResponse> createChatRoom(@RequestBody ChatRoomRequest request) {
		MyMuseResponse response = museService.createChatRoom(request);
		return ResponseEntity.ok(response);
	}

	/**
	 * 캐릭터 정보 조회
	 *
	 */
	@GetMapping("{characterId}")
	public ResponseEntity<NovelResponse> checkValidCharacter(@PathVariable("characterId") Long characterId) {
		NovelResponse response = museService.checkValidCharacter(characterId);
		return ResponseEntity.ok(response);
	}

	/**
	 * chatRoom의 메시지 내역 조회
	 *
	 */
	@GetMapping("{roomId}/messages")
	public ResponseEntity<ChatMessageResponse> getChatMessages(@PathVariable("roomId") Long roomId) {
		ChatMessageResponse response = museService.getChatMessages(roomId);
		return ResponseEntity.ok(response);
	}

	/**
	 * 유저노트 수정
	 *
	 */
	@PatchMapping("editUserNote")
	public ResponseEntity<String> updateUserNote(@RequestBody UserNoteRequest request) {
		String updatedNote = museService.updateUserNote(request.roomId(), request.note());
		return ResponseEntity.ok(updatedNote);
	}


	@PostMapping("create/message")
	public ResponseEntity<?> createRemakeChatMessage(@RequestBody ChatMessageRequest request) {

		return null;
	}
	
}
