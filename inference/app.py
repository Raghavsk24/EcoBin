"""FastAPI inference service for the EcoBin waste classifier.

Loads the EfficientNet-B0 .keras checkpoint at startup, applies the
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

DISPOSAL_MAP: dict[str, str] = {
    "aerosol_cans":               "Recycling",
    "aluminum_food_cans":         "Recycling",
    "aluminum_soda_cans":         "Recycling",
    "cardboard_boxes":            "Recycling",
    "cardboard_packaging":        "Recycling",
    "glass_beverage_bottles":     "Recycling",
    "glass_cosmetic_containers":  "Recycling",
    "glass_food_jars":            "Recycling",
    "magazines":                  "Recycling",
    "newspaper":                  "Recycling",
    "office_paper":               "Recycling",
    "paper_cups":                 "Recycling",
    "plastic_detergent_bottles":  "Recycling",
    "plastic_food_containers":    "Recycling",
    "plastic_soda_bottles":       "Recycling",
    "plastic_water_bottles":      "Recycling",
    "steel_food_cans":            "Recycling",
    "clothing":                   "Garbage",
    "disposable_plastic_cutlery": "Garbage",
    "plastic_cup_lids":           "Garbage",
    "plastic_shopping_bags":      "Garbage",
    "plastic_straws":             "Garbage",
    "plastic_trash_bags":         "Garbage",
    "shoes":                      "Garbage",
    "styrofoam_cups":             "Garbage",
    "styrofoam_food_containers":  "Garbage",
    "coffee_grounds":             "Compost",
    "eggshells":                  "Compost",
    "food_waste":                 "Compost",
    "tea_bags":                   "Compost",
}

CLASS_NAMES = sorted(DISPOSAL_MAP.keys())

log.info("Loading model...")
MODEL = tf.keras.models.load_model(MODELS_DIR / "stage_a_best.keras", compile=False)
FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
log.info("Model ready.")

app = FastAPI(title="EcoBin Inference", version="2.0.0")

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
    """Run the classifier on one image and return a structured result."""
    image = _decode_base64_image(req.image_base64)

    if _contains_face(image):
        return {
            "status":          "rejected",
            "reason":          "face_detected",
            "predicted_class": None,
            "confidence":      None,
            "pathway":         None,
        }

    pil = Image.fromarray(image).resize((IMG_SIZE, IMG_SIZE))
    batch = np.expand_dims(np.array(pil), axis=0).astype("float32")

    probs = MODEL.predict(batch, verbose=0)[0]
    idx = int(np.argmax(probs))
    predicted_class = CLASS_NAMES[idx]
    confidence = float(probs[idx])
    pathway = DISPOSAL_MAP.get(predicted_class, "Garbage")

    return {
        "status":          "ok",
        "reason":          None,
        "predicted_class": predicted_class,
        "confidence":      confidence,
        "pathway":         pathway,
    }
