"""EduPath local tutor: topic-aware Qwen + Nomic + OpenStax-aligned RAG."""

import re
import difflib
import io
from contextlib import redirect_stdout
from datetime import datetime
from difflib import SequenceMatcher
from pathlib import Path
from collections import Counter

import numpy as np
import ollama


# ============================================================
# 1. CONFIGURATION
# ============================================================

LLM_MODEL = "qwen3:4b-instruct"
EMBEDDING_MODEL = "nomic-embed-text"
BASE_DIR = Path(__file__).resolve().parent
KNOWLEDGE_FILE = BASE_DIR / "learning_content.txt"
LEVELS = ["Beginner", "Intermediate", "Advanced"]
TOP_K = 3


# ============================================================
# 2. TOPIC ROUTING
# ============================================================

TOPIC_LABELS = {
    "linear_equations": "Linear equations",
    "multi_variable": "Equations with multiple variables",
    "equation_behavior": "No solution / infinitely many solutions",
    "systems": "Systems of equations",
    "inequalities": "Inequalities",
    "functions": "Relations and functions",
    "slope": "Slope and linear models",
    "exponents": "Exponents and powers",
    "polynomials": "Polynomials and factoring",
    "foundations": "Algebra foundations",
    "general_algebra": "General algebra",
}

TOPIC_QUERY_CUES = {
    "linear_equations": (
        "OpenStax Algebra 1 solving a linear equation in one variable; "
        "equivalent equations; properties of equality; inverse operations; "
        "isolate a variable; combine like terms; check a solution."
    ),
    "multi_variable": (
        "OpenStax Algebra 1 equation in two or more variables; "
        "express one variable in terms of another; equations in two variables; "
        "ordered pairs and relationships between variables."
    ),
    "equation_behavior": (
        "OpenStax Algebra 1 classify a linear equation as one solution, "
        "no solution, or infinitely many solutions; identity and contradiction."
    ),
    "systems": (
        "OpenStax Algebra 1 systems of linear equations; elimination method; "
        "adding equations; solving and checking ordered pairs."
    ),
    "inequalities": (
        "OpenStax Algebra 1 solving linear inequalities in one variable; "
        "addition and subtraction properties of inequality; multiplication and "
        "division by positive or negative numbers; reversing the inequality sign; "
        "solution sets and number-line graphs."
    ),
    "functions": (
        "OpenStax Algebra 1 relations and functions; inputs and outputs; "
        "function notation; evaluate a function."
    ),
    "slope": (
        "OpenStax Algebra 1 slope; rate of change; slope from two points, "
        "tables or graphs; writing linear equations."
    ),
    "exponents": (
        "OpenStax Algebra 1 exponent rules; product and quotient properties; "
        "zero exponents; negative exponents; powers of powers."
    ),
    "polynomials": (
        "OpenStax Algebra 1 polynomials; monomials, binomials, trinomials; "
        "degree; greatest common factor and factoring."
    ),
    "foundations": (
        "OpenStax Algebra 1 values, algebraic expressions, equations, "
        "relationships and constraints."
    ),
    "general_algebra": "OpenStax Algebra 1 basic algebra concepts and expressions.",
}

TWO_VARIABLE_INEQUALITY_QUERY_CUE = (
    "OpenStax Algebra 1 linear inequalities in two variables; ordered pairs; "
    "coordinate-plane solution regions; testing a point in an inequality; "
    "systems of inequalities and feasible regions."
)

# Candidate section headings for each topic. Restricting the candidate set
# prevents a high-scoring but unrelated section from dominating retrieval.
TOPIC_SECTION_HINTS = {
    "linear_equations": [
        "1.6.2 Expressing Relationships as Equations",
        "1.6.3 Exploring Related Equations",
        "Solve Linear Equations - Mini-Lesson Review",
        "1.7.1 Determining if Zero Is a Solution",
    ],
    "multi_variable": [
        "1.1.1 Understanding Value",
        "1.2.3 Writing Equations to Represent Relationships",
        "1.5.3 Examining an Equation in Two Variables and Its Graph, Part 1",
        "1.6.2 Expressing Relationships as Equations",
        "1.6.3 Exploring Related Equations",
    ],
    "equation_behavior": [
        "1.7.1 Determining if Zero Is a Solution",
        "1.7.3 Understanding Equations with No Solution or Infinitely Many",
        "1.6.3 Exploring Related Equations",
    ],
    "systems": [
        "2.4.2 Adding Equations",
        "1.5.3 Examining an Equation in Two Variables and Its Graph, Part 1",
    ],
    "inequalities": [
        "2.9.2 Graphing Inequalities",
        "2.10.5 Solving Inequalities",
        "2.11.2 Finding Solutions to Inequalities on the Coordinate Plane",
        "2.14.2 Finding a Pair of Values that Satisfies Multiple Inequalities",
    ],
    "functions": [
        "4.1.3 Examining Relations and Functions",
        "4.2.2 Interpreting Statements Written in Function Notation",
        "4.7.3 Writing Linear Equations",
    ],
    "slope": [
        "4.7.2 Finding Slope From Tables, Graphs, and Points",
        "4.7.3 Writing Linear Equations",
        "1.5.3 Examining an Equation in Two Variables and Its Graph, Part 1",
    ],
    "exponents": [
        "5.1.2 Using Product and Quotient Properties for Exponents",
        "5.1.3 Using Zero Exponent Property and Negative Exponents",
        "5.1.4 Using Power Properties for Exponents",
    ],
    "polynomials": [
        "6.1.1 Understanding Polynomials",
        "6.4.2 Finding the GCF of Two or More Expressions",
    ],
    "foundations": [
        "1.1.1 Understanding Value",
        "1.2.3 Writing Equations to Represent Relationships",
        "1.4.2 Writing Equations to Represent Constraints",
    ],
}


def is_two_variable_inequality(question):
    """Distinguish coordinate-plane/system inequalities from one-variable ones."""
    text = question.lower()
    explicit_two_variable_cues = (
        "two-variable", "two variable", "coordinate plane", "ordered pair",
        "feasible region", "system of inequalities", "systems of inequalities",
        "multiple inequalities",
    )
    if any(cue in text for cue in explicit_two_variable_cues):
        return True
    return len(count_equation_variables(text)) >= 2


def count_equation_variables(question):
    """Count common variable symbols in equation-like input, not prose words."""
    variables = set()
    for variable in "xyz":
        # Match x in 7x, or a standalone variable such as x + 2.
        if re.search(rf"(?<![a-z]){variable}(?![a-z])", question.lower()):
            variables.add(variable)
    return variables


def detect_topic(question):
    """Classify a question with lightweight rules before semantic retrieval."""
    text = question.lower()

    if any(term in text for term in (
        "infinitely many", "infinite solutions", "no solution",
        "one solution", "identity", "contradiction"
    )):
        return "equation_behavior"

    if any(term in text for term in (
        "inequality", "inequalities", "number line", "feasible region"
    )) or re.search(r"(?<![<>=])[<>]=?|[<>]=", text):
        return "inequalities"

    if any(term in text for term in (
        "slope", "rate of change", "gradient", "rise over run"
    )):
        return "slope"

    # Check polynomial language before the exponent symbol. Polynomial
    # questions commonly contain x^2, x^3, etc., but should not be routed
    # to the exponents module just because they contain a caret.
    if any(term in text for term in (
        "polynomial", "polynomials", "factoring", "factorise", "factorize",
        "greatest common factor", " gcf", "degree of the polynomial"
    )):
        return "polynomials"

    if any(term in text for term in (
        "exponent", "exponents", "power rule", "negative exponent",
        "zero exponent", "raised to", "power of"
    )) or re.search(r"\^\s*[-+]?\d", text):
        return "exponents"

    if any(term in text for term in (
        "function notation", "f(x)", "function", "relation", "input and output"
    )):
        return "functions"

    if any(term in text for term in (
        "system of equations", "systems of equations", "elimination method",
        "substitution method", "two equations", "simultaneous equations"
    )) or text.count("=") >= 2:
        return "systems"

    if "=" in text:
        variables = count_equation_variables(text)
        if len(variables) >= 2:
            return "multi_variable"
        if len(variables) == 1:
            return "linear_equations"

    if any(term in text for term in (
        "linear equation", "inverse operation", "equivalent equation",
        "isolate x", "solve for x", "solve the equation", "solve equation"
    )):
        return "linear_equations"

    if any(term in text for term in (
        "expression", "evaluate", "value of", "relationship", "constraint"
    )):
        return "foundations"

    return "general_algebra"


def get_topic_label(topic):
    return TOPIC_LABELS.get(topic, TOPIC_LABELS["general_algebra"])


