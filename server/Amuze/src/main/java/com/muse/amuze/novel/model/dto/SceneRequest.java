package com.muse.amuze.novel.model.dto;

import lombok.Getter;
import lombok.Setter;

public class SceneRequest {
	
	@Getter @Setter
    public static class Write {
        private Long chapterId;    // 어느 챕터에 쓸 것인지
        private String userInput;  // 사용자가 입력한 가이드 (예: "주인공이 카페에서 옛 친구를 만난다")
    }
}
