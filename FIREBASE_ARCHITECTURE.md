# Firebase Architecture Documentation

## Overview

Whotopia uses Firebase as its backend infrastructure, leveraging three core Firebase services to support multiplayer gameplay, user management, and real-time features.

## Firebase Services

### 1. Firebase Authentication
**Purpose**: User authentication and session management

**Supported Methods**:
- Email/Password authentication
- Google Sign-In (OAuth)
- Guest/Anonymous authentication

**Key Features**:
- Automatic session persistence
- Secure token management
- Profile updates (display name, photo URL)
- Password reset functionality
- Account deletion

**Service Location**: `src/firebase/services/authService.js`

---

### 2. Cloud Firestore
**Purpose**: Persistent, structured data storage with querying capabilities

**Data Collections**:

#### Users Collection (`users/`)
- **Document ID**: Firebase Auth user ID
- **Fields**:
  - `displayName`: User's display name
  - `email`: User's email address
  - `photoURL`: Profile picture URL
  - `createdAt`: Account creation timestamp
  - `updatedAt`: Last update timestamp
  - `stats`: User statistics object
    - `totalMatches`: Total games played
    - `wins`: Number of victories
    - `losses`: Number of defeats
    - `winRate`: Win percentage (0-100)
  - `settings`: User preferences object

#### Match History Collection (`matchHistory/`)
- **Document ID**: Auto-generated match ID
- **Fields**:
  - `players`: Array of player IDs
  - `winner`: ID of the winning player
  - `duration`: Match duration in seconds
  - `timestamp`: Match completion timestamp
  - `gameMode`: Game mode played
  - `scores`: Player scores object

#### Leaderboards Collection (`leaderboards/`)
- **Documents**:
  - `global`: Global rankings document
    - `rankings`: Array of top players
  - `weekly`: Weekly rankings document
    - `rankings`: Array of top players for the week
    - `periodStart`: Week start timestamp
    - `periodEnd`: Week end timestamp

**Service Location**: `src/firebase/services/firestoreService.js`

---

### 3. Realtime Database
**Purpose**: Real-time synchronization for live game state and presence

**Data Structure**:

#### Game Rooms (`gameRooms/{roomId}`)
- **Fields**:
  - `roomId`: Unique room identifier
  - `name`: Room display name
  - `hostId`: ID of room creator
  - `maxPlayers`: Maximum player capacity
  - `currentPlayers`: Current player count
  - `status`: Room status (waiting, in-progress, completed)
  - `gameMode`: Selected game mode
  - `createdAt`: Room creation timestamp

#### Room Players (`gameRooms/{roomId}/players/{playerId}`)
- **Fields**:
  - `displayName`: Player's display name
  - `photoURL`: Player's avatar URL
  - `status`: Player status (ready, playing, idle)
  - `joinedAt`: Join timestamp
  - `isHost`: Boolean indicating if player is host

#### Active Games (`activeGames/{roomId}`)
- **Fields**:
  - `currentTurn`: ID of player whose turn it is
  - `deck`: Current deck state
  - `players`: Player hands and states
  - `lastPlayedCard`: Last card played
  - `gameStatus`: Current game phase
  - `lastUpdated`: Last state update timestamp

#### Chat Messages (`chat/{roomId}/{messageId}`)
- **Fields**:
  - `senderId`: ID of message sender
  - `senderName`: Display name of sender
  - `message`: Message content
  - `timestamp`: Message timestamp

#### Player Presence (`presence/{userId}`)
- **Fields**:
  - `online`: Boolean online status
  - `lastSeen`: Last activity timestamp
  - `currentRoom`: ID of room user is in (if any)

**Service Location**: `src/firebase/services/realtimeDBService.js`

---

## Folder Structure

```
src/firebase/
├── firebaseConfig.js          # Firebase configuration (replace with your credentials)
├── index.js                  # Firebase initialization and exports
├── services/                 # Firebase service modules
│   ├── authService.js       # Authentication operations
│   ├── firestoreService.js  # Firestore database operations
│   └── realtimeDBService.js  # Realtime Database operations
└── hooks/                    # React hooks for Firebase
    ├── index.js              # Hook exports
    ├── useAuth.js            # Authentication hook
    ├── useFirestore.js       # Firestore hooks
    └── useRealtimeDB.js      # Realtime Database hooks
```