# ============================================================
# 3. TOPIC-AWARE PRACTICE BANK
# Each exercise is tied to a topic, level, and answer type.
# ============================================================

PRACTICE_BANK = {
    "linear_equations": {
        "Beginner": [
            {"id": "le-b1", "question": "Solve 2x + 4 = 10. Find x.", "answer": 3, "answer_type": "numeric", "hint": "Subtract 4 from both sides, then divide by 2."},
            {"id": "le-b2", "question": "Solve x - 7 = 9. Find x.", "answer": 16, "answer_type": "numeric", "hint": "Add 7 to both sides to undo subtracting 7."},
        ],
        "Intermediate": [
            {"id": "le-i1", "question": "Solve 4x + 6 = 22. Find x.", "answer": 4, "answer_type": "numeric", "hint": "Subtract 6 from both sides, then divide by 4."},
            {"id": "le-i2", "question": "Solve 3(x + 2) = 18. Find x.", "answer": 4, "answer_type": "numeric", "hint": "Divide both sides by 3, then subtract 2."},
        ],
        "Advanced": [
            {"id": "le-a1", "question": "Solve 5x - 3 = 2x + 9. Find x.", "answer": 4, "answer_type": "numeric", "hint": "Collect variable terms on one side and constants on the other."},
            {"id": "le-a2", "question": "Solve 7x + 4 = 3x + 20. Find x.", "answer": 4, "answer_type": "numeric", "hint": "Subtract 3x from both sides, then isolate x."},
        ],
    },
    "multi_variable": {
        "Beginner": [
            {"id": "mv-b1", "question": "If y = 2x + 1 and x = 3, find y.", "answer": 7, "answer_type": "numeric", "hint": "Substitute 3 for x."},
        ],
        "Intermediate": [
            {"id": "mv-i1", "question": "Given 10x + 5y = 13y - 14x and x = 2, find y.", "answer": 6, "answer_type": "numeric", "hint": "First simplify to a relationship between x and y, then substitute x = 2."},
        ],
        "Advanced": [
            {"id": "mv-a1", "question": "Given 4x - 2y = 10x - 8y and x = 3, find y.", "answer": 3, "answer_type": "numeric", "hint": "Collect x-terms and y-terms, simplify, then substitute x = 3."},
        ],
    },
    "equation_behavior": {
        "Beginner": [
            {"id": "eb-b1", "question": "How many solutions does 2x + 4 = 2x + 4 have? Answer: one, none, or infinitely many.", "answer": ["infinitely many", "infinitely many solutions", "infinite solutions", "all real numbers"], "answer_type": "text", "hint": "Subtract 2x from both sides. Is the remaining statement always true?"},
        ],
        "Intermediate": [
            {"id": "eb-i1", "question": "How many solutions does 3x + 2 = 3x + 7 have? Answer: one, none, or infinitely many.", "answer": ["none", "no solution", "no solutions"], "answer_type": "text", "hint": "Subtract 3x from both sides and inspect the resulting number statement."},
        ],
        "Advanced": [
            {"id": "eb-a1", "question": "Classify 4(x + 2) = 4x + 8 as one solution, no solution, or infinitely many solutions.", "answer": ["infinitely many", "infinitely many solutions", "infinite solutions", "all real numbers"], "answer_type": "text", "hint": "Expand the left side and simplify. Does the result depend on x?"},
        ],
    },
    "systems": {
        "Beginner": [
            {"id": "sy-b1", "question": "For x + y = 8 and x - y = 2, find x.", "answer": 5, "answer_type": "numeric", "hint": "Add the two equations to eliminate y, then divide by 2."},
        ],
        "Intermediate": [
            {"id": "sy-i1", "question": "For x + y = 15 and x - y = 3, find x.", "answer": 9, "answer_type": "numeric", "hint": "Add the equations to eliminate y."},
        ],
        "Advanced": [
            {"id": "sy-a1", "question": "For 2x + 3y = 13 and x + y = 5, find x.", "answer": 2, "answer_type": "numeric", "hint": "Multiply the second equation by -3, add it to the first, and solve."},
        ],
    },
    "inequalities": {
        "Beginner": [
            {"id": "in-b1", "question": "Solve x + 2 > 5. Give your answer using inequality notation.", "answer": ["x>3", "x> 3"], "answer_type": "text", "hint": "Subtract 2 from both sides. The inequality direction stays the same."},
        ],
        "Intermediate": [
            {"id": "in-i1", "question": "Solve 3x - 4 <= 8. Give your answer using inequality notation.", "answer": ["x<=4", "x≤4", "x ≤ 4"], "answer_type": "text", "hint": "Add 4, then divide by positive 3. The direction stays the same."},
        ],
        "Advanced": [
            {"id": "in-a1", "question": "Solve -2x + 6 > 10. Give your answer using inequality notation.", "answer": ["x<-2", "x < -2"], "answer_type": "text", "hint": "Subtract 6, then divide by -2. Remember to reverse the inequality sign."},
        ],
    },
    "functions": {
        "Beginner": [
            {"id": "fn-b1", "question": "If f(x) = x + 2, find f(3).", "answer": 5, "answer_type": "numeric", "hint": "Replace x with 3 in the function rule."},
        ],
        "Intermediate": [
            {"id": "fn-i1", "question": "If f(x) = 2x - 5, find f(4).", "answer": 3, "answer_type": "numeric", "hint": "Substitute 4 for x and evaluate."},
        ],
        "Advanced": [
            {"id": "fn-a1", "question": "If f(x) = 3x^2 - 2, find f(-2).", "answer": 10, "answer_type": "numeric", "hint": "Substitute -2 for x. Square -2 before multiplying by 3."},
        ],
    },
    "slope": {
        "Beginner": [
            {"id": "sl-b1", "question": "Find the slope of the line through (1, 2) and (3, 6).", "answer": 2, "answer_type": "numeric", "hint": "Slope is change in y divided by change in x."},
        ],
        "Intermediate": [
            {"id": "sl-i1", "question": "Find the slope through (2, 5) and (5, 14).", "answer": 3, "answer_type": "numeric", "hint": "Calculate (14 - 5) / (5 - 2)."},
        ],
        "Advanced": [
            {"id": "sl-a1", "question": "Rewrite 4x + 2y = 8 in slope-intercept form and give the slope as a number.", "answer": -2, "answer_type": "numeric", "hint": "Isolate y, then identify the coefficient of x."},
        ],
    },
    "exponents": {
        "Beginner": [
            {"id": "ex-b1", "question": "Evaluate 2^3. Give the numerical answer.", "answer": 8, "answer_type": "numeric", "hint": "Multiply 2 by itself three times."},
        ],
        "Intermediate": [
            {"id": "ex-i1", "question": "Evaluate 2^3 * 2^2. Give the numerical answer.", "answer": 32, "answer_type": "numeric", "hint": "For powers with the same base, add the exponents."},
        ],
        "Advanced": [
            {"id": "ex-a1", "question": "Evaluate (3^2)^2 / 3^2. Give the numerical answer.", "answer": 9, "answer_type": "numeric", "hint": "Apply the power-of-a-power rule, then the quotient rule."},
        ],
    },
    "polynomials": {
        "Beginner": [
            {"id": "po-b1", "question": "What is the degree of 4x^2 + 3x + 1? Give a number.", "answer": 2, "answer_type": "numeric", "hint": "The degree is the highest exponent of x."},
        ],
        "Intermediate": [
            {"id": "po-i1", "question": "What is the degree of 5x^3 - 2x^5 + 1? Give a number.", "answer": 5, "answer_type": "numeric", "hint": "Find the largest exponent after identifying the terms."},
        ],
        "Advanced": [
            {"id": "po-a1", "question": "What is the degree of (2x^3 + 1)(x^2 + 4)? Give a number.", "answer": 5, "answer_type": "numeric", "hint": "The degree of a product is the sum of the degrees of the factors."},
        ],
    },
    "foundations": {
        "Beginner": [
            {"id": "fo-b1", "question": "Evaluate 2a + 3 when a = 4.", "answer": 11, "answer_type": "numeric", "hint": "Substitute 4 for a, then follow the order of operations."},
        ],
        "Intermediate": [
            {"id": "fo-i1", "question": "Evaluate 3a - 2b when a = 4 and b = 3.", "answer": 6, "answer_type": "numeric", "hint": "Substitute both values before calculating."},
        ],
        "Advanced": [
            {"id": "fo-a1", "question": "A relationship is c = 2n + 5. Find c when n = 7.", "answer": 19, "answer_type": "numeric", "hint": "Substitute 7 for n and simplify."},
        ],
    },
}


