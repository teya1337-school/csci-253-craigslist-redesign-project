package com.teya1337.craigslist.user.profile;

import com.teya1337.craigslist.post.dto.PostResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PublicProfileResponse(UUID id, String username, Instant memberSince, String bio, String publicEmail, String publicPhoneNumber, UUID pictureVersion, List<PostResponse> posts) {}
