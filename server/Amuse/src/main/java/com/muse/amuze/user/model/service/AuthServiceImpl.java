package com.muse.amuze.user.model.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.muse.amuze.common.auth.JwtTokenProvider;
import com.muse.amuze.user.model.dto.KakaoLoginRequest;
import com.muse.amuze.user.model.entity.User;
import com.muse.amuze.user.model.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService{
	
	private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    
    /** 카카오 로그인 서비스
	 * @param email
	 * @param nickname
	 * @param socialId
	 * @param profileImage
	 * @return
	 */
	@Override
	@Transactional
	public Map<String, Object> loginKakao(KakaoLoginRequest request) {
		// 1. 유저 존재 여부 확인 (없으면 가입)
        User user = userRepository.findBySocialId(request.getSocialId()) // 반환 타입 Optional<User> 
        		// Optional은 결과가 있을 수도 있고(User), 없을 수도(null) 있음
                .orElseGet(() -> { // Optional의 메서드 orElseGet() : 비어있는 경우 실행할 대체로직
                    User newUser = User.builder()
                            .email(request.getEmail())
                            .nickname(request.getNickname())
                            .socialId(request.getSocialId())
                            .profileImageUrl(request.getProfileImage())
                            .role("USER")
                            .isActive(true)
                            .build();
                    return userRepository.save(newUser); // DB에 저장
                });

        // 2. Amuse 전용 토큰 발행
        String accessToken = jwtTokenProvider.createAccessToken(user.getEmail(), user.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getEmail());
        
        user.updateRefreshToken(refreshToken);

        // 3. 응답 데이터 구성
        Map<String, Object> tokenMap = new HashMap<>();
        tokenMap.put("accessToken", accessToken);
        tokenMap.put("refreshToken", refreshToken);
        tokenMap.put("nickname", user.getNickname());
        tokenMap.put("id", user.getId());

        return tokenMap;
	}
	
	/** 로그아웃 서비스
	 *
	 */
	@Override
	@Transactional
	public void logout(String userEmail) {
		User user = userRepository.findByEmail(userEmail).orElseThrow();
	    user.setRefreshToken(null);
	    user.setExpiredAt(null);
	}
	
	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException{
		// 이메일로 유저를 찾아서 반환 (User 엔티티가 UserDetails이므로 바로 반환 가능)
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("해당 이메일을 가진 유저를 찾을 수 없습니다: " + email));
	}
}
