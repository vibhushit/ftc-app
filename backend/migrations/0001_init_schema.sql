-- 0001_init_schema.sql
-- Initial PostgreSQL Database Schema for FTC Creator Marketplace

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    role VARCHAR(20) NOT NULL DEFAULT 'client', -- 'client' or 'creator'
    city VARCHAR(100),
    locality VARCHAR(100),
    handle VARCHAR(50) UNIQUE,
    trust_score INT NOT NULL DEFAULT 75,
    is_creator BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CREATOR PROFILES TABLE
CREATE TABLE IF NOT EXISTS creator_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    handle VARCHAR(50) UNIQUE NOT NULL,
    avatar TEXT NOT NULL,
    discipline VARCHAR(50) NOT NULL,
    sub_skills TEXT[] NOT NULL DEFAULT '{}',
    city VARCHAR(100) NOT NULL,
    locality VARCHAR(100) NOT NULL,
    starting_at INT NOT NULL DEFAULT 5000,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
    review_count INT NOT NULL DEFAULT 0,
    bio TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    portfolio_urls TEXT[] NOT NULL DEFAULT '{}',
    instant_booking BOOLEAN NOT NULL DEFAULT FALSE,
    holiday_mode BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CREATOR PACKAGES TABLE
CREATE TABLE IF NOT EXISTS creator_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price INT NOT NULL,
    deliverable TEXT NOT NULL,
    turnaround_days INT NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. BOOKINGS & ESCROW TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code VARCHAR(20) UNIQUE NOT NULL, -- e.g. FTC-9821
    creator_id UUID NOT NULL REFERENCES creator_profiles(id),
    client_id UUID NOT NULL REFERENCES users(id),
    pkg_name VARCHAR(100) NOT NULL,
    date_time VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed', -- 'inquiry', 'confirmed', 'delivered', 'completed', 'cancelled'
    price INT NOT NULL,
    deposit_amount INT NOT NULL,
    balance_amount INT NOT NULL,
    location_type VARCHAR(50) NOT NULL DEFAULT 'Studio',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CUSTOM QUOTES TABLE
CREATE TABLE IF NOT EXISTS custom_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    client_id UUID NOT NULL REFERENCES users(id),
    scope TEXT NOT NULL,
    price INT NOT NULL,
    delivery VARCHAR(50) NOT NULL,
    note TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'sent', -- 'sent', 'accepted', 'declined'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PAYOUTS & TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    amount INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'payout_release', 'withdrawal'
    status VARCHAR(30) NOT NULL DEFAULT 'completed',
    description TEXT NOT NULL,
    upi_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
