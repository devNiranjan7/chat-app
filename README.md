# Chat App

A real-time chat application built with **React, Firebase, and Cloudinary**.

The application allows users to create accounts, manage their profiles, add friends, exchange real-time messages, share images, and view shared media. The interface is responsive and works across desktop and mobile devices.

## Features

### Authentication

- User registration
- User login
- Logout
- Password reset
- Firebase Authentication
- Session persistence

### Friends

- Search users by username
- Add friends
- Real-time user data
- Friend list

### Messaging

- Real-time text messaging
- Image messaging
- Separate conversations for each friend
- Message timestamps
- Automatic scrolling to the latest message

### Profile

- Update username
- Update bio
- Upload profile image
- View friend's profile
- View friend's bio
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
- **Cloudinary**

### Other

- **React Toastify**

## Getting Started

1. Clone the repository
   git clone https://github.com/devNiranjan7/chat-app.git

2. Navigate to the project
   cd chat-app

3. Install dependencies
   npm install

### Environment Variables

Create a .env file in the root directory.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Add your own Firebase and Cloudinary configuration values.
Never commit your .env file or expose private credentials in the repository.

### Firebase Setup

The application uses Firebase for authentication and real-time database functionality.

#### Firebase Authentication
The project uses:
- Email/Password authentication
- Password reset
- Session management

#### Firestore
Firestore stores:
- User profiles
- Friend relationships
- Chat documents
- Messages

The application uses Firestore realtime listeners to keep user data and messages synchronized.

### Cloudinary

#### Cloudinary is used for image uploads.

Images are used for:

- Profile pictures
- Chat messages
- Shared media

The application uses an unsigned Cloudinary upload preset for client-side image uploads.

Configure the following environment variables:

```
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

### Run the Application

Start the development server:

```
npm run dev
```

Vite will display the local development URL in the terminal.

### Production Build:

Create a production build:

```
npm run build
```

Preview the production build locally:

```
npm run preview
```

## Firestore Security

Firestore security rules require users to be authenticated before accessing application data.
The rules restrict:

- User profile modifications to the profile owner
- Chat access to chat participants
- Message creation to authenticated chat participants
- Message sender identity to the authenticated user
- Modification of chat participants after chat creation

## Core Functionality

#### User Authentication

Firebase Authentication manages user accounts and sessions.

#### User Profiles

Each user has:

- Username
- Email
- Profile image
- Bio
- Friends

#### Friend System

Friend relationships are stored between users and synchronized through Firestore.

#### Chat System

Each conversation has a unique chat ID generated from the two participating user IDs.

Messages are stored inside the corresponding chat document.

#### Image Messaging

Images are uploaded to Cloudinary and the resulting secure URL is stored in Firestore as part of the message.

[GitHub Repository](https://github.com/devNiranjan7/chat-app)

### License

This project is created for learning and portfolio purposes.
