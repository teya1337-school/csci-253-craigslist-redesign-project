package com.teya1337.craigslist.message;

import java.time.Instant;
import java.util.UUID;

public record DirectMessageResponse(UUID id, UUID senderId, String senderUsername,
        UUID recipientId, String recipientUsername, String subject, String body, Instant sentAt, Instant readAt) {}
