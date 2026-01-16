package com.muse.amuze.novel.model.entity;

import java.time.LocalDateTime;

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
public class Relationship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "novel_id", nullable = false)
    private Novel novel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "char_a_id", nullable = false)
    private Character charA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "char_b_id", nullable = false)
    private Character charB;

    @Builder.Default
    private Integer affinityScore = 0;

    @Column(columnDefinition = "TEXT")
    private String relationDescription;

    private LocalDateTime lastUpdated;

    @PreUpdate
    @PrePersist
    public void updateTime() {
        this.lastUpdated = LocalDateTime.now();
    }
}
