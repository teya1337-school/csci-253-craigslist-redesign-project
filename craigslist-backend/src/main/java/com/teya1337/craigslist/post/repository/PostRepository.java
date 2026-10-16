package com.teya1337.craigslist.post.repository;

import com.teya1337.craigslist.post.entity.Post;
import com.teya1337.craigslist.post.entity.PostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

    List<Post> findAllByStatus(PostStatus status);

    List<Post> findAllByUserId(UUID userId);

    Optional<Post> findByIdAndStatus(UUID id, PostStatus status);
}
