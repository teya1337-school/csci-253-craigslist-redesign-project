package com.teya1337.craigslist.message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record DirectMessageRequest(
        @NotNull UUID recipientId,
        @NotBlank @Size(max = 200) String subject,
        @NotBlank @Size(max = 5000) String body
) {}