# ============================================================
# 4. OLLAMA CONNECTION AND MODEL CHECK
# ============================================================


def check_ollama():
    try:
        response = ollama.list()
    except Exception as exc:
        raise RuntimeError(
            "Cannot connect to Ollama. Make sure Ollama is installed and running."
        ) from exc

    installed = set()
    for item in response.models:
        name = getattr(item, "model", None) or getattr(item, "name", None)
        if name:
            installed.add(name)

    missing = [
        required for required in (LLM_MODEL, EMBEDDING_MODEL)
        if not any(name == required or name.startswith(required + ":") for name in installed)
    ]

    if missing:
        raise RuntimeError(
            "Missing Ollama model(s): " + ", ".join(missing)
            + ". Download them with 'ollama pull MODEL_NAME'."
        )

    print("\nOllama connection successful.")
    print("LLM:", LLM_MODEL)
    print("Embedding model:", EMBEDDING_MODEL)


# ============================================================
# 5. STUDENT STATE
# ============================================================


def create_student():
    return {
        "level": "Beginner",
        "correct_answers": 0,
        "incorrect_answers": 0,
        "consecutive_correct": 0,
        "consecutive_wrong": 0,
        "history": [],
        "observations": [],
        "support_needed": False,
        "practice_counts": {},
    }


# ============================================================
# 6. LOAD AND CHUNK EDUCATIONAL CONTENT
# ============================================================


def load_knowledge():
    if not KNOWLEDGE_FILE.exists():
        raise FileNotFoundError(f"Knowledge file not found: {KNOWLEDGE_FILE}")

    text = KNOWLEDGE_FILE.read_text(encoding="utf-8")
    if not text.strip():
        raise ValueError("learning_content.txt is empty.")

    print("\nKnowledge file loaded successfully.")
    return text


def create_chunks(text):
    """Split the knowledge file into sections while preserving MODULE metadata."""
    chunks = []
    current_module = "General"
    current_section = []

    def save_section():
        if current_section:
            body = current_section[0:1] + [f"MODULE: {current_module}"] + current_section[1:]
            chunks.append("\n".join(body).strip())

    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("MODULE:"):
            save_section()
            current_section = []
            current_module = stripped.split(":", 1)[1].strip() or "General"
        elif stripped.startswith("SECTION:"):
            save_section()
            current_section = [stripped]
        elif current_section:
            current_section.append(line)

    save_section()

    if not chunks:
        raise ValueError("No SECTION headings found in learning_content.txt.")

    return chunks


def get_chunk_heading(chunk):
    return next((line.strip() for line in chunk.splitlines() if line.startswith("SECTION:")), "SECTION: Unknown")


def get_chunk_module(chunk):
    match = re.search(r"(?m)^MODULE:\s*(.+)$", chunk)
    return match.group(1).strip() if match else "General"


# ============================================================
# 7. TOPIC DETECTION AND TOPIC-AWARE EMBEDDINGS
# ============================================================


def count_equation_variables(question):
    variables = set()
    lowered = question.lower()
    for variable in "xyz":
        if re.search(rf"(?<![a-z]){variable}(?![a-z])", lowered):
            variables.add(variable)
    return variables


def detect_topic(question):
    text = question.lower()

    if any(term in text for term in (
        "infinitely many", "infinite solutions", "no solution",
        "one solution", "identity", "contradiction"
    )):
        return "equation_behavior"

    if any(term in text for term in (
        "inequality", "inequalities", "number line", "feasible region"
    )) or re.search(r"(?<![<>=])[<>]=?|[<>]=", text):
        return "inequalities"

    if any(term in text for term in (
        "slope", "rate of change", "gradient", "rise over run"
    )):
        return "slope"

    # Polynomial language must be checked before caret notation because
    # polynomial expressions commonly contain x^2, x^3, and similar powers.
    if any(term in text for term in (
        "polynomial", "polynomials", "factoring", "factorise", "factorize",
        "greatest common factor", " gcf", "degree of the polynomial"
    )):
        return "polynomials"

    if any(term in text for term in (
        "exponent", "exponents", "power rule", "negative exponent",
        "zero exponent", "raised to", "power of"
    )) or re.search(r"\^\s*[-+]?\d", text):
        return "exponents"

    if any(term in text for term in (
        "function notation", "f(x)", "function", "relation", "input and output"
    )):
        return "functions"

    if any(term in text for term in (
        "system of equations", "systems of equations", "elimination method",
        "substitution method", "two equations", "simultaneous equations"
    )) or text.count("=") >= 2:
        return "systems"

    if "=" in text:
        if len(count_equation_variables(text)) >= 2:
            return "multi_variable"
        if len(count_equation_variables(text)) == 1:
            return "linear_equations"

    if any(term in text for term in (
        "linear equation", "inverse operation", "equivalent equation",
        "isolate x", "solve for x", "solve the equation", "solve equation"
    )):
        return "linear_equations"

    if any(term in text for term in (
        "expression", "evaluate", "value of", "relationship", "constraint"
    )):
        return "foundations"

    return "general_algebra"


def generate_document_embeddings(chunks):
    print("\nGenerating local document embeddings...")
    inputs = [f"search_document: {chunk}" for chunk in chunks]
    response = ollama.embed(model=EMBEDDING_MODEL, input=inputs)

    if not response.embeddings:
        raise RuntimeError("Document embedding generation returned no vectors.")

    vectors = np.asarray(response.embeddings, dtype=np.float32)
    if vectors.ndim != 2 or vectors.shape[0] != len(chunks):
        raise RuntimeError("Document embedding matrix has an unexpected shape.")

    return vectors


def generate_query_embedding(question, topic):
    if topic == "inequalities" and is_two_variable_inequality(question):
        cue = TWO_VARIABLE_INEQUALITY_QUERY_CUE
    else:
        cue = TOPIC_QUERY_CUES.get(topic, TOPIC_QUERY_CUES["general_algebra"])
    query_text = f"search_query: {cue} Student question: {question}"

    response = ollama.embed(
        model=EMBEDDING_MODEL,
        input=query_text
    )

    if not response.embeddings:
        raise RuntimeError("Question embedding generation returned no vector.")

    return np.asarray(response.embeddings[0], dtype=np.float32)


# ============================================================
# 8. TOPIC-AWARE SEMANTIC RETRIEVAL
# ============================================================


def cosine_similarity(query_vector, document_vectors):
    query_norm = np.linalg.norm(query_vector)
    document_norms = np.linalg.norm(document_vectors, axis=1)

    if query_norm == 0 or np.any(document_norms == 0):
        raise ValueError("Cannot calculate similarity with a zero vector.")

    return np.dot(document_vectors, query_vector) / (document_norms * query_norm)


def get_topic_candidate_indices(chunks, topic, question=""):
    if topic == "inequalities":
        if question and is_two_variable_inequality(question):
            hints = [
                "2.11.2 Finding Solutions to Inequalities on the Coordinate Plane",
                "2.14.2 Finding a Pair of Values that Satisfies Multiple Inequalities",
            ]
        else:
            hints = [
                "2.9.2 Graphing Inequalities",
                "2.10.5 Solving Inequalities",
            ]
    else:
        hints = TOPIC_SECTION_HINTS.get(topic, [])

    hints = [hint.casefold() for hint in hints]
    if not hints:
        return list(range(len(chunks)))

    matches = []
    for index, chunk in enumerate(chunks):
        heading = get_chunk_heading(chunk).casefold()
        if any(hint in heading for hint in hints):
            matches.append(index)

    # For inequalities, an empty match is meaningful: do not retrieve unrelated
    # coordinate-plane or algebra sections and imply that they support the answer.
    if topic == "inequalities":
        return matches

    # Preserve the existing fallback for the other topics.
    return matches if matches else list(range(len(chunks)))


def search_knowledge(question, chunks, vectors, top_k=TOP_K):
    topic = detect_topic(question)
    query_vector = generate_query_embedding(question, topic)

    if query_vector.shape[0] != vectors.shape[1]:
        raise ValueError(
            "Query and document embedding dimensions differ. "
            "Regenerate document embeddings using the same model."
        )

    scores = cosine_similarity(query_vector, vectors)
    candidate_indices = get_topic_candidate_indices(chunks, topic, question)
    candidate_scores = [(index, float(scores[index])) for index in candidate_indices]
    candidate_scores.sort(key=lambda pair: pair[1], reverse=True)

    selected = candidate_scores[:min(top_k, len(candidate_scores))]
    results = []

    print("\nDetected topic:", get_topic_label(topic))
    print(
        f"Topic-aware search: {len(candidate_indices)} candidate section(s) "
        f"from {len(chunks)} total section(s)."
    )
    print("\n--- RETRIEVED KNOWLEDGE ---")

    for index, score in selected:
        heading = get_chunk_heading(chunks[index])
        result = {
            "content": chunks[index],
            "score": score,
            "heading": heading,
            "module": get_chunk_module(chunks[index]),
            "topic": topic,
        }
        results.append(result)
        print(f"\nSimilarity: {score:.4f}")
        print(heading)

    return results, topic


