ALTER TABLE posts DROP CONSTRAINT posts_status_check;
UPDATE posts SET status = 'UNPUBLISHED' WHERE status = 'HIDE';
ALTER TABLE posts ADD CONSTRAINT posts_status_check
    CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'DELETED'));
