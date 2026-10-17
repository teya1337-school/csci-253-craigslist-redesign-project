package com.teya1337.craigslist.account;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordChangeRequest(
        @NotBlank @Size(max = 200) String currentPassword,
        @NotBlank @Size(min = 8, max = 72) String newPassword,
        @NotBlank @Size(max = 72) String confirmPassword
) {}
