package com.teya1337.craigslist.post;

import com.teya1337.craigslist.post.dto.*;
import com.teya1337.craigslist.post.picture.PostPictureService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.Instant;
import java.util.*;

@Service @RequiredArgsConstructor
public class PostSaveService {
    private final PostService posts;
    private final PostPictureService pictures;
    private final com.teya1337.craigslist.post.repository.PostRepository postRepository;

    @Transactional
    public PostResponse create(UUID userId, PostRequest request, List<MultipartFile> files) {
        var created = posts.createPost(userId, request);
        var post = posts.findOwnedActivePost(userId, created.id());
        pictures.update(post, files, List.of());
        return posts.findVisiblePost(post.getId(), userId);
    }

    @Transactional
    public PostResponse update(UUID userId, UUID postId, PostRequest request,
                               List<MultipartFile> files, List<UUID> removedIds) {
        var post = posts.findOwnedActivePost(userId, postId);
        boolean picturesChanged = pictures.update(post, files, removedIds);
        posts.updatePost(userId, postId, request);
        if (picturesChanged) {
            post.setEditedAt(Instant.now());
            postRepository.saveAndFlush(post);
        }
        return posts.findVisiblePost(postId, userId);
    }
}
