package com.muse.amuze.novel.model.service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.amuze.common.util.Utility;
import com.muse.amuze.novel.model.dto.NovelCreateRequest;
import com.muse.amuze.novel.model.dto.StorySceneResponse;
import com.muse.amuze.novel.model.dto.UserNovelRequest;
import com.muse.amuze.novel.model.entity.Character;
import com.muse.amuze.novel.model.entity.CharacterRole;
import com.muse.amuze.novel.model.entity.Novel;
import com.muse.amuze.novel.model.entity.NovelStats;
import com.muse.amuze.novel.model.entity.StoryScene;
import com.muse.amuze.novel.model.repository.CharacterRepository;
import com.muse.amuze.novel.model.repository.NovelRepository;
import com.muse.amuze.novel.model.repository.NovelStatsRepository;
import com.muse.amuze.novel.model.repository.StorySceneRepository;
import com.muse.amuze.user.model.entity.User;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@PropertySource("classpath:/config.properties")
public class NovelServiceImpl implements NovelService {

	private final SummaryService summaryService;

	private final StorySceneRepository storySceneRepository;
	private final CharacterRepository characterRepository;
	private final NovelRepository novelRepository;
	private final NovelStatsRepository novelStatsRepository;
	private final OpenAiChatModel chatModel;
	private final ObjectMapper objectMapper; // JSON 파싱용

	@Value("${amuse.novel.web-path}")
	private String novelWebPath;

	@Value("${amuse.novel.folder-path}")
	private String novelFolderPath;

	@Value("classpath:prompts/claude-system-prompt.txt")
	private Resource aiSystemPromptResource;

	/**
	 * noveId에 맞는 소설 조회 서비스
	 *
	 */
	@Override
	public Novel findNovelById(Long novelId) {
		return novelRepository.findById(novelId)
				.orElseThrow(() -> new EntityNotFoundException("소설을 찾을 수 없습니다. ID: " + novelId));
	}

	/**
	 * 소설 생성 서비스
	 *
	 */
	@Transactional
	@Override
	public Long createNovel(NovelCreateRequest request, MultipartFile coverImage, User user) throws Exception {

		String rename = null;
		String updatePath = null;

		// 커버 이미지 처리
		if (coverImage != null && !coverImage.isEmpty()) {
			rename = Utility.fileRename(coverImage.getOriginalFilename());
			updatePath = novelWebPath + rename;
			coverImage.transferTo(new File(novelFolderPath + rename));
		}

		// 캐릭터 설정 정보 요약
		// AI 컨텍스트용으로 쓰기 위해 캐릭터 리스트를 하나의 텍스트로 합침
		String combinedSettings = request.getCharacters().stream().map(c -> String.format("[%s / %s / %s]: %s (%s)",
				c.getName(), c.getRole(), c.getGender(), c.getPersonality(), c.getAppearance()))
				.collect(Collectors.joining("\n"));

		// 소설 기본 뼈대 저장
		Novel novel = Novel.builder().author(user) // 작가정보
				.title(request.getTitle()) // 제목
				.description(request.getDescription()) // 짧은소개글
				.tags(request.getTags()) // 태그
				.coverImageUrl(updatePath) // 커버이미지
				.characterSettings(combinedSettings) // 요약본 저장
				.status("PROCESS") // 진행중인소설
				.isShared(false) // 비공유
				.build();

		// novel_tags 테이블에 데이터가 자동으로 분리되어 저장
		Novel savedNovel = novelRepository.save(novel);

		// 캐릭터 개별 엔티티 저장
		if (request.getCharacters() != null && !request.getCharacters().isEmpty()) {
			List<Character> characterEntities = request.getCharacters().stream()
					.map(charDto -> Character.builder().novel(savedNovel).name(charDto.getName())
							.role(charDto.getRole()).personality(charDto.getPersonality())
							.appearance(charDto.getAppearance()).gender(charDto.getGender()).affinity(0) // 초기 호감도 0
							.relationshipLevel("ACQUAINTANCE") // 초기 관계 '지인'
							.build())
					.collect(Collectors.toList());
			characterRepository.saveAll(characterEntities);
		}

		// 소설 통계 초기 데이터 생성 (조회수, 좋아요 등)
		NovelStats stats = NovelStats.builder().novel(savedNovel).viewCount(0L).likeCount(0L).build();
		novelStatsRepository.save(stats);

		// 유저가 입력한 첫장면 저장
		StoryScene firstScene = StoryScene.builder().novel(savedNovel).sequenceOrder(0) // 첫 번째 데이터
				.userInput(request.getFirstScene()) // 사용자가 입력한 가이드/프롬프트
				.aiOutput(request.getFirstScene()) // 첫 장면은 사용자가 쓴 내용이 곧 본문
				.keyEvent("소설의 시작").affinityAtMoment(0).build();
		storySceneRepository.save(firstScene);

		return savedNovel.getId();
	}

