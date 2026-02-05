package com.muse.amuze.novel.model.dto;

public record UserNoteRequest(
    Long roomId,
    String note
) {}