# ============================================================
# 9. QUESTION-SPECIFIC FEEDBACK CLASSIFICATION
# ============================================================


def is_self_critical(text):
    words = re.findall(r"[a-z]+", text.lower())
    negative_labels = ["foolish", "stupid", "idiot", "dumb", "useless", "worthless"]
    return any(
        word in negative_labels
        or any(SequenceMatcher(None, word, label).ratio() >= 0.82 for label in negative_labels)
        for word in words
    )


def classify_feedback(feedback):
    text = feedback.lower()

    if is_self_critical(text):
        return "emotional_support"

    rules = [
        ("inverse_operations", ("why add", "why subtract", "inverse", "opposite operation", "cancel", "undo", "plus", "minus", "negative sign", "positive sign")),
        ("coefficient_and_isolation", ("divide", "division", "multiply", "multiplication", "coefficient", "isolate", "get x alone")),
        ("variables_on_both_sides", ("variable on both sides", "both sides have x", "collect x terms", "move the x terms")),
        ("distribution", ("distributive", "expand brackets", "expand the bracket")),
        ("arithmetic", ("calculation", "arithmetic", "adding numbers", "subtracting numbers", "multiplication table")),
        ("equality_and_balancing", ("balance", "equal sign", "equals", "same operation")),
        ("inequality_sign", ("inequality sign", "flip the sign", "sign flip", "sign flips", "reverse the sign", "reverse the inequality", "greater than", "less than")),
        ("function_notation", ("function notation", "f of x", "input", "output")),
        ("slope_interpretation", ("slope", "gradient", "rate of change")),
        ("exponent_rules", ("exponent", "power rule", "negative power", "zero power")),
        ("polynomial_concepts", ("polynomial", "degree", "factor", "gcf", "common factor")),
        ("equation_classification", ("no solution", "infinite solution", "infinitely many", "one solution", "identity")),
    ]

    for category, terms in rules:
        if any(term in text for term in terms):
            return category

    return "unclassified"


def record_feedback(student, related_question, stage, feedback, topic):
    feedback = feedback.strip()
    if not feedback:
        return "none"

    category = classify_feedback(feedback)
    record = {
        "question": related_question,
        "stage": stage,
        "topic": topic,
        "category": category,
    }

    if category == "emotional_support":
        student["support_needed"] = True
        record["note"] = "Student expressed frustration; respond supportively."
        student["observations"].append(record)
        student["observations"] = student["observations"][-12:]
        print("EduPath: You are not foolish. Learning takes practice; let's work through it together.")
        return category

    record["note"] = (
        "Feedback received; no specific misconception inferred."
        if category == "unclassified"
        else feedback
    )
    student["observations"].append(record)
    student["observations"] = student["observations"][-12:]
    return category


# ============================================================
# 10. TOPIC-SCOPED STUDENT MEMORY
# ============================================================


def get_student_memory(student, topic=None):
    parts = []

    history = student["history"][-4:]
    if history:
        parts.append("RECENT PRACTICE RESULTS:")
        for item in history:
            status = "correct" if item["correct"] else "incorrect"
            parts.append(
                f"- Topic: {get_topic_label(item.get('topic', 'general_algebra'))}; "
                f"practice: {item['question']}; answer: {item['answer']}; "
                f"result: {status}; level: {item['level']}"
            )

    observations = student["observations"]
    if topic:
        observations = [
            item for item in observations
            if item.get("topic") == topic
        ]

    if observations:
        parts.append("FEEDBACK RELEVANT TO THIS TOPIC:")
        for item in observations[-5:]:
            parts.append(
                f"- Related {item['stage']} question: {item['question']} | "
                f"Topic: {get_topic_label(item.get('topic', 'general_algebra'))} | "
                f"Category: {item['category']} | Note: {item['note']}"
            )

    return "\n".join(parts) if parts else "No relevant previous learning history."


def get_learning_needs(student, topic=None):
    observations = student["observations"]
    if topic:
        observations = [item for item in observations if item.get("topic") == topic]

    categories = [
        item["category"] for item in observations
        if item["category"] not in ("emotional_support", "unclassified")
    ]
    counts = Counter(categories)
    if not counts:
        return "No specific misconception identified for this topic yet."

    return "\n".join(
        f"- {category.replace('_', ' ')} (observed {count} time(s))"
        for category, count in counts.most_common(4)
    )


# ============================================================
# 11. PERSONALIZED QWEN TUTOR
# ============================================================


def generate_tutor_response(question, retrieved_chunks, student, topic):
    context = "\n\n".join(item["content"] for item in retrieved_chunks)
    source_headings = "\n".join(item["heading"] for item in retrieved_chunks)
    memory = get_student_memory(student, topic)
    learning_needs = get_learning_needs(student, topic)

    level_instructions = {
        "Beginner": "Use simple words, relatable analogies and short steps. Explain why each operation is performed.",
        "Intermediate": "Explain the mathematical idea and show complete logical working. Address relevant previous difficulties without over-explaining basics.",
        "Advanced": "Use formal mathematical reasoning, verification and general rules where relevant.",
    }

    supportive_instruction = ""
    if student["support_needed"]:
        supportive_instruction = (
            "The student recently expressed frustration. Be calm, kind and encouraging. "
            "Never repeat or agree with negative self-descriptions."
        )

    prompt = f"""
You are EduPath, a personalized mathematics tutor.

DETECTED TOPIC: {get_topic_label(topic)}
STUDENT LEVEL: {student['level']}
TEACHING STYLE: {level_instructions[student['level']]}

CURRENT STUDENT QUESTION:
{question}

RETRIEVED EDUCATIONAL MATERIAL:
{context}

RECENT STUDENT MEMORY RELEVANT TO THIS TOPIC:
{memory}

IDENTIFIED LEARNING NEEDS FOR THIS TOPIC:
{learning_needs}

FEW-SHOT TEACHING PATTERNS:
1. If a beginner adds when they should subtract, explain inverse operations with a balance analogy.
2. If a student stops at 2x = 10, explain that division is still needed to isolate x.
3. If a student understands basic steps, explain why applying the same operation to both sides preserves equality.

RULES:
- Solve or explain the exact question the student typed. Do not replace it with another equation.
- Repeat the student's original equation accurately before solving it, when an equation is provided.
- For equations with multiple variables, distinguish simplifying a relationship from finding a unique numerical solution.
- If one equation contains two independent variables, explain when a unique pair cannot be determined.
- Use retrieved material when relevant, but do not force irrelevant passages into the answer.
- If retrieved material does not cover the question, say that the local knowledge base has limited coverage and distinguish general mathematical reasoning from retrieved content.
- Use student feedback only when it belongs to this same topic.
- A learning-need observation is a support target, not proof that the student made a particular past error.
- Never claim that the student previously gave a specific answer, made a specific mistake, or used a specific step unless that exact event is present in RECENT STUDENT MEMORY.
- If memory contains no actual prior answer, use neutral wording such as "Let's focus on..." rather than "You previously...".
- Do not treat emotional or self-critical comments as mathematical misconceptions.
- Do not invent sources or claim that a source supports something it does not say.
- For a one-variable inequality, explain the full solution set, not just one example value.
- When multiplying or dividing an inequality by a negative number, reverse the inequality sign and explain why with an order example such as 2 < 5 becoming -2 > -5 after multiplying by -1.
- Do not reverse the sign when adding, subtracting, or multiplying/dividing by a positive number.
- Check arithmetic and algebra before presenting the final result.
- {supportive_instruction}

OUTPUT FORMAT:
1. CONCEPT
2. PERSONALIZED EXPLANATION
3. SOLUTION TO THE EXACT QUESTION
4. VERIFICATION, when applicable
5. SOURCES (use only relevant retrieved headings):
{source_headings}

Do not create a practice question in this response. The application will provide a separate, topic-matched exercise.
"""

    response = ollama.chat(
        model=LLM_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are EduPath, an accurate, patient mathematics tutor. Prioritize correctness and clear reasoning.",
            },
            {"role": "user", "content": prompt},
        ],
        options={"temperature": 0.2, "num_ctx": 4096},
    )

    answer = response.message.content or ""
    answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
    if not answer:
        raise RuntimeError("Qwen returned an empty response.")

    student["support_needed"] = False
    return answer


