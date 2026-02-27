package com.muse.amuze.novel.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.muse.amuze.novel.model.entity.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

  @Query("SELECT m FROM ChatMessage m WHERE m.chatRoom.id = :roomId ORDER BY m.sequenceOrder ASC")
  List<ChatMessage> findByRoomIdOrderBySequenceOrder(@Param("roomId") Long roomId);

  List<ChatMessage> findByChatRoomIdOrderBySequenceOrderDesc(Long roomId, PageRequest of);

  @Query("SELECT m FROM ChatMessage m WHERE m.chatRoom.id = :roomId ORDER BY m.sequenceOrder DESC LIMIT 5")
  List<ChatMessage> findTop5ByRoomIdOrderBySequenceOrderDesc(@Param("roomId") Long roomId);

  Optional<ChatMessage> findByChatRoomIdAndId(Long roomId, Long id);

  @Query(value = """
  SELECT * FROM chat_message cm
  WHERE (cm.room_id, cm.sequence_order) IN (
  SELECT room_id, MAX(sequence_order)
  FROM chat_message
  WHERE room_id IN :roomIds
  GROUP BY room_id
  )
  """, nativeQuery = true)
  List<ChatMessage> findLastMessagesByRoomIds(@Param("roomIds") List<Long> roomIds);

  ChatMessage findTopByChatRoomIdOrderByCreatedAtDesc(@Param("id") Long id);
}
