package com.muse.amuze.novel.model.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.BatchSize;

import com.muse.amuze.novel.model.dto.NovelSettingRequest;
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

    @BatchSize(size = 100) // 100개 소설의 태그를 단 한 번의 쿼리로 모아서 가져오라는 설정
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

	public void updateSettings(NovelSettingRequest request) {
		if (request.getTitle() != null) this.title = request.getTitle();
	    if (request.getDescription() != null) this.description = request.getDescription();
	    if (request.getCoverImagePosY() != null) this.coverImagePosY = request.getCoverImagePosY();
	    if (request.getIsShared() != null) this.isShared = request.getIsShared();
	    if (request.getIsDelete() != null) this.isDelete = request.getIsDelete();
	    if (request.getIsAffinityModeEnabled() != null) this.isAffinityModeEnabled = request.getIsAffinityModeEnabled();
	    if (request.getIsShared() != null ) {
	    	if (this.sharedAt == null) {
	            this.sharedAt = LocalDateTime.now();
	        } else {
		    	this.sharedAt = null;
		    }
	    } 
	}
	
	public void updateTags(List<String> newTags) {
	    if (newTags == null) return; // 수정 사항이 없으면 무시
	    
	    this.tags.clear(); // 기존 novel_tags 테이블의 해당 novel_id 레코드 전부 삭제 예약
	    this.tags.addAll(newTags); // 새로운 태그들로 다시 삽입 예약
	}
}