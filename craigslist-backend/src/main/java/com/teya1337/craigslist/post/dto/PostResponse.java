package com.teya1337.craigslist.post.dto;

import com.teya1337.craigslist.post.entity.PostCategory;
import com.teya1337.craigslist.post.entity.PostStatus;
import com.teya1337.craigslist.post.entity.PostType;

import java.time.Instant;
import java.util.UUID;

public record PostResponse(
        UUID id,
        UUID userId,
        String username,
        String title,
        String body,
        PostCategory category,
        PostType postType,
        String location,
        PostStatus status,
        Instant createdAt,
        Instant editedAt,
        Instant updatedAt,
        boolean advertisement,
        java.util.List<UUID> pictureIds
) {}
