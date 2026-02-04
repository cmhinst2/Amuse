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

    @Column(columnDefinition = "TEXT")
    private String personality;

    @Column(columnDefinition = "TEXT")
    private String appearance;
    
    @Column(columnDefinition = "TEXT")
    private String gender;
    
    @Column(columnDefinition = "TEXT")
    private String profileImageUrl;
    
    @Column(name = "profile_image_pos_y", nullable = false)
    @Builder.Default
    private Integer profileImagePosY = 50;
    
    @Column(columnDefinition = "TEXT")
    private String statusMessage;
    
    @Column(columnDefinition = "TEXT")
    private String firstSceneContent;
    
    @Column(columnDefinition = "TEXT")
    private String firstSceneLocation;

    @Column(name = "speech_examples", columnDefinition = "TEXT")
    private String speechExamples;
   
}