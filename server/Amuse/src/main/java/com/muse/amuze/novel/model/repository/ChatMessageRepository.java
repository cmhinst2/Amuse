package com.muse.amuze.novel.model.repository;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.muse.amuze.novel.model.entity.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

  @Query("SELECT m FROM ChatMessage m WHERE m.id = :roomId ORDER BY m.sequenceOrder ASC")
  List<ChatMessage> findByRoomIdOrderBySequenceOrder(@Param("roomId") Long roomId);

  List<ChatMessage> findByChatRoomIdOrderBySequenceOrder(Long roomId, PageRequest of);

  @Query("SELECT m FROM ChatMessage m WHERE m.chatRoom.id = :roomId ORDER BY m.sequenceOrder DESC LIMIT 5")
  List<ChatMessage> findTop5ByRoomIdOrderBySequenceOrderDesc(@Param("roomId") Long roomId);

}
