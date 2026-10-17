ALTER TABLE users ADD COLUMN picture_version UUID;

CREATE TABLE profile_pictures (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    content_type VARCHAR(20) NOT NULL,
    image_data BYTEA NOT NULL
);
