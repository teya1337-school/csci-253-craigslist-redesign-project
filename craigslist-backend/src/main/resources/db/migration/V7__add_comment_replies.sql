ALTER TABLE comments ADD COLUMN parent_id UUID;
ALTER TABLE comments ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE comments ADD CONSTRAINT comments_parent_fkey
    FOREIGN KEY (parent_id) REFERENCES comments (id);
CREATE INDEX comments_parent_id_idx ON comments (parent_id);
