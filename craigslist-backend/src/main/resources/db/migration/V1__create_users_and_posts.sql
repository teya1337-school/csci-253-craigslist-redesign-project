CREATE TABLE users (
    id            UUID         NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password      VARCHAR(100) NOT NULL,
    phone_number  VARCHAR(20)  NOT NULL,
    address       VARCHAR(255) NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE posts (
    id          UUID         NOT NULL,
    user_id     UUID         NOT NULL,
    title       VARCHAR(200) NOT NULL,
    body        TEXT         NOT NULL,
    category    VARCHAR(30)  NOT NULL,
    location    VARCHAR(255) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PUBLISHED',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMPTZ,
    CONSTRAINT posts_pkey PRIMARY KEY (id),
    CONSTRAINT posts_user_fkey FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT posts_category_check CHECK (
        category IN ('COMMUNITY', 'FOR_SALE', 'HOUSING', 'JOBS', 'SERVICES')
    ),
    CONSTRAINT posts_status_check CHECK (status IN ('DRAFT', 'PUBLISHED', 'DELETED'))
);

CREATE INDEX posts_status_created_at_idx ON posts (status, created_at DESC);
CREATE INDEX posts_user_id_idx ON posts (user_id);
