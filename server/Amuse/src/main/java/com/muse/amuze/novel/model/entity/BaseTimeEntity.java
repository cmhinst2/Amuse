package com.muse.amuze.novel.model.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

@Getter
@MappedSuperclass // 필드만 상속받게 해주는 어노테이션
@EntityListeners(AuditingEntityListener.class) // 자동으로 날짜를 감시해서 넣어줌
public abstract class BaseTimeEntity {
	@CreatedDate
	@Column(name = "created_at", updatable = false) // 생성일 수정 불가능하게
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
