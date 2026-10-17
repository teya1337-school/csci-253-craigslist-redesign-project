package com.teya1337.craigslist.message;

import com.teya1337.craigslist.common.error.ResourceNotFoundException;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.entity.UserStatus;
import com.teya1337.craigslist.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class DirectMessageServiceTests {
    private final DirectMessageRepository messages = mock(DirectMessageRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final DirectMessageService service = new DirectMessageService(messages, users);
    private final User alice = User.builder().id(UUID.randomUUID()).username("alice").build();
    private final User bob = User.builder().id(UUID.randomUUID()).username("bob").build();
    private final UUID messageId = UUID.randomUUID();
    private final DirectMessage message = DirectMessage.builder().id(messageId).sender(alice).recipient(bob)
            .subject("Hello").body("Original text").sentAt(Instant.now()).build();

    private void storedMessage() {
        when(messages.findById(messageId)).thenReturn(Optional.of(message));
        when(messages.findForUpdate(messageId)).thenReturn(Optional.of(message));
    }

    @Test void sendingUsesAuthenticatedSenderAndTrimsContent() {
        when(users.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(users.findById(bob.getId())).thenReturn(Optional.of(bob));
        when(messages.save(any(DirectMessage.class))).thenAnswer(call -> call.getArgument(0));
        var sent = service.send(alice.getId(), new DirectMessageRequest(bob.getId(), " Hello ", " Text "));
        assertThat(sent.senderId()).isEqualTo(alice.getId());
        assertThat(sent.recipientId()).isEqualTo(bob.getId());
        assertThat(sent.subject()).isEqualTo("Hello");
        assertThat(sent.body()).isEqualTo("Text");
        assertThat(sent.readAt()).isNull();
    }

    @Test void cannotSendToYourselfOrInactiveRecipient() {
        assertThatThrownBy(() -> service.send(alice.getId(), new DirectMessageRequest(alice.getId(), "Hi", "Text")))
                .isInstanceOf(ResponseStatusException.class);
        when(users.findById(alice.getId())).thenReturn(Optional.of(alice));
        bob.setStatus(UserStatus.DELETED);
        when(users.findById(bob.getId())).thenReturn(Optional.of(bob));
        assertThatThrownBy(() -> service.send(alice.getId(), new DirectMessageRequest(bob.getId(), "Hi", "Text")))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(messages, never()).save(any());
    }

    @Test void onlyMailboxOwnerCanReadMarkReadOrDelete() {
        storedMessage();
        UUID outsider = UUID.randomUUID();
        for (Mailbox mailbox : Mailbox.values()) {
            assertThatThrownBy(() -> service.find(outsider, messageId, mailbox)).isInstanceOf(ResourceNotFoundException.class);
            assertThatThrownBy(() -> service.delete(outsider, messageId, mailbox)).isInstanceOf(ResourceNotFoundException.class);
        }
        assertThatThrownBy(() -> service.markRead(outsider, messageId)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.markRead(alice.getId(), messageId)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.delete(alice.getId(), messageId, Mailbox.INBOX)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.delete(bob.getId(), messageId, Mailbox.SENT)).isInstanceOf(ResourceNotFoundException.class);
        assertThat(message.getReadAt()).isNull();
        assertThat(message.getSenderDeletedAt()).isNull();
        assertThat(message.getRecipientDeletedAt()).isNull();
    }

    @Test void openingSentMessageDoesNotMarkItRead() {
        storedMessage();
        assertThat(service.find(alice.getId(), messageId, Mailbox.SENT).body()).isEqualTo("Original text");
        assertThat(message.getReadAt()).isNull();
    }

    @Test void recipientCanMarkReadWithoutChangingContentOrResettingReadTime() {
        storedMessage();
        var first = service.markRead(bob.getId(), messageId);
        var second = service.markRead(bob.getId(), messageId);
        assertThat(first.readAt()).isNotNull().isEqualTo(second.readAt());
        assertThat(second.body()).isEqualTo("Original text");
        assertThat(second.sentAt()).isEqualTo(message.getSentAt());
    }

    @Test void recipientDeletionPreservesSendersCopyAndBlocksRecipientAccess() {
        storedMessage();
        service.delete(bob.getId(), messageId, Mailbox.INBOX);
        assertThat(message.getRecipientDeletedAt()).isNotNull();
        assertThat(message.getSenderDeletedAt()).isNull();
        assertThat(service.find(alice.getId(), messageId, Mailbox.SENT).subject()).isEqualTo("Hello");
        assertThatThrownBy(() -> service.find(bob.getId(), messageId, Mailbox.INBOX)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.markRead(bob.getId(), messageId)).isInstanceOf(ResourceNotFoundException.class);
        verify(messages, never()).delete(any());
    }

    @Test void senderDeletionPreservesRecipientsCopy() {
        storedMessage();
        service.delete(alice.getId(), messageId, Mailbox.SENT);
        assertThat(message.getSenderDeletedAt()).isNotNull();
        assertThat(message.getRecipientDeletedAt()).isNull();
        assertThat(service.find(bob.getId(), messageId, Mailbox.INBOX).body()).isEqualTo("Original text");
        assertThatThrownBy(() -> service.find(alice.getId(), messageId, Mailbox.SENT)).isInstanceOf(ResourceNotFoundException.class);
        verify(messages, never()).delete(any());
    }

    @Test void listsUseOwnerAndMailboxSpecificQueries() {
        when(messages.findAllByRecipientIdAndRecipientDeletedAtIsNullOrderBySentAtDescIdDesc(bob.getId())).thenReturn(List.of(message));
        when(messages.findAllBySenderIdAndSenderDeletedAtIsNullOrderBySentAtDescIdDesc(alice.getId())).thenReturn(List.of(message));
        assertThat(service.list(bob.getId(), Mailbox.INBOX)).extracting(DirectMessageResponse::id).containsExactly(messageId);
        assertThat(service.list(alice.getId(), Mailbox.SENT)).extracting(DirectMessageResponse::id).containsExactly(messageId);
        verify(messages).findAllByRecipientIdAndRecipientDeletedAtIsNullOrderBySentAtDescIdDesc(bob.getId());
        verify(messages).findAllBySenderIdAndSenderDeletedAtIsNullOrderBySentAtDescIdDesc(alice.getId());
    }

    @Test void unreadCountIsRestrictedToRecipientsUnreadUndeletedMail() {
        when(messages.countByRecipientIdAndRecipientDeletedAtIsNullAndReadAtIsNull(bob.getId())).thenReturn(3L);
        assertThat(service.unreadCount(bob.getId())).isEqualTo(3L);
        verify(messages).countByRecipientIdAndRecipientDeletedAtIsNullAndReadAtIsNull(bob.getId());
        verifyNoInteractions(users);
    }
}
