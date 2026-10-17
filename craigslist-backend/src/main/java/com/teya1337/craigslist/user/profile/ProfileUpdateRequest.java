package com.teya1337.craigslist.user.profile;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @Size(max = 1000) String bio,
        @Email @Size(max = 100) String publicEmail,
        @Size(max = 30) @Pattern(regexp = "[0-9+(). \\-]*") String publicPhoneNumber,
        @NotBlank @Size(max = 200) String currentPassword
) {}
