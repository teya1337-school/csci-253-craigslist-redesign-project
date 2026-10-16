CREATE TABLE comments (
    id          UUID        NOT NULL,
    user_id     UUID        NOT NULL,
    post_id     UUID        NOT NULL,
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT comments_pkey PRIMARY KEY (id),
    CONSTRAINT comments_user_fkey FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT comments_post_fkey FOREIGN KEY (post_id) REFERENCES posts (id)
);

CREATE INDEX comments_post_id_idx ON comments (post_id);
CREATE INDEX comments_user_id_idx ON comments (user_id);
