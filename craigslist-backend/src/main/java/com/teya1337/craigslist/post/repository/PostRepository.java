package com.teya1337.craigslist.post.repository;

import com.teya1337.craigslist.post.entity.Post;
import com.teya1337.craigslist.post.entity.PostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    @Query("""
            select post from Post post
            where post.status = :status
              and (locate(lower(:query), lower(post.title)) > 0
                or locate(lower(:query), lower(post.body)) > 0)
            order by post.createdAt desc, post.id desc
            """)
    Page<Post> searchPublishedPosts(@Param("query") String query, @Param("status") PostStatus status, Pageable pageable);

    List<Post> findAllByStatus(PostStatus status);

    List<Post> findAllByUserId(UUID userId);

    Optional<Post> findByIdAndStatus(UUID id, PostStatus status);
}
