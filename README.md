# The Baker's Archive

## Getting Started

### Prerequisites 

- Python
- Node.js
- npm
- Git
- Docker **or** Podman (optional)

---

### Docker Compose (recommended)

```bash
# Clone the repository
git clone https://github.com/AustinATTS/bakers-archive.git
cd bakers-archive

# Start both services
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | <http://localhost:3000> |
| Backend API | <http://localhost:8000> |

Recipe data is persisted in the `./data` directory on your host machine (mounted as a volume).

To stop the services:

```bash
docker compose down
```

---

### Manual Setup

#### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the development server (reloads on file changes)
DATA_DIR=../data uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at <http://localhost:8000>.

**Run tests**

```bash
pytest
```

#### Frontend

```bash
cd frontend

# Copy the example environment file and adjust if needed
cp .env.local.example .env.local

# Install dependencies
npm ci

# Start the development server
npm run dev
```

The UI will be available at <http://localhost:3000>.

**Build for production**

```bash
npm run build
npm start
```

---

### Environment Variables

#### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_DIR` | `./data` | Path to the directory where recipe data is stored |

#### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL of the backend API |

---

### Vercel

Placeholder for vercel