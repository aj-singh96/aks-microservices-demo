-- Database initialization script for PostgreSQL
-- This script is executed when the database is first created

-- Create the database schema
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Insert sample data for demonstration
INSERT INTO users (name, email) VALUES
  ('Alice Johnson', 'alice.johnson@example.com'),
  ('Bob Smith', 'bob.smith@example.com'),
  ('Charlie Brown', 'charlie.brown@example.com')
ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON TABLE users TO demouser;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO demouser;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Database initialization completed successfully';
END $$;