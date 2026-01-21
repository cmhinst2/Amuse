package com.muse.amuze.novel.model.dto;

import com.muse.amuze.novel.model.entity.Character;
import com.muse.amuze.novel.model.entity.StoryScene;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorySceneResponse {
    private String content;        // AI가 생성한 소설 지문 및 대사 (ai_output)
    private Integer affinity;      // 현재 총 호감도 점수 (mainChar.getAffinity())
    private Integer affinityDelta; // 이번 장면에 의해 변동된 점수 (ai_delta)
    private String reason;         // 호감도 변동 이유 (AI가 설명한 심리학적 근거)
    private Long novelId;          // 소설 ID
    private Long sceneId;          // 방금 생성된 장면의 DB ID
    private String relationshipLevel; // 현재 관계 단계 (ACQUAINTANCE, SOME 등)
    private boolean levelUp;

    /** 새장면 생성 후 답변 변환하는 정적 메서드(실시간 생성용)
     * @param scene
     * @param delta
     * @param reason
     * @param character
     * @return
     */
    public static StorySceneResponse of(StoryScene scene, int delta, String reason, Character character) {
        return StorySceneResponse.builder()
                .content(scene.getAiOutput())
                .affinity(character.getAffinity())
                .affinityDelta(delta)
                .reason(reason)
                .novelId(scene.getNovel().getId())
                .sceneId(scene.getId())
                .relationshipLevel(character.getRelationshipLevel())
                .build();
    }
    
    /** 과거 목록 조회용
     * @param scene
     * @return
     */
    public static StorySceneResponse from(StoryScene scene) {
        return StorySceneResponse.builder()
                .content(scene.getAiOutput())
                .affinity(scene.getAffinityAtMoment())
                .novelId(scene.getNovel().getId())
                .sceneId(scene.getId())
                .levelUp(false) 
                .build();
    }
}