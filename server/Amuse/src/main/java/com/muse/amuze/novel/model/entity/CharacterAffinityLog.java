package com.muse.amuze.novel.model.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "character_affinity_log")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CharacterAffinityLog extends BaseTimeEntity{
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom chatRoom;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id")
    private ChatMessage message; // 어떤 메시지 때문에 변했는지 연결

    @Column(nullable = false)
    private Integer changeAmount; // 변동량 (예: +5, -2)

    @Column(nullable = false)
    private Integer currentScore; // 변동 후 최종 점수

    @Column(columnDefinition = "TEXT")
    private String reason; // AI가 판단한 호감도 변화 이유

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
