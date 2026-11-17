# Task Manager frontend

The React app uses Vite and JSX. During development, Vite proxies `/tasks` requests to FastAPI on port 8000.

## Development

In one terminal, from the project root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`.

## Build and serve through FastAPI

From the project root:

```powershell
npm --prefix frontend run build
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Open `http://127.0.0.1:8000`. FastAPI serves the generated frontend from `frontend/dist`.
