package com.muse.amuze.novel.model.service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.ai.anthropic.AnthropicChatModel;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.amuze.novel.model.dto.AiAnalysisResponse;
import com.muse.amuze.novel.model.entity.Chapter;
import com.muse.amuze.novel.model.entity.Character;
import com.muse.amuze.novel.model.entity.Scene;
import com.muse.amuze.novel.model.repository.ChapterRepository;
import com.muse.amuze.novel.model.repository.CharacterRepository;
import com.muse.amuze.novel.model.repository.SceneRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiNovelServiceImpl implements AiNovelService {

	private final OpenAiChatModel openAiChatModel;
	private final AnthropicChatModel anthropicChatModel;
	private final SceneRepository sceneRepository;
	private final CharacterRepository characterRepository;
	private final ChapterRepository chapterRepository;
	private final ObjectMapper objectMapper;
	private final ResourceLoader resourceLoader;

	/**
	 * 핵심 집필 로직: 유저는 chapterId와 userInput만 전달함
	 */
	@Override
	@Transactional
	public Scene writeAndAnalyzeScene(Long chapterId, String userInput) {
		try {
			// 1. 데이터 로드 (챕터 및 이전 맥락 추출)
			Chapter chapter = chapterRepository.findById(chapterId)
					.orElseThrow(() -> new RuntimeException("챕터를 찾을 수 없습니다."));

			List<Scene> previousScenes = sceneRepository.findByChapterIdOrderBySequenceOrderAsc(chapterId);
			String contextSummary = previousScenes.stream().map(Scene::getSummary).filter(s -> s != null)
					.collect(Collectors.joining(" -> "));

			if (contextSummary.isEmpty())
				contextSummary = "소설의 시작 단계입니다.";

			// 2. Claude 4.5 Opus - 소설 집필
			String writingSystemPrompt = loadPrompt("classpath:prompts/claude-system-prompt.txt");
			String writingUserPrompt = String.format("[이전줄거리]: %s\n[가이드]: %s", contextSummary, userInput);

			String aiOutput = callClaude(writingSystemPrompt, writingUserPrompt);

			// 3. GPT-4o mini - 결과 분석
			String analysisSystemPrompt = loadPrompt("classpath:prompts/gpt-system-prompt.txt");
			String analysisResult = callGpt(analysisSystemPrompt, "분석할 장면: " + aiOutput);

			// 4. 결과 파싱 및 DB 반영
			AiAnalysisResponse analysis = objectMapper.readValue(analysisResult, AiAnalysisResponse.class);
			updateCharacterStatus(chapter.getNovel().getId(), analysis.getCharacter_status_changes());

			// 5. 장면 저장
			Scene scene = Scene.builder().chapter(chapter).userInput(userInput).aiOutput(aiOutput)
					.summary(analysis.getSummary()).sentimentDelta(analysis.getSentiment_delta())
					.sequenceOrder(previousScenes.size() + 1).build();

			return sceneRepository.save(scene);

		} catch (Exception e) {
			log.error("소설 생성 중 오류 발생: ", e);
			throw new RuntimeException("소설 생성 및 분석 중 오류가 발생했습니다.", e);
		}
	}

	// --- 헬퍼 메서드 ---

	private String loadPrompt(String path) throws Exception {
		Resource resource = resourceLoader.getResource(path);
		return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
	}

	private String callClaude(String system, String user) {
		return anthropicChatModel.call(new Prompt(List.of(new SystemMessage(system), new UserMessage(user))))
				.getResult().getOutput().getContent();
	}

	private String callGpt(String system, String user) {
		return openAiChatModel.call(new Prompt(List.of(new SystemMessage(system), new UserMessage(user)))).getResult()
				.getOutput().getContent();
	}

	private void updateCharacterStatus(Long novelId, List<AiAnalysisResponse.CharacterStatus> statusChanges) {
		if (statusChanges == null)
			return;

		List<Character> characters = characterRepository.findByNovelId(novelId);
		for (AiAnalysisResponse.CharacterStatus change : statusChanges) {
			characters.stream().filter(c -> c.getName().equals(change.getName())).findFirst()
					.ifPresent(c -> c.setCurrentStatus(change.getStatus()));
		}
	}
}