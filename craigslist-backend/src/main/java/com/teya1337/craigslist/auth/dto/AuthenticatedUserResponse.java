package com.teya1337.craigslist.auth.dto;

import com.teya1337.craigslist.user.entity.UserStatus;
import lombok.Builder;

import java.util.UUID;

@Builder
public record AuthenticatedUserResponse(
        UUID id,
        String email,
        String username,
        String phoneNumber,
        String address,
        UserStatus status
) {}
