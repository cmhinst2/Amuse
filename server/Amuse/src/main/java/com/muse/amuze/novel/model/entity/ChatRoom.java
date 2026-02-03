package com.muse.amuze.novel.model.entity;

import java.time.LocalDateTime;

import com.muse.amuze.user.model.entity.User;

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
import lombok.ToString;

@Entity
@Table(name = "chat_room")
@Getter @Setter 
@ToString
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChatRoom extends BaseTimeEntity{

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "novel_id", nullable = false)
	private Novel novel;
	
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
	
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id", nullable = false)
    private Character character;
	
	@Column(name = "current_location", columnDefinition = "TEXT")
    private String currentLocation;
	
    private LocalDateTime lastMessageAt;
    
    @Column(name = "last_summary", columnDefinition = "TEXT")
    private String lastSummary;
    
    @Column(name = "ai_status", columnDefinition = "TEXT")
    private String aiStatus;
    
    @Column(name = "current_mood")
    private String currentMood;
    
    @Builder.Default
    private String status = "ACTIVE";
    
    private Integer scenarioId;
    
    @Builder.Default
    @Column(name = "scenario_step", nullable = false)
    private Integer scenarioStep = 0;
    
    @Builder.Default
    @Column(name = "relationship_status", length = 50)
    private String relationshipStatus = "낯선 사람";

    @Column(name = "room_mode")
    private String roomMode; 
    
    //---------------------
    
    @Column(name = "last_message", columnDefinition = "TEXT")
    private String lastMessage; // 마지막 대화 내용 직접 저장

    @Column(name = "current_score")
    private Integer currentScore; // 최신 호감도 점수 직접 저장
    
    @Column(name = "user_nickname", length = 10) // 채팅에서 사용할 사용자 닉네임
    private String userNickname;
}
