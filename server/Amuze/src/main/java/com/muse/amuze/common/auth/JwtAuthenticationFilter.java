package com.muse.amuze.common.auth;

import java.io.IOException;
import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
	// 사용자가 요청 헤더에 실어 보낸 Authorization: Bearer <AccessToken>을 꺼내서 유효한지 확인하는 필터 (토큰 실제 검사 로직)
	
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. 헤더에서 토큰 추출
        String token = resolveToken(request);

        // 2. 토큰이 유효하면 사용자 정보를 시큐리티 컨텍스트에 저장
        if (token != null && jwtTokenProvider.validateToken(token)) {
            String email = jwtTokenProvider.getEmail(token);
            
            // 유저 인증 객체 생성 (이때 권한 정보를 함께 넣을 수 있음)
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());

            // 시큐리티 저장소에 이 사람 인증되었다고 기록
            SecurityContextHolder.getContext().setAuthentication(authentication); // Principal, 사용자의 이메일이 name 역할을 함
        }

        filterChain.doFilter(request, response);
    }

    // AccessToken이 진짜인지, 그리고 누구인지 검사
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}