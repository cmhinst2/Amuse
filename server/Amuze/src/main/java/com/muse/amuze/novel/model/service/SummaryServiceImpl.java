package com.muse.amuze.novel.model.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.io.Resource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import com.muse.amuze.novel.model.entity.Novel;
import com.muse.amuze.novel.model.entity.StoryScene;
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

	private final StorySceneRepository storySceneRepository;
	private final NovelRepository novelRepository;
	private final OpenAiChatModel chatModel;

	@Value("classpath:prompts/summary-system-prompt.txt")
	private Resource summaryPromptResource;

	/** 최근 다섯개 씬의 내용 줄거리 요약
	 * keyEvents 기반으로 요약
	 */
	@Async
	@Transactional
	public void summarizeInterval(Long novelId) throws IOException {
		// 모든 Key Events 조회
		List<String> keyEvents = storySceneRepository.findAllKeyEventsByNovelId(novelId);

		// AI에게 보낼 텍스트로 결합 (ex) "1. 사건 -> 2. 사건")
		String combinedEvents = String.join(" -> ", keyEvents);

		// AI에게 요약 요청
		log.info("추출된 이벤트: " + combinedEvents);
		String newSummary = requestSummary(combinedEvents);

		// 마스터 줄거리 업데이트 (novel 테이블 total_summary)
        Novel novel = novelRepository.findById(novelId)
                .orElseThrow(() -> new RuntimeException("소설을 찾을 수 없습니다."));
        novel.setTotalSummary(newSummary);

        // 가장 최신 장면 하나에 스냅샷 저장(story_scene 테이블 summary)
        StoryScene latestScene = storySceneRepository.findTopByNovelIdOrderByIdDesc(novelId);
        if (latestScene != null) {
            latestScene.setSummary(newSummary);
        }
        
        log.info("=== 비동기 요약 완료 (Novel ID: " + novelId + ") ===");
	}
	
	/**
     * 사건 리스트를 바탕으로 전체 줄거리를 요약.
     * @param combinedEvents "사건1 -> 사건2 -> 사건3" 형태의 문자열
     * @return 요약된 줄거리 텍스트
	 * @throws IOException 
     */
    public String requestSummary(String combinedEvents) throws IOException {
    	String systemPrompt = StreamUtils.copyToString(summaryPromptResource.getInputStream(),
				StandardCharsets.UTF_8);

        String userPrompt = "# Input (Key Events)\n" + combinedEvents;

        // 1. Prompt 생성
        Prompt prompt = new Prompt(
            List.of(
                new SystemMessage(systemPrompt),
                new UserMessage(userPrompt)
            )
        );

        // 2. AI 호출 및 결과 반환 (단순 텍스트 추출)
        ChatResponse response = chatModel.call(prompt);
        return response.getResult().getOutput().getContent();
    }
}
