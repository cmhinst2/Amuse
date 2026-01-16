package com.muse.amuze.user.model.service;

import java.util.Map;

import com.muse.amuze.user.model.dto.KakaoLoginRequest;

public interface AuthService {

	/** 카카오 로그인 서비스
	 * @param email
	 * @param nickname
	 * @param socialId
	 * @param profileImage
	 * @return
	 */
	Map<String, String> loginKakao(KakaoLoginRequest request);

	/** 로그아웃 서비스
	 * @param userEmail
	 */
	void logout(String userEmail);

}
