package com.teya1337.craigslist.post.picture;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface PostPictureRepository extends JpaRepository<PostPicture, UUID> {
    @Query("select picture.id from PostPicture picture where picture.post.id = :postId order by picture.displayOrder, picture.id")
    List<UUID> findPictureIds(@Param("postId") UUID postId);
}
