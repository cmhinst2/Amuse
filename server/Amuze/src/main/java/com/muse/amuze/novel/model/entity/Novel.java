package com.muse.amuze.novel.model.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Novel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String background;

    private String coverImageUrl;
    private String subImageUrl1;
    private String subImageUrl2;

    @Builder.Default
    private String status = "PROCESS";

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    // 연관관계 매핑
    @OneToMany(mappedBy = "novel", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Character> characters = new ArrayList<>();

    @OneToMany(mappedBy = "novel", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Chapter> chapters = new ArrayList<>();

    @OneToMany(mappedBy = "novel", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StoryNote> storyNotes = new ArrayList<>();
    
    @Builder.Default
    @Column(name = "view_count", nullable = false)
    private Long viewCount = 0L; // 조회수 필드 추가

    public void incrementViewCount() {
        this.viewCount++;
    }
}