# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Little Alchimist is a full-stack Next.js application for family task and reward management with gamification. Parents create tasks for kids who earn points and gems, which can be redeemed for rewards.

## Tech Stack

- **Framework**: Next.js 14 with App Router, React 18, TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS with Radix UI components
- **Auth**: JWT (jose) with HTTP-only cookie storage, bcrypt password hashing

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint

npm run db:generate  # Generate Prisma client after schema changes
npm run db:push      # Sync schema to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio (DB explorer)
```

## Architecture

### Directory Structure

- `src/app/` - Next.js App Router pages and API routes
- `src/app/api/` - 47 RESTful API endpoints
- `src/components/` - React components (`ui/` for reusable primitives)
- `src/lib/` - Shared utilities (api client, auth, db, permissions, types)
- `prisma/` - Database schema and migrations

### User Roles

1. **Admin** - Full system access via `user.superuser` flag
2. **Parents/Guardians** - Create families, manage kids and tasks
3. **Kids** - Complete tasks, earn points/gems, redeem rewards (PIN or link access)

### Authentication Flow

- Login/register → JWT access token (15min) + refresh token (7 days) in cookies
- `src/middleware.ts` validates tokens and protects routes
- `src/lib/auth.ts` handles JWT operations and session management

### Key Data Models (Prisma)

- `User` → `Session` (refresh tokens)
- `Family` → `FamilyMember`, `Kid`, `CalendarEvent`
- `Kid` → `Task`, `Streak`, `PointLog`, `Follow`, `FriendRequest`
- `Reward` → `Redemption`

### API Pattern

Routes export named functions (`GET`, `POST`, `PATCH`, `DELETE`) returning `NextResponse.json()`.

### Path Alias

`@/*` maps to `./src/*` - use `@/lib/db` instead of relative imports.

## Key Features

- **Points System**: 10 points = 1 gem; tracked via `PointLog`
- **Streaks**: Daily/weekly/monthly with milestone bonuses
- **Google Calendar**: OAuth integration to import events as tasks
- **Public Access**: Kids have shareable dashboard links (no auth required)
- **Recurring Tasks**: Tasks can repeat on schedule
