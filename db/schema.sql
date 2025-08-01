CREATE TABLE IF NOT EXISTS articles (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    number INT NOT NULL,
    content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS faqs (
    id VARCHAR(255) PRIMARY KEY,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    "order" INT NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    article_id VARCHAR(255) NOT NULL,
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    parent_id VARCHAR(255),
    article_link_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    depth INT DEFAULT 0,
    pinned BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (article_id) REFERENCES articles(id),
    FOREIGN KEY (parent_id) REFERENCES comments(id)
);