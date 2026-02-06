package com.muse.amuze.novel.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {
  private Long roomId;
  private String roomMode;
  private String autoMode;
  private String userInput;
  private Integer lastSceneId;
}
