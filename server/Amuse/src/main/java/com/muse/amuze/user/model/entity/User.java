package com.muse.amuze.user.model.entity;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

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
public class User extends BaseTimeEntity implements UserDetails {

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

	@Builder.Default // @Builder 패턴을 사용할 때, 필드에 미리 설정해둔 초기값(기본값)이 사라지지 않게 지켜주는 어노테이션
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

	// --- UserDetails 필수 구현 메서드 ---

	@Override
	public String getUsername() {
		return this.email; // 우리는 이메일을 ID로 사용
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		// 권한 문자열을 스프링 시큐리티 규격에 맞게 변환
		return Collections.singletonList(new SimpleGrantedAuthority(this.role));
	}

	@Override
	public String getPassword() {
		return this.password;
	}

	// 나머지 계정 상태 메서드들은 일단 true로 설정
	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return true;
	}

}