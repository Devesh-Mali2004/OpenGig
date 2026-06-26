from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017/")
db = client["opengig"]

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def get_all_courses():
    courses = list(db.courses.find({"isPublished": True}))
    for c in courses:
        c["_id"] = str(c["_id"])
        c["Mentor"] = str(c.get("Mentor", ""))
    return courses

def get_all_reviews():
    reviews = list(db.reviews.find({}))
    result = []
    for r in reviews:
        result.append({
            "LearnerId": str(r["Learner"]),
            "courseId":  str(r["course"]),
            "rating":    r.get("rating", 0)
        })
    return result

def get_user_enrollments(user_id):
    enrollments = list(db.enrollments.find({"Learner": ObjectId(user_id)}))
    return [str(e["course"]) for e in enrollments]


# ─────────────────────────────────────────────
# CONTENT-BASED FILTERING (TF-IDF)
# ─────────────────────────────────────────────

def content_based_scores(enrolled_course_ids, courses):
    course_ids = [c["_id"] for c in courses]

    corpus = []
    for c in courses:
        tags = " ".join(c.get("tags", []))
        text = f"{c['title']} {c.get('description', '')} {tags} {c.get('category', '')} {c.get('level', '')}"
        corpus.append(text)

    tfidf = TfidfVectorizer(stop_words="english")
    tfidf_matrix = tfidf.fit_transform(corpus)
    sim_matrix = cosine_similarity(tfidf_matrix)

    enrolled_indices = [i for i, cid in enumerate(course_ids) if cid in enrolled_course_ids]

    if not enrolled_indices:
        return {cid: 0.0 for cid in course_ids}

    avg_sim = np.mean(sim_matrix[enrolled_indices], axis=0)
    return {course_ids[i]: float(avg_sim[i]) for i in range(len(course_ids))}


# ─────────────────────────────────────────────
# COLLABORATIVE FILTERING (SVD)
# ─────────────────────────────────────────────

def collaborative_scores(user_id, courses):
    reviews = get_all_reviews()
    all_course_ids = [c["_id"] for c in courses]

    if not reviews:
        return {cid: 0.0 for cid in all_course_ids}

    df = pd.DataFrame(reviews)
    matrix = df.pivot_table(index="LearnerId", columns="courseId", values="rating", fill_value=0)

    if user_id not in matrix.index:
        return {cid: 0.0 for cid in all_course_ids}

    n_components = min(10, matrix.shape[0] - 1, matrix.shape[1] - 1)
    if n_components < 1:
        return {cid: 0.0 for cid in all_course_ids}

    svd = TruncatedSVD(n_components=n_components, random_state=42)
    latent = svd.fit_transform(matrix.values)
    reconstructed = np.dot(latent, svd.components_)

    user_idx = list(matrix.index).index(user_id)
    user_scores = reconstructed[user_idx]

    min_s, max_s = user_scores.min(), user_scores.max()
    if max_s - min_s > 0:
        user_scores = (user_scores - min_s) / (max_s - min_s)

    matrix_course_ids = list(matrix.columns)
    cf_scores = {matrix_course_ids[i]: float(user_scores[i]) for i in range(len(matrix_course_ids))}

    for cid in all_course_ids:
        if cid not in cf_scores:
            cf_scores[cid] = 0.0

    return cf_scores


# ─────────────────────────────────────────────
# HYBRID RECOMMENDER
# ─────────────────────────────────────────────

def hybrid_recommend(user_id, top_n=6, alpha=0.5):
    courses = get_all_courses()
    enrolled_ids = get_user_enrollments(user_id)

    cb_scores = content_based_scores(enrolled_ids, courses)
    cf_scores = collaborative_scores(user_id, courses)

    # Auto fallback to content-only for cold start users
    has_cf_data = any(v > 0 for v in cf_scores.values())
    effective_alpha = alpha if has_cf_data else 1.0

    hybrid_scores = {}
    for c in courses:
        cid = c["_id"]
        if cid in enrolled_ids:
            continue  # skip already enrolled
        cb = cb_scores.get(cid, 0.0)
        cf = cf_scores.get(cid, 0.0)
        hybrid_scores[cid] = effective_alpha * cb + (1 - effective_alpha) * cf

    ranked = sorted(hybrid_scores.items(), key=lambda x: x[1], reverse=True)
    top_ids = [cid for cid, _ in ranked[:top_n]]

    recommended = [c for c in courses if c["_id"] in top_ids]
    for c in recommended:
        c["score"] = round(hybrid_scores[c["_id"]], 4)
        c["method"] = "hybrid" if has_cf_data else "content-based"

    recommended.sort(key=lambda c: c["score"], reverse=True)
    return recommended


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@app.route("/recommend/<user_id>", methods=["GET"])
def recommend(user_id):
    try:
        results = hybrid_recommend(user_id, top_n=6, alpha=0.5)
        return jsonify({
            "userId": user_id,
            "count": len(results),
            "recommendations": results
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "OpenGig ML Recommender"})


if __name__ == "__main__":
    app.run(port=5001, debug=True)