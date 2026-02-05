package com.muse.amuze.novel.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.muse.amuze.novel.model.entity.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long>{

  @Query("SELECT m FROM ChatMessage m WHERE m.id = :roomId ORDER BY m.sequenceOrder ASC")
  List<ChatMessage> findByRoomIdOrderBySequenceOrder(@Param("roomId") Long roomId);
  
}
