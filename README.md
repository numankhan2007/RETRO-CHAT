<div align="center">
  <br />
  <img src="frontend/public/logo.svg" width="150" height="150" />
  <br />
  
  <h1 style="font-size: 3rem; font-weight: bold; margin-bottom: 0;">RETRO CHAT</h1>
  
  <a href="https://git.io/typing-svg"><img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=24&pause=1000&color=00FFCC&center=true&vCenter=true&width=600&lines=A+Next-Gen%2C+Real-Time+Communication+Platform;Chronological.+Authentic.+Lightning+Fast.;Powered+by+FastAPI+%2B+React+%2B+WebSockets" alt="Typing SVG" /></a>


  <p align="center">
    <strong>FastAPI • React • Supabase • WebSockets • Cloudflare R2</strong>
    <br />
    <br />
    <a href="#-architecture">Architecture</a>
    ·
    <a href="#-features">Features</a>
    ·
    <a href="#-tech-stack">Tech Stack</a>
    ·
    <a href="#-getting-started">Getting Started</a>
  </p>
</div>

---

## 🌌 The Vision

**Retro Chat** is a highly scalable, real-time chat and social blogging platform engineered with modern performance and clean aesthetics in mind. Bypassing algorithmic feeds and engagement hacks, it delivers a pure chronological, authentic social experience.

---

## 📐 Architecture Wireframe

```mermaid
graph TD
    %% Styling
    classDef client fill:#0d1117,stroke:#00ffcc,stroke-width:2px,color:#fff;
    classDef backend fill:#0d1117,stroke:#ff0055,stroke-width:2px,color:#fff;
    classDef storage fill:#0d1117,stroke:#ffaa00,stroke-width:2px,color:#fff;
  
    subgraph FRONTEND ["💻 Client Tier"]
        UI[React UI / Tailwind CSS]
        State[Context API / Axios]
        WS_Client[WebSocket Client]
    end

    subgraph BACKEND ["⚙️ API Tier"]
        API[FastAPI REST Router]
        WS_Server[WebSocket Manager]
        Auth[JWT Auth & OTP]
    end

    subgraph INFRASTRUCTURE ["☁️ Data & Storage Tier"]
        DB[(Supabase PostgreSQL)]
        R2[Cloudflare R2 Object Storage]
        SMTP[SMTP Email Server]
    end

    %% Connections
    UI <-->|HTTP Requests| API
    WS_Client <-->|Real-Time WS| WS_Server
    State --> UI
  
    API -->|SQLAlchemy| DB
    WS_Server -->|Read/Write| DB
    API -->|Verify/Upload| R2
    Auth -->|Send OTP| SMTP
  
    class UI,State,WS_Client client;
    class API,WS_Server,Auth backend;
    class DB,R2,SMTP storage;
```

---

## ⚡ Features

### 💬 Real-Time Chat Engine

* **WebSockets:** Lightning-fast, instant message delivery.
* **Read Receipts:** Track when messages are delivered and read.
* **Typing Indicators:** See when friends are actively typing.

### 🌐 Social Blogging (The Feed)

* **Chronological Feed:** No algorithms. Pure chronological posts.
* **Engagement:** Like, save, and comment on posts.
* **Content Management:** Pin your favorite replies (up to 3) to the top of your posts.

### 🔐 Ironclad Security & Auth

* **OTP Verification:** Email verification codes required for registration and password resets.
* **JWT Tokens:** Stateless, highly secure session management.
* **Privacy-First:** Usernames are hidden globally until a friend request is accepted.

### 🖼️ Modern Media & Storage

* **Cloudflare R2 Integration:** Avatars and media assets are stored safely on the edge.
* **Responsive Design:** 100% responsive fluid UI built meticulously with Tailwind CSS and glassmorphism elements.

---

## 🛠️ Tech Stack

```mermaid
mindmap
  root((Retro Chat))
    Frontend
      React 18
      Vite
      Tailwind CSS
      React Router
      Axios
    Backend
      Python 3.11+
      FastAPI
      SQLAlchemy
      Uvicorn
      Passlib
    Infrastructure
      Supabase Postgres
      Cloudflare R2
      SMTP
```

---

## 📂 Project Structure

```text
RETRO-CHAT/
├── backend/                       # Python FastAPI Server
│   ├── app/
│   │   ├── core/                  # Security & Config
│   │   ├── db/                    # Postgres setup & migrations
│   │   ├── models/                # SQLAlchemy database tables
│   │   ├── routers/               # API endpoint definitions
│   │   ├── schemas/               # Pydantic data validation
│   │   └── services/              # Business logic & email sending
│   ├── main.py                    # Server entrypoint
│   └── requirements.txt           # Python dependencies
│
├── frontend/                      # React Vite Application
│   ├── public/                    # Static assets (including logo)
│   ├── src/
│   │   ├── assets/                # Images and SVGs
│   │   ├── components/            # Reusable UI components
│   │   ├── context/               # Global state (Auth, WebSockets)
│   │   ├── pages/                 # Full screen route views
│   │   ├── services/              # Axios API clients
│   │   ├── styles/                # Tailwind CSS globals
│   │   ├── App.jsx                # React Router setup
│   │   └── main.jsx               # React entrypoint
│   ├── tailwind.config.js         # Theme styling configuration
│   └── package.json               # Node.js dependencies
│
├── .gitignore                     # Git ignore rules
└── README.md                      # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** (v18+)
- **Python** (v3.11+)
- **Git**

### 2. Clone the Repository

```bash
git clone https://github.com/yourusername/RETRO-CHAT.git
cd RETRO-CHAT
```

### 3. Backend Setup

Navigate to the backend and initialize the virtual environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Copy the environment template and fill in your secrets (Supabase, SMTP, Cloudflare):

```bash
cp .env.example .env
```

Run the FastAPI Server:

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup

Open a new terminal, navigate to the frontend, and install dependencies:

```bash
cd frontend
npm install
```

Copy the environment template:

```bash
cp .env.example .env
```

Start the Vite Development Server:

```bash
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## 📊 Database ER Diagram

```mermaid
erDiagram
    USERS ||--o{ POSTS : creates
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ FRIENDSHIPS : requests
    POSTS ||--o{ COMMENTS : contains
    POSTS ||--o{ POST_LIKES : receives
    CONVERSATIONS ||--o{ MESSAGES : holds
  
    USERS {
        int id PK
        string email
        string username
        string password_hash
        string avatar_url
    }
    POSTS {
        int id PK
        int author_id FK
        text content
        string visibility
        timestamp created_at
    }
    MESSAGES {
        int id PK
        int conversation_id FK
        int sender_id FK
        text content
        timestamp created_at
    }
    CONVERSATIONS {
        int id PK
        string type
    }
```

<div align="center">
  <br />
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0b0b0b&height=100&section=footer" width="100%" />
</div>
