package com.teya1337.craigslist.comment.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(
        @NotBlank String content,
        java.util.UUID parentId
) {}
