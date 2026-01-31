package com.muse.amuze.novel.model.service;

import java.util.List;

import com.muse.amuze.novel.model.dto.ChatRoomRequest;
import com.muse.amuze.novel.model.dto.MyMuseResponse;

public interface MuseService {

	List<MyMuseResponse> getMyMuseList(int userId);

	MyMuseResponse checkChatRoomByUserId(int novelId, int userId);

	MyMuseResponse createChatRoom(ChatRoomRequest request);

	MyMuseResponse checkChatRoomByRoomID(Long roomId);

}
