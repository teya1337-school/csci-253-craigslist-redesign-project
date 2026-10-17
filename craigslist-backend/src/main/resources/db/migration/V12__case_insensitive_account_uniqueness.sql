CREATE UNIQUE INDEX users_username_ignore_case_key ON users (lower(username));
CREATE UNIQUE INDEX users_private_email_ignore_case_key ON users (lower(private_email));
