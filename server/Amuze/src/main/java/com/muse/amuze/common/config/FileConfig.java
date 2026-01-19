package com.muse.amuze.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.MultipartConfigElement;

@Configuration
@PropertySource("classpath:/config.properties")
public class FileConfig implements WebMvcConfigurer{
	
	@Value("${spring.servlet.multipart.file-size-threshold}")
	private long fileSizeThreshold;
	
	@Value("${spring.servlet.multipart.location}")
	private String location;
	
	@Value("${spring.servlet.multipart.max-request-size}")
	private long maxRequestSize;
	
	@Value("${spring.servlet.multipart.max-file-size}")
	private long maxFileSize;
	
	// 프로필 이미지 관련 경로
	@Value("${amuse.profile.resource-handler}")
	private String profileResourceHandler;
	
	@Value("${amuse.profile.resource-location}")
	private String profileResourceLocation;
	
	// 소설커버 이미지 관련 경로
	@Value("${amuse.novel.resource-handler}")
	private String novelResourceHandler;
	
	@Value("${amuse.novel.resource-location}")
	private String novelResourceLocation;
	
	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		
		registry.addResourceHandler(profileResourceHandler)
		.addResourceLocations(profileResourceLocation);
		
		registry.addResourceHandler(novelResourceHandler)
		.addResourceLocations(novelResourceLocation);
		
	}
	
	
	
	
	// MultipartResolver 설정
	@Bean
	public MultipartConfigElement configElement() {
		// MultipartConfigElement :
		// 파일 업로드를 처리하는데 사용되는 MultipartConfigElement를 
		// 구성하고 반환(옵션 설정하는데 사용)
		// 업로드 파일의 최대크기, 임시 저장 경로 등..
		MultipartConfigFactory factory 
			= new MultipartConfigFactory();
		
		// 파일 업로드 임계값
		factory.setFileSizeThreshold(DataSize.ofBytes(fileSizeThreshold));
		
		// 임시 저장 폴더 경로
		factory.setLocation(location);
		
		// HTTP 요청당 파일 최대 크기
		factory.setMaxRequestSize(DataSize.ofBytes(maxRequestSize));
		
		// 개별 파일당 최대 크기
		factory.setMaxFileSize(DataSize.ofBytes(maxFileSize));
		
		return factory.createMultipartConfig();
	}
	
	// MultipartResolver 객체를 생성하여 Bean으로 등록
	// -> 위에서 만든 MultipartConfigElement 자동으로 이용함
	@Bean
	public MultipartResolver multipartResolver() {
		// MultipartResolver : MultipartFile 을 처리해주는 해결사
		// -> MultipartResolver는 클라이언트로부터 받은 multipart 요청을 처리하고,
		// 그 중 업로드된 파일을 추출하여 MultipartFile 객체로 제공하는 역할
		StandardServletMultipartResolver multipartResolver
			= new StandardServletMultipartResolver();
		
		return multipartResolver;
		
	}
	

}
