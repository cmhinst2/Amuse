package com.muse.amuze.novel.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "story_scene")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StoryScene extends BaseCreateTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "novel_id", nullable = false)
    private Novel novel;

    @Column(name = "sequence_order", nullable = false)
    private int sequenceOrder;

    @Column(name = "user_input", columnDefinition = "TEXT")
    private String userInput;

    @Column(name = "ai_output", columnDefinition = "TEXT", nullable = false)
    private String aiOutput;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "key_event")
    private String keyEvent;

    @Column(name = "affinity_at_moment")
    private Integer affinityAtMoment;
    
    @Column(name = "is_edited")
    private boolean isEdited;
    
    @Column(name = "is_regenerated")
    private boolean isRegenerated;
    
    @Column(name = "affinity_delta")
    private int affinityDelta; // 해당 장면에서 증감된 호감도 수치
    
}