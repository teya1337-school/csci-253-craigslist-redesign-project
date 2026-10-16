-- Keep the database constraint consistent with PostStatus.HIDE.
ALTER TABLE posts DROP CONSTRAINT posts_status_check;

ALTER TABLE posts
    ADD CONSTRAINT posts_status_check
    CHECK (status IN ('DRAFT', 'PUBLISHED', 'HIDE', 'DELETED'));
