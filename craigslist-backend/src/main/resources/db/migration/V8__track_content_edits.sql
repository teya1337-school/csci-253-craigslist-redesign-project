-- Track actual content edits separately from general updates and deletions.
-- Leave existing rows unset: updated_at alone cannot prove a content edit.
ALTER TABLE posts ADD COLUMN edited_at TIMESTAMPTZ;
ALTER TABLE comments ADD COLUMN edited_at TIMESTAMPTZ;
