package com.muse.amuze.user.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.muse.amuze.user.model.dto.KakaoLoginRequest;
import com.muse.amuze.user.model.service.AuthService;

import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth Controller", description = "Auth API")
@Slf4j
public class AuthController {
	
	private final AuthService authService;

    /**
     * 카카오 로그인 및 회원가입 처리
     * 프론트엔드에서 카카오로부터 받은 정보를 전달받음
     */
    @PostMapping("/kakao")
    public ResponseEntity<Map<String, Object>> kakaoLogin(@RequestBody @Valid KakaoLoginRequest request) {
        // AuthService를 통해 유저 저장 및 Amuse 전용 토큰 발행
        Map<String, Object> tokens = authService.loginKakao(request);
        
        String accessToken = (String) tokens.get("accessToken");
        String refreshToken = (String) tokens.get("refreshToken");
        String nickname = (String) tokens.get("nickname");
        int id = (int) tokens.get("id");

        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .maxAge(14 * 24 * 60 * 60)
                .path("/")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(Map.of(
                    "accessToken", accessToken,
                    "nickname", nickname,
                    "id", id
                ));
    }
    
    /**
     * 로그아웃
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(Principal principal) { // Principal : SecurityContextHolder에서 인증된 정보 or 인증되지 않았을 시 null 반환
    	log.debug("principal : {}", principal);
    	if (principal != null) {
            authService.logout(principal.getName());
        }
    	
    	ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
    		    .maxAge(0)
    		    .path("/")
    		    .httpOnly(true)
    		    .secure(true)
    		    .build();
		return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body("로그아웃 처리됨");
    }
}
