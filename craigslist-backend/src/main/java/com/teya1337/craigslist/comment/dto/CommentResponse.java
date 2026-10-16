package com.teya1337.craigslist.comment.dto;

import java.time.Instant;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        UUID userId,
        String username,
        UUID postId,
        String content,
        UUID parentId,
        boolean deleted,
        Instant createdAt,
        Instant editedAt,
        Instant updatedAt
) {}
