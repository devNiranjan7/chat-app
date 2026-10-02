# Chat App

A real-time chat application built with **React, Firebase, and Cloudinary**, deployed on **Vercel**.

Users can create accounts, manage their profiles, send and accept friend requests, exchange real-time messages with friends, share images, and view shared media. The interface is responsive and works across desktop and mobile devices.

**Live demo:** [chat-app-sandy-one-18.vercel.app](https://chat-app-sandy-one-18.vercel.app)

## Features

### Authentication

- User registration
- User login
- Logout
- Password reset
- Firebase Authentication (email/password)
- Session persistence

### Friends

- Search users by username
- Send friend requests
- Accept or reject incoming requests
- Real-time user data
- Friend list

### Messaging

- Real-time text messaging
- Image messaging (JPG/PNG, up to 5 MB)
- Separate conversation for each friend (friends only)
- Message timestamps
- Automatic scrolling to the latest message

### Profile

- Update username
- Update bio
- Upload profile image
- View a friend's profile and bio
- View shared media

### Responsive Design

- Responsive login page
- Responsive profile update page
- Responsive chat interface
- Mobile friend list
- Mobile chat navigation
- Mobile profile/sidebar navigation
- Responsive message input
- Responsive shared media section

## Tech Stack

### Frontend

- **React**
- **Vite**
- **React Router**
- **CSS**

### Backend & Services

- **Firebase Authentication**
- **Firebase Firestore**
- **Cloudinary** (image storage, signed uploads)
- **Vercel Serverless Function** (`/api/sign-upload`) to authorize uploads

### Other

- **React Toastify**

## Getting Started

1. Clone the repository

   ```
   git clone https://github.com/devNiranjan7/chat-app.git
   ```

2. Navigate to the project

   ```
   cd chat-app
   ```

3. Install dependencies

   ```
   npm install
   ```

### Environment Variables

Create a `.env` file in the root directory.

**Client-side (exposed to the browser by Vite):**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**Server-side (used only by the `/api/sign-upload` function, never exposed to the browser):**

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Add your own Firebase and Cloudinary values. The server-side variables must also be added in your Vercel project settings (Settings → Environment Variables) for the deployed site.

> Never commit your `.env` file. In particular, `CLOUDINARY_API_SECRET` must never be pushed to the repository. If it is ever exposed, rotate it in the Cloudinary dashboard (Settings → API Keys) and update it in Vercel.

### Firebase Setup

The application uses Firebase for authentication and real-time database functionality.

#### Firebase Authentication

The project uses:

- Email/Password authentication
- Password reset
- Session management

Add your deployed domain (for example `your-app.vercel.app`) under **Authentication → Settings → Authorized domains**.

#### Firestore

Firestore stores:

- User profiles (`users`)
- Friend requests (`friendRequests`)
- Chat documents (`chats`)
- Messages (`chats/{chatId}/messages`)

The application uses Firestore realtime listeners to keep user data and messages synchronized.

### Cloudinary

Cloudinary is used for image uploads. Images are used for:

- Profile pictures
- Chat messages
- Shared media

Uploads use **signed uploads**:

1. The browser sends its Firebase ID token to `/api/sign-upload`.
2. The serverless function verifies the token and returns a short-lived Cloudinary signature.
3. The browser uploads the image to Cloudinary with that signature.

The signature restricts uploads to JPG/PNG and to a per-user folder (`chat-app/<uid>`). Only logged-in users can upload. No unsigned upload preset is used.

### Run the Application

Start the development server:

```
npm run dev
```

Vite will display the local development URL in the terminal.

> `npm run dev` does not run the `/api` serverless function, so image uploads will not work locally. To test uploads locally, use the [Vercel CLI](https://vercel.com/docs/cli) (`vercel dev`) or test on the deployed site.

### Production Build

Create a production build:

```
npm run build
```

Preview the production build locally:

```
npm run preview
```

### Deployment (Vercel)

1. Import the repository in Vercel.
2. Add all environment variables listed above (client-side and server-side).
3. Make sure `vercel.json` does not rewrite `/api` routes to `index.html`, for example:

   ```json
   { "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }] }
   ```

4. Redeploy after adding or changing environment variables, since they only apply to new deployments.

## Firestore Security

Firestore security rules (set in the Firebase console under Firestore → Rules) require users to be authenticated and enforce the following:

- **Profiles:** any signed-in user can read profiles; users can edit only their own username, bio, and profile image, with length limits. Profiles do not store email addresses.
- **Friends:** a friend can be added to a friends list only through a valid friend request. Existing friends cannot be removed or duplicated, and a user can add themselves to a sender's list only while that sender's request to them is pending.
- **Friend requests:** requests can be created only as yourself, to a different existing user, starting as `pending`, with the ID `<senderId>_<receiverId>`. Only the receiver can accept or reject. A sender can re-send after a rejection.
- **Chats:** a chat can be created only between two distinct users who are mutual friends, with an ID derived from both user IDs. Only participants can read or update a chat, and participants cannot be changed after creation.
- **Messages:** only chat participants can read and send messages, the sender must be the authenticated user, field types and sizes are validated, images must be Cloudinary URLs, and messages cannot be edited. Authors can delete their own messages.

## Core Functionality

#### User Authentication

Firebase Authentication manages user accounts and sessions.

#### User Profiles

Each user profile document has:

- Username
- Profile image
- Bio
- Friends (list of user IDs)

Email addresses are managed by Firebase Authentication and are not stored in profile documents.

#### Friend System

Users send friend requests by searching for a username. The receiver can accept or reject the request. On acceptance, both users are added to each other's friends list.

#### Chat System

Each conversation has a unique chat ID generated from the two participating user IDs (sorted and joined with `_`).

Messages are stored in a `messages` subcollection inside the corresponding chat document. The chat document stores the participants and the last message preview.

#### Image Messaging

Images are uploaded to Cloudinary using a signed upload, and the resulting secure URL is stored in Firestore as part of the message. The shared media panel is built from the messages already loaded for the open chat.

[GitHub Repository](https://github.com/devNiranjan7/chat-app)

### License

This project is created for learning and portfolio purposes.