# ============================================================
# 12. TOPIC-AWARE PRACTICE AND ANSWER CHECKING
# ============================================================


def get_next_practice(student, topic):
    selected_topic = topic if topic in PRACTICE_BANK else "linear_equations"
    level = student["level"]
    exercises = PRACTICE_BANK[selected_topic][level]

    # Rotate independently for each topic and level.
    counter_key = f"{selected_topic}:{level}"
    index = student["practice_counts"].get(counter_key, 0) % len(exercises)
    student["practice_counts"][counter_key] = index + 1

    practice = dict(exercises[index])
    practice["topic"] = selected_topic
    practice["level"] = level
    return practice


def normalize_text_answer(text):
    normalized = text.lower().strip()
    normalized = normalized.replace("≤", "<=").replace("≥", ">=")
    normalized = normalized.replace("−", "-")
    normalized = re.sub(r"\s+", "", normalized)
    normalized = normalized.rstrip(".!?")
    return normalized


def parse_numeric_answer(answer):
    """Accept only a number or x=value, not algebraic expressions such as 3x."""
    text = answer.strip().replace("$", "")
    number_pattern = r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)"

    explicit_x = re.fullmatch(rf"x\s*=\s*({number_pattern})", text, re.IGNORECASE)
    if explicit_x:
        return float(explicit_x.group(1))

    if re.fullmatch(number_pattern, text):
        return float(text)

    return None


def canonical_concept_tokens(text):
    """Normalize common spelling variants and abbreviations in short answers."""
    text = text.lower().replace("’", "'")
    tokens = re.findall(r"[a-z]+", text)

    explicit_corrections = {
        "infint": "infinite",
        "infinte": "infinite",
        "inifinite": "infinite",
        "infinet": "infinite",
        "infinitely": "infinite",
        "sol": "solutions",
        "soln": "solutions",
        "solns": "solutions",
        "soltuion": "solution",
        "soltuions": "solutions",
        "soloution": "solution",
        "soloutions": "solutions",
        "solutons": "solutions",
        "solutionss": "solutions",
        "numberss": "numbers",
    }

    vocabulary = [
        "infinite", "solution", "solutions", "many",
        "all", "real", "number", "numbers",
        "no", "none", "one", "unique",
    ]

    corrected = []
    for token in tokens:
        if token in explicit_corrections:
            corrected.append(explicit_corrections[token])
            continue

        # Only fuzzy-correct words that look like one of the key concepts.
        if len(token) >= 5:
            close = difflib.get_close_matches(
                token, vocabulary, n=1, cutoff=0.80
            )
            if close:
                corrected.append(close[0])
                continue

        corrected.append(token)

    return corrected


def classify_concept_answer(text):
    """Map equivalent short conceptual answers to a canonical category."""
    tokens = set(canonical_concept_tokens(text))

    if (
        ("infinite" in tokens and (
            "solution" in tokens or "solutions" in tokens or "many" in tokens
        ))
        or ("all" in tokens and "real" in tokens and (
            "number" in tokens or "numbers" in tokens
        ))
    ):
        return "infinite_solutions"

    if "none" in tokens or (
        "no" in tokens and (
            "solution" in tokens or "solutions" in tokens
        )
    ):
        return "no_solution"

    if ("one" in tokens or "unique" in tokens) and (
        "solution" in tokens or "solutions" in tokens
    ):
        return "one_solution"

    return None


def remove_question_echo(answer):
    """If a student pastes a question followed by an answer, keep the answer tail."""
    text = answer.strip()
    if "?" in text:
        tail = text.rsplit("?", 1)[-1].strip()
        if tail:
            return tail
        return ""
    return text


def check_student_answer(answer, practice):
    if practice["answer_type"] == "numeric":
        submitted = parse_numeric_answer(answer)
        if submitted is None:
            return None
        return abs(submitted - float(practice["answer"])) < 1e-6

    if practice["answer_type"] == "text":
        candidate = remove_question_echo(answer)
        if not candidate:
            return False

        # Keep exact matching for symbolic answers such as x<=4.
        submitted = normalize_text_answer(candidate)
        accepted = {
            normalize_text_answer(item)
            for item in practice["answer"]
        }
        if submitted in accepted:
            return True

        # Handle common equivalent phrasings and minor spelling errors.
        submitted_category = classify_concept_answer(candidate)
        expected_categories = {
            classify_concept_answer(str(item))
            for item in practice["answer"]
        }
        expected_categories.discard(None)

        if (
            submitted_category is not None
            and submitted_category in expected_categories
        ):
            return True

        # Do not fuzzy-match mathematical operators: x>=4 must never
        # be accepted when the expected answer is x<=4.
        has_relation_answer = any(
            any(symbol in str(item) for symbol in ("<", ">", "≤", "≥"))
            for item in practice["answer"]
        )
        if has_relation_answer:
            return False

        # General fuzzy phrase fallback is only used for ordinary prose.
        candidate_tokens = canonical_concept_tokens(candidate)
        candidate_text = " ".join(candidate_tokens)
        for item in practice["answer"]:
            expected_text = " ".join(canonical_concept_tokens(str(item)))
            if expected_text and SequenceMatcher(
                None, candidate_text, expected_text
            ).ratio() >= 0.90:
                return True

        return False

    raise ValueError(f"Unsupported answer type: {practice['answer_type']}")


# ============================================================
# 13. FEEDBACK-BASED ADAPTATION
# ============================================================


def update_student_profile(student, practice, answer, correct, feedback_category=None):
    previous_level = student["level"]

    if correct:
        student["correct_answers"] += 1
        student["consecutive_correct"] += 1
        student["consecutive_wrong"] = 0
    else:
        student["incorrect_answers"] += 1
        student["consecutive_wrong"] += 1
        student["consecutive_correct"] = 0

    student["history"].append({
        "question": practice["question"],
        "answer": answer,
        "correct": correct,
        "level": previous_level,
        "topic": practice["topic"],
        "feedback_category": feedback_category,
    })
    student["history"] = student["history"][-12:]

    current_index = LEVELS.index(previous_level)

    if student["consecutive_correct"] >= 2:
        if current_index < len(LEVELS) - 1:
            student["level"] = LEVELS[current_index + 1]
            print(f"\nEduPath: Excellent progress! Difficulty increased to {student['level']}.")
        else:
            print("\nEduPath: Excellent! You are performing well at Advanced level.")
        student["consecutive_correct"] = 0

    elif student["consecutive_wrong"] >= 2:
        if current_index > 0:
            student["level"] = LEVELS[current_index - 1]
            print(f"\nEduPath: Let's strengthen the basics. Difficulty changed to {student['level']}.")
        else:
            print("\nEduPath: Let's practise the fundamentals with smaller steps.")
        student["consecutive_wrong"] = 0


# ============================================================
# 14. STUDENT PROGRESS
# ============================================================


def show_student_profile(student):
    total = student["correct_answers"] + student["incorrect_answers"]
    accuracy = student["correct_answers"] / total * 100 if total else 0.0

    print("\n========== STUDENT PROFILE ==========")
    print("Current level:", student["level"])
    print("Correct answers:", student["correct_answers"])
    print("Incorrect answers:", student["incorrect_answers"])
    print(f"Practice accuracy: {accuracy:.1f}%")
    print("Correct streak:", student["consecutive_correct"])
    print("Incorrect streak:", student["consecutive_wrong"])

    print("\nLearning needs:")
    categories = [
        item["category"] for item in student["observations"]
        if item["category"] not in ("emotional_support", "unclassified")
    ]
    counts = Counter(categories)
    if counts:
        for category, count in counts.most_common(5):
            print(f"- {category.replace('_', ' ')}: {count} observation(s)")
    else:
        print("No specific mathematical misconception identified yet.")

    if student["observations"]:
        print("\nRecent question-specific feedback:")
        for item in student["observations"][-4:]:
            print(
                f"- [{item['stage']}] [{get_topic_label(item['topic'])}] "
                f"{item['question']}: {item['category']}"
            )

    print("=====================================")


# ============================================================
# 15. PERSONALIZATION DEMO
# ============================================================


