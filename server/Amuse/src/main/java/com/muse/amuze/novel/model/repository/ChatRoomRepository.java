package com.muse.amuze.novel.model.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.muse.amuze.novel.model.entity.ChatRoom;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
	
	@Query("SELECT r FROM ChatRoom r JOIN FETCH r.character JOIN FETCH r.novel WHERE r.user.id = :userId")
	List<ChatRoom> findMyMuseListByUserId(@Param("userId") Integer userId);
	
	@Query("""
		    SELECT r FROM ChatRoom r 
		    JOIN FETCH r.character c 
		    JOIN FETCH r.novel n 
		    WHERE r.user.id = :userId 
		    AND c.id = (SELECT ch.id FROM Character ch 
		                WHERE ch.role = 'MAIN' AND ch.novel.id = :novelId)
		""")
	Optional<ChatRoom> findChatRoomByNovelIdAndUserId(@Param("novelId") Integer novelId, @Param("userId") Integer userId);

	@Query("SELECT r FROM ChatRoom r WHERE r.id = :roomId")
	Optional<ChatRoom> findChatRoomByRoomId(@Param("roomId") Long roomId);

}
