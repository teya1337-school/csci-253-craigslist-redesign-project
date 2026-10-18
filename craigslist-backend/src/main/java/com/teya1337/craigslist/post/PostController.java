package com.teya1337.craigslist.post;

import com.teya1337.craigslist.auth.security.UserPrincipal;
import com.teya1337.craigslist.post.dto.PostRequest;
import com.teya1337.craigslist.post.dto.PostResponse;
import com.teya1337.craigslist.post.dto.PostSearchResponse;
import com.teya1337.craigslist.post.entity.PostCategory;
import com.teya1337.craigslist.post.entity.PostType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RequestMapping("/api/posts")
@RestController
public class PostController {

    private final PostService postService;

    @GetMapping
    public List<PostResponse> findPublishedPosts(
            @RequestParam(required = false) PostCategory category,
            @RequestParam(required = false) PostType postType
    ) {
        return postService.findPublishedPosts(category, postType);
    }

    @GetMapping("/search")
    public PostSearchResponse searchPosts(@RequestParam(name = "search", defaultValue = "") String search) {
        return postService.searchPosts(search);
    }

    @GetMapping("/mine")
    public List<PostResponse> findMyPosts(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return postService.findPostsByUserId(principal.getUserId());
    }

    @GetMapping("/{postId}")
    public PostResponse findPost(@PathVariable UUID postId, @AuthenticationPrincipal UserPrincipal principal) {
        return postService.findVisiblePost(postId, principal == null ? null : principal.getUserId());
    }

    @PostMapping(consumes = "application/json")
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse createPost(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PostRequest request
    ) {
        return postService.createPost(principal.getUserId(), request);
    }

    @PutMapping(value = "/{postId}", consumes = "application/json")
    public PostResponse updatePost(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID postId,
            @Valid @RequestBody PostRequest request
    ) {
        return postService.updatePost(principal.getUserId(), postId, request);
    }

    public record PublicationRequest(boolean published) {}

    @PutMapping("/{postId}/publication")
    public PostResponse changePublication(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID postId,
            @RequestBody PublicationRequest request
    ) {
        return postService.changePublication(principal.getUserId(), postId, request.published());
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID postId
    ) {
        postService.deletePost(principal.getUserId(), postId);
    }
}
