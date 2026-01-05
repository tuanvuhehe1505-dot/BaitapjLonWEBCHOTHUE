# ChoThueNha - Local setup

This repository contains a simple frontend (static files) and a Node/Express backend with MongoDB.

Quick start (development):

1. Server

```bash
cd server
npm install
# Create a .env file by copying .env.example and filling values
# Example values are in server/.env.example
node index.js
```

Required env vars (see `server/.env.example`): `JWT_SECRET`, `ADMIN_REG_CODE`, `PORT`, `MONGODB_URI`.

2. Frontend

Open `client/index.html` using Live Server (VS Code) or run a simple HTTP server:

```bash
cd client
npx http-server -p 5500
```

3. Admin registration

To create an admin account from the frontend registration form, input the same value as `ADMIN_REG_CODE`.

4. Uploads

Uploaded images are stored in `server/uploads` and served at `/uploads/<filename>`.

5. Git

I initialized the repository and made an initial commit. To push, create a remote and run:

```bash
git remote add origin <GIT_REMOTE_URL>
git push -u origin main
```

Notes

- Make sure MongoDB is running locally (or update `MONGODB_URI` to a hosted DB).
- Install server dependencies listed in `server/package.json` if present; otherwise install the packages mentioned in README.
