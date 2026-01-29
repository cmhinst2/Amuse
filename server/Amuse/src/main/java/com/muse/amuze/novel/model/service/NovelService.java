package com.muse.amuze.novel.model.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import com.muse.amuze.novel.model.dto.NovelCreateRequest;
import com.muse.amuze.novel.model.dto.NovelResponse;
import com.muse.amuze.novel.model.dto.NovelSettingRequest;
import com.muse.amuze.novel.model.dto.NovelUserInputRequest;
import com.muse.amuze.novel.model.dto.StorySceneResponse;
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
	StorySceneResponse generateNextScene(NovelUserInputRequest novelRequest);
	
	/** 현재 장면(AI) 재생성 서비스
	 * @param sceneId
	 * @return
	 */
	StorySceneResponse regenerateScene(NovelUserInputRequest novelRequest) throws Exception;


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

	/** userId와 일치하는 소설 List 조회
	 * @param userId
	 * @return
	 */
	List<NovelResponse> getMyNovelList(int userId);

	/** 도서관(모든 소설 조회 - 정렬) 서비스
	 * @param order
	 * @return
	 */
	Page<NovelResponse> getNovelListSortByAny(String order, int page, int size);

	/** 마지막 장면 수정 서비스
	 * @param novelRequest
	 * @return
	 */
	StorySceneResponse generateEditScene(NovelUserInputRequest novelRequest) throws Exception;

	/** 소설 설정 정보 업데이트 서비스
	 * @param novelId
	 * @param novelSettingRequest
	 * @return
	 */
	int updateNovelSettings(Long novelId, NovelSettingRequest request) throws Exception;

	/** 소설 삭제
	 * @param novelId
	 * @return
	 */
	int deleteNovel(Long novelId);

	


}
