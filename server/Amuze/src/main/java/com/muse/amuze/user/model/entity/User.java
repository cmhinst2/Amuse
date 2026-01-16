package com.muse.amuze.user.model.entity;

import java.time.LocalDateTime;

import com.muse.amuze.novel.model.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter 
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    private String email;

    private String password; 

    @Column(nullable = false, length = 100)
    private String nickname;

    @Column(name = "profile_image_url", columnDefinition = "TEXT")
    private String profileImageUrl;

    @Builder.Default
    @Column(name = "registration_source", nullable = false)
    private String registrationSource = "LOCAL"; // 기본값 설정

    @Column(name = "social_id", unique = true)
    private String socialId;

    @Builder.Default
    @Column(length = 20)
    private String role = "USER";

    @Builder.Default
    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;
    
    public void updateRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
        this.expiredAt = LocalDateTime.now().plusDays(14);
    }

}