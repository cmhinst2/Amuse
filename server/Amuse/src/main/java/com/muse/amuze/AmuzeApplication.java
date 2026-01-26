package com.muse.amuze;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing // 시간 추적
@SpringBootApplication(exclude={SecurityAutoConfiguration.class})
public class AmuzeApplication {

	public static void main(String[] args) {
		SpringApplication.run(AmuzeApplication.class, args);
	}

}
