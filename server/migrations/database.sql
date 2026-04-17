-- Smart Meeting Handshake System - Database Schema
-- This migration creates the complete database schema for the MVP

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clients table
-- Stores client information for meetings
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meetings table
-- Stores meeting records with share tokens for public access
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  title VARCHAR(255) NOT NULL,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transcripts table
-- Stores meeting transcripts (text or audio source)
-- One transcript per meeting (enforced by UNIQUE constraint)
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID UNIQUE NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source VARCHAR(50) DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Outputs table
-- Stores AI-generated analysis results
-- One output per meeting (enforced by UNIQUE constraint)
CREATE TABLE IF NOT EXISTS ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID UNIQUE NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  action_items JSONB DEFAULT '[]',
  key_decisions JSONB DEFAULT '[]',
  open_questions JSONB DEFAULT '[]',
  next_steps JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
-- Index on meetings.client_id for efficient client lookup
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);

-- Index on meetings.share_token for efficient public URL resolution
CREATE INDEX IF NOT EXISTS idx_meetings_share_token ON meetings(share_token);

-- Unique index on transcripts.meeting_id to enforce one transcript per meeting
CREATE UNIQUE INDEX IF NOT EXISTS idx_transcripts_meeting ON transcripts(meeting_id);

-- Unique index on ai_outputs.meeting_id to enforce one output per meeting
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_outputs_meeting ON ai_outputs(meeting_id);