def run_personalization_demo(chunks, vectors):
    question = "Explain how to solve 2x + 4 = 14 and why inverse operations are used."
    results, topic = search_knowledge(question, chunks, vectors)

    profiles = []

    beginner = create_student()
    beginner["observations"].append({
        "question": "3x + 5 = 20",
        "stage": "practice",
        "topic": "linear_equations",
        "category": "inverse_operations",
        "note": "Student added 5 instead of subtracting 5.",
    })
    profiles.append(beginner)

    intermediate = create_student()
    intermediate["level"] = "Intermediate"
    intermediate["observations"].append({
        "question": "3x + 5 = 20",
        "stage": "practice",
        "topic": "linear_equations",
        "category": "coefficient_and_isolation",
        "note": "Student stopped at 3x = 15 and did not divide by 3.",
    })
    profiles.append(intermediate)

    advanced = create_student()
    advanced["level"] = "Advanced"
    advanced["correct_answers"] = 3
    profiles.append(advanced)

    for profile in profiles:
        print("\n" + "=" * 60)
        print("STUDENT LEVEL:", profile["level"])
        print("=" * 60)
        print(generate_tutor_response(question, results, profile, topic))

    print("\nThree-level personalization demo completed.")


# ============================================================
# 16. INTERACTIVE TUTORING SESSION
# ============================================================


def interactive_tutor(chunks, vectors):
    student = create_student()

    print("\n======================================")
    print("       EDUPATH PERSONALIZED TUTOR")
    print("======================================")
    print("Starting level: Beginner")
    print("Type 'profile' to see learning progress.")
    print("Type 'exit' to finish.")

    while True:
        print("\n" + "-" * 50)
        question = input("\nStudent question: ").strip()

        if question.lower() == "exit":
            break
        if question.lower() == "profile":
            show_student_profile(student)
            continue
        if not question:
            continue

        try:
            # A. Detect the topic and retrieve from relevant sections.
            results, topic = search_knowledge(question, chunks, vectors)

            # B. Answer the student's actual question.
            print("\n========== EDUPATH TUTOR ==========")
            print(generate_tutor_response(question, results, student, topic))

            # C. Collect feedback specifically about the main explanation.
            main_feedback = input(
                "\nWas any step in this explanation confusing? "
                "(optional; press Enter to skip): "
            ).strip()
            if main_feedback:
                category = record_feedback(
                    student,
                    related_question=question,
                    stage="main explanation",
                    feedback=main_feedback,
                    topic=topic,
                )
                if category not in ("emotional_support", "unclassified"):
                    print("EduPath: I'll use this feedback for this topic.")

            # D. Select a separate practice exercise from the SAME topic.
            practice = get_next_practice(student, topic)
            print("\n========== SEPARATE PRACTICE QUESTION ==========")
            print("Topic:", get_topic_label(practice["topic"]))
            print("Level:", practice["level"])
            print("This is a new exercise, separate from your original question.")
            print("Practice:", practice["question"])
            print("Hint:", practice["hint"])

            student_answer = input(
                "\nEnter your answer for THIS practice question "
                "(or type 'skip'): "
            ).strip()

            if student_answer.lower() in ("skip", ""):
                print("Practice skipped. No progress recorded.")
                continue

            correct = check_student_answer(student_answer, practice)
            while correct is None:
                example = "a number or x=value" if practice["answer_type"] == "numeric" else "the requested text or inequality"
                student_answer = input(
                    f"Please enter {example}, or type 'skip': "
                ).strip()
                if student_answer.lower() == "skip":
                    break
                correct = check_student_answer(student_answer, practice)

            if student_answer.lower() == "skip":
                print("Practice skipped. No progress recorded.")
                continue

            feedback_category = None
            if correct:
                print("\nCorrect! Excellent work.")
            else:
                print("\nNot quite. Expected answer:", practice["answer"])
                practice_feedback = input(
                    "Which step in THIS practice question was difficult? "
                    "(optional): "
                ).strip()
                if practice_feedback:
                    feedback_category = record_feedback(
                        student,
                        related_question=practice["question"],
                        stage="practice question",
                        feedback=practice_feedback,
                        topic=practice["topic"],
                    )

            # E. Update progress and adaptive difficulty.
            update_student_profile(
                student=student,
                practice=practice,
                answer=student_answer,
                correct=correct,
                feedback_category=feedback_category,
            )
            show_student_profile(student)

        except Exception as exc:
            print("\nTutoring error:", exc)

    print("\nTutoring session completed.")
    show_student_profile(student)


# ============================================================
# 17. EVALUATION SUITE
# Tests routing, retrieval, answer validation, memory and adaptation.
# This evaluates the pipeline; tutor response quality still needs
# a separate human review against a reference solution/rubric.
# ============================================================

EVALUATION_CASES = [
    {
        "name": "Linear equation",
        "question": "Solve 7x + 3 = 24.",
        "topic": "linear_equations",
        "expected_headings": ["Solve Linear Equations - Mini-Lesson Review", "1.6.3 Exploring Related Equations"],
    },
    {
        "name": "Equation behaviour",
        "question": "What happens when an equation has infinitely many solutions?",
        "topic": "equation_behavior",
        "expected_headings": ["1.7.3 Understanding Equations with No Solution or Infinitely Many"],
    },
    {
        "name": "Multiple variables",
        "question": "Rearrange 10x + 5y = 13y - 14x to express y in terms of x.",
        "topic": "multi_variable",
        "expected_headings": ["1.5.3 Examining an Equation in Two Variables", "1.6.2 Expressing Relationships as Equations"],
    },
    {
        "name": "Systems of equations",
        "question": "Solve the system x + y = 8 and x - y = 2 using elimination.",
        "topic": "systems",
        "expected_headings": ["2.4.2 Adding Equations"],
    },
    {
        "name": "One-variable inequalities",
        "question": "Solve x + 2 > 5.",
        "topic": "inequalities",
        "expected_headings": ["2.10.5 Solving Inequalities"],
    },
    {
        "name": "Two-variable inequalities",
        "question": "Does the ordered pair (2, 3) satisfy x + y <= 8?",
        "topic": "inequalities",
        "expected_headings": ["2.11.2 Finding Solutions to Inequalities on the Coordinate Plane"],
    },
    {
        "name": "Functions",
        "question": "If f(x) = 2x - 5, find f(4).",
        "topic": "functions",
        "expected_headings": ["4.1.3 Examining Relations and Functions", "4.2.2 Interpreting Statements Written in Function Notation"],
    },
    {
        "name": "Slope",
        "question": "Find the slope of the line through (1, 2) and (3, 6).",
        "topic": "slope",
        "expected_headings": ["4.7.2 Finding Slope From Tables, Graphs, and Points"],
    },
    {
        "name": "Exponents",
        "question": "Evaluate 2^3 * 2^2 using exponent rules.",
        "topic": "exponents",
        "expected_headings": ["5.1.2 Using Product and Quotient Properties for Exponents"],
    },
    {
        "name": "Polynomials",
        "question": "Find the degree of the polynomial 4x^2 + 3x + 1.",
        "topic": "polynomials",
        "expected_headings": ["6.1.1 Understanding Polynomials"],
    },
    {
        "name": "Algebra foundations",
        "question": "Evaluate 2a + 3 when a = 4.",
        "topic": "foundations",
        "expected_headings": ["1.1.1 Understanding Value", "1.2.3 Writing Equations to Represent Relationships"],
    },
]


def evaluate_topic_routing():
    passed = 0
    failures = []
    for case in EVALUATION_CASES:
        actual = detect_topic(case["question"])
        if actual == case["topic"]:
            passed += 1
        else:
            failures.append((case["name"], case["topic"], actual))
    return passed, len(EVALUATION_CASES), failures


def evaluate_retrieval(chunks, vectors, top_k=TOP_K):
    """Run real local Nomic query embeddings and measure expected-section Hit@k."""
    outcomes = []

    for case in EVALUATION_CASES:
        topic = detect_topic(case["question"])
        query_vector = generate_query_embedding(case["question"], topic)

        if query_vector.shape[0] != vectors.shape[1]:
            raise ValueError(
                "Embedding dimensions differ during evaluation. Rebuild document vectors."
            )

        scores = cosine_similarity(query_vector, vectors)
        candidate_indices = get_topic_candidate_indices(chunks, topic, case["question"])
        ranked = sorted(
            candidate_indices,
            key=lambda index: float(scores[index]),
            reverse=True
        )[:min(top_k, len(candidate_indices))]

        returned_headings = [get_chunk_heading(chunks[index]) for index in ranked]
        hit = any(
            expected_fragment.casefold() in heading.casefold()
            for expected_fragment in case["expected_headings"]
            for heading in returned_headings
        )

        outcomes.append({
            "name": case["name"],
            "topic_ok": topic == case["topic"],
            "hit": hit,
            "expected": case["expected_headings"],
            "returned": returned_headings,
        })

    hits = sum(1 for outcome in outcomes if outcome["hit"])
    return hits, len(outcomes), outcomes


