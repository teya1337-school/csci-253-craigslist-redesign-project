CREATE TABLE direct_messages (
    id UUID PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ,
    sender_deleted_at TIMESTAMPTZ,
    recipient_deleted_at TIMESTAMPTZ,
    CONSTRAINT direct_messages_different_users CHECK (sender_id <> recipient_id),
    CONSTRAINT direct_messages_subject_check CHECK (char_length(trim(subject)) BETWEEN 1 AND 200),
    CONSTRAINT direct_messages_body_check CHECK (char_length(trim(body)) BETWEEN 1 AND 5000)
);
CREATE INDEX direct_messages_inbox_idx ON direct_messages(recipient_id, sent_at DESC) WHERE recipient_deleted_at IS NULL;
CREATE INDEX direct_messages_sent_idx ON direct_messages(sender_id, sent_at DESC) WHERE sender_deleted_at IS NULL;
