package com.muse.amuze.novel.model.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import com.muse.amuze.novel.model.entity.ChatMessage;
import com.muse.amuze.novel.model.entity.ChatRoom;
import com.muse.amuze.novel.model.entity.Novel;
import com.muse.amuze.novel.model.entity.StoryScene;
import com.muse.amuze.novel.model.repository.ChatMessageRepository;
import com.muse.amuze.novel.model.repository.ChatRoomRepository;
import com.muse.amuze.novel.model.repository.NovelRepository;
import com.muse.amuze.novel.model.repository.StorySceneRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
@PropertySource("classpath:/config.properties")

public class SummaryServiceImpl implements SummaryService {

  private final ChatRoomRepository chatRoomRepository;
  private final ChatMessageRepository chatMessageRepository;
  private final StorySceneRepository storySceneRepository;
  private final NovelRepository novelRepository;
  private final OpenAiChatModel chatModel;

  @Value("classpath:prompts/summary-system-prompt.txt")
  private Resource summaryPromptResource;

  /** NOVEL
   * 전체 내용 줄거리 요약
   * 누적 totalSummar + 최근 5개 keyEvents 기반으로 요약
   */
  @Async
  @Transactional
  public void summarizeInterval(Long novelId) throws IOException {
    // 소설 및 기존 줄거리 조회
    Novel novel = novelRepository.findById(novelId)
        .orElseThrow(() -> new RuntimeException("소설을 찾을 수 없습니다."));

    // 최근 5개의 장면 조회 (sequenceOrder 기준 내림차순)
    List<StoryScene> recentScenes = storySceneRepository.findByNovelIdOrderBySequenceOrderDesc(
        novelId, PageRequest.of(0, 5));

    if (recentScenes.isEmpty())
      return;

    // 최근 Key Events 추출 및 시간순 정렬
    List<String> recentKeyEvents = recentScenes.stream()
        .map(StoryScene::getKeyEvent)
        .collect(Collectors.toList());
    Collections.reverse(recentKeyEvents);
    String combinedEvents = String.join(" -> ", recentKeyEvents);

    // 기존 줄거리와 새 사건을 하나의 입력 데이터로 구성
    String existingSummary = (novel.getTotalSummary() != null && !novel.getTotalSummary().isBlank())
        ? novel.getTotalSummary()
        : "새로운 소설의 시작 단계입니다.";

    // 프롬프트 내부의 {{inputData}} 자리에 들어갈 문자열
    String inputData = String.format(
        "### 기존 전체 줄거리:\n%s\n\n### 새로 발생한 사건들:\n%s",
        existingSummary,
        combinedEvents);

    // AI 호출 (requestSummary 메서드 실행)
    log.info("비동기 줄거리 업데이트 요청 - Novel ID: {}", novelId);
    String updatedSummary = requestSummary(inputData);

    // DB 반영 (소설 마스터 테이블 및 최신 장면 스냅샷)
    novel.setTotalSummary(updatedSummary);
    recentScenes.get(0).setSummary(updatedSummary);

    log.info("=== 줄거리 업데이트 완료 (Novel ID: {}) ===", novelId);
  }

  /** REMAKE
   * 전체 내용 줄거리 요약
   * 누적 lastSummary + 최근 5개 keyEvents 기반으로 요약
   * chat_message 테이블의 metadata 필드에 저장된 keyEvent들을 기반으로 함
   */
  @Async
  @Transactional
  public void remakeSummarizeInterval(Long roomId) throws IOException {
    // 채팅방 정보 조회 (기존 last_summary 가져오기)
    ChatRoom chatRoom = chatRoomRepository.findById(roomId)
        .orElseThrow(() -> new RuntimeException("채팅방을 찾을 수 없습니다."));

    // 해당 채팅방의 최신 메시지 5개 조회
    List<ChatMessage> recentMessages = chatMessageRepository.findTop5ByRoomIdOrderBySequenceOrderDesc(roomId);

    log.debug("없는겨? recentMessages:: {}", recentMessages);

    if (recentMessages.isEmpty()) return;

    // Metadata 에서 key_event 추출
    List<String> recentKeyEvents = new ArrayList<>();
    for (ChatMessage msg : recentMessages) {
      Map<String, Object> metadata = msg.getMetadata();
      if (metadata != null && metadata.get("key_event") != null) {
        recentKeyEvents.add(metadata.get("key_event").toString());
      }
    }

    // 추출된 사건이 없으면 중단
    if (recentKeyEvents.isEmpty()) return;

    log.debug("recentKeyEvents {}::", recentKeyEvents);

    // 리스트 반전 (최신순 -> 시간순: 1->2->3->4->5)
    Collections.reverse(recentKeyEvents);
    String combinedEvents = String.join(" -> ", recentKeyEvents);

    // 기존 줄거리 확인
    String existingSummary = (chatRoom.getLastSummary() != null && !chatRoom.getLastSummary().isBlank())
        ? chatRoom.getLastSummary()
        : "새로운 서사가 시작됩니다.";

    // 프롬프트 구성
    String inputData = String.format(
        "### 기존 전체 줄거리:\n%s\n\n### 새로 발생한 사건들:\n%s",
        existingSummary,
        combinedEvents);

    // AI 요약 요청
    log.info("비동기 요약 프로세스 시작 (Room ID: {})", roomId);
    String updatedSummary = requestSummary(inputData);

    // chat_room.last_summary 업데이트
    chatRoom.setLastSummary(updatedSummary);

    log.info("=== chat_room.last_summary 업데이트 성공 (Room ID: {}) ===", roomId);
  }

  /**
   * 사건 리스트를 바탕으로 전체 줄거리를 요약.
   * 
   * @param combinedEvents "사건1 -> 사건2 -> 사건3" 형태의 문자열
   * @return 요약된 줄거리 텍스트
   * @throws IOException
   */
  public String requestSummary(String combinedEvents) throws IOException {
    String systemPrompt = StreamUtils.copyToString(summaryPromptResource.getInputStream(),
        StandardCharsets.UTF_8);

    // PromptTemplate 생성 및 변수 치환
    // 템플릿 안의 {{inputData}}를 파라미터로 받은 inputData 값으로 바꿉니다.
    PromptTemplate template = new PromptTemplate(systemPrompt);
    Message systemMessage = template.createMessage(Map.of("inputData", combinedEvents));

    // UserMessage 생성 (기존 방식 유지 또는 간단하게 구성)
    Message userMessage = new UserMessage("위 지침에 따라 줄거리를 갱신해줘.");

    // Prompt 생성 및 AI 호출 및 결과 반환
    Prompt prompt = new Prompt(List.of(systemMessage, userMessage));
    ChatResponse response = chatModel.call(prompt);

    return response.getResult().getOutput().getContent();
  }
}
