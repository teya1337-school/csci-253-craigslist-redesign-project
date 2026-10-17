package com.teya1337.craigslist.message;

import com.teya1337.craigslist.common.error.ResourceNotFoundException;
import com.teya1337.craigslist.user.entity.UserStatus;
import com.teya1337.craigslist.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DirectMessageService {
    private final DirectMessageRepository messages;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public List<DirectMessageResponse> list(UUID userId, Mailbox mailbox) {
        var results = mailbox == Mailbox.INBOX
                ? messages.findAllByRecipientIdAndRecipientDeletedAtIsNullOrderBySentAtDescIdDesc(userId)
                : messages.findAllBySenderIdAndSenderDeletedAtIsNullOrderBySentAtDescIdDesc(userId);
        return results.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        return messages.countByRecipientIdAndRecipientDeletedAtIsNullAndReadAtIsNull(userId);
    }

    @Transactional(readOnly = true)
    public DirectMessageResponse find(UUID userId, UUID messageId, Mailbox mailbox) {
        var message = messages.findById(messageId).orElseThrow(this::notFound);
        checkMailbox(message, userId, mailbox);
        return toResponse(message);
    }

    @Transactional
    public DirectMessageResponse send(UUID senderId, DirectMessageRequest request) {
        if (senderId.equals(request.recipientId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot send a message to yourself.");
        }
        var sender = users.findById(senderId).filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(this::notFound);
        var recipient = users.findById(request.recipientId()).filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("This recipient is unavailable."));
        return toResponse(messages.save(DirectMessage.builder().sender(sender).recipient(recipient)
                .subject(request.subject().trim()).body(request.body().trim()).build()));
    }

    @Transactional
    public DirectMessageResponse markRead(UUID userId, UUID messageId) {
        var message = messages.findForUpdate(messageId).orElseThrow(this::notFound);
        checkMailbox(message, userId, Mailbox.INBOX);
        if (message.getReadAt() == null) message.setReadAt(Instant.now());
        return toResponse(message);
    }

    @Transactional
    public void delete(UUID userId, UUID messageId, Mailbox mailbox) {
        var message = messages.findForUpdate(messageId).orElseThrow(this::notFound);
        checkMailbox(message, userId, mailbox);
        if (mailbox == Mailbox.INBOX) message.setRecipientDeletedAt(Instant.now());
        else message.setSenderDeletedAt(Instant.now());
    }

    private void checkMailbox(DirectMessage message, UUID userId, Mailbox mailbox) {
        boolean visible = mailbox == Mailbox.INBOX
                ? message.getRecipient().getId().equals(userId) && message.getRecipientDeletedAt() == null
                : message.getSender().getId().equals(userId) && message.getSenderDeletedAt() == null;
        if (!visible) throw notFound();
    }

    private ResourceNotFoundException notFound() { return new ResourceNotFoundException("Message not found."); }

    private DirectMessageResponse toResponse(DirectMessage message) {
        return new DirectMessageResponse(message.getId(), message.getSender().getId(), message.getSender().getUsername(),
                message.getRecipient().getId(), message.getRecipient().getUsername(), message.getSubject(),
                message.getBody(), message.getSentAt(), message.getReadAt());
    }
}
