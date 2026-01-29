package com.muse.amuze.novel.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.muse.amuze.novel.model.dto.MyMuseReponse;
import com.muse.amuze.novel.model.service.MuseService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/muse")
@Tag(name = "Muse Controller", description = "Muse API")
@RequiredArgsConstructor
@Slf4j
public class MuseController {
	
	private final MuseService museService;

	@GetMapping("{userId:[0-9]+}")
	public ResponseEntity<List<MyMuseReponse>> getMyMuseList(@PathVariable("userId") int userId) {
		List<MyMuseReponse> myMuses = museService.getMyMuseList(userId);
		log.debug("응답값 : {}", myMuses);
		return ResponseEntity.ok(myMuses);
	}
}
