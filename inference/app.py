"""FastAPI inference service for the EcoBin two-stage waste classifier.

Loads the Stage A and Stage B .keras checkpoints at startup, applies the
face-cascade privacy gate, and returns a structured disposal recommendation
for any single uploaded image.
"""
from __future__ import annotations

import base64
import io
import logging
import os
import re
from pathlib import Path

import cv2
import keras
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ecobin")

@keras.saving.register_keras_serializable()
class WarmupCosineSchedule(keras.optimizers.schedules.LearningRateSchedule):
    def __init__(self, start_lr, peak_lr, end_lr, warmup_steps, total_steps, **kwargs):
        super().__init__(**kwargs)
        self.start_lr = start_lr
        self.peak_lr = peak_lr
        self.end_lr = end_lr
        self.warmup_steps = warmup_steps
        self.total_steps = total_steps

    def __call__(self, step):
        return self.peak_lr

    def get_config(self):
        return {"start_lr": self.start_lr, "peak_lr": self.peak_lr,
                "end_lr": self.end_lr, "warmup_steps": self.warmup_steps,
                "total_steps": self.total_steps}

IMG_SIZE = 224
MODELS_DIR = Path(__file__).parent

# Disposal pathway map. Must match the DISPOSAL_MAP in the notebook exactly.
DISPOSAL_MAP: dict[str, str] = {
    "aerosol_cans":              "curbside_recycling",
    "aluminum_food_cans":        "curbside_recycling",
    "aluminum_soda_cans":        "curbside_recycling",
    "cardboard_boxes":           "curbside_recycling",
    "cardboard_packaging":       "curbside_recycling",
    "glass_beverage_bottles":    "curbside_recycling",
    "glass_cosmetic_containers": "curbside_recycling",
    "glass_food_jars":           "curbside_recycling",
    "magazines":                 "curbside_recycling",
    "newspaper":                 "curbside_recycling",
    "office_paper":              "curbside_recycling",
    "plastic_cup_lids":          "curbside_recycling",
    "plastic_detergent_bottles": "curbside_recycling",
    "plastic_food_containers":   "curbside_recycling",
    "plastic_soda_bottles":      "curbside_recycling",
    "plastic_water_bottles":     "curbside_recycling",
    "steel_food_cans":           "curbside_recycling",
    "plastic_shopping_bags":     "dropoff_recycling",
    "plastic_straws":            "dropoff_recycling",
    "plastic_trash_bags":        "dropoff_recycling",
    "styrofoam_cups":            "dropoff_recycling",
    "styrofoam_food_containers": "dropoff_recycling",
    "coffee_grounds":            "compost",
    "eggshells":                 "compost",
    "food_waste":                "compost",
    "tea_bags":                  "compost",
    "clothing":                  "garbage",
    "disposable_plastic_cutlery":"garbage",
    "paper_cups":                "garbage",
    "shoes":                     "garbage",
}

RECYCLING_PATHWAYS = {"curbside_recycling", "dropoff_recycling"}

# Sorted in the same order Keras sees the train directory: alphabetical.
CLASS_NAMES = sorted(DISPOSAL_MAP.keys())

# Same alphabetical ordering used for Stage B: clean first, then contaminant
# subgroup names sorted ascending.
STAGE_B_CLASS_NAMES = [
    "clean",
    "coffee_stains",
    "condiment_residue",
    "dirt",
    "food_residue",
    "grease",
    "mold",
    "paint",
    "wet_paper_pulp",
]
CLEAN_CLASS_IDX = 0
# Threshold sweep showed Stage B degrades pathway accuracy at every cutoff
# (synthetic training data does not generalise to real-world photos). Set to
# 1.01 to disable Stage B overrides until a real contamination dataset is available.
STAGE_B_THRESHOLD = 0.90

# Load models once at import time
log.info("Loading Stage A and Stage B models...")
STAGE_A = tf.keras.models.load_model(MODELS_DIR / "stage_a_best.keras", compile=False)
STAGE_B = tf.keras.models.load_model(MODELS_DIR / "stage_b_best.keras", compile=False)
FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
log.info("Models ready.")

app = FastAPI(title="EcoBin Inference", version="1.0.0")

# Allow the Vercel app to call us from a browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


class InferRequest(BaseModel):
    image_base64: str


def _decode_base64_image(b64: str) -> np.ndarray:
    """Strip the optional data-URL prefix and return an RGB uint8 ndarray."""
    if not b64:
        raise HTTPException(status_code=400, detail="empty image")
    # Strip data:image/...;base64, prefix if present
    b64 = re.sub(r"^data:image/[^;]+;base64,", "", b64)
    try:
        raw = base64.b64decode(b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid base64: {e}")
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid image: {e}")
    return np.array(img)


def _contains_face(image: np.ndarray) -> bool:
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    faces = FACE_CASCADE.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(50, 50)
    )
    return len(faces) > 0


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/infer")
def infer(req: InferRequest):
    """Run the full pipeline on one image and return a structured result."""
    image = _decode_base64_image(req.image_base64)

    # 1. Privacy gate
    if _contains_face(image):
        return {
            "status":             "rejected",
            "reason":             "face_detected",
            "predicted_class":    None,
            "stage_a_confidence": None,
            "stage_a_pathway":    None,
            "final_pathway":      None,
            "stage_b_ran":        False,
            "stage_b_result":     None,
        }

    # 2. Pre-process for both stages
    pil = Image.fromarray(image).resize((IMG_SIZE, IMG_SIZE))
    batch = np.expand_dims(np.array(pil), axis=0).astype("float32")

    # 3. Stage A
    a_probs = STAGE_A.predict(batch, verbose=0)[0]
    a_idx = int(np.argmax(a_probs))
    a_class = CLASS_NAMES[a_idx]
    a_conf = float(a_probs[a_idx])
    a_pathway = DISPOSAL_MAP.get(a_class, "garbage")
    final_pathway = a_pathway

    # 4. Stage B runs only on recyclables
    stage_b_ran = False
    stage_b_result = None

    if a_pathway in RECYCLING_PATHWAYS:
        b_probs = STAGE_B.predict(batch, verbose=0)[0]
        prob_contaminated = float(1.0 - b_probs[CLEAN_CLASS_IDX])
        pred_subgroup_idx = int(np.argmax(b_probs))
        stage_b_ran = True
        stage_b_result = {
            "predicted_subgroup": STAGE_B_CLASS_NAMES[pred_subgroup_idx],
            "prob_contaminated":  prob_contaminated,
            "threshold":          STAGE_B_THRESHOLD,
        }
        if prob_contaminated >= STAGE_B_THRESHOLD:
            final_pathway = "garbage"

    return {
        "status":             "ok",
        "reason":             None,
        "predicted_class":    a_class,
        "stage_a_confidence": a_conf,
        "stage_a_pathway":    a_pathway,
        "final_pathway":      final_pathway,
        "stage_b_ran":        stage_b_ran,
        "stage_b_result":     stage_b_result,
    }
