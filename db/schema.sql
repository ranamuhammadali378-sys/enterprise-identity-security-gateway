CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'Employee' CHECK (role IN ('Employee', 'Manager', 'SuperAdmin')),
    github_id VARCHAR(100) UNIQUE,
    failed_login_attempts INT DEFAULT 0,
    lock_until TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial test accounts for grading & viva demo (Password: Password123!)
INSERT INTO users (name, email, password_hash, role) VALUES 
('Super Admin User', 'superadmin@example.com', '$2b$10$w8T0hR.T7tOekZqGgHlXxe3fB3p1ZgE1P8gT5rF2iKqH7E8J6wWKe', 'SuperAdmin'),
('Manager User', 'manager@example.com', '$2b$10$w8T0hR.T7tOekZqGgHlXxe3fB3p1ZgE1P8gT5rF2iKqH7E8J6wWKe', 'Manager'),
('Employee User', 'employee@example.com', '$2b$10$w8T0hR.T7tOekZqGgHlXxe3fB3p1ZgE1P8gT5rF2iKqH7E8J6wWKe', 'Employee')
ON CONFLICT (email) DO NOTHING;