---

## Why Two Databases?

### Firestore vs Realtime Database

**Firestore** is used for:
- User profiles (persistent, queryable data)
- Match history (structured records with complex queries)
- Leaderboards (rankings with sorting and filtering)

**Realtime Database** is used for:
- Game rooms (frequent updates, real-time sync)
- Active game state (low-latency multiplayer updates)
- Chat messages (real-time messaging)
- Player presence (online/offline status)

**Rationale**:
- Firestore provides better querying capabilities and offline sync for persistent data
- Realtime Database offers lower latency for real-time game state synchronization
- Separating concerns optimizes performance and cost
- Each database is optimized for its specific use case

---

## Custom Hooks

### useAuth
Provides authentication state and methods:
- `user`: Current authenticated user
- `loading`: Auth loading state
- `error`: Auth error state
- `isAuthenticated`: Boolean auth status
- `isGuest`: Boolean guest status
- Methods: `signIn`, `signUp`, `googleSignIn`, `guestSignIn`, `logout`, `updateProfile`, `resetPassword`, `deleteAccount`

### useUserProfile
Manages user profile data:
- `profile`: User profile object
- `loading`: Profile loading state
- `error`: Profile error state
- Methods: `updateProfile`, `createProfile`

### useMatchHistory
Handles match history:
- `matches`: Array of match records
- `loading`: History loading state
- `error`: History error state
- Methods: `fetchMatchHistory`, `recordMatch`

### useLeaderboard
Manages leaderboard data:
- `leaderboard`: Array of ranked players
- `loading`: Leaderboard loading state
- `error`: Leaderboard error state

### useGameRoom
Manages game room operations:
- `room`: Room object
- `loading`: Room loading state
- `error`: Room error state
- Methods: `createRoom`, `updateRoom`, `deleteRoom`

### useAvailableRooms
Lists available game rooms:
- `rooms`: Array of available rooms
- `loading`: Rooms loading state
- `error`: Rooms error state
- Methods: `fetchRooms`

### useRoomPlayers
Manages players in a room:
- `players`: Object of players in room
- `loading`: Players loading state
- `error`: Players error state
- Methods: `addPlayer`, `removePlayer`

### useGameState
Manages active game state:
- `gameState`: Current game state object
- `loading`: Game state loading state
- `error`: Game state error state
- Methods: `setGame`, `updateGame`, `endGame`

### useChat
Handles chat functionality:
- `messages`: Array of chat messages
- `loading`: Messages loading state
- `error`: Messages error state
- Methods: `sendMessage`, `clearMessages`

### usePresence
Manages player presence:
- `presence`: User presence object
- `loading`: Presence loading state
- `error`: Presence error state
- Methods: `setOnline`, `setOffline`

---

## Setup Instructions

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "Whotopia"
3. Enable Authentication:
   - Email/Password provider
   - Google provider
   - Anonymous provider
4. Create Firestore Database:
   - Choose production mode
   - Set location (closest to your users)
5. Create Realtime Database:
   - Choose production mode
   - Set location (same as Firestore)

### 2. Configure Firebase
1. In Firebase Console, add a web app
2. Copy the configuration object
3. Replace placeholder values in `src/firebase/firebaseConfig.js`

### 3. Set Security Rules

#### Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Match history is readable by participants
    match /matchHistory/{matchId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.players;
      allow create: if request.auth != null;
    }
    
    // Leaderboards are publicly readable
    match /leaderboards/{leaderboardId} {
      allow read: if true;
      allow write: if false; // Server-side only
    }
  }
}
```

#### Realtime Database Rules
```
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    
    "gameRooms": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null && (data.child('hostId').val() == auth.uid || newData.child('hostId').val() == auth.uid)",
        
        "players": {
          "$playerId": {
            ".read": "auth != null",
            ".write": "auth != null && ($playerId == auth.uid || data.parent().parent().child('hostId').val() == auth.uid)"
          }
        }
      }
    },
    
    "activeGames": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null && root.child('gameRooms').child($roomId).child('players').child(auth.uid).exists()"
      }
    },
    
    "chat": {
      "$roomId": {
        ".read": "auth != null && root.child('gameRooms').child($roomId).child('players').child(auth.uid).exists()",
        ".write": "auth != null && root.child('gameRooms').child($roomId).child('players').child(auth.uid).exists()"
      }
    },
    
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && $userId == auth.uid"
      }
    }
  }
}
```

---

## Usage Examples

### Authentication
```javascript
import { useAuth } from './firebase/hooks';

