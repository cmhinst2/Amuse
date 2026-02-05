package com.muse.amuze.novel.model.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muse.amuze.novel.model.dto.ChatMessageResponse;
import com.muse.amuze.novel.model.dto.ChatMessageResponse.MessageDetail;
import com.muse.amuze.novel.model.dto.ChatMessageResponse.RoomDetail;
import com.muse.amuze.novel.model.dto.ChatRoomRequest;
import com.muse.amuze.novel.model.dto.MyMuseResponse;
import com.muse.amuze.novel.model.dto.NovelResponse;
import com.muse.amuze.novel.model.entity.Character;
import com.muse.amuze.novel.model.entity.ChatMessage;
import com.muse.amuze.novel.model.entity.ChatRoom;
import com.muse.amuze.novel.model.entity.MessageType;
import com.muse.amuze.novel.model.entity.Novel;
import com.muse.amuze.novel.model.repository.CharacterRepository;
import com.muse.amuze.novel.model.repository.ChatMessageRepository;
import com.muse.amuze.novel.model.repository.ChatRoomRepository;
import com.muse.amuze.novel.model.repository.NovelRepository;
import com.muse.amuze.user.model.entity.User;
import com.muse.amuze.user.model.repository.UserRepository;

import groovy.util.logging.Slf4j;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Slf4j
@Service
@RequiredArgsConstructor
@PropertySource("classpath:/config.properties")
public class MuseServiceImpl implements MuseService {

	private final ChatRoomRepository chatRoomRepository;
	private final ChatMessageRepository chatMessageRepository;
	private final NovelRepository novelRepository;
	private final CharacterRepository characterRepository;
	private final UserRepository userRepository;

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
				.messageType(MessageType.ACTION)
				.isRead(true)
				.readAt(LocalDateTime.now())
				.metadata(metadata)
				.sequenceOrder(0)
				.build();

		chatMessageRepository.save(chatMessage);

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

	@Transactional
	@Override
	public String updateUserNote(Long roomId, String userNote) {
		ChatRoom chatRoom = chatRoomRepository.findById(roomId)
				.orElseThrow(() -> new EntityNotFoundException("채팅방 없음"));
		chatRoom.setUserNote(userNote);
		return userNote;
	}
}