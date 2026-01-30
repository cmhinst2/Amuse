package com.muse.amuze.novel.model.service;

import java.util.List;

import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.muse.amuze.novel.model.dto.MyMuseReponse;
import com.muse.amuze.novel.model.repository.ChatRoomRepository;

import groovy.util.logging.Slf4j;
import lombok.RequiredArgsConstructor;

@Slf4j
@Service
@RequiredArgsConstructor
@PropertySource("classpath:/config.properties")
public class MuseServiceImpl implements MuseService {

	private final ChatRoomRepository chatRoomRepository;
	
	/** 나의 Muse 목록 조회
	 *
	 */
	@Transactional(readOnly = true)
	@Override
	public List<MyMuseReponse> getMyMuseList(int userId) {
		
		return chatRoomRepository.findMyMuseListByUserId(userId);
	}
	
	/** novelId, userId에 맞는 ChatRoom 조회
	 *
	 */
	@Override
	public MyMuseReponse checkChatRoomByUserId(int novelId, int userId) {
		
		return chatRoomRepository.findChatRoomByNovelIdAndUserId(novelId, userId);
	}
}
