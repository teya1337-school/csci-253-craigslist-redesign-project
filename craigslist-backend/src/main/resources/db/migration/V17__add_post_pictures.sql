CREATE TABLE post_pictures (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL CHECK (display_order >= 0),
    content_type VARCHAR(20) NOT NULL,
    image_data BYTEA NOT NULL
);
CREATE INDEX post_pictures_post_order_idx ON post_pictures (post_id, display_order);
