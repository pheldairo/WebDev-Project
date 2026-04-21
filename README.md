# WebDev Project

Collaborative student scheduling platform with rooms, shared timetable, JWT auth, and voice chat.

## Overview

This project contains:

- Backend: Django + Django REST Framework + Channels (WebSocket signaling for voice chat)
- Frontend: Angular (standalone components)
- Auth: JWT (access + refresh)
- Realtime: WebRTC voice chat with Django Channels as signaling server

The app supports:

- Registration and login
- Room creation and joining
- Shared room schedules
- Global academic subjects list (shared across all rooms)
- Voice communication between users inside a room

## Team

1. Bodnar Daniil
2. Musaev Sarvan
3. Nurlanzhan Bagdar

## Tech Stack

- Python 3.12+
- Django 4.2
- Django REST Framework
- Django Channels + Daphne
- PostgreSQL
- Angular 21
- ngrok (for external access/testing)

## Repository Structure

```text
WebDev-Project/
	backend/
		manage.py
		backend/
			settings.py
			urls.py
			asgi.py
			apps/
				users/
				rooms/
				schedule/
				university/
				voicechat/
	frontend/
		angular.json
		src/
			environments/
			app/
```

## Prerequisites

Install before running:

1. Python 3.12+
2. Node.js 20+ and npm
3. PostgreSQL 14+
4. ngrok (optional, for external/device-to-device testing)

## 1. Clone Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd WebDev-Project
```

## 2. Backend Setup (Django)

### 2.1 Create virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

### 2.2 Install dependencies

```bash
pip install -r ../requirements.txt
```

### 2.3 Configure PostgreSQL

Default backend settings expect:

- DB name: `webdev_db`
- User: `user`
- Password: `password`
- Host: `localhost`
- Port: `5432`

Create this database/user:

```bash
sudo -u postgres psql
CREATE USER "user" WITH PASSWORD 'password';
CREATE DATABASE webdev_db OWNER "user";
\q
```

If you prefer custom credentials, update `backend/backend/settings.py`.

### 2.4 Apply migrations

```bash
python manage.py migrate
```

This also seeds global academic subjects via migrations in the university app.

### 2.5 Create admin user (optional)

```bash
python manage.py createsuperuser
```

## 3. Frontend Setup (Angular)

Open a new terminal:

```bash
cd frontend
npm install
```

## 4. Environment Configuration

Edit frontend environment file:

`frontend/src/environments/environment.ts`

### Local development values

```ts
export const environment = {
	production: false,
	apiUrl: 'http://localhost:8000/api',
	wsUrl: 'ws://localhost:8000'
};
```

### ngrok values

```ts
export const environment = {
	production: false,
	apiUrl: 'https://<your-ngrok-domain>.ngrok-free.dev/api',
	wsUrl: 'wss://<your-ngrok-domain>.ngrok-free.dev'
};
```

Important:

- `apiUrl` must include `/api`
- `wsUrl` must NOT include `/ws` (the app appends the route itself)

## 5. Run Project (Local Development)

Use 2 terminals.

### Terminal A: Backend (ASGI, recommended for voice chat)

```bash
cd backend
source .venv/bin/activate
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```

### Terminal B: Frontend

```bash
cd frontend
ng serve --host 0.0.0.0
```

Open app:

- Frontend: http://localhost:4200
- Backend API: http://localhost:8000/api

## 6. External Access via ngrok (One Tunnel Mode)

Free ngrok usually allows one active endpoint. This project is configured to support one-tunnel demo mode.

### 6.1 Build frontend into Django static folder

`frontend/angular.json` already uses:

```json
"outputPath": "../backend/static/frontend"
```

Build command:

```bash
cd frontend
npm run build
```

### 6.2 Start backend

```bash
cd backend
source .venv/bin/activate
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```

### 6.3 Start single ngrok tunnel

```bash
ngrok http 8000
```

Copy HTTPS URL from ngrok, for example:

`https://abc123.ngrok-free.dev`

### 6.4 Update frontend environment and rebuild

Set:

- `apiUrl = https://abc123.ngrok-free.dev/api`
- `wsUrl = wss://abc123.ngrok-free.dev`

Then rebuild frontend:

```bash
cd frontend
npm run build
```

Now open this single ngrok URL from any device.

## 7. Voice Chat Test (Two Devices)

1. Open the app on device A and device B (same URL).
2. Register/login both users.
3. Join the same room.
4. Open schedule page for that room.
5. Press Join Voice on both devices.
6. Allow microphone permission on both browsers.

Expected result:

- WebSocket connects to `/ws/voicechat/<room_id>/`
- Audio is exchanged peer-to-peer via WebRTC

## 8. Global Academic Subjects (Shared Across All Rooms)

Subjects are stored in university academic slots and returned by:

- `GET /api/university/slots/`

They are global (not room-specific), so dropdown options are available in every room.

Current seeded test data includes 20 English subjects (10 initial + 10 additional).

## 9. Main API Routes

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET/PATCH /api/auth/profile/`
- `GET/POST /api/rooms/`
- `POST /api/rooms/join/`
- `GET /api/rooms/<id>/participants/`
- `GET/POST /api/schedule/`
- `POST /api/schedule/confirm-selection/`
- `PUT/PATCH/DELETE /api/schedule/<id>/`
- `GET /api/university/slots/`

## 10. Common Issues and Fixes

### 10.1 `ModuleNotFoundError: No module named 'backend.asgi'`

You are likely in the wrong directory. Run Daphne from `backend/`:

```bash
cd backend
source .venv/bin/activate
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```

### 10.2 Register/Login returns 401

Check frontend environment URL:

- Correct domain
- `apiUrl` includes `/api`
- Clear stale tokens in browser storage if needed

### 10.3 ngrok `ERR_NGROK_334`

An endpoint with the same domain is already online.

Fix:

1. Stop existing ngrok process
2. Run only one tunnel (`ngrok http 8000`) in one-tunnel mode

### 10.4 No sound in voice chat

Checklist:

1. Both users joined voice
2. Browser mic permission is granted
3. Both users are in same room
4. WebSocket connects successfully

In restrictive networks/NAT scenarios, TURN server may be required for full reliability.

## 11. Useful Commands

Backend:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```

Frontend:

```bash
ng serve --host 0.0.0.0
npm run build
```

ngrok:

```bash
ngrok http 8000
```

## License

Educational project.
