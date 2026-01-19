package com.muse.amuze.novel.model.service;

import java.io.File;

import org.springframework.ai.anthropic.AnthropicChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.muse.amuze.AmuzeApplication;
import com.muse.amuze.common.util.Utility;
import com.muse.amuze.novel.model.dto.NovelCreateRequest;
import com.muse.amuze.novel.model.entity.Novel;
import com.muse.amuze.novel.model.entity.NovelStats;
import com.muse.amuze.novel.model.entity.StoryScene;
import com.muse.amuze.novel.model.repository.NovelRepository;
import com.muse.amuze.novel.model.repository.NovelStatsRepository;
import com.muse.amuze.novel.model.repository.StorySceneRepository;
import com.muse.amuze.user.model.entity.User;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiNovelServiceImpl implements AiNovelService {

	private final StorySceneRepository storySceneRepository;
	private final NovelRepository novelRepository;
	private final NovelStatsRepository novelStatsRepository;
	private final AnthropicChatModel chatModel; // spring-ai-anthropic 사용

	@Value("${amuse.novel.web-path}")
	private String novelWebPath;
	
	@Value("${amuse.novel.folder-path}")
	private String novelFolderPath;
	
	/** 새 소설 시작하기
	 *
	 */
	@Transactional
	@Override
	public Long createNovel(NovelCreateRequest request, MultipartFile coverImage, User user) throws Exception{
		
		String rename = null;
		String updatePath = null; 
		
		// 커버 이미지 처리
		if (coverImage != null && !coverImage.isEmpty()) {
			rename = Utility.fileRename(coverImage.getOriginalFilename());
			updatePath = novelWebPath + rename;
			coverImage.transferTo(new File(novelFolderPath + rename));
		}
		
		// 소설 기본 뼈대 저장
		Novel novel = Novel.builder()
	            .author(user) // 작가정보
	            .title(request.getTitle()) // 제목
	            .description(request.getDescription()) // 짧은소개글
	            .tags(request.getTags()) // 태그
	            .coverImageUrl(updatePath) // 커버이미지
	            .characterSettings(request.getCharacterSettings()) // 캐릭터및세계관
	            .status("PROCESS") // 진행중인소설
	            .isShared(false) // 비공유
	            .build();
		
		// novel_tags 테이블에 데이터가 자동으로 분리되어 저장
		Novel savedNovel = novelRepository.save(novel);
		
		// 소설 통계 초기 데이터 생성 (조회수, 좋아요 등)
	    NovelStats stats = NovelStats.builder()
	            .novel(savedNovel)
	            .viewCount(0L)
	            .likeCount(0L)
	            .build();
	    novelStatsRepository.save(stats);
	    
	    // 유저가 입력한 첫장면 저장
	    StoryScene firstScene = StoryScene.builder()
	            .novel(savedNovel)
	            .sequenceOrder(0) // 첫 번째 데이터
	            .userInput(request.getFirstScene()) // 사용자가 입력한 가이드/프롬프트
	            .aiOutput(request.getFirstScene())  // 첫 장면은 사용자가 쓴 내용이 곧 본문
	            .keyEvent("소설의 시작")
	            .affinityAtMoment(0)
	            .build();
	    storySceneRepository.save(firstScene);
	    
		return savedNovel.getId();
	}
}