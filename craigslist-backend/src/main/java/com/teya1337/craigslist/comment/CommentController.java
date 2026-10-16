package com.teya1337.craigslist.comment;

import com.teya1337.craigslist.auth.security.UserPrincipal;
import com.teya1337.craigslist.comment.dto.CommentRequest;
import com.teya1337.craigslist.comment.dto.CommentResponse;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RequestMapping("/api/posts/{postId}/comments")
@RestController
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public List<CommentResponse> findComments(@PathVariable UUID postId) {
        return commentService.findComments(postId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse createComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID postId,
            @Valid @RequestBody CommentRequest request
    ) {
        return commentService.createComment(principal.getUserId(), postId, request);
    }

    @PutMapping("/{commentId}")
    public CommentResponse updateComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID postId,
            @PathVariable UUID commentId,
            @Valid @RequestBody CommentRequest request
    ) {
        return commentService.updateComment(principal.getUserId(), postId, commentId, request);
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID postId,
            @PathVariable UUID commentId
    ) {
        commentService.deleteComment(principal.getUserId(), postId, commentId);
    }
}
