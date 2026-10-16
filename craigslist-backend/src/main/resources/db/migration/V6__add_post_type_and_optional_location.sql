ALTER TABLE posts
    ADD COLUMN post_type VARCHAR(30);

UPDATE posts
SET post_type = 'GENERAL';

ALTER TABLE posts
    ALTER COLUMN post_type SET NOT NULL,
    ALTER COLUMN location DROP NOT NULL,
    ADD CONSTRAINT posts_post_type_check CHECK (post_type IN ('GENERAL'));

CREATE INDEX posts_category_post_type_created_at_idx
    ON posts (category, post_type, created_at DESC);
