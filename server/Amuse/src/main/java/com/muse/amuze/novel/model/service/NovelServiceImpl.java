package com.muse.amuze.novel.model.service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StreamUtils;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muse.amuze.common.util.Utility;
import com.muse.amuze.novel.model.dto.NovelCreateRequest;
import com.muse.amuze.novel.model.dto.NovelResponse;
import com.muse.amuze.novel.model.dto.NovelSettingRequest;
import com.muse.amuze.novel.model.dto.NovelUserInputRequest;
import com.muse.amuze.novel.model.dto.StorySceneResponse;
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

	@Value("${amuse.char.web-path}")
	private String charProfileWebPath;

	@Value("${amuse.char.folder-path}")
	private String charProfileFolderPath;

	@Value("classpath:prompts/write-system-prompt.txt")
	private Resource aiSystemPromptResource;

	// 컨텍스트 묶음
	private record NovelContext(Novel novel, Character userChar, Character mainChar, List<StoryScene> previousScenes) {
	}

	/**
	 * noveId에 맞는 소설 조회 서비스
	 *
	 */
	@Transactional(readOnly = true)
	@Override
	public Novel findNovelById(Long novelId) {
		return novelRepository.findByIdAndIsDeleteFalse(novelId)
				.orElseThrow(() -> new EntityNotFoundException("소설을 찾을 수 없거나 삭제되었습니다. ID: " + novelId));
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
	@Transactional(readOnly = true)
	@Override
	public StoryScene findLastSceneByNovelId(Long novelId) {
		return storySceneRepository.findFirstByNovelIdOrderBySequenceOrderDesc(novelId)
				.orElseThrow(() -> new IllegalStateException("해당 소설의 첫 장면이 존재하지 않습니다."));
	}

	/**
	 * 새로운(다음)장면 생성 (AI) 서비스 + 자동 전개모드 (AUTO)에 따른 로직 처리
	 * 
	 * @param novelRequest
	 * @return
	 * @throws Exception
	 */
	@Transactional
	@Override
	public StorySceneResponse generateNextScene(NovelUserInputRequest novelRequest) {

		boolean mode = false;
		if (novelRequest.getMode().equals("AUTO"))
			mode = true; // 자동 전개 모드

		int maxRetries = 2; // 최대 2번 더 시도 (총 3번)
		int attempt = 0;

		while (attempt <= maxRetries) {
			try {

				// AI 전달용 message 데이터 준비(novel, userChar, mainChar, previousScenes)
				NovelContext ctx = prepareContext(novelRequest.getNovelId(), mode);

				// AI 전달 message bulider로 생성
				List<Message> messages = buildMessage(ctx, novelRequest.getContent(), mode);

				// AI 호출
				String jsonResponse = getAiResponse(messages);

				log.debug("AI 응답: {}", jsonResponse);

				// AI 응답 파싱
				JsonNode rootNode = objectMapper.readTree(jsonResponse);
				String aiOutput = rootNode.path("ai_output").asText("");
				int affinityDelta = rootNode.path("affinity_delta").asInt(0);
				String reason = rootNode.path("reason").asText("");
				String keyEvent = rootNode.path("key_event").asText("");

				if (aiOutput.isBlank() || reason.isBlank() || keyEvent.isBlank()) {
					throw new RuntimeException("AI 응답 필수 필드 누락");
				}

				// NovelContext에서 필요한 값 추출
				Novel novel = ctx.novel();
				Character mainChar = ctx.mainChar();
				List<StoryScene> previousScenes = ctx.previousScenes();

				// 호감도 및 관계 등급 업데이트
				String oldLevel = mainChar.getRelationshipLevel(); // 이전 레벨
				mainChar.updateAffinity(affinityDelta); // 호감도 업뎃 후
				String newLevel = mainChar.getRelationshipLevel(); // 최종 레벨

				String finalUserInput = null;
				if (novelRequest.getContent() == null || novelRequest.getContent().isBlank()) {
					finalUserInput = "자동 전개 모드(AUTO) : 사용자 입력이 없습니다.";
				} else if (mode) {
					finalUserInput = "자동 전개 모드(AUTO) : " + novelRequest.getContent();
				} else {
					finalUserInput = novelRequest.getContent();
				}

				// 위에서 뒤집힌 List의 마지막 SequenceOrder 꺼내오기
				int lastOrder = previousScenes.isEmpty() ? 0
						: previousScenes.get(previousScenes.size() - 1).getSequenceOrder();
				// 새로운 장면(Scene) 저장
				StoryScene newScene = StoryScene.builder().novel(novel).userInput(finalUserInput).aiOutput(aiOutput)
						.keyEvent(keyEvent).sequenceOrder(lastOrder + 1).affinityAtMoment(mainChar.getAffinity())
						.build();

				storySceneRepository.save(newScene);

				// 5장면마다 줄거리 요약
				if (newScene.getSequenceOrder() % 5 == 0) {
					// @Async 비동기 실행(응답 별개, 백그라운드에서 실행)
					summaryService.summarizeInterval(novel.getId());
				}

				// 응답 DTO 반환
				return StorySceneResponse.of(newScene, affinityDelta, reason, mainChar, !oldLevel.equals(newLevel));

			} catch (Exception e) {
				attempt++;
				log.warn("AI 응답 생성 실패 (시도 {}/{}): {}", attempt, maxRetries + 1, e.getMessage());

				if (attempt > maxRetries) {
					log.error("최대 재시도 횟수를 초과했습니다.");
					throw new RuntimeException("AI 작가가 현재 원고 작성을 거부하고 있습니다. 잠시 후 다시 시도해 주세요.");
				}

				// 네트워크나 api의 일시적 오류를 대비하여 재시도 전 짧게 대기 후 수행
				try {
					Thread.sleep(500);
				} catch (InterruptedException ie) {
					Thread.currentThread().interrupt();
				}
			}
		}

		throw new RuntimeException("예기치 못한 시스템 오류가 발생했습니다.");
	}

	/**
	 * 현재 장면(AI) 재생성 서비스
	 * 
	 * @param sceneId
	 * @return
	 * @throws JsonProcessingException
	 * @throws JsonMappingException
	 */
	@Transactional
	@Override
	public StorySceneResponse regenerateScene(NovelUserInputRequest novelRequest) throws Exception {
		// 기존 장면 조회
		StoryScene scene = storySceneRepository
				.findByNovelIdAndId(novelRequest.getNovelId(), novelRequest.getLastSceneId())
				.orElseThrow(() -> new EntityNotFoundException("장면을 찾을 수 없습니다."));

		if (scene.isRegenerated())
			throw new IllegalStateException("이미 재생성된 장면입니다.");

		// AI 전달용 message 데이터 준비(novel, userChar, mainChar, previousScenes)
		NovelContext ctx = prepareContext(novelRequest.getNovelId(), false);

		// 기존장면에서 가져온 이전 호감도 변화 취소
		// novel의 메인 캐릭터 호감도 복구
		Character mainChar = ctx.mainChar();
		mainChar.updateAffinity(-scene.getAffinityDelta()); // 이전 생성된 장면에서의 호감도 마이너스(복구)처리하기

		// AI 전달 message bulider로 생성
		List<Message> messages = buildMessage(ctx, scene.getUserInput(), false); // 이전에 사용자가 입력했던 값 그대로 다시 보내기

		// AI에게 다시 요청하여 내용 갱신
		String jsonResponse = getAiResponse(messages);

		log.debug("AI 재생성 응답: {}", jsonResponse);

		// AI 응답 파싱
		JsonNode rootNode = objectMapper.readTree(jsonResponse);
		String aiOutput = rootNode.get("ai_output").asText();
		int affinityDelta = rootNode.get("affinity_delta").asInt();
		String reason = rootNode.get("reason").asText();
		String keyEvent = rootNode.get("key_event").asText();

		String oldLevel = mainChar.getRelationshipLevel(); // 이전 레벨
		mainChar.updateAffinity(affinityDelta); // character entity 새 호감도 반영
		String newLevel = mainChar.getRelationshipLevel(); // 최종 레벨

		scene.setAiOutput(aiOutput);
		scene.setKeyEvent(keyEvent);
		scene.setAffinityDelta(affinityDelta); // story_scene 새로운 호감도 저장
		scene.setAffinityAtMoment(mainChar.getAffinity()); // 갱신된 누적 호감도 스냅샷

		scene.setRegenerated(true); // 재생성 체크
		scene.setEdited(true); // 재생성한 내용은 수정 불가

		return StorySceneResponse.of(scene, affinityDelta, reason, mainChar, !oldLevel.equals(newLevel));
	}

	/**
	 * 해당 소설 모든 기록 불러오기
	 *
	 */
	@Transactional(readOnly = true)
	@Override
	public List<StorySceneResponse> getScenes(Long novelId) {
		return storySceneRepository.findByNovelIdOrderByIdAsc(novelId).stream().map(StorySceneResponse::from).toList();
	}

	/**
	 * userId와 일치하는 소설(삭제된 것 제외) List 조회
	 *
	 */
	@Transactional(readOnly = true)
	@Override
	public List<NovelResponse> getMyNovelList(int userId) {
		List<Novel> novelList = novelRepository.findAllByAuthorIdAndIsDeleteFalse(userId);

		List<Long> novelIds = novelList.stream().map(Novel::getId).toList(); // 소설의 id들만 추출

		List<NovelStats> statsList = novelStatsRepository.findStatsByNovelIds(novelIds); // 해당 소설의 통계 정보만 한번에 조회
		Map<Long, NovelStats> statsMap = statsList.stream().collect(Collectors.toMap(NovelStats::getNovelId, s -> s));

		List<Character> characters = characterRepository.findMainCharactersByNovelIds(novelIds);
		Map<Long, Character> characterMap = characters.stream()
				.collect(Collectors.toMap(c -> c.getNovel().getId(), c -> c, (existing, replacement) -> existing // 중복 시
																													// 기존값
																													// 유지
				));

		return novelList.stream().map(novel -> {
			// 해당 소설의 통계 정보와 캐릭터 정보를 각각 Map에서 꺼냄
			NovelStats stats = statsMap.get(novel.getId());
			Character mainChar = characterMap.get(novel.getId());

			// DTO의 of 메서드에 함께 전달
			return NovelResponse.of(novel, stats, mainChar);
		}).toList();

	}

	/**
	 * 도서관(모든 소설 조회 - 정렬) 서비스
	 * 
	 * @param order
	 * @return
	 */
	@Transactional(readOnly = true)
	@Override
	public Page<NovelResponse> getNovelListSortByAny(String order, int page, int size) {

		// 정렬 조건 설정
		Sort sort = switch (order) {
		case "views" -> Sort.by(Sort.Direction.DESC, "ns.viewCount");
		case "likes" -> Sort.by(Sort.Direction.DESC, "ns.likeCount");
		default -> Sort.by(Sort.Direction.DESC, "n.sharedAt");
		};

		// Pageable 객채 생성 (페이지 0부터 시작)
		Pageable pageable = PageRequest.of(page, size, sort);
		
		// Repository에서 엔티티 조회(Author FETCH JOIN)
		Page<Novel> novelPage = novelRepository.findSharedNovels(pageable);
		
		List<Long> novelIds = novelPage.getContent().stream().map(Novel::getId).toList();
		Map<Long, Character> mainCharMap = characterRepository.findMainCharactersByNovelIds(novelIds)
		        .stream()
		        .collect(Collectors.toMap(c -> c.getNovel().getId(), c -> c, (a, b) -> a));
		
		// 엔티티를 NovelListResponse DTO로 변환
	    return novelPage.map(novel -> {
	        // 통계 정보 조회 (없으면 0L)
	        NovelStats stats = novelStatsRepository.findByNovelId(novel.getId()).orElse(null);
	        
	        // 메인 캐릭터 정보 추출
	        Character mainChar = mainCharMap.get(novel.getId());
	        
	        return NovelResponse.of(novel, stats, mainChar);
	    });
	}

	/**
	 * 마지막 장면 수정 서비스
	 *
	 */
	@Transactional
	@Override
	public StorySceneResponse generateEditScene(NovelUserInputRequest novelRequest) throws Exception {
		// 해당 엔티티 조회
		StoryScene scene = storySceneRepository
				.findByNovelIdAndId(novelRequest.getNovelId(), novelRequest.getLastSceneId())
				.orElseThrow(() -> new EntityNotFoundException("해당 장면을 찾을 수 없습니다."));

		// 내용 업데이트(수정한 콘텐트)
		scene.setAiOutput(novelRequest.getContent());
		scene.setEdited(true);
		scene.setRegenerated(true);

		// AI 요청(key_event 생성 및 수정)
		String changeKeyEventPrompt = "작성된 내용 : " + novelRequest.getContent()
				+ "\n당신은 전문 편집자입니다. 위 내용을 2문장 이내의 keyEvent로 요약하세요.";
		String newKeyEvent = chatModel.call(changeKeyEventPrompt);
		scene.setKeyEvent(newKeyEvent);

		// 만약 해당 행에 summary가 있었다면 장면 요약 다시 생성하여 업데이트
		if (scene.getSummary() != null && !scene.getSummary().isEmpty()) {
			summaryService.summarizeInterval(novelRequest.getNovelId());
		}

		Character mainChar = characterRepository.findByNovelIdAndRole(novelRequest.getNovelId(), CharacterRole.MAIN);

		// -> 두번의 AI 호출됨 (비용 고려해볼것)
		return StorySceneResponse.of(scene, 0, "직접 수정됨", mainChar, false);
	}

	/**
	 * 소설 정보 업데이트 서비스 + 공개일자 업데이트 추가 (26.01.29)
	 * 
	 * @throws IOException
	 * @throws IllegalStateException
	 *
	 */
	@Transactional
	@Override
	public int updateNovelSettings(Long novelId, NovelSettingRequest request) throws Exception {
		Novel novel = novelRepository.findById(novelId).orElseThrow(() -> new RuntimeException("소설을 찾을 수 없습니다."));

		// null 값 제외한 일반 필드 업데이트
		novel.updateSettings(request);

		// 태그 업데이트
		if (request.getTags() != null) {
			novel.updateTags(request.getTags());
		}

		// 커버 이미지 처리
		MultipartFile coverImage = request.getCoverImageUrl();
		String coverRename = null;
		if (coverImage != null && !coverImage.isEmpty()) {
			coverRename = Utility.fileRename(coverImage.getOriginalFilename());
			coverImage.transferTo(new File(novelFolderPath + coverRename));
			novel.setCoverImageUrl(novelWebPath + coverRename);
		}

		// 캐릭터 정보 + 프로필 이미지 처리
		if (request.getMainCharId() != null) {
			Character mainChar = characterRepository.findById(request.getMainCharId())
					.orElseThrow(() -> new RuntimeException("캐릭터를 찾을 수 없습니다."));

			// 일반 정보 null 제외 업데이트 처리
			if (request.getStatusMessage() != null)
				mainChar.setStatusMessage(request.getStatusMessage());
			if (request.getProfileImagePosY() != null)
				mainChar.setProfileImagePosY(request.getProfileImagePosY());

			MultipartFile profileImage = request.getProfileImageUrl();
			String profileRename = null;
			if (profileImage != null && !profileImage.isEmpty()) {
				profileRename = Utility.fileRename(profileImage.getOriginalFilename());
				profileImage.transferTo(new File(charProfileFolderPath + profileRename));
				mainChar.setProfileImageUrl(charProfileWebPath + profileRename);
			}

		}

		return 1;
	}

	/**
	 * 소설 삭제 서비스
	 *
	 */
	@Transactional
	@Override
	public int deleteNovel(Long novelId) {
		Novel novel = novelRepository.findByIdAndIsDeleteFalse(novelId)
				.orElseThrow(() -> new EntityNotFoundException("소설을 찾을 수 없거나 이미 삭제되었습니다. ID: " + novelId));
		novel.setDelete(true);

		return 1;
	}

	/**
	 * Message 전달 데이터 준비 메서드
	 * 
	 * @param novelId
	 * @return
	 */
	private NovelContext prepareContext(Long novelId, boolean isAuto) {

		int count = isAuto ? 5 : 3; // 자동전개 모드에 따라 갯수 변경

		// 최근 n개 장면 조회 및 정렬
		List<StoryScene> previousScenes = storySceneRepository.findByNovelIdOrderBySequenceOrderDesc(novelId,
				PageRequest.of(0, count)); // 0부터 count 까지 페이지 잘라오기
		Collections.reverse(previousScenes); // 반대로 정렬

		// 현재 소설 조회
		Novel novel = findNovelById(novelId);

		// 현재 소설 속 유저,메인 캐릭터 조회
		Character userChar = characterRepository.findByNovelIdAndRole(novelId, CharacterRole.USER);
		Character mainChar = characterRepository.findByNovelIdAndRole(novelId, CharacterRole.MAIN);

		return new NovelContext(novel, userChar, mainChar, previousScenes);
	}

	/**
	 * AI 전달 Message 빌더
	 * 
	 * @param context    : 현재 소설 정보 모음 객체
	 * @param userInput  : 사용자 입력값
	 * @param isAutoMode : 자동 전개모드 플래그
	 * @return
	 */
	private List<Message> buildMessage(NovelContext context, String userInput, boolean isAutoMode) {
		Novel novel = context.novel();
		Character userChar = context.userChar();
		Character mainChar = context.mainChar();
		List<StoryScene> previousScenes = context.previousScenes();

		// AI 에게 전달할 메세지 List
		List<Message> messages = new ArrayList<>();

		try {

			// 파일에서 시스템 프롬프트 읽기
			String baseSystemPrompt = StreamUtils.copyToString(aiSystemPromptResource.getInputStream(),
					StandardCharsets.UTF_8);

			StringBuilder initialContext = new StringBuilder();
			;
			if (novel.getTotalSummary() != null && !novel.getTotalSummary().isBlank()) {
				initialContext.append(novel.getTotalSummary());
			} else {
				String description = (novel.getDescription() != null && !novel.getDescription().isBlank())
						? novel.getDescription()
						: "이제 막 이야기가 시작되는 단계입니다. 등장인물의 설정에 집중하여 서사를 시작하세요.";
				initialContext.append("\n(초기 서사 단계): ").append(description);
			}

			baseSystemPrompt = baseSystemPrompt.replace("{{totalSummary}}", initialContext.toString())
					.replace("{{characterSettings}}", novel.getCharacterSettings())
					.replace("{{relationLevel}}", mainChar.getRelationshipLevel())
					.replace("{{affinityScore}}", String.valueOf(mainChar.getAffinity()))
					.replace("{{userName}}", userChar.getName()).replace("{{mainCharName}}", mainChar.getName());

			StringBuilder instructionBuilder = new StringBuilder();
			String userText = (userInput != null) ? userInput.trim() : "";
			boolean hasInput = !userText.isEmpty();

			if (isAutoMode && !hasInput) {
				// 순수 자동 전개
				instructionBuilder.append("\n\n### [MODE: PURE AUTO]\n").append("- 현재 사용자의 입력이 전혀 없는 상태입니다.\n")
						.append("- 당신이 '작가'로서 이전 5개의 key_event를 분석해 완전히 새로운 사건이나 감정적 진전을 주도하십시오.\n")
						.append("- 주변 환경 변화나 캐릭터의 돌발 행동을 통해 서사를 확장하십시오.");

			} else if (isAutoMode && hasInput) {
				// 가이드형 자동 전개
				instructionBuilder.append("\n\n### [MODE: GUIDED AUTO]\n").append("- 사용자의 가이드 입력: \"").append(userText)
						.append("\"\n").append("- 위 가이드를 방향성으로 삼되, 당신이 주도적으로 상세한 묘사와 돌발 상황을 덧붙여 서사를 풍성하게 만드십시오.\n")
						.append("- 이전 3개의 key_event와 사용자의 가이드를 자연스럽게 연결하십시오.");

			} else {
				// 일반 사용자 입력 모드
				instructionBuilder.append("\n\n### [MODE: MANUAL USER INPUT]\n").append("- 사용자의 입력 내용: \"")
						.append(userText).append("\"\n")
						.append("- 사용자의 입력을 최우선으로 반영하여 해당 상황에 대한 캐릭터의 반응과 결과를 묘사하십시오.\n")
						.append("- 이전 3개의 key_event 맥락을 유지하십시오.");
			}

			instructionBuilder.append("\n\n[!!! CRITICAL OUTPUT RULE !!!]\n")
					.append("- 반드시 'ai_output' 필드에 800자 내외의 풍부한 소설 본문을 작성하십시오.\n")
					.append("- 'ai_output', 'affinity_delta', 'reason', 'key_event' 네 가지 필드는 단 하나라도 누락되어서는 안 됩니다.\n")
					.append("- 본문(ai_output)이 없는 응답은 실패한 응답으로 간주합니다.");

			// 시스템 메시지 세팅
			messages.add(new SystemMessage(baseSystemPrompt + instructionBuilder.toString()));

			// 이전 맥락(최근3개) 메시지 객체로 추가
			for (StoryScene scene : previousScenes) {
				// 이전 사용자의 입력 (없으면 자동전개 표시) : 무슨 대화를 했는지 맥락 파악 용도
				String prevUserInput = (scene.getUserInput() != null && !scene.getUserInput().isBlank())
						? scene.getUserInput()
						: "(시스템: 자동 전개됨)";
				messages.add(new UserMessage(prevUserInput));

				// 이전 DB 본문을 가짜 JSON으로 감싸서 전달: 이전의 대답 형식(JSON)을 기억, 형식 유지 용도
				Map<String, Object> assistantData = new HashMap<>();
				assistantData.put("ai_output", scene.getAiOutput());
				assistantData.put("affinity_delta", 0);
				assistantData.put("reason", "이전 대화 맥락");
				assistantData.put("key_event", scene.getKeyEvent() != null ? scene.getKeyEvent() : "사건 요약");

				String assistantJson = objectMapper.writeValueAsString(assistantData);
				messages.add(new AssistantMessage(assistantJson));
			}

			if (userInput != null && !userInput.trim().isEmpty()) {
				messages.add(new UserMessage(userInput));
			} else {
				messages.add(new UserMessage("이전 흐름을 이어 다음 장면을 작성하세요."));
			}

		} catch (IOException e) {
			log.error("프롬프트 파일을 읽거나 JSON을 파싱하는 중 오류 발생", e);
			throw new RuntimeException("AI 응답 처리 실패");
		}

		return messages;
	}

	// User의 메시지 전달 및 AI 답변 반환받기
	private String getAiResponse(List<Message> messages) {
		OpenAiChatOptions options = OpenAiChatOptions.builder().temperature(0.8).build();

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