def evaluate_answer_checker():
    tests = [
        ("numeric exact", "3", {"answer_type": "numeric", "answer": 3}, True),
        ("numeric x=value", "x=3", {"answer_type": "numeric", "answer": 3}, True),
        ("reject expression", "3x", {"answer_type": "numeric", "answer": 3}, None),
        ("reject wrong number", "4", {"answer_type": "numeric", "answer": 3}, False),
        ("concept spelling tolerance", "infinte soltuions", {"answer_type": "text", "answer": ["infinitely many", "infinitely many solutions", "infinite solutions", "all real numbers"]}, True),
        ("concept accepted phrase", "all real numbers", {"answer_type": "text", "answer": ["infinitely many", "all real numbers"]}, True),
        ("reject wrong concept", "no solution", {"answer_type": "text", "answer": ["infinitely many", "all real numbers"]}, False),
        ("inequality accepted", "x<=4", {"answer_type": "text", "answer": ["x<=4", "x≤4"]}, True),
        ("inequality direction rejected", "x>=4", {"answer_type": "text", "answer": ["x<=4", "x≤4"]}, False),
    ]

    results = []
    for name, submitted, practice, expected in tests:
        actual = check_student_answer(submitted, practice)
        results.append((name, actual == expected, actual, expected))

    passed = sum(1 for item in results if item[1])
    return passed, len(results), results


def evaluate_practice_rotation():
    student = create_student()
    first = get_next_practice(student, "linear_equations")
    second = get_next_practice(student, "linear_equations")
    passed = first["id"] != second["id"]
    return passed, first["id"], second["id"]


def evaluate_adaptation():
    student = create_student()
    practice = {
        "question": "Evaluation exercise",
        "topic": "linear_equations",
        "level": "Beginner",
    }

    update_student_profile(student, practice, "correct", True)
    first_level = student["level"]
    update_student_profile(student, practice, "correct", True)
    promoted_level = student["level"]

    update_student_profile(student, practice, "wrong", False)
    update_student_profile(student, practice, "wrong", False)
    demoted_level = student["level"]

    passed = (
        first_level == "Beginner"
        and promoted_level == "Intermediate"
        and demoted_level == "Beginner"
    )
    return passed, first_level, promoted_level, demoted_level


def evaluate_memory_fidelity():
    """Ensure seeded evaluation needs do not fabricate a previous student answer."""
    case = TUTOR_QUALITY_CASES[1]
    student = build_evaluation_student("Intermediate", case)
    passed = (
        student["history"] == []
        and len(student["observations"]) == 1
        and student["observations"][0]["stage"] == "seeded evaluation history"
    )
    return passed, len(student["history"]), len(student["observations"])


def evaluate_feedback_classification():
    tests = [
        ("why add 7?", "inverse_operations"),
        ("I am foolisj", "emotional_support"),
        ("I don't understand", "unclassified"),
        ("I do not understand why the sign flips", "inequality_sign"),
    ]
    outcomes = []
    for text, expected in tests:
        actual = classify_feedback(text)
        outcomes.append((text, actual, expected, actual == expected))
    passed = sum(1 for item in outcomes if item[3])
    return passed, len(outcomes), outcomes


def run_evaluation_suite(chunks, vectors):
    print("\n======================================")
    print("       EDUPATH EVALUATION SUITE")
    print("======================================")
    print("This evaluates topic routing, retrieval, answer checking,")
    print("practice rotation, feedback classification, adaptation and memory fidelity.")
    print("It does not automatically grade the quality of generated prose.\n")

    total_passed = 0
    total_checks = 0

    # 1. Topic routing
    routing_passed, routing_total, routing_failures = evaluate_topic_routing()
    total_passed += routing_passed
    total_checks += routing_total
    print(f"1. Topic routing: {routing_passed}/{routing_total} passed")
    for name, expected, actual in routing_failures:
        print(f"   FAIL {name}: expected {expected}, got {actual}")

    # 2. Real Nomic retrieval
    print("\n2. Retrieval evaluation (local Nomic embeddings)...")
    retrieval_hits, retrieval_total, retrieval_results = evaluate_retrieval(chunks, vectors)
    total_passed += retrieval_hits
    total_checks += retrieval_total
    for item in retrieval_results:
        status = "PASS" if item["hit"] else "FAIL"
        print(f"   {status} {item['name']}")
        if not item["hit"]:
            print("      Expected one of:", "; ".join(item["expected"]))
        print("      Returned:", " | ".join(item["returned"]))
    print(f"   Retrieval Hit@{TOP_K}: {retrieval_hits}/{retrieval_total}")

    # 3. Answer validation
    answer_passed, answer_total, answer_results = evaluate_answer_checker()
    total_passed += answer_passed
    total_checks += answer_total
    print(f"\n3. Answer checker: {answer_passed}/{answer_total} passed")
    for name, passed, actual, expected in answer_results:
        if not passed:
            print(f"   FAIL {name}: returned {actual}, expected {expected}")

    # 4. Practice rotation
    rotation_passed, first_id, second_id = evaluate_practice_rotation()
    total_passed += int(rotation_passed)
    total_checks += 1
    print("\n4. Practice rotation:", "PASS" if rotation_passed else "FAIL")
    print(f"   First exercise: {first_id}; second exercise: {second_id}")

    # 5. Adaptation
    adaptation_passed, initial, promoted, demoted = evaluate_adaptation()
    total_passed += int(adaptation_passed)
    total_checks += 1
    print("\n5. Adaptive difficulty:", "PASS" if adaptation_passed else "FAIL")
    print(f"   Level path: {initial} -> {promoted} -> {demoted}")

    # 6. Feedback classification
    feedback_passed, feedback_total, feedback_results = evaluate_feedback_classification()
    total_passed += feedback_passed
    total_checks += feedback_total
    print(f"\n6. Feedback classification: {feedback_passed}/{feedback_total} passed")
    for text, actual, expected, passed in feedback_results:
        if not passed:
            print(f"   FAIL '{text}': got {actual}, expected {expected}")

    # 7. Memory honesty: seeded learning needs must not invent a past answer.
    memory_passed, history_count, observation_count = evaluate_memory_fidelity()
    total_passed += int(memory_passed)
    total_checks += 1
    print("\n7. Evaluation memory fidelity:", "PASS" if memory_passed else "FAIL")
    print(f"   Seeded prior answers: {history_count}; explicit observations: {observation_count}")

    percentage = (total_passed / total_checks * 100) if total_checks else 0.0
    print("\n======================================")
    print(f"DETERMINISTIC PIPELINE SCORE: {total_passed}/{total_checks} ({percentage:.1f}%)")
    print("======================================")
    print("Interpretation:")
    print("- Topic, retrieval and answer-checker results are measured against this test set.")
    print("- The overall score is a software test pass rate, NOT model accuracy or learning gain.")
    print("- Review generated tutor explanations separately for correctness, clarity and source support.")
    print("- Improve failed retrieval cases before claiming strong RAG performance.")



# ============================================================
# 18. GENERATIVE TUTOR-QUALITY EVALUATION
# Runs the actual local Qwen tutor on 5 topics x 3 levels.
# Saves model outputs plus a human scoring sheet in one Markdown file.
# Scores must be filled after reviewing the responses; this is not
# an automatic claim of model accuracy or student learning gain.
# ============================================================

