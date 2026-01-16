package com.muse.amuze.user.model.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.muse.amuze.user.model.entity.User;

public interface UserRepository extends JpaRepository<User, Long>{
	// 일반 로그인 시 사용  로그인/중복체크용
    Optional<User> findByEmail(String email);

    // 카카오 로그인 시 기존 가입자인지 확인
    Optional<User> findBySocialId(String socialId);
    
    // 이메일 중복 체크용
    boolean existsByEmail(String email);
}
