# NoteAI Pro

NoteAI Pro is a production-grade, AI-powered note-taking application designed to revolutionize how you capture, organize, and interact with your thoughts. Built with a robust **FastAPI** backend and a dynamic **React** frontend, it seamlessly integrates advanced AI capabilities like summarization, chat, and content generation into a secure and intuitive workspace.

## 🚀 Key Features

*   **AI-Powered Intelligence**:
    *   **Text Summarization & Rewriting**: instantly condense long notes or improve writing style.
    *   **Generative AI**: Auto-generate notes from topics, expanded text, or create images and flowcharts from prompts.
    *   **Interactive Chat**: Chat with your notes for context-aware answers.
    *   **Text-to-Speech**: Listen to your notes on the go.
    *   **Auto-Tagging & Categorization**: Intelligent organization of your content.
*   **Rich Text Editing**: Full-featured editor supporting formatting, images, and more.
*   **Secure & Private**:
    *   **Privacy Mode**: Lock sensitive notes with a PIN.
    *   **JWT Authentication**: Secure login and session management.
*   **Advanced Organization**:
    *   **Hierarchical Structure**: Organize with tags, categories, and archives.
    *   **Search**: Powerful search capabilities to find anything instantly.
*   **File Management**: Upload and attach files (PDFs, Images, Audio) to your notes.
*   **Sharing & Export**:
    *   Generate shareable links for collaboration.
    *   Export notes to high-quality PDF documents.

## 🛠️ Tech Stack

### Backend
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (High-performance Async Python API)
*   **Database**: PostgreSQL (via SQLAlchemy ORM)
*   **AI Integration**: OpenRouter (GPT-4o, etc.), OpenAI, Gemini
*   **Authentication**: OAuth2 with Password hashing (Bcrypt) & JWT Tokens
*   **Validation**: Pydantic Models

### Frontend
*   **Framework**: [React](https://react.dev/) (Vite)
*   **Styling**: TailwindCSS
*   **State Management**: Zustand
*   **HTTP Client**: Axios
*   **Routing**: React Router
*   **UI Components**: Lucide Icons, React Hot Toast, Recharts

## 📋 Prerequisites

Ensure you have the following installed on your system:

*   **Python**: v3.9 or higher
*   **PostgreSQL**: v13 or higher
*   **Git**: For version control

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/NoteAIPro.git
cd NoteAIPro
```

### 2. Backend Setup

Navigate to the backend directory and set up the Python environment.

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:
*   **Windows**: `venv\Scripts\activate`
*   **macOS/Linux**: `source venv/bin/activate`

Install dependencies:
```bash
pip install -r requirements.txt
```

**Database Setup**:
Ensure your PostgreSQL server is running and create a database named `notes_ai_pro`.

**Environment Variables**:
Create a `.env` file in the `backend` directory (or root `backend/app/`) with the following key configurations:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/notes_ai_pro

# Security
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Configuration (OpenRouter Example)
OPENROUTER_API_KEY=sk-or-your-api-key
OPENROUTER_MODEL=gpt-4o-mini

# App Configuration
DEBUG=True
APP_NAME="NoteAI Pro"
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

Run Database Migrations (if using Alembic) or let the app create tables on startup:
```bash
# The app is configured to create tables automatically in main.py
# Base.metadata.create_all(bind=engine)
```

Start the Backend Server:
```bash
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.
API Documentation: `http://localhost:8000/api/docs`

### 3. Frontend Setup

Open a new terminal configuration (keep backend running) and navigate to the frontend directory.

```bash
cd frontend
```

Install Dependencies:
```bash
npm install
```

Start Development Server:
```bash
npm run dev
# or
vite
```
The application will launch at `http://localhost:5173` (or the port shown in terminal).

## 📄 API Documentation

FastAPI automatically generates interactive API documentation:
*   **Swagger UI**: `/api/docs` - Test endpoints directly in your browser.
*   **ReDoc**: `/api/redoc` - clean, easy-to-read documentation.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
<<<<<<< HEAD

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
=======
>>>>>>> 08dd53f6c2622e2cf2fc6e62ae5eff9dcca5b1ef
