package com.teya1337.craigslist.post.dto;

import java.util.List;

public record PostSearchResponse(List<PostResponse> posts, long total) {}
