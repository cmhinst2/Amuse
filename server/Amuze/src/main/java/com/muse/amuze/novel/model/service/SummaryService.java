package com.muse.amuze.novel.model.service;

import java.io.IOException;

public interface SummaryService {

	void updateTotalSummaryAsync(Long id) throws IOException;
	
}
