# Chat App

A real-time chat application built with React, Firebase, and Cloudinary. It includes email verification, friend requests, profile management, and real-time messaging with image sharing.

Live demo: https://chat-app-sandy-one-18.vercel.app

## Features

### Authentication
- Email/password sign up and sign in
- Password reset
- Email verification flow
- Protected routes for authenticated users
- Firebase session persistence

### Friends
- Search users by username
- Send friend requests
- Accept or reject incoming requests
- Friend list management
- Real-time presence status for friends

### Messaging
- Real-time text chat
- One-to-one conversations between mutual friends
- Message timestamps
- Unread message tracking
- Auto-scroll to latest message
- Image message support via Cloudinary

### Profile
- Update username
- Update bio
- Upload profile image
- View a friend's profile and shared media
- Shared media gallery from chat images

### Responsive UI
- Mobile-friendly chat layout
- Responsive sidebar navigation
- Responsive login page
- Responsive profile update screen

## Tech Stack

### Frontend
- React
- Vite
- React Router
- CSS

### Backend / Services
- Firebase Authentication
- Firestore
- Firebase Realtime Database
- Cloudinary
- Vercel Serverless API

### Libraries
- React Toastify

## Project Structure

```bash
chat-app/
├── api/
│   ├── sign-upload.js
│   └── delete-images.js
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ChatBox/
│   │   ├── DeleteAccountModal/
│   │   ├── LeftSidebar/
│   │   └── RightSidebar/
│   ├── config/
│   │   └── firebase.js
│   ├── context/
│   │   └── AppContext.jsx
│   ├── lib/
│   ├── pages/
│   │   ├── Chat/
│   │   ├── Login/
│   │   ├── ProfileUpdate/
│   │   └── VerifyEmail/
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── vercel.json
├── vite.config.js
├── README.md
└── package-lock.json
```

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/devNiranjan7/chat-app.git
```

2. Navigate to the project folder

```bash
cd chat-app
```

3. Install dependencies

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory.

### Client-side variables
These are used by Firebase in the frontend and must be exposed to Vite:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=
```

### Server-side variables
These are used by the Vercel serverless function for Cloudinary image signing:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

> Never commit your `.env` file. The Cloudinary secret should never be pushed to the repository.

## Firebase Setup

This application uses Firebase for authentication, Firestore, and realtime features.

### Firebase Authentication
- Email/password signup and login
- Password reset
- Email verification
- Authorized domains must include your deployed app domain, such as:
  - `your-app.vercel.app`

### Firestore
The app stores:
- User profiles in `users`
- Friend requests in `friendRequests`
- Chats in `chats`
- Messages in `chats/{chatId}/messages`

### Firebase Realtime Database
Used for presence and online/offline status tracking.

## Cloudinary Setup

Cloudinary is used for uploading profile images and chat images.

The app uses signed uploads:
1. The browser sends the Firebase ID token to `/api/sign-upload`
2. The server validates the token
3. A short-lived Cloudinary signature is returned
4. The browser uploads the image directly to Cloudinary

Upload rules:
- JPG/PNG only
- Max file size: 5 MB
- Each upload is scoped to a per-user folder:
  - `chat-app/<uid>`

## Running the App

Start the Vite development server:

```bash
npm run dev
```

This starts the frontend locally. The local app can run without the API server for basic frontend work, but image uploads require the serverless function.

### Local upload testing
Use Vercel CLI for full local environment behavior:

```bash
vercel dev
```

## Production Build

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment on Vercel

1. Import the repository into Vercel
2. Add all required environment variables
3. Deploy the app
4. Ensure your Firebase authorized domain matches the deployment URL

The project includes a `vercel.json` rewrite configuration so SPA routes work correctly while leaving `/api` routes intact.

## Core Functionality

### User Authentication

Firebase Authentication manages user accounts and sessions. Users create accounts with email and password, and the app requires email verification before accessing the chat features. The authentication state is persisted using Firebase sessions.

### User Profiles

Each user profile document contains:

- Username
- Profile image
- Bio
- Friends (list of user IDs)

Email addresses are managed by Firebase Authentication and are not stored in profile documents.

### Friend System

Users can search for other users by their username. When a user sends a friend request, it is stored in the `friendRequests` collection with a status of `pending`. The receiver can then accept or reject the request. On acceptance, both users are added to each other's friends list, and they can now send messages to each other.

### Chat System

Each conversation has a unique chat ID generated from the two participating user IDs (sorted and joined with `_`). For example, if user `alice` chats with user `bob`, the chat ID is `alice_bob`.

Messages are stored in a `messages` subcollection inside the corresponding chat document. The chat document itself stores the participants, unread message counts, delivery timestamps, and a preview of the last message.

### Image Messaging

Images are uploaded to Cloudinary using a signed upload. The resulting secure Cloudinary URL is stored in Firestore as part of the message object. The shared media panel on the right sidebar displays all images from the currently open chat by filtering the loaded messages for those with image URLs.

---

[GitHub Repository](https://github.com/devNiranjan7/chat-app)

## License

This project is created for learning and portfolio purposes.