TUTOR_QUALITY_CASES = [
    {
        "name": "One-variable linear equation",
        "topic": "linear_equations",
        "question": "Solve 7x + 3 = 24.",
        "reference_answer": "x = 3. Check: 7(3) + 3 = 24.",
        "beginner_observation": ("inverse_operations", "The student sometimes adds a constant instead of using the inverse operation."),
        "intermediate_observation": ("coefficient_and_isolation", "The student can remove the constant but sometimes stops before dividing by the coefficient."),
        "advanced_observation": ("equality_and_balancing", "The student can solve the equation and should explain why each operation preserves equality."),
    },
    {
        "name": "Variables on both sides",
        "topic": "linear_equations",
        "question": "Solve 4x + 2 = 2x + 10.",
        "reference_answer": "x = 4. Subtract 2x, subtract 2, then divide by 2.",
        "beginner_observation": ("variables_on_both_sides", "The student is unsure how to collect variable terms on one side."),
        "intermediate_observation": ("coefficient_and_isolation", "The student can collect like terms but may forget the final division."),
        "advanced_observation": ("equality_and_balancing", "The student should justify equivalent transformations and verify both sides."),
    },
    {
        "name": "Linear inequality",
        "topic": "inequalities",
        "question": "Solve 3x - 4 <= 8. Express the solution using inequality notation.",
        "reference_answer": "x <= 4. Add 4 to both sides and divide by positive 3; the sign does not reverse.",
        "beginner_observation": ("inverse_operations", "The student needs practice undoing addition and subtraction in an inequality."),
        "intermediate_observation": ("inequality_sign", "The student sometimes reverses the inequality sign when dividing by a positive number."),
        "advanced_observation": ("inequality_sign", "The student should explain when and why multiplying or dividing by a negative number reverses the sign."),
    },
    {
        "name": "Product property of exponents",
        "topic": "exponents",
        "question": "Evaluate 2^3 * 2^2 and explain the exponent rule used.",
        "reference_answer": "2^5 = 32. For equal bases, add the exponents when multiplying.",
        "beginner_observation": ("exponent_rules", "The student needs to connect an exponent to repeated multiplication."),
        "intermediate_observation": ("exponent_rules", "The student sometimes multiplies exponents instead of adding them for equal bases."),
        "advanced_observation": ("exponent_rules", "The student should justify the product rule using repeated multiplication and state its conditions."),
    },
    {
        "name": "Infinitely many solutions",
        "topic": "equation_behavior",
        "question": "Classify 4(x + 2) = 4x + 8 as one solution, no solution, or infinitely many solutions. Explain why.",
        "reference_answer": "Infinitely many solutions. Expanding gives 4x + 8 = 4x + 8, an identity true for every real x.",
        "beginner_observation": ("equation_classification", "The student needs to distinguish one solution, no solution and infinitely many solutions."),
        "intermediate_observation": ("equation_classification", "The student recognizes identities but needs to explain why an identity allows every value."),
        "advanced_observation": ("equation_classification", "The student should distinguish an identity from a contradiction and a conditional equation."),
    },
]


def build_evaluation_student(level, case):
    """Create controlled, reproducible student context for one quality test."""
    student = create_student()
    student["level"] = level

    observation_key = f"{level.lower()}_observation"
    category, note = case[observation_key]
    student["observations"].append({
        "question": case["question"],
        "stage": "seeded evaluation history",
        "topic": case["topic"],
        "category": category,
        "note": note,
    })

    # The controlled profile supplies a learning-need observation only. It does
    # not pretend that a particular answer or mistake was previously observed.
    return student


def run_tutor_quality_evaluation(chunks, vectors):
    """Generate and save 15 real Qwen tutoring responses for human review."""
    report_path = BASE_DIR / "tutor_quality_evaluation.md"
    total_runs = len(TUTOR_QUALITY_CASES) * len(LEVELS)
    completed = 0

    lines = [
        "# EduPath Tutor Quality Evaluation",
        "",
        f"- Generated: {datetime.now().astimezone().isoformat(timespec='seconds')}",
        f"- LLM: `{LLM_MODEL}`",
        f"- Embeddings: `{EMBEDDING_MODEL}`",
        f"- Knowledge sections: {len(chunks)}",
        f"- Test design: {len(TUTOR_QUALITY_CASES)} topics × {len(LEVELS)} levels = {total_runs} responses",
        "",
        "> This report contains actual model outputs. It does not automatically certify their quality. Review each response against the reference answer and the retrieved sections before assigning scores.",
        "",
        "## Human scoring rubric",
        "",
        "Score each criterion from 0 to 2:",
        "- **Correctness:** 0 = incorrect; 1 = partly correct or contains a minor error; 2 = mathematically correct.",
        "- **Clarity:** 0 = confusing; 1 = understandable with gaps; 2 = clear and well structured.",
        "- **Level fit:** 0 = clearly unsuitable; 1 = partly suitable; 2 = appropriate depth and language for the stated level.",
        "- **Personalization:** 0 = ignores the seeded learning history; 1 = mentions it but does not adapt usefully; 2 = meaningfully addresses the student's stated difficulty.",
        "- **Grounding:** 0 = unsupported or misattributes sources; 1 = partly supported; 2 = uses relevant retrieved material and accurately names sources.",
        "",
        "Maximum score per response: 10. Maximum overall score: 150.",
        "",
        "## Generated responses",
        "",
    ]

    # Save a starter report before making model calls, so the output file exists
    # even if a local inference call is interrupted.
    report_path.write_text("\n".join(lines), encoding="utf-8")

    for case_index, case in enumerate(TUTOR_QUALITY_CASES, start=1):
        print(f"\nPreparing retrieval for topic {case_index}/{len(TUTOR_QUALITY_CASES)}: {case['name']}")

        # search_knowledge prints a console trace; capture it so the evaluation
        # output stays readable. The actual returned results are recorded below.
        captured = io.StringIO()
        with redirect_stdout(captured):
            retrieved, detected_topic = search_knowledge(
                case["question"], chunks, vectors, top_k=TOP_K
            )

        retrieved_headings = [item["heading"] for item in retrieved]

        for level in LEVELS:
            completed += 1
            print(f"[{completed}/{total_runs}] Generating {level} response: {case['name']}...")

            student = build_evaluation_student(level, case)
            response_text = generate_tutor_response(
                case["question"], retrieved, student, detected_topic
            )

            section = [
                f"### Response {completed}: {case['name']} — {level}",
                "",
                f"**Question:** {case['question']}",
                f"**Detected topic:** {get_topic_label(detected_topic)} (`{detected_topic}`)",
                f"**Student profile:** {level}",
                f"**Seeded learning need:** {case[level.lower() + '_observation'][1]}",
                f"**Reference answer for reviewer:** {case['reference_answer']}",
                f"**Retrieved sections:** {'; '.join(retrieved_headings) if retrieved_headings else 'None'}",
                "",
                "#### Qwen response",
                "",
                response_text,
                "",
                "---",
                "",
            ]
            lines.extend(section)
            report_path.write_text("\n".join(lines), encoding="utf-8")

    # Append a single human scoring sheet for all generated responses.
    score_lines = [
        "## Human scoring sheet",
        "",
        "Fill in each score from 0 to 2 after reading the corresponding generated response above.",
        "",
        "| # | Topic | Level | Correctness /2 | Clarity /2 | Level fit /2 | Personalization /2 | Grounding /2 | Total /10 |",
        "|---:|---|---|---:|---:|---:|---:|---:|---:|",
    ]

    row_number = 0
    for case in TUTOR_QUALITY_CASES:
        for level in LEVELS:
            row_number += 1
            score_lines.append(
                f"| {row_number} | {case['name']} | {level} |  |  |  |  |  |  |"
            )

    score_lines.extend([
        "",
        "**Scoring guidance:** A score of 0 means absent/incorrect, 1 means partly satisfactory, and 2 means fully satisfactory. Use the reference answer and retrieved section list for checking. Do not award grounding points merely because a source name appears; check that the source is actually relevant.",
        "",
        "## Summary",
        "",
        "- Responses generated: 15",
        "- Maximum possible human review score: 150",
        "- Human review completed: No",
        "- Overall quality result: Pending manual scoring",
        "",
        "The deterministic pipeline test score and this generative quality review measure different things. Do not combine them into one accuracy percentage.",
        "",
    ])

    lines.extend(score_lines)
    report_path.write_text("\n".join(lines), encoding="utf-8")

    print("\n======================================")
    print("TUTOR QUALITY GENERATION COMPLETED")
    print("======================================")
    print(f"Generated responses: {completed}/{total_runs}")
    print("Human scoring: pending")
    print("Saved report:", report_path)
    print("Open the Markdown file and score each response using the rubric.")



# ============================================================
# 19. MAIN APPLICATION
# ============================================================


def main():
    print("\n======================================")
    print("           EDUPATH AI TUTOR")
    print("======================================")

    check_ollama()

    text = load_knowledge()
    chunks = create_chunks(text)
    print("\nTotal knowledge sections:", len(chunks))

    vectors = generate_document_embeddings(chunks)
    print("Embedding matrix:", vectors.shape)
    print("\nKnowledge retrieval system ready!")

    while True:
        print("\n======================================")
        print("1. Three-level personalization demo")
        print("2. Interactive tutoring session")
        print("3. Run deterministic pipeline evaluation")
        print("4. Run tutor quality evaluation (15 Qwen responses)")
        print("5. Exit")
        print("======================================")

        choice = input("\nSelect an option: ").strip()

        try:
            if choice == "1":
                run_personalization_demo(chunks, vectors)
            elif choice == "2":
                interactive_tutor(chunks, vectors)
            elif choice == "3":
                run_evaluation_suite(chunks, vectors)
            elif choice == "4":
                run_tutor_quality_evaluation(chunks, vectors)
            elif choice == "5":
                print("\nExiting EduPath.")
                break
            else:
                print("Invalid option. Choose 1, 2, 3, 4 or 5.")
        except Exception as exc:
            print("\nApplication error:", exc)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nEduPath stopped by user.")
    except Exception as exc:
        print("\nStartup error:", exc)
