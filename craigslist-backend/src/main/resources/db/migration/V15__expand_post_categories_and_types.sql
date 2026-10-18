ALTER TABLE posts DROP CONSTRAINT posts_category_check;
ALTER TABLE posts DROP CONSTRAINT posts_post_type_check;

ALTER TABLE posts ADD CONSTRAINT posts_category_check
    CHECK (category IN ('COMMUNITY', 'SERVICES', 'FOR_SALE', 'HOUSING', 'JOBS', 'GIGS'));
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check
    CHECK (post_type IN ('GENERAL', 'EVENTS', 'COMPUTER', 'AUTOMOTIVE', 'ELECTRONICS', 'FURNITURE',
                        'APARTMENTS', 'ROOMS', 'CUSTOMER_SERVICE', 'GENERAL_LABOR', 'CREATIVE'));
ALTER TABLE posts ADD CONSTRAINT posts_category_type_check CHECK (
    (category = 'COMMUNITY' AND post_type IN ('GENERAL', 'EVENTS')) OR
    (category = 'SERVICES' AND post_type IN ('COMPUTER', 'AUTOMOTIVE')) OR
    (category = 'FOR_SALE' AND post_type IN ('ELECTRONICS', 'FURNITURE')) OR
    (category = 'HOUSING' AND post_type IN ('APARTMENTS', 'ROOMS')) OR
    (category = 'JOBS' AND post_type IN ('CUSTOMER_SERVICE', 'GENERAL_LABOR')) OR
    (category = 'GIGS' AND post_type IN ('COMPUTER', 'CREATIVE'))
);
