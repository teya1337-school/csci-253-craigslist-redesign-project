package com.teya1337.craigslist.account;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AccountRequest(
        @NotBlank @Size(min = 3, max = 100)
        @Pattern(regexp = "[A-Za-z0-9_]+") String username,
        @NotBlank @Email @Size(max = 100) String privateEmail,
        @NotBlank @Size(max = 200) String currentPassword
) {}