	/**
	 * 마지막 장면 불러오기
	 */
	@Override
	public StoryScene findLastSceneByNovelId(Long novelId) {
		return storySceneRepository.findFirstByNovelIdOrderBySequenceOrderDesc(novelId)
				.orElseThrow(() -> new IllegalStateException("해당 소설의 첫 장면이 존재하지 않습니다."));
	}

	/**
	 * 다음장면 생성 (AI) 서비스
	 * 
	 * @param novelRequest
	 * @return
	 * @throws Exception
	 */
	@Transactional
	@Override
	public StorySceneResponse generateNextScene(UserNovelRequest novelRequest) throws Exception {
		// 소설 및 캐릭터 정보 조회
		Novel novel = findNovelById(novelRequest.getNovelId());

		// 메인 캐릭터 정보 가져오기 (호감도 반영/성별 확인을 위해)
		Character userChar = characterRepository.findByNovelIdAndRole(novel.getId(), CharacterRole.USER);
		Character mainChar = characterRepository.findByNovelIdAndRole(novel.getId(), CharacterRole.MAIN);

		// 이전 맥락 가져오기 (최근 3개 장면)
		List<StoryScene> previousScenes = storySceneRepository.findTop3ByNovelIdOrderBySequenceOrderDesc(novel.getId());
		Collections.reverse(previousScenes); // 시간순서대로 보이게 하기 위해 뒤집기

		try {
			// AI 에게 전달할 메세지 List
			List<Message> messages = new ArrayList<>();

			// 파일에서 시스템 프롬프트 읽기
			String baseSystemPrompt = StreamUtils.copyToString(aiSystemPromptResource.getInputStream(),
					StandardCharsets.UTF_8);

			StringBuilder fullSystemPrompt = new StringBuilder(baseSystemPrompt);
			fullSystemPrompt.append("\n\n[현재까지의 줄거리 요약]");
			if (novel.getTotalSummary() != null && !novel.getTotalSummary().isBlank()) {
				// 요약본이 있는 경우 (5장 이후)
				fullSystemPrompt.append("\n").append(novel.getTotalSummary());
			} else {
				// [초반 예외 처리] 요약본이 없는 경우 (1~4장 사이)
				// 소설의 기본 설명을 활용하거나, 초기 상태임을 명시
				String initialContext = (novel.getDescription() != null && !novel.getDescription().isBlank())
						? novel.getDescription()
						: "이제 막 이야기가 시작되는 단계입니다. 등장인물의 설정에 집중하여 서사를 시작하세요.";
				fullSystemPrompt.append("\n(초기 서사 단계): ").append(initialContext);
			}
			
			fullSystemPrompt.append("\n\n[등장인물 설정 및 페르소나]\n").append(novel.getCharacterSettings());
			fullSystemPrompt.append("\n\n[현재 세션 캐릭터 성별 정보]");
			fullSystemPrompt.append("\n- ").append(userChar.getName()).append(": ").append("M".equals(userChar.getGender()) ? "남성" : "여성");
			fullSystemPrompt.append("\n- ").append(mainChar.getName()).append(": ").append("M".equals(mainChar.getGender()) ? "남성" : "여성");
			fullSystemPrompt.append("\n\n### [현재 관계 상태]");
			fullSystemPrompt.append("\n- 관계 등급: ").append(mainChar.getRelationshipLevel());
			fullSystemPrompt.append("\n- 현재 호감도 점수: ").append(mainChar.getAffinity()).append("점");

			messages.add(new SystemMessage(fullSystemPrompt.toString()));

			// 이전 맥락(최근3개) 메시지 객체로 추가
			for (StoryScene scene : previousScenes) {
				messages.add(new UserMessage(scene.getUserInput()));
				// AI가 이전 응답 맥락을 기억하도록 수정: DB에 본문만 저장되어있어 응답 포맷(JSON)을 기억못하는 이슈 발생
				String fakeJsonResponse = String.format(
			        "{\"ai_output\": \"%s\", \"affinity_delta\": 0, \"reason\": \"이전 대화\", \"key_event\": \"%s\"}",
			        scene.getAiOutput().replace("\"", "\\\"").replace("\n", "\\n"),
			        scene.getKeyEvent() != null ? scene.getKeyEvent().replace("\"", "\\\"") : "사건 요약"
			    );
			    messages.add(new AssistantMessage(fakeJsonResponse));
			}

			// 현재 유저 입력 추가
			messages.add(new UserMessage(novelRequest.getContent()));

			// AI 호출
			String jsonResponse = getAiResponse(messages);

			log.debug("AI Raw Response: {}", jsonResponse);

			// AI 응답 파싱
			JsonNode rootNode = objectMapper.readTree(jsonResponse);
			String aiOutput = rootNode.get("ai_output").asText();
			int affinityDelta = rootNode.get("affinity_delta").asInt();
			String reason = rootNode.get("reason").asText();
			String keyEvent = rootNode.get("key_event").asText();

			// 호감도 및 관계 등급 업데이트
			String oldLevel = mainChar.getRelationshipLevel();
			mainChar.updateAffinity(affinityDelta);
			String newLevel = mainChar.getRelationshipLevel();

			// 위에서 뒤집힌 List의 마지막 SequenceOrder 꺼내오기
			int lastOrder = previousScenes.isEmpty() ? 0
					: previousScenes.get(previousScenes.size() - 1).getSequenceOrder();
			// 새로운 장면(Scene) 저장
			StoryScene newScene = StoryScene.builder()
					.novel(novel)
					.userInput(novelRequest.getContent())
					.aiOutput(aiOutput)
					.keyEvent(keyEvent)
					.sequenceOrder(lastOrder + 1)
					.affinityAtMoment(mainChar.getAffinity())
					.build();

			storySceneRepository.save(newScene);

			// 5장면마다 줄거리 요약
			if (newScene.getSequenceOrder() % 5 == 0) {
				// @Async 비동기 실행(응답 별개, 백그라운드에서 실행)
				summaryService.updateTotalSummaryAsync(novel.getId());
			}

			// 응답 DTO 반환
			return StorySceneResponse.builder()
					.novelId(novel.getId())
					.content(aiOutput)
					.userInput(novelRequest.getContent())
					.affinity(mainChar.getAffinity())
					.affinityDelta(affinityDelta)
					.reason(reason)
					.relationshipLevel(newLevel)
					.sceneId(newScene.getId())
					.levelUp(!oldLevel.equals(newLevel))
					.sequenceOrder(lastOrder + 1)
					.build();

		} catch (IOException e) {
			log.error("프롬프트 파일을 읽거나 JSON을 파싱하는 중 오류 발생", e);
			throw new RuntimeException("AI 응답 처리 실패");
		}
	}

