# Implementation Plan - Smart Gym Management System

## Phase 1: Foundation & Setup
- [x] **Project Structure**: Set up folder structure for Super Admin, Branch Admin, and Member Portal.
- [x] **Dependencies**: Install core UI libraries (`lucide-react`, `clsx`, `tailwind-merge`).
- [x] **Shared Components**: Build reusable "premium" UI components (Button, Card, Input, Badge).
- [x] **Layouts**: Create distinct layouts for Marketing, Admin (Super/Branch), and Member Portal.

## Phase 2: Core Modules (Frontend + UI)
### Super Admin
- [x] **Dashboard**: Global stats (branches, revenue).
- [x] **Branch Management**: List, Add, Edit branches.

### Branch Admin
- [x] **Dashboard**: Daily check-ins, active members.
- [x] **Member Management**: List, Add Member, Member Profile (with Tabs for Profile, Attendance, Payments).
- [x] **Attendance**: Live logs, manual entry.
- [x] **Classes & Trainers**: Class scheduling and booking UI.
- [x] **Expenses**: Expense tracking UI.
- [x] **Communications**: SMS/WhatsApp broadcast UI.

### Member Portal
- [x] **Dashboard**: Membership status, QR Code.
- [x] **Class Booking**: View Schedule.

## Phase 3: Backend & Data (Next.js API / Server Actions)
- [x] **Database Setup**: Connect to Database (MongoDB with Mongoose). *Switched from Prisma/PostgreSQL to MongoDB*
- [x] **Auth**: Implementation of Custom Auth (Credentials Provider) with JWT and MongoDB adapter.
- [x] **API Routes**: Create CRUD endpoints for Branches, Members, Attendance, and Users using Async Repositories.

## Phase 4: Biometric Integration
- [ ] **Device API**: Endpoints for device heartbeats and command queues.

---
**Current Focus**: Phase 3 - Backend & Data.
