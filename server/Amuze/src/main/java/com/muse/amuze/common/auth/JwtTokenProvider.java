package com.muse.amuze.common.auth;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@PropertySource("classpath:/config.properties")
public class JwtTokenProvider { 	// 토큰을 발행하고 내용을 확인함.
	
    @Value("${jwt.secret}")
    private String secretKey;
    
    private static final String ROLE_KEY = "role";

    private SecretKey key;

    // 만료 시간 설정 (밀리초 단위)
    private final long accessTokenValidity = 1000L * 60 * 60; // 1시간
    private final long refreshTokenValidity = 1000L * 60 * 60 * 24 * 14; // 14일

    @PostConstruct // 객체가 생성되고 DI가 완료된 직후 딱 한 번 자동으로 실행될 메서드
    protected void init() {
        // 비밀키를 HMAC-SHA 알고리즘에 적합한 형태로 변환
        this.key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    // AccessToken 생성
    public String createAccessToken(String email, String role) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + accessTokenValidity);

        return Jwts.builder()
                .subject(email)                 // 기존 setSubject()
                .claim(ROLE_KEY, role)            // 그대로 claim()
                .issuedAt(now)                  // 기존 setIssuedAt()
                .expiration(validity)            // 기존 setExpiration()
                .signWith(key)                  // 알고리즘 생략 가능 (key 객체에 정보가 포함됨)
                .compact();
    }

    // RefreshToken 생성
    public String createRefreshToken(String email) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + refreshTokenValidity);

        return Jwts.builder()
        		.subject(email) 
                .issuedAt(now)
                .expiration(validity)
                .signWith(key)
                .compact();
    }

    // 토큰 유효성 검사
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("잘못된 JWT 토큰입니다: {}", e.getMessage());
        }
        return false;
    }

    // 토큰에서 이메일(Subject) 추출
    public String getEmail(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }
}
