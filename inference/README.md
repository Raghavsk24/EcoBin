---
title: EcoBin Inference
emoji: ♻️
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# EcoBin Inference

FastAPI service that runs a single-stage **EfficientNet-B0** waste classifier on
one uploaded image and returns a structured disposal recommendation, a Grad-CAM
explainability overlay, and a confidence score. The model recognises 30 item
classes and maps each to one of three disposal pathways: **Compost**, **Garbage**,
or **Recycling**. Recyclable items are simply classified as Recycling; the model
makes a single material-based decision and nothing overrides it.

Images are fed to the model as **raw 0-255 RGB pixels** resized to 224×224.
EfficientNet-B0 normalizes internally, so the service must not rescale.

## Features

- **Grad-CAM overlay** — every prediction returns a base64 PNG heatmap showing
  what region of the image drove the classification.
- **Correction memory** — when a user corrects a wrong prediction via `/feedback`,
  the image's 1280-d embedding is stored with the correct label. Future
  predictions whose embedding is very close to a stored correction are overridden
  (`corrected_by_memory: true`). This learns instantly, never touches the model
  weights, and persists to JSON (mounted at `/data` on HF persistent storage).
- **Confidence + low-confidence flag** — `confidence` is the softmax probability
  of the top class; `low_confidence` is `true` when it falls below the threshold
  (0.65).

## Endpoints

- `GET /health` — liveness/warmth probe; reports `model_loaded`, `memory_size`,
  and the number of classes.
- `POST /predict` — accepts `{ "image": "data:image/png;base64,..." }` (the
  `data:` prefix is optional) and returns the prediction dict (see below).
- `POST /feedback` — accepts `{ "prediction_id": "...", "correct_item": "..." }`
  where `correct_item` is one of the 30 class names, and stores the correction in
  the correction memory.

## Deployment

1. Train the notebook and export `efficientnet-b0-weights.keras`.
2. Place the `.keras` file in this directory (tracked via Git LFS).
3. Push the directory to a HuggingFace Space (SDK = Docker, hardware = CPU basic).
4. The Space auto-builds on push. The first request after idle takes 15–30 s
   (cold start); subsequent calls are about a second when warm.

## /predict response schema

```jsonc
{
  "prediction_id": "a1b2c3...",          // pass to /feedback to teach a correction
  "item": "plastic_soda_bottles",        // final item (may be overridden by memory)
  "item_label": "Plastic Soda Bottles",
  "pathway": "Recycling",                // Compost | Garbage | Recycling
  "physical_bin": "Garbage",             // two-compartment hardware routing (UI ignores this)
  "confidence": 0.91,                    // softmax prob of the model's top class
  "low_confidence": false,               // true when confidence < 0.65
  "corrected_by_memory": false,          // true when correction memory overrode the model
  "memory_similarity": 0.0,              // cosine similarity to the closest correction
  "model_item": "plastic_soda_bottles",  // the model's raw guess, before memory
  "model_item_label": "Plastic Soda Bottles",
  "gradcam": "iVBORw0KGgo..."            // base64 PNG overlay (no data: prefix)
}
```

## /feedback response schema

```jsonc
{
  "status": "learned",
  "correct_item": "glass_food_jars",
  "correct_item_label": "Glass Food Jars",
  "pathway": "Recycling",
  "physical_bin": "Garbage",
  "memory_size": 1
}
```
