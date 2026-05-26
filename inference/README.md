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

FastAPI service that runs the Stage A waste classifier and the Stage B contamination check on a single uploaded image and returns a structured disposal recommendation.

## Endpoints

- `GET /health`  -  quick liveness check.
- `POST /infer`  -  accepts `{ "image_base64": "data:image/png;base64,..." }` and returns the inference dict.

## Deployment

1. Train the notebook on Kaggle and download `Models/stage_a_best.keras` and `Models/stage_b_best.keras` from `ecobin_outputs.zip`.
2. Place both `.keras` files in this directory.
3. Push the directory to a new HuggingFace Space (SDK = Docker, hardware = CPU basic).
4. The Space auto-builds on push. First inference after idle will take 15-30 seconds (cold start); subsequent calls take 3-8 seconds.

## Response schema

```jsonc
{
  "status": "ok" | "rejected",
  "reason": null | "face_detected",
  "predicted_class": "plastic_soda_bottles",
  "stage_a_confidence": 0.91,
  "stage_a_pathway": "curbside_recycling",
  "final_pathway": "garbage",
  "stage_b_ran": true,
  "stage_b_result": {
    "predicted_subgroup": "food_residue",
    "prob_contaminated": 0.78,
    "threshold": 0.5
  }
}
```
