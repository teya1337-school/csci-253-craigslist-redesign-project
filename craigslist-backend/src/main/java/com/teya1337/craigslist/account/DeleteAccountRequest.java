package com.teya1337.craigslist.account;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeleteAccountRequest(
        @NotBlank @Size(max = 200) String currentPassword,
        @AssertTrue boolean confirmed
) {}
