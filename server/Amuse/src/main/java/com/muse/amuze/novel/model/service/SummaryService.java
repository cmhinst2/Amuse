package com.muse.amuze.novel.model.service;

import java.io.IOException;

public interface SummaryService {

	void summarizeInterval(Long id) throws IOException;
	
}
