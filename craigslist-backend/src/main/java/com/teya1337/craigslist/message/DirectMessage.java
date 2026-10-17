package com.teya1337.craigslist.message;

import com.teya1337.craigslist.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "direct_messages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false, updatable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false, updatable = false)
    private User recipient;

    @Column(nullable = false, length = 200, updatable = false)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT", updatable = false)
    private String body;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "sender_deleted_at")
    private Instant senderDeletedAt;

    @Column(name = "recipient_deleted_at")
    private Instant recipientDeletedAt;

    @PrePersist
    private void onCreate() { sentAt = Instant.now(); }
}
