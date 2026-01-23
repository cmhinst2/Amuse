package com.muse.amuze.novel.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "character")
@Getter @Setter @ToString
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Character extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "novel_id", nullable = false)
    private Novel novel;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING) // DB에 문자열로 저장 ("MAIN", "SUB" 등)
    @Column(length = 20)
    private CharacterRole role = CharacterRole.MAIN;

    @Builder.Default
    private Integer affinity = 0;

    @Builder.Default
    @Column(name = "relationship_level", length = 20)
    private String relationshipLevel = "ACQUAINTANCE";

    @Column(columnDefinition = "TEXT")
    private String personality;

    @Column(columnDefinition = "TEXT")
    private String appearance;

    @Column(name = "current_status", columnDefinition = "TEXT")
    private String currentStatus;
    
    @Column(columnDefinition = "TEXT")
    private String gender;
    
    // 호감도 계산
    public void updateAffinity(int delta) {
    	// 현재 등급에 따른 하한선
        int minThreshold = 0;
        if ("LOVER".equals(this.relationshipLevel)) minThreshold = 301;
        else if ("SOME".equals(this.relationshipLevel)) minThreshold = 201;
        else if ("FRIEND".equals(this.relationshipLevel)) minThreshold = 101;

        // 호감도 계산 및 하한선 적용
        // (기존 점수 + 변동폭)이 하한선보다 낮아지면 하한선으로 고정
        this.affinity = Math.max(minThreshold, this.affinity + delta);
        
        // 호감도 상한선 제한 (0~400)
        // 하한선은 위에서 이미 처리했으므로 상한선만 체크하면 됩니다.
        if (this.affinity > 400) this.affinity = 400;

        // 점수에 따른 관계 등급 업데이트 (상향 업데이트)
        if (this.affinity >= 301) {
            this.relationshipLevel = "LOVER";
        } else if (this.affinity >= 201) {
            this.relationshipLevel = "SOME";
        } else if (this.affinity >= 101) {
            this.relationshipLevel = "FRIEND";
        } else {
            this.relationshipLevel = "ACQUAINTANCE";
        }
    }
}