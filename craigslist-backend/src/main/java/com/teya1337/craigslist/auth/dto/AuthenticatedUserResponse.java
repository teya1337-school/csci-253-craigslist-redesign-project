package com.teya1337.craigslist.auth.dto;

import com.teya1337.craigslist.user.entity.UserStatus;
import lombok.Builder;

import java.util.UUID;

@Builder
public record AuthenticatedUserResponse(
        UUID id,
        UUID pictureVersion,
        String privateEmail,
        String username,
        String privatePhoneNumber,
        String address,
        UserStatus status
) {}
