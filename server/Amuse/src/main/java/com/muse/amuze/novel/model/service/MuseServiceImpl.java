package com.muse.amuze.novel.model.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.PropertySource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StreamUtils;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.amuze.novel.model.dto.ChatMessageRequest;
import com.muse.amuze.novel.model.dto.ChatMessageResponse;
import com.muse.amuze.novel.model.dto.ChatMessageResponse.MessageDetail;
import com.muse.amuze.novel.model.dto.ChatMessageResponse.RoomDetail;
import com.muse.amuze.novel.model.dto.ChatRoomRequest;
import com.muse.amuze.novel.model.dto.MyMuseResponse;
import com.muse.amuze.novel.model.dto.NovelResponse;
import com.muse.amuze.novel.model.entity.Character;
import com.muse.amuze.novel.model.entity.CharacterRole;
import com.muse.amuze.novel.model.entity.ChatMessage;
import com.muse.amuze.novel.model.entity.ChatRoom;
import com.muse.amuze.novel.model.entity.MessageType;
import com.muse.amuze.novel.model.entity.Novel;
import com.muse.amuze.novel.model.entity.StoryScene;
import com.muse.amuze.novel.model.repository.CharacterRepository;
import com.muse.amuze.novel.model.repository.ChatMessageRepository;
import com.muse.amuze.novel.model.repository.ChatRoomRepository;
import com.muse.amuze.novel.model.repository.NovelRepository;
import com.muse.amuze.user.model.entity.User;
import com.muse.amuze.user.model.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Slf4j
@Service
@RequiredArgsConstructor
@PropertySource("classpath:/config.properties")
public class MuseServiceImpl implements MuseService {

	private final SummaryService summaryService;
	private final NovelServiceImpl novelService;
	private final ChatRoomRepository chatRoomRepository;
	private final ChatMessageRepository chatMessageRepository;
	private final NovelRepository novelRepository;
	private final CharacterRepository characterRepository;
	private final UserRepository userRepository;
	private final OpenAiChatModel chatModel;
	private final ObjectMapper objectMapper; // JSON 파싱용

	@Value("classpath:prompts/remake-system-prompt.txt")
	private Resource aiSystemPromptResource;

	// 컨텍스트 묶음
	private record ChatMessageContext(ChatRoom chatRoom, Character mainChar,
			List<ChatMessage> previousMessages, String userNote) {
	}

	/**
	 * 나의 Muse 목록 조회
	 *
	 */
	@Transactional(readOnly = true)
	@Override
	public List<MyMuseResponse> getMyMuseList(int userId) {
		List<ChatRoom> myMuses = chatRoomRepository.findMyMuseListByUserId(userId);
		if (myMuses.isEmpty())
			return Collections.emptyList();

		return myMuses.stream()
				.map(room -> MyMuseResponse.builder()
						.novelId(room.getNovel().getId())
						.roomId(room.getId())
						.characterId(room.getCharacter().getId())
						.name(room.getCharacter().getName())
						.profileImageUrl(room.getCharacter().getProfileImageUrl())
						.profileImagePosY(room.getCharacter().getProfileImagePosY())
						.currentScore(room.getCurrentScore())
						.relationshipStatus(room.getRelationshipStatus())
						.lastMessage(room.getLastMessage())
						.lastMessageAt(room.getLastMessageAt())
						.currentLocation(room.getCurrentLocation())
						.status(room.getStatus())
						.isNovelDeleted(room.getNovel().isDelete())
						.isMuseMode(room.getNovel().isMuseMode())
						.userId(room.getUser().getId())
						.novelTitle(room.getNovel().getTitle())
						.roomMode(room.getRoomMode())
						.coverImageUrl(room.getNovel().getCoverImageUrl())
						.coverImagePosY(room.getNovel().getCoverImagePosY())
						.build())
				.toList();
	}

