package com.teya1337.craigslist.post.picture;

import com.teya1337.craigslist.auth.security.UserPrincipal;
import com.teya1337.craigslist.post.PostSaveService;
import com.teya1337.craigslist.post.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController @RequiredArgsConstructor
@RequestMapping("/api/posts")
public class PostPictureController {
    private final PostSaveService posts;
    private final PostPictureService pictures;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(@AuthenticationPrincipal UserPrincipal principal,
                               @Valid @RequestPart PostRequest post,
                               @RequestPart(required = false) List<MultipartFile> files) {
        return posts.create(principal.getUserId(), post, files == null ? List.of() : files);
    }

    @PutMapping(value = "/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PostResponse update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID postId,
                               @Valid @RequestPart PostRequest post,
                               @RequestPart(required = false) List<MultipartFile> files,
                               @RequestPart(required = false) List<UUID> removedPictureIds) {
        return posts.update(principal.getUserId(), postId, post,
                files == null ? List.of() : files, removedPictureIds == null ? List.of() : removedPictureIds);
    }

    @GetMapping("/{postId}/pictures/{pictureId}")
    public ResponseEntity<byte[]> find(@PathVariable UUID postId, @PathVariable UUID pictureId,
                                      @AuthenticationPrincipal UserPrincipal principal) {
        var picture = pictures.find(postId, pictureId, principal == null ? null : principal.getUserId());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(picture.getContentType()))
                .header("X-Content-Type-Options", "nosniff").body(picture.getImageData());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> error(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of("detail",
                exception.getReason() == null ? "We could not save this post." : exception.getReason()));
    }
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public Map<String, String> tooLarge() {
        return Map.of("detail", "Use up to 5 pictures, each a JPEG or PNG up to 2 MB.");
    }
}
