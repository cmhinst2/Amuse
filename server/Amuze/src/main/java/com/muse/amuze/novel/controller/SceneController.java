package com.muse.amuze.novel.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.muse.amuze.novel.model.dto.SceneRequest;
import com.muse.amuze.novel.model.entity.Scene;
import com.muse.amuze.novel.model.service.AiNovelService;
import com.muse.amuze.user.controller.AuthController;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/scenes")
@Tag(name = "Scene Controller", description = "Scene API")
@RequiredArgsConstructor
@Slf4j
public class SceneController {

	private final AiNovelService aiNovelService;

    @PostMapping("/write")
    public ResponseEntity<Scene> writeScene(@RequestBody SceneRequest.Write request) {
    	// 사용자가 보낸 chapterId와 가이드(userInput)만 서비스로 넘깁니다.
        Scene savedScene = aiNovelService.writeAndAnalyzeScene(
            request.getChapterId(), 
            request.getUserInput()
        );
        
        // 생성된 장면(본문, 요약, 분석결과 포함)을 다시 브라우저로 보냅니다.
        return ResponseEntity.ok(savedScene);
    }
}