	/**
	 * novelId, userId에 맞는 ChatRoom 조회
	 *
	 */
	@Transactional(readOnly = true)
	@Override
	public MyMuseResponse checkChatRoomByUserId(int novelId, int userId) {
		ChatRoom chatRoom = chatRoomRepository.findChatRoomByNovelIdAndUserId(novelId, userId)
				.orElse(null); // 방이 없으면 null 반환 (혹은 예외 처리)
		if (chatRoom == null)
			return null;
		return MyMuseResponse.builder()
				.novelId(chatRoom.getNovel().getId())
				.roomId(chatRoom.getId())
				.characterId(chatRoom.getCharacter().getId())
				.name(chatRoom.getCharacter().getName())
				.profileImageUrl(chatRoom.getCharacter().getProfileImageUrl())
				.profileImagePosY(chatRoom.getCharacter().getProfileImagePosY())
				.currentScore(chatRoom.getCurrentScore())
				.relationshipStatus(chatRoom.getRelationshipStatus())
				.lastMessage(chatRoom.getLastMessage())
				.lastMessageAt(chatRoom.getLastMessageAt())
				.currentLocation(chatRoom.getCurrentLocation())
				.status(chatRoom.getStatus())
				.isNovelDeleted(chatRoom.getNovel().isDelete())
				.isMuseMode(chatRoom.getNovel().isMuseMode())
				.userId(chatRoom.getUser().getId())
				.build();
	}

	/**
	 * roomId 유효성 검사
	 *
	 *
	 */
	@Transactional(readOnly = true)
	@Override
	public MyMuseResponse checkChatRoomByRoomID(Long roomId) {
		ChatRoom chatRoom = chatRoomRepository.findChatRoomByRoomId(roomId)
				.orElseThrow(() -> new EntityNotFoundException("해당 채팅방을 찾을 수 없습니다. ID: " + roomId));

		return MyMuseResponse.builder()
				.roomId(roomId)
				.novelId(chatRoom.getNovel().getId())
				.userId(chatRoom.getUser().getId())
				.name(chatRoom.getCharacter().getName())
				.profileImageUrl(chatRoom.getCharacter().getProfileImageUrl())
				.profileImagePosY(chatRoom.getCharacter().getProfileImagePosY())
				.currentScore(chatRoom.getCurrentScore())
				.statusMessage(chatRoom.getCharacter().getStatusMessage())
				.relationshipStatus(chatRoom.getRelationshipStatus())
				.currentLocation(chatRoom.getCurrentLocation())
				.lastMessage(chatRoom.getLastMessage())
				.lastMessageAt(chatRoom.getLastMessageAt())
				.isMuseMode(chatRoom.getNovel().isMuseMode())
				.status(chatRoom.getStatus())
				.build();
	}

	/**
	 * 채팅방 생성 서비스
	 * + chat_message에 추가
	 *
	 */
	@Transactional
	@Override
	public MyMuseResponse createChatRoom(ChatRoomRequest request) {

		Novel novel = novelRepository.findById(request.getNovelId())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 소설 id 입니다"));

		User user = userRepository.findById(request.getUserId())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자 id 입니다"));

		Character character = characterRepository.findById(request.getCharacterId())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 캐릭터 id 입니다"));

		ChatRoom chatRoom = ChatRoom.builder()
				.novel(novel)
				.user(user)
				.character(character)
				.userNickname(request.getUserNickname())
				.scenarioId(request.getScenarioId())
				.scenarioStep(request.getScenarioStep())
				.currentScore(0)
				.currentLocation(request.getFirstSceneLocation())
				.lastSummary(request.getFirstSceneContent())
				.lastMessage(request.getFirstSceneContent())
				.lastMessageAt(LocalDateTime.now())
				.status("ACTIVE")
				.roomMode(request.getRoomMode())
				.userNote(null)
				.build();

		// 채팅방 새로 생성
		ChatRoom savedRoom = chatRoomRepository.save(chatRoom);

		Map<String, Object> metadata = new HashMap<>();
		metadata.put("is_origin", true);
		metadata.put("scene_type", "PROLOGUE");
		metadata.put("origin_novel_id", novel.getId());

		ChatMessage chatMessage = ChatMessage.builder()
				.chatRoom(chatRoom)
				.senderType("CHARACTER")
				.content(request.getFirstSceneContent())
				.messageType(MessageType.REMAKE)
				.isRead(true)
				.readAt(LocalDateTime.now())
				.metadata(metadata)
				.sequenceOrder(0)
				.build();

		chatMessageRepository.save(chatMessage); // AI 답변왔을때까지 기다렸다가 넣자

		return MyMuseResponse.builder()
				.novelId(novel.getId())
				.roomId(savedRoom.getId())
				.characterId(character.getId())
				.name(character.getName())
				.profileImageUrl(character.getProfileImageUrl())
				.profileImagePosY(character.getProfileImagePosY())
				.currentScore(savedRoom.getCurrentScore())
				.relationshipStatus(savedRoom.getRelationshipStatus())
				.lastMessage(savedRoom.getLastMessage())
				.lastMessageAt(savedRoom.getLastMessageAt())
				.currentLocation(savedRoom.getCurrentLocation())
				.status(savedRoom.getStatus())
				.isNovelDeleted(novel.isDelete())
				.isMuseMode(novel.isMuseMode())
				.userId(user.getId())
				.roomMode(savedRoom.getRoomMode())
				.build();

	}