	/**
	 * 해당 소설 모든 기록 불러오기
	 *
	 */
	@Override
	public List<StorySceneResponse> getScenes(Long novelId) {
		return storySceneRepository.findByNovelIdOrderByIdAsc(novelId)
				.stream()
				.map(StorySceneResponse::from)
				.toList();
	}

	// User의 메시지 전달 및 AI 답변 반환받기
	private String getAiResponse(List<Message> messages) {
	    OpenAiChatOptions options = OpenAiChatOptions.builder()
	            .temperature(0.8)
	            .build();

		Prompt prompt = new Prompt(messages, options);

		// AI 호출 및 응답 반환
		return extractJson(chatModel.call(prompt) // AI에게 메시지 뭉치를 보내고 응답(ChatResponse)을 받음
				.getResult() // 응답 중에서 첫 번째 결과(Generation)를 선택
				.getOutput() // 결과 내부에 포함된 AI 메시지(AssistantMessage) 객체를 꺼냄
				.getText()); // 메시지 객체 안의 '순수 텍스트(String)'만 추출
	}

	// json 포맷 제거하여 파싱
	private String extractJson(String text) {
		if (text == null)
			return "{}";

		// 1. 마크다운 코드 블록 제거 (```json 또는 ```)
		String cleaned = text.replaceAll("(?s)```(?:json)?|```", "").trim();

		// 2. 만약 앞뒤에 불필요한 설명글이 붙어있다면 { 로 시작해서 } 로 끝나는 부분만 추출
		int firstBrace = cleaned.indexOf("{");
		int lastBrace = cleaned.lastIndexOf("}");

		if (firstBrace != -1 && lastBrace != -1 && firstBrace < lastBrace) {
			return cleaned.substring(firstBrace, lastBrace + 1);
		}

		return cleaned;
	}

}