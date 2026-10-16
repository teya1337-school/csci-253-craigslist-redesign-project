package com.teya1337.craigslist.post;

import com.teya1337.craigslist.common.error.ForbiddenOperationException;
import com.teya1337.craigslist.common.error.ResourceNotFoundException;
import com.teya1337.craigslist.post.dto.PostRequest;
import com.teya1337.craigslist.post.dto.PostResponse;
import com.teya1337.craigslist.post.entity.Post;
import com.teya1337.craigslist.post.entity.PostCategory;
import com.teya1337.craigslist.post.entity.PostStatus;
import com.teya1337.craigslist.post.entity.PostType;
import com.teya1337.craigslist.post.repository.PostRepository;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<PostResponse> findPublishedPosts(PostCategory category, PostType postType) {
        return postRepository.findAllByStatus(PostStatus.PUBLISHED)
                .stream()
                .filter(post -> category == null || post.getCategory() == category)
                .filter(post -> postType == null || post.getPostType() == postType)
                .sorted(Comparator.comparing(Post::getCreatedAt).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> findPostsByUserId(UUID userId) {
        return postRepository.findAllByUserId(userId)
                .stream()
                .filter(post -> post.getStatus() != PostStatus.DELETED)
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> findPublishedPostsByUserId(UUID userId) {
        return postRepository.findAllByUserId(userId).stream()
                .filter(post -> post.getStatus() == PostStatus.PUBLISHED)
                .sorted(Comparator.comparing(Post::getCreatedAt).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PostResponse findPublishedPost(UUID postId) {
        return toResponse(postRepository.findByIdAndStatus(postId, PostStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found")));
    }

    @Transactional
    public PostResponse createPost(UUID userId, PostRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Post post = Post.builder()
                .user(user)
                .title(request.title())
                .body(request.body())
                .category(request.category())
                .postType(request.postType())
                .location(normalizeLocation(request.location()))
                .status(PostStatus.PUBLISHED)
                .build();

        return toResponse(postRepository.save(post));
    }

    @Transactional
    public PostResponse updatePost(UUID userId, UUID postId, PostRequest request) {
        Post post = findOwnedActivePost(userId, postId);
        String location = normalizeLocation(request.location());
        if (java.util.Objects.equals(post.getTitle(), request.title())
                && java.util.Objects.equals(post.getBody(), request.body())
                && post.getCategory() == request.category()
                && post.getPostType() == request.postType()
                && java.util.Objects.equals(post.getLocation(), location)) {
            return toResponse(post);
        }
        post.setEditedAt(Instant.now());
        post.setTitle(request.title());
        post.setBody(request.body());
        post.setCategory(request.category());
        post.setPostType(request.postType());
        post.setLocation(location);
        return toResponse(postRepository.saveAndFlush(post));
    }

    @Transactional
    public void deletePost(UUID userId, UUID postId) {
        Post post = findOwnedActivePost(userId, postId);
        post.setStatus(PostStatus.DELETED);
        post.setDeletedAt(Instant.now());
    }

    private Post findOwnedActivePost(UUID userId, UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        if (post.getStatus() == PostStatus.DELETED) {
            throw new ResourceNotFoundException("Post not found");
        }

        if (!post.getUser().getId().equals(userId)) {
            throw new ForbiddenOperationException("You can only change your own posts");
        }

        return post;
    }

    private PostResponse toResponse(Post post) {
        return new PostResponse(
                post.getId(),
                post.getUser().getId(),
                post.getUser().getUsername(),
                post.getTitle(),
                post.getBody(),
                post.getCategory(),
                post.getPostType(),
                post.getLocation(),
                post.getStatus(),
                post.getCreatedAt(),
                post.getEditedAt(),
                post.getUpdatedAt()
        );
    }

    private String normalizeLocation(String location) {
        if (location == null || location.isBlank()) {
            return null;
        }
        return location.trim();
    }
}
