"""
OpenGig ML Service — Course Recommendation Engine
Uses TF-IDF + Cosine Similarity to recommend courses
Port: 5001
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

# ── TF-IDF from scratch (no sklearn needed) ───────────────────────────────────
import math
import re
from collections import Counter

def tokenize(text):
    """Clean and tokenize text."""
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return [w for w in text.split() if len(w) > 2]

def compute_tfidf(docs):
    """Compute TF-IDF matrix for a list of documents."""
    N = len(docs)
    if N == 0:
        return [], {}

    tokenized = [tokenize(d) for d in docs]

    # Build vocabulary
    vocab = set()
    for tokens in tokenized:
        vocab.update(tokens)
    vocab = sorted(vocab)
    word_idx = {w: i for i, w in enumerate(vocab)}

    # IDF
    idf = {}
    for word in vocab:
        df = sum(1 for tokens in tokenized if word in tokens)
        idf[word] = math.log((N + 1) / (df + 1)) + 1  # smooth

    # TF-IDF vectors
    vectors = []
    for tokens in tokenized:
        tf = Counter(tokens)
        total = max(len(tokens), 1)
        vec = [0.0] * len(vocab)
        for word, count in tf.items():
            if word in word_idx:
                vec[word_idx[word]] = (count / total) * idf[word]
        vectors.append(vec)

    return vectors, idf, word_idx

def cosine_similarity(a, b):
    """Cosine similarity between two vectors."""
    dot   = sum(x * y for x, y in zip(a, b))
    normA = math.sqrt(sum(x * x for x in a))
    normB = math.sqrt(sum(y * y for y in b))
    if normA == 0 or normB == 0:
        return 0.0
    return dot / (normA * normB)

def query_vector(query_text, idf, word_idx):
    """Build a TF-IDF vector for a query string."""
    tokens = tokenize(query_text)
    tf = Counter(tokens)
    total = max(len(tokens), 1)
    vec = [0.0] * len(word_idx)
    for word, count in tf.items():
        if word in word_idx:
            vec[word_idx[word]] = (count / total) * idf.get(word, 1.0)
    return vec


# ── HEALTH CHECK ──────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify({ "status": "OpenGig ML Service running ✅", "port": 5001 })


# ── RECOMMEND ─────────────────────────────────────────────────────────────────
@app.route("/recommend", methods=["POST"])
def recommend():
    """
    Input JSON:
    {
      "user_skills": ["python", "machine learning"],
      "enrolled_courses": [{ "title": "...", "description": "...", "tags": [...] }],
      "all_courses": [{ "_id": "...", "title": "...", "description": "...", "tags": [...], "category": "..." }]
    }

    Output JSON:
    { "recommendations": [{ "_id": "...", "score": 0.85, ... }] }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({ "error": "No JSON body received" }), 400

        user_skills      = data.get("user_skills", [])
        enrolled_courses = data.get("enrolled_courses", [])
        all_courses      = data.get("all_courses", [])

        if not all_courses:
            return jsonify({ "recommendations": [] })

        # Build user profile text from skills + enrolled course content
        user_profile_parts = list(user_skills)
        for c in enrolled_courses:
            user_profile_parts.append(c.get("title", ""))
            user_profile_parts.append(c.get("description", ""))
            tags = c.get("tags", [])
            if isinstance(tags, list):
                user_profile_parts.extend(tags)
            user_profile_parts.append(c.get("category", ""))

        user_profile = " ".join(str(p) for p in user_profile_parts if p)

        # Build course documents
        enrolled_ids = set(str(c.get("_id", "")) for c in enrolled_courses)

        # Filter out already enrolled
        candidate_courses = [c for c in all_courses if str(c.get("_id", "")) not in enrolled_ids]

        if not candidate_courses:
            return jsonify({ "recommendations": [] })

        # Build corpus: user profile + all candidate course docs
        course_docs = []
        for c in candidate_courses:
            tags = c.get("tags", [])
            tags_str = " ".join(tags) if isinstance(tags, list) else ""
            doc = f"{c.get('title','')} {c.get('description','')} {tags_str} {c.get('category','')}"
            course_docs.append(doc)

        all_docs = [user_profile] + course_docs

        # TF-IDF
        vectors, idf, word_idx = compute_tfidf(all_docs)
        if not vectors:
            return jsonify({ "recommendations": [] })

        user_vec    = vectors[0]
        course_vecs = vectors[1:]

        # Score each course
        scored = []
        for i, course in enumerate(candidate_courses):
            score = cosine_similarity(user_vec, course_vecs[i])
            scored.append({ **course, "score": round(score, 4) })

        # Sort by score descending
        scored.sort(key=lambda x: x["score"], reverse=True)

        # Return top 10
        top = scored[:10]

        return jsonify({ "recommendations": top })

    except Exception as e:
        print(f"Recommendation error: {e}")
        return jsonify({ "error": str(e), "recommendations": [] }), 500


# ── SIMILAR COURSES ───────────────────────────────────────────────────────────
@app.route("/similar", methods=["POST"])
def similar():
    """Find courses similar to a given course."""
    try:
        data = request.get_json()
        source_course = data.get("course", {})
        all_courses   = data.get("all_courses", [])

        if not source_course or not all_courses:
            return jsonify({ "similar": [] })

        source_text = f"{source_course.get('title','')} {source_course.get('description','')} {' '.join(source_course.get('tags',[]))}"
        other       = [c for c in all_courses if str(c.get("_id","")) != str(source_course.get("_id",""))]

        docs = [source_text] + [
            f"{c.get('title','')} {c.get('description','')} {' '.join(c.get('tags',[]))}"
            for c in other
        ]

        vectors, _, _ = compute_tfidf(docs)
        if not vectors:
            return jsonify({ "similar": [] })

        src_vec = vectors[0]
        scored  = []
        for i, c in enumerate(other):
            score = cosine_similarity(src_vec, vectors[i+1])
            scored.append({ **c, "score": round(score, 4) })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return jsonify({ "similar": scored[:5] })

    except Exception as e:
        return jsonify({ "error": str(e), "similar": [] }), 500


if __name__ == "__main__":
    print("🤖 OpenGig ML Service starting on port 5001...")
    app.run(host="0.0.0.0", port=5001, debug=True)