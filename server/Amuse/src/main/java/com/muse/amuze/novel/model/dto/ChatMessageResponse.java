package com.muse.amuze.novel.model.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.muse.amuze.novel.model.entity.Character;
import com.muse.amuze.novel.model.entity.ChatMessage;
import com.muse.amuze.novel.model.entity.MessageType;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class ChatMessageResponse {
  private List<MessageDetail> messages;
  private RoomDetail roomInfo;

  // Remake용
  private MessageDetail messageDetail;

  @Data
  @Builder
  public static class MessageDetail {
    private Long id;
    private String senderType;
    private MessageType messageType;
    private String content;
    private Integer sequenceOrder;
    private Map<String, Object> metadata;
    private LocalDateTime createdAt;
  }

  @Data
  @Builder
  public static class RoomDetail {
    private Long roomId;
    private String userNote;
    private String lastSummary;
    private String currentMood;
  }

  public static ChatMessageResponse of(ChatMessage remakeScene) {
    return ChatMessageResponse.builder()
        .messageDetail(MessageDetail.builder()
            .id(remakeScene.getId())
            .senderType(remakeScene.getSenderType())
            .content(remakeScene.getContent())
            .messageType(remakeScene.getMessageType())
            .sequenceOrder(remakeScene.getSequenceOrder())
            .metadata(remakeScene.getMetadata())
            .createdAt(remakeScene.getCreatedAt())
            .build())
        .build();
  }
}
