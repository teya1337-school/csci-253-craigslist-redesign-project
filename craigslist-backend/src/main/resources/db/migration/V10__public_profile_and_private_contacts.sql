ALTER TABLE users RENAME COLUMN email TO private_email;
ALTER TABLE users RENAME COLUMN phone_number TO private_phone_number;
ALTER TABLE users ADD COLUMN bio VARCHAR(1000);
ALTER TABLE users ADD COLUMN public_email VARCHAR(100);
ALTER TABLE users ADD COLUMN public_phone_number VARCHAR(30);
