package com.muse.amuze.novel.model.service;

import java.util.List;

import com.muse.amuze.novel.model.dto.MyMuseReponse;

public interface MuseService {

	List<MyMuseReponse> getMyMuseList(int userId);

}
