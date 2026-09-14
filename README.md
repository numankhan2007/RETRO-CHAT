# Retro Chat

A privacy-first web platform combining private one-to-one chat and personal chronological blogging. 

## Local Development

### Frontend
1. `cd frontend`
2. `npm install`
3. Create `.env` from `.env.example`
4. `npm run dev`

### Backend
1. `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate virtual environment:
   - Linux/Mac: `source venv/bin/activate`
   - Windows: `venv\Scripts\activate`
4. `pip install -r requirements.txt`
5. Create `.env` from `.env.example`
6. Run server: `uvicorn app.main:app --reload`