	/**
	 * character ID 유효성 검사
	 *
	 */
	@Transactional(readOnly = true)
	@Override
	public NovelResponse checkValidCharacter(Long characterId) {

		Character character = characterRepository.findById(characterId)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 캐릭터입니다"));

		Novel novel = novelRepository.findById(character.getNovel().getId())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 소설입니다"));

		return NovelResponse.builder()
				.id(novel.getId())
				.title(novel.getTitle())
				.description(novel.getDescription())
				.worldSetting(novel.getWorldSetting())
				.authorId(novel.getAuthor().getId())
				.authorName(novel.getAuthor().getNickname())
				.authorNote(novel.getAuthorNote())
				.profileImg(novel.getAuthor().getProfileImageUrl())
				.mainChar(Character.builder()
						.id(characterId)
						.name(character.getName())
						.gender(character.getGender())
						.statusMessage(character.getStatusMessage())
						.profileImageUrl(character.getProfileImageUrl())
						.profileImagePosY(character.getProfileImagePosY())
						.firstSceneContent(character.getFirstSceneContent())
						.firstSceneLocation(character.getFirstSceneLocation())
						.build())
				.tags(novel.getTags())
				.coverImageUrl(novel.getCoverImageUrl())
				.coverImagePosY(novel.getCoverImagePosY())
				.isMuseMode(novel.isMuseMode())
				.shatredAt(novel.getSharedAt())
				.build();
	}

	/**
	 * Chatroom의 message 조회
	 *
	 */
	@Transactional(readOnly = true)
	@Override
	public ChatMessageResponse getChatMessages(Long roomId) {

		ChatRoom chatRoom = chatRoomRepository.findById(roomId)
				.orElseThrow(() -> new EntityNotFoundException("해당 채팅방을 찾을 수 없습니다. ID: " + roomId));
		List<ChatMessage> chatMessages = chatMessageRepository.findByRoomIdOrderBySequenceOrder(roomId);

		List<MessageDetail> messageDetails = chatMessages.stream()
				.map(m -> MessageDetail.builder()
						.id(m.getId())
						.senderType(m.getSenderType())
						.messageType(m.getMessageType().name())
						.content(m.getContent())
						.sequenceOrder(m.getSequenceOrder())
						.metadata(m.getMetadata())
						.createdAt(m.getCreatedAt())
						.build())
				.toList();

		return ChatMessageResponse.builder()
				.messages(messageDetails)
				.roomInfo(RoomDetail.builder()
						.roomId(chatRoom.getId())
						.userNote(chatRoom.getUserNote())
						.lastSummary(chatRoom.getLastSummary())
						.build())
				.build();

	}

	/**
	 * 사용자 노트 수정
	 *
	 */
	@Transactional
	@Override
	public String updateUserNote(Long roomId, String userNote) {
		ChatRoom chatRoom = chatRoomRepository.findById(roomId)
				.orElseThrow(() -> new EntityNotFoundException("채팅방 없음"));
		chatRoom.setUserNote(userNote);
		return userNote;
	}

