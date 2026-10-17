package com.teya1337.craigslist.message;

import com.teya1337.craigslist.auth.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class DirectMessageController {
    private final DirectMessageService service;

    @GetMapping
    public List<DirectMessageResponse> list(@AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "INBOX") Mailbox mailbox) {
        return service.list(user.getUserId(), mailbox);
    }

    public record UnreadCountResponse(long count) {}

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal UserPrincipal user) {
        return new UnreadCountResponse(service.unreadCount(user.getUserId()));
    }

    @GetMapping("/{messageId}")
    public DirectMessageResponse find(@AuthenticationPrincipal UserPrincipal user, @PathVariable UUID messageId,
            @RequestParam(defaultValue = "INBOX") Mailbox mailbox) {
        return service.find(user.getUserId(), messageId, mailbox);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DirectMessageResponse send(@AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody DirectMessageRequest request) {
        return service.send(user.getUserId(), request);
    }

    @PostMapping("/{messageId}/read")
    public DirectMessageResponse markRead(@AuthenticationPrincipal UserPrincipal user, @PathVariable UUID messageId) {
        return service.markRead(user.getUserId(), messageId);
    }

    @DeleteMapping("/{messageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal user, @PathVariable UUID messageId,
            @RequestParam(defaultValue = "INBOX") Mailbox mailbox) {
        service.delete(user.getUserId(), messageId, mailbox);
    }
}
