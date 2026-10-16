package com.teya1337.craigslist.comment.repository;

import com.teya1337.craigslist.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    List<Comment> findAllByPostId(UUID postId);

    List<Comment> findAllByUserId(UUID userId);
}
