# EduPath AI Tutor: Topic-Aware RAG & Adaptive Agent

> **An intelligent, local LLM-powered mathematics tutoring agent aligned with CSE473 (Large Language Models and Agentic AI).**  
> Powered by `qwen3:4b-instruct` and `nomic-embed-text` via Ollama, grounded in OpenStax Algebra 1 with dynamic student modeling and rigorous dual-evaluation pipelines.

---

## 📌 Table of Contents
- [Project Overview](#-project-overview)
- [System Architecture & Perception-Action Cycle](#-system-architecture--perception-action-cycle)
- [Core Features](#-core-features)
- [Project Structure](#-project-structure)
- [Prerequisites & Installation](#-prerequisites--installation)
- [Usage & Menu Options](#-usage--menu-options)
- [Evaluation & Benchmark Results](#-evaluation--benchmark-results)
- [Attribution & Academic Integrity](#-attribution--academic-integrity)

---

## 📖 Project Overview

**EduPath** is a fully local, privacy-first Agentic AI tutoring system designed to assist students in mastering foundational and intermediate algebra. Rather than acting as a simple chatbot, EduPath operates as a stateful, goal-directed agent that:
1. **Perceives** user questions, emotional sentiment, and mathematical proficiency.
2. **Retrieves** verified educational material using semantic embeddings and topic-aware candidate pruning.
3. **Reasons & Formulates** personalized responses tailored to the student's current tier (Beginner, Intermediate, Advanced).
4. **Validates & Adapts** through interactive practice exercises, tracking misconceptions and dynamically modifying difficulty based on performance streaks.
5. **Evaluates** its own retrieval and generative quality through deterministic software tests and rubric-based benchmarking.


---

## 🏗 System Architecture & Perception-Action Cycle

```
                             +------------------------+
                             |   Student Question     |
                             +-----------+------------+
                                         |
                                         v
                             +------------------------+
                             |  Topic Classification  |
                             |  & Query Cue Expansion |
                             +-----------+------------+
                                         |
                                         v
+-----------------------+    +------------------------+
| OpenStax Knowledge    |--->|  Semantic Search       |
| Base (23 Sections)    |    |  (Nomic Cosine Sim)    |
+-----------------------+    +-----------+------------+
                                         |
                                         v
+-----------------------+    +------------------------+
| Student Memory &      |--->| Personalized Qwen Tutoring|
| Profile (Level/History|    | (CoT + Few-Shot Prompt)|
+-----------------------+    +-----------+------------+
                                         |
                                         v
                             +------------------------+
                             |  Tutor Explanation     |
                             +-----------+------------+
                                         |
                                         v
                             +------------------------+
                             | Topic Practice Bank    |
                             | (Numeric / Symbolic)   |
                             +-----------+------------+
                                         |
                                         v
                             +------------------------+
                             | Answer & Feedback Check|
                             +-----------+------------+
                                         |
                                         v
                             +------------------------+
                             | Dynamic State Update   |
                             | (Level Up / Demote)    |
                             +------------------------+
```

---

## ⚡ Core Features

### 1. 100% Local & Privacy-Preserving
- Uses **Ollama** running locally on your hardware.
- Language Model: `qwen3:4b-instruct` (low latency, strong algebraic reasoning).
- Embedding Model: `nomic-embed-text` (8192 context, high-density embeddings).
- No external API keys or cloud dependencies required.

### 2. Contextual RAG with Topic Routing
- **Structure-Preserving Chunking**: Parses `learning_content.txt` while maintaining `MODULE:` and `SECTION:` hierarchical metadata.
- **Asymmetric Search Prefixing**: Implements `search_document: ` and `search_query: ` cues aligned with Nomic embedding standards.
- **Topic Candidate Pruning**: Filters candidate chunks based on detected query topics (linear equations, inequalities, systems, polynomials, exponents, etc.) before computing cosine similarity, preventing false-positive semantic drift.

### 3. Topic-Scoped Student Memory & Honest Grounding
- **Pedagogical Tiers**: Adapts explanations for `Beginner` (analogies & inverse steps), `Intermediate` (logical working & common misconception fixes), and `Advanced` (formal mathematical proofs & verifications).
- **Anti-Hallucination Guardrails**: Explicit prompt rules prevent the model from fabricating student error history unless recorded in verified memory.
- **Sentiment & Emotional Support**: Detects self-critical expressions (e.g., "I'm stupid/foolish") and responds with encouraging, calm reassurance before continuing instruction.

### 4. Interactive Practice & Dynamic Adaptation
- Comprehensive practice problem bank with support for:
  - Numeric answers ($x = 3$ or $3$).
  - Symbolic inequalities ($x \le 4$, $x > 3$).
  - Conceptual classification ("infinitely many solutions", "no solution").
- **Adaptive Level Progression**: Two consecutive correct answers promote the student; two consecutive incorrect answers prompt foundational reinforcement.

### 5. Dual-Layer Evaluation Architecture
1. **Deterministic Test Suite** (Section 17): Runs 7 automated verification tests covering routing accuracy, Hit@3 retrieval rate, answer checker fuzzing, practice rotation, adaptive state transitions, and memory fidelity.
2. **Generative Quality Evaluation** (Section 18): Generates 15 end-to-end tutoring outputs across 5 core topics $\times$ 3 competency levels, evaluated against a 5-dimension rubric (Correctness, Clarity, Level fit, Personalization, Grounding).

---

## 📁 Project Structure

```text
├── app.py                                # Main application: RAG pipeline, agent state, CLI & evaluation
├── learning_content.txt                  # OpenStax-aligned Algebra 1 knowledge base (23 curated sections)
├── requirements.txt                      # Python dependencies (ollama, numpy)
├── tutor_quality_evaluation.md           # Raw generated responses & scoring sheets (15 test runs)
├── tutor_quality_evaluation_reviewed_v2.md # Evaluated rubric benchmark (Score: 147/150 - 98.0%)
└── README.md                             # Comprehensive project documentation
```

---

## 💻 Prerequisites & Installation

### 1. Prerequisites
- **Python 3.10+**
- **Ollama** installed and running on your system ([Download Ollama](https://ollama.com/download))

### 2. Pull Required Models
Open your terminal and pull the local LLM and embedding models:
```bash
ollama pull qwen3:4b-instruct
ollama pull nomic-embed-text
```

### 3. Setup Virtual Environment
```bash
# Clone or navigate to the project directory
cd z

# Create and activate virtual environment
python -m venv .venv

# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1

# On macOS/Linux:
source .venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 🚀 Usage & Menu Options

Run the main application:
```bash
python app.py
```

Upon launch, EduPath loads `learning_content.txt`, chunks the sections, computes local Nomic document embeddings, and displays the interactive menu:

```text
======================================
           EDUPATH AI TUTOR
======================================
1. Three-level personalization demo
2. Interactive tutoring session
3. Run deterministic pipeline evaluation
4. Run tutor quality evaluation (15 Qwen responses)
5. Exit
======================================
```

### Menu Options Explained:
- **`1. Three-level personalization demo`**: Demonstrates how the same question (`Solve 2x + 4 = 14`) is explained differently across Beginner, Intermediate, and Advanced profiles.
- **`2. Interactive tutoring session`**: Launches the live tutoring loop.
  - Ask any algebra question.
  - Receive a grounded, structured explanation.
  - Complete a follow-up practice problem from the same topic.
  - Special commands: type `profile` to view learning stats, `skip` to bypass practice, or `exit` to return to menu.
- **`3. Run deterministic pipeline evaluation`**: Executes automated verification for topic classification, vector retrieval Hit@3, regex answer checking, and adaptive leveling.
- **`4. Run tutor quality evaluation`**: Generates 15 responses across 5 algebra topics and 3 levels, writing the output directly to `tutor_quality_evaluation.md`.

---

## 📊 Evaluation & Benchmark Results

As documented in [`tutor_quality_evaluation_reviewed_v2.md`](file:///c:/Users/sanya/OneDrive/Desktop/z/tutor_quality_evaluation_reviewed_v2.md):

### Generative Reviewer Rubric: **147 / 150 (98.0%)**
- **Correctness**: 30 / 30 (All algebraic solutions verified mathematically).
- **Clarity**: 30 / 30 (Structured with Concept, Explanation, Solution, and Verification).
- **Level Fit**: 30 / 30 (Distinct adaptation for Beginner, Intermediate, and Advanced).
- **Personalization**: 29 / 30 (Addressed seeded learning needs without hallucinating student history).
- **Grounding**: 28 / 30 (Accurate attribution to OpenStax source sections).

### Pipeline Verification
- **Topic Routing Accuracy**: 100% on benchmark cases.
- **Retrieval Hit@3**: Knowledge-grounded queries consistently return relevant OpenStax sections.
- **Deterministic Pipeline Pass Rate**: High reliability across numeric and symbolic answer checking.

---

## ⚖ Attribution & Academic Integrity

- **Textbook Alignment**: Knowledge base materials are adapted from **OpenStax Algebra 1** (Rice University, authors: Lynn Marecek et al.).
- **Permissions & Notes**: The knowledge content consists of paraphrased, module-tagged study summaries specifically designed for semantic RAG benchmarking.
- **Course Context**: Developed for academic study and research in **CSE473: Large Language Models and Agentic AI**.
