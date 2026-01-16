package com.muse.amuze.novel.model.service;

import com.muse.amuze.novel.model.entity.Chapter;
import com.muse.amuze.novel.model.entity.Scene;

public interface AiNovelService {

	/**
	 * 핵심 집필 로직: 유저는 chapterId와 userInput만 전달함
	 */
	Scene writeAndAnalyzeScene(Long chapterId, String userInput);

}
