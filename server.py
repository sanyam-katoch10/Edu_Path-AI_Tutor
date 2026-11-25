"""EduPath FastAPI backend — thin wrapper around the existing app.py engine."""

import uuid
import io
import re
from contextlib import redirect_stdout
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Import the EXISTING tutoring engine — no logic is rewritten here.
# ---------------------------------------------------------------------------
from app import (
    # Startup / init
    check_ollama,
    load_knowledge,
    create_chunks,
    generate_document_embeddings,
    # Topic helpers
    detect_topic,
    get_topic_label,
    TOPIC_LABELS,
    TOPIC_SECTION_HINTS,
    PRACTICE_BANK,
    LEVELS,
    LLM_MODEL,
    EMBEDDING_MODEL,
    # Student state
    create_student,
    get_student_memory,
    get_learning_needs,
    # RAG retrieval
    search_knowledge,
    # Tutoring
    generate_tutor_response,
    # Practice
    get_next_practice,
    check_student_answer,
    update_student_profile,
    # Feedback
    record_feedback,
    classify_feedback,
    # Helpers
    get_chunk_heading,
    get_chunk_module,
)


# ===================================================================
# Pydantic Models
# ===================================================================

class AskRequest(BaseModel):
    session_id: str
    question: str

class FeedbackRequest(BaseModel):
    session_id: str
    question: str
    stage: str = "main explanation"
    feedback: str
    topic: str

class CheckAnswerRequest(BaseModel):
    session_id: str
    practice: dict[str, Any]
    answer: str

class SessionResponse(BaseModel):
    session_id: str
    student: dict[str, Any]
    created_at: str


# ===================================================================
# Application
# ===================================================================

