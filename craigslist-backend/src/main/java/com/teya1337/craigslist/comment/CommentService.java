package com.teya1337.craigslist.comment;

import com.teya1337.craigslist.comment.dto.CommentRequest;
import com.teya1337.craigslist.comment.dto.CommentResponse;
import com.teya1337.craigslist.comment.entity.Comment;
import com.teya1337.craigslist.comment.repository.CommentRepository;
import com.teya1337.craigslist.common.error.ForbiddenOperationException;
import com.teya1337.craigslist.common.error.ResourceNotFoundException;
import com.teya1337.craigslist.post.entity.Post;
import com.teya1337.craigslist.post.entity.PostStatus;
import com.teya1337.craigslist.post.repository.PostRepository;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CommentResponse> findComments(UUID postId) {
        findPublishedPost(postId);
        return commentRepository.findAllByPostId(postId)
                .stream()
                .sorted(Comparator.comparing(Comment::getCreatedAt))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CommentResponse createComment(UUID userId, UUID postId, CommentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Post post = findPublishedPost(postId);

        Comment parent = null;
        if (request.parentId() != null) {
            parent = commentRepository.findById(request.parentId())
                    .filter(candidate -> candidate.getPost().getId().equals(postId))
                    .filter(candidate -> !candidate.isDeleted())
                    .orElseThrow(() -> new ResourceNotFoundException("Reply target not found"));
        }

        Comment comment = Comment.builder()
                .user(user)
                .post(post)
                .parent(parent)
                .content(request.content().trim())
                .build();

        return toResponse(commentRepository.save(comment));
    }

    @Transactional
    public CommentResponse updateComment(
            UUID userId,
            UUID postId,
            UUID commentId,
            CommentRequest request
    ) {
        Comment comment = findOwnedComment(userId, postId, commentId);
        String content = request.content().trim();
        if (comment.getContent().equals(content)) {
            return toResponse(comment);
        }
        comment.setEditedAt(java.time.Instant.now());
        comment.setContent(content);
        return toResponse(commentRepository.saveAndFlush(comment));
    }

    @Transactional
    public void deleteComment(UUID userId, UUID postId, UUID commentId) {
        Comment comment = findOwnedComment(userId, postId, commentId);
        comment.setDeleted(true);
        comment.setContent("");
    }

    private Post findPublishedPost(UUID postId) {
        return postRepository.findByIdAndStatus(postId, PostStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
    }

    private Comment findOwnedComment(UUID userId, UUID postId, UUID commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        findPublishedPost(postId);
        if (comment.isDeleted() || !comment.getPost().getId().equals(postId)) {
            throw new ResourceNotFoundException("Comment not found");
        }

        if (!comment.getUser().getId().equals(userId)) {
            throw new ForbiddenOperationException("You can only change your own comments");
        }

        return comment;
    }

    private CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.isDeleted() ? null : comment.getUser().getId(),
                comment.isDeleted() ? "[deleted]" : comment.getUser().getPublicUsername(),
                comment.getPost().getId(),
                comment.isDeleted() ? "Comment deleted" : comment.getContent(),
                comment.getParent() == null ? null : comment.getParent().getId(),
                comment.isDeleted(),
                comment.getCreatedAt(),
                comment.isDeleted() ? null : comment.getEditedAt(),
                comment.getUpdatedAt()
        );
    }
}
