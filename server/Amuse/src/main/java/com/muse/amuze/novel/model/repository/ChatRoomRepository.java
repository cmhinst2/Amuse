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
		Optional<ChatRoom> findChatRoomByNovelIdAndUserId(
		    @Param("novelId") Integer novelId, 
		    @Param("userId") Integer userId
		);
//	@Query("""
//		    SELECT new com.muse.amuze.novel.model.dto.MyMuseReponse(
//		        r.id, 
//		        c.id, 
//		        c.name, 
//		        c.profileImageUrl, 
//		        c.profileImagePosY, 
//		        r.currentScore, 
//		        r.relationshipStatus, 
//		        r.lastMessage, 
//		        r.lastMessageAt, 
//		        r.currentLocation, 
//		        r.status
//		    )
//		    FROM ChatRoom r
//		    JOIN r.character c
//		    WHERE r.user.id = :userId
//		    ORDER BY r.lastMessageAt DESC
//		""")
//	List<MyMuseReponse> findMyMuseListByUserId(@Param("userId") Integer userId);

//	@Query("""
//			SELECT new com.muse.amuze.novel.model.dto.MyMuseReponse(
//				r.id,
//				c.id, 
//		        c.name, 
//		        c.profileImageUrl, 
//		        c.profileImagePosY, 
//		        r.currentScore, 
//		        r.relationshipStatus, 
//		        r.lastMessage, 
//		        r.lastMessageAt, 
//		        r.currentLocation, 
//		        r.status
//			)
//			FROM ChatRoom r
//			JOIN r.character c
//			WHERE r.user.id = :userId
//			AND r.character.id = (SELECT c.id FROM com.muse.amuze.novel.model.entity.Character c 
//			WHERE c.role = 'MAIN' AND c.novel.id = :novelId)
//			""")
//	MyMuseReponse findChatRoomByNovelIdAndUserId(@Param("novelId") int novelId, @Param("userId") int userId);
}
