package com.muse.amuze.novel.model.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.muse.amuze.user.model.entity.User;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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
@Table(name = "novel")
@Getter @Setter
@ToString
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Novel extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_summary", columnDefinition = "TEXT")
    private String totalSummary;

    @ElementCollection(fetch = FetchType.LAZY) // 컬렉션 객체임을 JPA가 알 수 있게 함
    @CollectionTable(
        name = "novel_tags",  // 테이블 이름 novel_tags
        joinColumns = @JoinColumn(name = "novel_id") // novel에 담을 수 없는 컬렉션을 저장하기 위한 별도의 테이블 생성
    )
    @Column(name = "tag") // 실제 태그 문자열이 저장될 컬럼명
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Column(name = "cover_image_url", columnDefinition = "TEXT")
    private String coverImageUrl;

    @Column(name = "character_settings", columnDefinition = "TEXT")
    private String characterSettings;

    @Builder.Default
    @Column(length = 20)
    private String status = "PROCESS";

    @Builder.Default
    @Column(name = "is_shared")
    private boolean isShared = false;

    @Column(name = "shared_at")
    private LocalDateTime sharedAt;
    
    @Column(name = "is_delete")
    private boolean isDelete;
    
    @Column(name = "is_affinity_mode_enabled")
    private boolean isAffinityModeEnabled;
    
    @Column(name = "cover_image_pos_y", nullable = false)
    @Builder.Default
    private Integer coverImagePosY = 50;
}