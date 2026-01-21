# RealChat 💬⚡ (Real-Time Multi-User Room Chat App)

RealChat is a **modern real-time chat application** built for **Android-first mobile experience** with a **clean solid-color UI**, smooth chat animations, and **multi-user room support (10+ users per room)**.  
No login, no signup — just **create a room, share the code, and start chatting instantly**.

> ✅ **Real-time messaging**  
> ✅ **Room invite via code/link**  
> ✅ **10+ users per room**  
> ✅ **Message reactions (❤️ 😂 👍 😮 😢 🔥)**  
> ✅ **Typing indicator + smooth animations**  
> ✅ **Lovable Cloud backend integration**  
> ✅ **SEO-friendly documentation**

---

## ✨ Features

### 🚀 Core Features
- **Create Room** (Host creates a chat room)
- **Join Room** using **Room Code / Invite Link**
- **Real-Time Chat** (messages sync instantly)
- **Multi-User Room Support** (minimum **10 users**)
- **Participants List** (see who is in the room)
- **Online Users Count**
- **Typing Indicator** (“Someone is typing…”)
- **Auto Scroll** to latest message
- **New Message Indicator** when user scrolls up

### 😍 Chat Experience
- Smooth message animations (send/receive)
- Interactive UI (tap effects, micro-interactions)
- **Message reactions** with animation + counts
- Solid-color premium UI (NO gradients)

### 🔐 Authentication
- ❌ No signup
- ❌ No login
- ❌ No authentication required  
Users can chat instantly using room invite system.

---

## 📱 Screens / Pages

- **Home**
  - Create Room
  - Join Room

- **Create Room**
  - Generate Room Code
  - Click-to-copy invite
  - Share link (optional)

- **Join Room**
  - Enter Room Code
  - Join instantly

- **Chat Room**
  - Messages
  - Participants
  - Reactions
  - Typing indicator
  - Leave Room

---

## 🧠 How RealChat Works (System Flow)

```ascii
+-------------------+         +----------------------+
|   User A (Host)   |         |    User B / C / D    |
+-------------------+         +----------------------+
          |                              |
          | Create Room                  | Join Room
          |----------------------------->| (Room Code / Link)
          |                              |
          v                              v
+------------------------------------------------------+
|                    RealChat Room                      |
|   - roomId                                            |
|   - participants (10+ users)                          |
|   - messages realtime sync                            |
|   - reactions + typing indicator                      |
+------------------------------------------------------+
          |
          v
+-----------------------------+
|    Lovable Cloud Backend    |
|  - rooms                    |
|  - participants             |
|  - messages                 |
|  - reactions                |
+-----------------------------+

```
**Architecture Overview**
```

                    ┌───────────────────────────────┐
                    │          RealChat UI           │
                    │  Mobile-first + Responsive     │
                    │  Solid colors + Animations     │
                    └───────────────┬───────────────┘
                                    │
                                    │ Realtime updates
                                    v
                    ┌───────────────────────────────┐
                    │        Lovable Cloud           │
                    │  Database + Realtime Sync      │
                    └───────────────┬───────────────┘
                                    │
                                    v
        ┌─────────────────────────────────────────────────┐
        │                  Data Collections                │
        │ rooms | participants | messages | reactions      │
        └─────────────────────────────────────────────────┘
```

**Folder Structure**

```
RealChat/
│
├── README.md
├── package.json
├── .env.example
├── .gitignore
│
├── public/
│   ├── favicon.ico
│   └── assets/
│       └── logo.png
│
└── src/
    ├── app/
    │   ├── layout.jsx
    │   ├── page.jsx                # Home (Create / Join)
    │   ├── create-room/
    │   │   └── page.jsx
    │   ├── join-room/
    │   │   └── page.jsx
    │   └── room/
    │       └── [roomId]/
    │           └── page.jsx        # Chat Screen
    │
    ├── components/
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   └── Modal.jsx
    │   │
    │   ├── chat/
    │   │   ├── ChatHeader.jsx
    │   │   ├── ChatMessages.jsx
    │   │   ├── ChatBubble.jsx
    │   │   ├── ChatInput.jsx
    │   │   ├── ReactionPicker.jsx
    │   │   └── ParticipantsDrawer.jsx
    │   │
    │   └── common/
    │       ├── CopyToClipboard.jsx
    │       ├── Loader.jsx
    │       └── Toast.jsx
    │
    ├── lib/
    │   ├── lovableClient.js        # Lovable Cloud client config
    │   ├── roomService.js          # Create/Join room logic
    │   ├── messageService.js       # Send/Receive messages
    │   ├── reactionService.js      # Add/Remove reactions
    │   └── utils.js
    │
    ├── styles/
    │   └── globals.css
    │
    └── constants/
        ├── colors.js
        └── reactions.js
```

**⚙️ Setup Instructions**

✅ Prerequisites

Make sure you have:

Node.js (LTS recommended)

npm or yarn

A Lovable Cloud project (for realtime database + sync)

1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/realchat.git
```
```bash
cd realchat
```
2️⃣ Install Dependencies
```bash
npm install
```
3️⃣ Setup Environment Variables

Create a .env file from .env.example

cp .env.example .env


Example .env:
```
LOVABLE_CLOUD_API_KEY=your_key_here
LOVABLE_CLOUD_PROJECT_ID=your_project_id_here
LOVABLE_CLOUD_URL=https://your-lovable-cloud-endpoint

4️⃣ Run the App
```bash
npm run dev
```

Now open:
```bash
http://localhost:3000



