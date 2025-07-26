@echo off
echo Starting Civic Mind Development Environment...

echo Starting Firebase Emulators...
start "Firebase Emulators" cmd /k "firebase emulators:start --only firestore,pubsub"

timeout /t 5

echo Starting Backend API...
start "Backend API" cmd /k "cd apps/api && pnpm dev"

timeout /t 3

echo Starting Frontend...
start "Frontend" cmd /k "cd apps/web && pnpm dev"

echo Development environment started!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:3001
echo Firebase UI: http://localhost:4000
