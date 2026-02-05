package com.muse.amuze.novel.model.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import lombok.Builder;
import lombok.Data;
@Builder
@Data
public class ChatMessageResponse {
  private List<MessageDetail> messages;
  private RoomDetail roomInfo;

  @Data
  @Builder
  public static class MessageDetail {
    private Long id;
    private String senderType;
    private String messageType;
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
}