app = FastAPI(title="EduPath API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global state — initialised once at startup
# ---------------------------------------------------------------------------
state: dict[str, Any] = {
    "chunks": [],
    "vectors": None,
    "ready": False,
}

sessions: dict[str, dict[str, Any]] = {}


# ===================================================================
# Startup
# ===================================================================

@app.on_event("startup")
def startup():
    """Load knowledge base and generate embeddings once."""
    captured = io.StringIO()
    with redirect_stdout(captured):
        check_ollama()
        text = load_knowledge()
        chunks = create_chunks(text)
        vectors = generate_document_embeddings(chunks)

    state["chunks"] = chunks
    state["vectors"] = vectors
    state["ready"] = True
    print(f"EduPath API ready — {len(chunks)} knowledge sections, embeddings {vectors.shape}")


# ===================================================================
# Helper
# ===================================================================

def get_session(session_id: str) -> dict[str, Any]:
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found. Create a new session first.")
    sessions[session_id]["last_active"] = datetime.now(timezone.utc).isoformat()
    return sessions[session_id]


def student_to_json(student: dict) -> dict:
    """Return student dict as a clean JSON-safe copy."""
    total = student["correct_answers"] + student["incorrect_answers"]
    accuracy = round(student["correct_answers"] / total * 100, 1) if total > 0 else 0.0
    topics_covered = list({
        item.get("topic", "general_algebra") for item in student["history"]
    })
    return {
        "level": student["level"],
        "correct_answers": student["correct_answers"],
        "incorrect_answers": student["incorrect_answers"],
        "accuracy": accuracy,
        "consecutive_correct": student["consecutive_correct"],
        "consecutive_wrong": student["consecutive_wrong"],
        "history": student["history"],
        "observations": student["observations"],
        "support_needed": student["support_needed"],
        "practice_counts": student["practice_counts"],
        "topics_covered": topics_covered,
    }


# ===================================================================
# Endpoints
# ===================================================================

@app.get("/api/health")
def health():
    return {
        "status": "ready" if state["ready"] else "initialising",
        "llm_model": LLM_MODEL,
        "embedding_model": EMBEDDING_MODEL,
        "knowledge_sections": len(state["chunks"]),
    }


@app.get("/api/topics")
def topics():
    return {
        "topics": {key: label for key, label in TOPIC_LABELS.items()},
        "levels": LEVELS,
    }


@app.post("/api/session")
def create_session():
    session_id = str(uuid.uuid4())
    student = create_student()
    now = datetime.now(timezone.utc).isoformat()
    sessions[session_id] = {
        "student": student,
        "created_at": now,
        "last_active": now,
        "conversations": [],
    }
    return {
        "session_id": session_id,
        "student": student_to_json(student),
        "created_at": now,
    }


@app.get("/api/session/{session_id}")
def get_session_info(session_id: str):
    session = get_session(session_id)
    return {
        "session_id": session_id,
        "student": student_to_json(session["student"]),
        "created_at": session["created_at"],
        "last_active": session["last_active"],
        "conversation_count": len(session["conversations"]),
    }


@app.post("/api/tutor/ask")
def tutor_ask(req: AskRequest):
    session = get_session(req.session_id)
    student = session["student"]
    chunks = state["chunks"]
    vectors = state["vectors"]

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Capture console output from search_knowledge
    captured = io.StringIO()
    with redirect_stdout(captured):
        results, topic = search_knowledge(req.question, chunks, vectors)

    # Generate tutor response
    response_text = generate_tutor_response(req.question, results, student, topic)

    sources = [
        {"heading": item["heading"], "score": round(item["score"], 4), "module": item["module"]}
        for item in results
    ]

    # Store in conversation history
    conversation_entry = {
        "question": req.question,
        "topic": topic,
        "topic_label": get_topic_label(topic),
        "level": student["level"],
        "response": response_text,
        "sources": sources,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    session["conversations"].append(conversation_entry)

    return {
        "response": response_text,
        "topic": topic,
        "topic_label": get_topic_label(topic),
        "level": student["level"],
        "sources": sources,
        "student": student_to_json(student),
    }


@app.post("/api/tutor/feedback")
def tutor_feedback(req: FeedbackRequest):
    session = get_session(req.session_id)
    student = session["student"]

    if not req.feedback.strip():
        return {"category": "none", "message": "No feedback provided."}

    captured = io.StringIO()
    with redirect_stdout(captured):
        category = record_feedback(
            student,
            related_question=req.question,
            stage=req.stage,
            feedback=req.feedback,
            topic=req.topic,
        )

    return {
        "category": category,
        "student": student_to_json(student),
    }


@app.get("/api/practice/{topic}")
def get_practice(topic: str, session_id: str):
    session = get_session(session_id)
    student = session["student"]

    if topic not in PRACTICE_BANK and topic != "general_algebra":
        raise HTTPException(status_code=400, detail=f"Unknown topic: {topic}")

    practice = get_next_practice(student, topic)
    return {
        "practice": {
            "id": practice["id"],
            "question": practice["question"],
            "hint": practice["hint"],
            "answer_type": practice["answer_type"],
            "topic": practice["topic"],
            "level": practice["level"],
        },
        "student_level": student["level"],
    }


@app.post("/api/practice/check")
def check_practice(req: CheckAnswerRequest):
    session = get_session(req.session_id)
    student = session["student"]

    if not req.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")

    # Reconstruct full practice dict with answer for checking
    practice_full = req.practice.copy()
    if "answer" not in practice_full or practice_full.get("answer") is None:
        target_id = practice_full.get("id")
        found = False
        for top, lvls in PRACTICE_BANK.items():
            for lvl, ex_list in lvls.items():
                for ex in ex_list:
                    if ex.get("id") == target_id:
                        practice_full = dict(ex)
                        practice_full["topic"] = top
                        practice_full["level"] = lvl
                        found = True
                        break
                if found:
                    break

    result = check_student_answer(req.answer, practice_full)

    # result can be True, False, or None (unparseable)
    if result is None:
        return {
            "result": "unparseable",
            "message": "Could not parse your answer. Try a number or the requested format.",
            "expected": practice_full.get("answer"),
            "student": student_to_json(student),
        }

    captured = io.StringIO()
    with redirect_stdout(captured):
        update_student_profile(
            student=student,
            practice=practice_full,
            answer=req.answer,
            correct=result,
        )

    return {
        "result": "correct" if result else "incorrect",
        "correct": result,
        "expected": practice_full.get("answer"),
        "student": student_to_json(student),
        "level_changed": captured.getvalue().strip() if captured.getvalue().strip() else None,
    }


@app.get("/api/library")
def get_library():
    chunks = state["chunks"]
    modules: dict[str, list] = {}

    for i, chunk in enumerate(chunks):
        module_name = get_chunk_module(chunk)
        heading = get_chunk_heading(chunk)

        # Extract metadata from chunk
        url_match = re.search(r"OPENSTAX_URL:\s*(\S+)", chunk)
        url = url_match.group(1) if url_match else None

        # Get content (strip metadata lines)
        lines = chunk.split("\n")
        content_lines = []
        skip_prefixes = ("SECTION:", "MODULE:", "OPENSTAX_BOOK:", "OPENSTAX_SECTION:", "OPENSTAX_URL:")
        for line in lines:
            stripped = line.strip()
            if stripped and not any(stripped.startswith(p) for p in skip_prefixes):
                content_lines.append(line)

        section = {
            "index": i,
            "heading": heading.replace("SECTION: ", ""),
            "module": module_name,
            "content": "\n".join(content_lines).strip(),
            "openstax_url": url,
        }

        if module_name not in modules:
            modules[module_name] = []
        modules[module_name].append(section)

    return {
        "modules": modules,
        "total_sections": len(chunks),
        "total_modules": len(modules),
    }


@app.get("/api/knowledge")
def get_knowledge():
    return {
        "total_sections": len(state["chunks"]),
        "sections": [
            {
                "index": i,
                "heading": get_chunk_heading(chunk),
                "module": get_chunk_module(chunk),
            }
            for i, chunk in enumerate(state["chunks"])
        ],
    }
