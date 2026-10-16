-- Alice is inserted by V2. This migration adds Bob as the second test user.
INSERT INTO users (
    id,
    email,
    username,
    password,
    phone_number,
    address,
    status
) VALUES (
    'B0B00000-0000-4000-8000-000000000002',
    'bob@example.test',
    'bob',
    '$2y$12$lwIp8Pj5mjga1Cr/h0z97e13b1yVQT5uN2cS1gEGELEV.4lXWr1iS',
    '5595550102',
    '2000 B Street, Fresno, CA 93722',
    'ACTIVE'
)
ON CONFLICT DO NOTHING;
