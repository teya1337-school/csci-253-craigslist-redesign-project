package com.teya1337.craigslist.post.picture;

import com.teya1337.craigslist.common.image.ImageUpload;
import com.teya1337.craigslist.post.entity.Post;
import com.teya1337.craigslist.post.entity.PostStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@Service @RequiredArgsConstructor
public class PostPictureService {
    private final PostPictureRepository pictures;

    @Transactional
    public boolean update(Post post, List<MultipartFile> files, List<UUID> removedIds) {
        List<UUID> existing = pictures.findPictureIds(post.getId());
        Set<UUID> removed = new HashSet<>(removedIds);
        if (!existing.containsAll(removed)) throw invalid("Only remove pictures belonging to this post.");
        if (existing.size() - removed.size() + files.size() > 5) throw invalid("Use up to 5 pictures per post.");
        if (files.isEmpty() && removed.isEmpty()) return false;
        // Validate the entire selection before changing any stored pictures.
        var uploads = files.stream().map(ImageUpload::read).toList();
        pictures.deleteAllById(removed);
        int position = 0;
        for (UUID id : existing) {
            if (removed.contains(id)) continue;
            var picture = pictures.findById(id).orElseThrow();
            picture.setDisplayOrder(position++);
        }
        for (var upload : uploads) {
            var picture = new PostPicture();
            picture.setPost(post);
            picture.setDisplayOrder(position++);
            picture.setContentType(upload.contentType());
            picture.setImageData(upload.data());
            pictures.save(picture);
        }
        pictures.flush();
        return !removed.isEmpty() || !uploads.isEmpty();
    }

    @Transactional(readOnly = true)
    public PostPicture find(UUID postId, UUID pictureId, UUID viewerId) {
        var picture = pictures.findById(pictureId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Post post = picture.getPost();
        if (!post.getId().equals(postId) || (post.getStatus() != PostStatus.PUBLISHED
                && !(post.getStatus() == PostStatus.UNPUBLISHED && post.getUser().getId().equals(viewerId)))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return picture;
    }

    private ResponseStatusException invalid(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