function LoginForm() {
  const { signIn, loading, error } = useAuth();
  
  const handleLogin = async (email, password) => {
    const result = await signIn(email, password);
    if (result.success) {
      console.log('Logged in:', result.user);
    } else {
      console.error('Login failed:', result.error);
    }
  };
  
  return <button onClick={() => handleLogin('user@example.com', 'password')}>Login</button>;
}
```

### Game Room Management
```javascript
import { useGameRoom } from './firebase/hooks';

function GameRoom({ roomId }) {
  const { room, loading, updateRoom } = useGameRoom(roomId);
  
  const startGame = async () => {
    await updateRoom({ status: 'in-progress' });
  };
  
  if (loading) return <div>Loading room...</div>;
  return <div>{room?.name} <button onClick={startGame}>Start Game</button></div>;
}
```

### Real-time Chat
```javascript
import { useChat } from './firebase/hooks';

function GameChat({ roomId, userId }) {
  const { messages, sendMessage } = useChat(roomId);
  
  const handleSend = async (text) => {
    await sendMessage({
      senderId: userId,
      senderName: 'Player',
      message: text
    });
  };
  
  return (
    <div>
      {messages.map(msg => <div key={msg.id}>{msg.senderName}: {msg.message}</div>)}
      <input onKeyPress={(e) => e.key === 'Enter' && handleSend(e.target.value)} />
    </div>
  );
}
```

---

## Performance Considerations

### Firestore
- Use indexes for frequently queried fields
- Limit query results with `.limit()` to reduce data transfer
- Use batch operations for multiple writes
- Enable offline persistence for better UX

### Realtime Database
- Structure data for efficient reads (avoid deep nesting)
- Use `.on()` for real-time listeners, `.once()` for single reads
- Always unsubscribe from listeners on component unmount
- Use `onDisconnect` for presence management

### General
- Implement caching strategies for frequently accessed data
- Use pagination for large datasets
- Debounce rapid updates to reduce database load
- Monitor usage in Firebase Console to optimize costs

---

## Security Best Practices

1. **Never expose Firebase config secrets** - The config in `firebaseConfig.js` is safe to expose as it contains public keys only
2. **Implement proper security rules** - Restrict data access based on authentication and ownership
3. **Validate data on the client** - Before sending to Firebase, validate user input
4. **Use Firebase Security Rules** - Enforce data validation at the database level
5. **Implement rate limiting** - Prevent abuse through Firebase Extensions or Cloud Functions
6. **Enable App Check** - Protect your backend from abusive traffic
7. **Monitor for suspicious activity** - Use Firebase Analytics and Crashlytics

---

## Future Enhancements

1. **Cloud Functions** - Server-side logic for:
   - Matchmaking algorithms
   - Automated leaderboard calculations
   - Push notifications
   - Data validation and sanitization

2. **Firebase Storage** - For:
   - User avatar uploads
   - Game assets
   - Replay recordings

3. **Firebase Analytics** - For:
   - User engagement tracking
   - Game balance analysis
   - Feature usage metrics

4. **Firebase Remote Config** - For:
   - A/B testing
   - Feature flags
   - Game parameter tuning

---

## Troubleshooting

### Common Issues

**Firebase not initialized**
- Ensure `firebase/index.js` is imported in `main.jsx`
- Check that config values are correctly set in `firebaseConfig.js`

**Authentication errors**
- Verify authentication providers are enabled in Firebase Console
- Check security rules allow the operation
- Ensure user is not already signed in

**Firestore permission denied**
- Review Firestore security rules
- Check that user has proper authentication
- Verify document IDs match expected format

**Realtime Database connection issues**
- Ensure Realtime Database is created in Firebase Console
- Check security rules allow read/write operations
- Verify database URL is correct in config

---

## Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Community](https://firebase.google.com/support/community)
- [Stack Overflow - Firebase Tag](https://stackoverflow.com/questions/tagged/firebase)

For Whotopia-specific implementation:
- Review service files in `src/firebase/services/`
- Check hook implementations in `src/firebase/hooks/`
- Refer to this documentation for architecture guidance
