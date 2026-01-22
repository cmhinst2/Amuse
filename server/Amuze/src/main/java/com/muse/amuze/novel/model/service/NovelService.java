package com.muse.amuze.novel.model.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.muse.amuze.novel.model.dto.NovelCreateRequest;
import com.muse.amuze.novel.model.dto.StorySceneResponse;
import com.muse.amuze.novel.model.dto.UserNovelRequest;
import com.muse.amuze.novel.model.entity.Novel;
import com.muse.amuze.novel.model.entity.StoryScene;
import com.muse.amuze.user.model.entity.User;

public interface NovelService {

	/** 소설 생성 서비스
	 * @param request
	 * @param coverImage
	 * @param user
	 * @return
	 */
	Long createNovel(NovelCreateRequest request, MultipartFile coverImage, User user) throws Exception;

	/** noveId에 맞는 소설 조회 서비스
	 * @param novelId
	 * @return
	 */
	Novel findNovelById(Long novelId);

	/** 다음장면 생성 (AI) 서비스
	 * @param novelRequest
	 * @return
	 */
	StorySceneResponse generateNextScene(UserNovelRequest novelRequest) throws Exception;

	/** 해당 소설 모든 기록 불러오기
	 * @param novelId
	 * @return
	 */
	List<StorySceneResponse> getScenes(Long novelId);

	/** 마지막 장면 찾기
	 * @param novelId
	 * @return
	 */
	StoryScene findLastSceneByNovelId(Long novelId);


}
