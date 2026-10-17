ALTER TABLE users DROP CONSTRAINT users_status_check;

UPDATE users SET status = 'DELETED' WHERE status = 'INACTIVE';

DELETE FROM profile_pictures
WHERE user_id IN (SELECT id FROM users WHERE status = 'DELETED');

UPDATE users
SET username = 'deleted:' || id::text,
    private_email = 'deleted-' || id::text || '@deleted.invalid',
    password = '',
    private_phone_number = '',
    address = '',
    bio = NULL,
    public_email = NULL,
    public_phone_number = NULL,
    picture_version = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'DELETED';

ALTER TABLE users ADD CONSTRAINT users_status_check
    CHECK (status IN ('ACTIVE', 'DELETED'));
