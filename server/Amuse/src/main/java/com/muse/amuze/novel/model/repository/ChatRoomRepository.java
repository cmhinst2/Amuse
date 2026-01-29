package com.muse.amuze.novel.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.muse.amuze.novel.model.dto.MyMuseReponse;
import com.muse.amuze.novel.model.entity.ChatRoom;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
	
	@Query("""
		    SELECT new com.muse.amuze.novel.model.dto.MyMuseReponse(
		        r.id, 
		        c.id, 
		        c.name, 
		        c.profileImageUrl, 
		        c.profileImagePosY, 
		        r.currentScore, 
		        r.relationshipStatus, 
		        r.lastMessage, 
		        r.lastMessageAt, 
		        r.currentLocation, 
		        r.status
		    )
		    FROM ChatRoom r
		    JOIN r.character c
		    WHERE r.user.id = :userId
		    ORDER BY r.lastMessageAt DESC
		""")
	List<MyMuseReponse> findMyMuseListByUserId(@Param("userId") Integer userId);
}
