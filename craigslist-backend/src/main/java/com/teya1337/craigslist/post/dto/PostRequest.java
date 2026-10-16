package com.teya1337.craigslist.post.dto;

import com.teya1337.craigslist.post.entity.PostCategory;
import com.teya1337.craigslist.post.entity.PostType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PostRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String body,
        @NotNull PostCategory category,
        @NotNull PostType postType,
        @Size(max = 255) String location
) {}