	/**
	 * REMAKE 메시지 (AI) 서비스 + 자동 전개모드 (AUTO)에 따른 로직 처리
	 * 
	 */
	@Transactional
	@Override
	public ChatMessageResponse generateNextRemakeMessage(ChatMessageRequest request) {
		boolean mode = false;
		if (request.getAutoMode().equals("AUTO"))
			mode = true; // 자동 전개 모드

		int maxRetries = 2; // 최대 2번 더 시도 (총 3번)
		int attempt = 0;

		while (attempt <= maxRetries) {
			try {

				// 컨텍스트 준비
				ChatMessageContext ctx = prepareContext(request.getRoomId(), mode);

				// AI 전달 message builder로 생성
				List<Message> messages = buildRemakeMessages(ctx, request.getUserInput(), mode);

				// AI 호출
				String jsonResponse = novelService.getAiResponse(messages);
				log.debug("리메이크 AI 응답: {}", jsonResponse);

				// AI 응답 파싱
				JsonNode rootNode = objectMapper.readTree(jsonResponse);
				String aiOutput = rootNode.path("ai_output").asText("");
				String keyEvent = rootNode.path("key_event").asText("");

				if (aiOutput.isBlank() || keyEvent.isBlank()) throw new RuntimeException("AI 각색 내용 누락");

				// 최종 사용자 입력 텍스트 결정 (기존 로직 이식)
				String finalUserInput;
				if (request.getUserInput() == null || request.getUserInput().isBlank()) {
					finalUserInput = "자동 전개 모드(AUTO) : 사용자 입력이 없습니다.";
				} else if (mode) {
					finalUserInput = "자동 전개 모드(AUTO) : " + request.getUserInput();
				} else {
					finalUserInput = request.getUserInput();
				}

				List<ChatMessage> previousMessages = ctx.previousMessages();
				ChatRoom chatRoom = ctx.chatRoom();

				int lastOrder = previousMessages.isEmpty() ? 0
						: previousMessages.get(previousMessages.size() - 1).getSequenceOrder();

				Map<String, Object> metaDataMap = new HashMap<>();
				metaDataMap.put("user_input", finalUserInput);
				metaDataMap.put("origin_novel_id", chatRoom.getNovel().getId());
				metaDataMap.put("auto_mode", request.getAutoMode());
				metaDataMap.put("key_event", keyEvent);

				// AI 각색 결과 및 나머지 정보 저장
				ChatMessage remakeScene = ChatMessage.builder()
				.chatRoom(chatRoom)
				.senderType("CHARACTER") // 리메이크에선 무조건 CHARACTER
				.messageType(MessageType.REMAKE)
				.content(aiOutput) // AI가 쓴 소설 각색문
				.metadata(metaDataMap)
				.isRead(true) // 리메이크에선 무조건 true
				.sequenceOrder(lastOrder + 1)
				.build();
				
				ChatMessage saved = chatMessageRepository.save(remakeScene);
				log.info("저장된 메시지 ID: {}", saved.getId());

				if (remakeScene.getSequenceOrder() % 5 == 0) { // chat_message 5개마다 chat_room 의 last_summary 갱신
					// @Async 비동기 실행(응답 별개, 백그라운드에서 실행)
					summaryService.remakeSummarizeInterval(chatRoom.getId());
				}

				//return ChatMessageResponse.of(remakeScene, mainChar);

			} catch (Exception e) {
				attempt++;
				log.warn("AI 응답 생성 실패 (시도 {}/{}): {}", attempt, maxRetries + 1, e.getMessage());

				if (attempt > maxRetries) {
					log.error("최대 재시도 횟수를 초과했습니다.");
					throw new RuntimeException("AI 작가가 현재 원고 작성을 거부하고 있습니다. 잠시 후 다시 시도해 주세요.");
				}

				try {
					Thread.sleep(500);
				} catch (InterruptedException ie) {
					Thread.currentThread().interrupt();
				}
			}
		}

		throw new RuntimeException("예기치 못한 시스템 오류가 발생했습니다.");
	}

