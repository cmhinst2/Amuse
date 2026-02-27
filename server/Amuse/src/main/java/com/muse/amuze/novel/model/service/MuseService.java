package com.muse.amuze.novel.model.service;

import java.util.List;

import com.muse.amuze.novel.model.dto.ChatMessageRequest;
import com.muse.amuze.novel.model.dto.ChatMessageResponse;
import com.muse.amuze.novel.model.dto.ChatRoomRequest;
import com.muse.amuze.novel.model.dto.MyMuseResponse;
import com.muse.amuze.novel.model.dto.NovelResponse;

public interface MuseService {

	List<MyMuseResponse> getMyMuseList(int userId);
	
	MyMuseResponse checkChatRoomByUserId(int novelId, int userId);

	MyMuseResponse createChatRoom(ChatRoomRequest request);

	MyMuseResponse checkChatRoomByRoomID(Long roomId);

  NovelResponse checkValidCharacter(Long characterId);

  ChatMessageResponse getChatMessages(Long roomId);

  String updateUserNote(Long roomId, String userNote);

	ChatMessageResponse generateNextRemakeMessage(ChatMessageRequest request);

	ChatMessageResponse generateNextChatMessage(ChatMessageRequest request);

  ChatMessageResponse regenerateMessage(Long roomId, Long id) throws Exception;

	ChatMessageResponse editLastMessage(ChatMessageRequest request);

	List<MyMuseResponse> getMyMuseList_loop(int userId);

	void measurePerformance(int userId);
}