	/**
	 * AI 전달 Message 빌더
	 * 
	 * @param mode
	 * @param string
	 * @param ctx
	 */
	private List<Message> buildRemakeMessages(ChatMessageContext ctx, String userInput, boolean isAutoMode) {
		ChatRoom chatRoom = ctx.chatRoom();
		List<ChatMessage> previousMessages = ctx.previousMessages();
		Character mainChar = ctx.mainChar();

		List<Message> messages = new ArrayList<>();

		try {
			// 시스템 프롬프트 읽기 및 치환
			String baseSystemPrompt = StreamUtils.copyToString(aiSystemPromptResource.getInputStream(),
					StandardCharsets.UTF_8);

			String initialSummary = (chatRoom.getLastSummary() != null && !chatRoom.getLastSummary().isBlank())
					? chatRoom.getLastSummary()
					: (chatRoom.getLastMessage() != null ? chatRoom.getLastMessage() : "이제 막 이야기가 시작되는 단계입니다.");

			baseSystemPrompt = baseSystemPrompt
					.replace("{{totalSummary}}", initialSummary)
					.replace("{{worldSetting}}",
							chatRoom.getNovel().getWorldSetting() != null ? chatRoom.getNovel().getWorldSetting() : "일반적인 세계관")
					.replace("{{mainCharName}}", mainChar.getName())
					.replace("{{userNote}}", chatRoom.getUserNote() != null ? chatRoom.getUserNote() : "특별한 메모 없음");

			// 모드별 추가 지시문 구성
			StringBuilder instructionBuilder = new StringBuilder();
			String userText = (userInput != null) ? userInput.trim() : "";
			boolean hasInput = !userText.isEmpty();

			if (isAutoMode && !hasInput) {
				instructionBuilder.append("\n\n### [MODE: PURE AUTO]\n- 사용자의 입력이 없습니다. 당신이 '작가'로서 서사를 주도하십시오.");
			} else if (isAutoMode && hasInput) {
				instructionBuilder.append("\n\n### [MODE: GUIDED AUTO]\n- 가이드: \"").append(userText)
						.append("\"\n- 위 가이드를 방향성으로 삼아 풍성하게 묘사하십시오.");
			} else {
				instructionBuilder.append("\n\n### [MODE: MANUAL USER INPUT]\n- 입력 내용: \"").append(userText)
						.append("\"\n- 사용자의 입력을 최우선으로 반영하십시오.");
			}

			instructionBuilder
					.append("\n\n[!!! CRITICAL OUTPUT RULE !!!]\n- 반드시 JSON 형식으로 'ai_output'과 'key_event'를 출력하십시오.");

			// 시스템 메시지 추가
			messages.add(new SystemMessage(baseSystemPrompt + instructionBuilder.toString()));

			// 이전 대화 기록 추가 (맥락 주입)
			for (ChatMessage message : previousMessages) {
				// 사용자의 지시 추출
				String prevInput = "(시스템: 자동 전개됨)";
				if (message.getMetadata() != null && message.getMetadata().containsKey("user_input")) {
					prevInput = message.getMetadata().get("user_input").toString();
				}
				messages.add(new UserMessage(prevInput));

				// AI의 이전 답변을 JSON 형태로 변환 (형식 학습용)
				try {
					Map<String, Object> prevData = new HashMap<>();
					// [수정 포인트]: Map은 add가 아니라 put입니다!
					prevData.put("ai_output", message.getContent());

					String keyEvent = "사건 요약";
					if (message.getMetadata() != null && message.getMetadata().containsKey("key_event")) {
						keyEvent = message.getMetadata().get("key_event").toString();
					}
					prevData.put("key_event", keyEvent);

					String prevJson = objectMapper.writeValueAsString(prevData);
					messages.add(new AssistantMessage(prevJson));
				} catch (JsonProcessingException e) {
					messages.add(new AssistantMessage(message.getContent()));
				}
			}

			// 현재 사용자의 새로운 요청 추가 (마지막 UserMessage)
			String currentPrompt = hasInput ? userText : "이전 흐름을 이어 다음 장면을 작성하세요.";
			messages.add(new UserMessage(currentPrompt));

		} catch (IOException e) {
			log.error("프롬프트 파일을 읽거나 처리하는 중 오류 발생", e);
			throw new RuntimeException("AI 컨텍스트 구성 실패", e);
		}

		return messages;
	}

	/**
	 * Message 전달 데이터 준비 메서드
	 * 
	 * @param novelId
	 * @return
	 */
	private ChatMessageContext prepareContext(Long roomId, boolean isAuto) {

		int count = isAuto ? 5 : 3; // 자동전개 모드에 따라 갯수 변경

		// 최근 n개 장면 조회 및 정렬
		List<ChatMessage> previousMessages = chatMessageRepository.findByChatRoomIdOrderBySequenceOrder(roomId,
				PageRequest.of(0, count));
		Collections.reverse(previousMessages); // 반대로 정렬

		// 현재 Chat_room 조회
		ChatRoom chatRoom = chatRoomRepository.findById(roomId)
				.orElseThrow(() -> new EntityNotFoundException("찾을 수 없는 roomId"));

		String userNote = chatRoom.getUserNote();

		// 현재 소설 속 메인 캐릭터 조회
		Character mainChar = characterRepository.findByNovelIdAndRole(chatRoom.getNovel().getId(), CharacterRole.MAIN);

		return new ChatMessageContext(chatRoom, mainChar, previousMessages, userNote);
	}

	@Override
	public ChatMessageResponse generateNextChatMessage(ChatMessageRequest request) {
		// TODO Auto-generated method stub
		return null;
	}

}