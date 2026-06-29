# EcoBin

EcoBin is an AI-powered waste classification platform that helps people sort their waste correctly and learn better recycling habits. Waste is a massive problem. In the United States alone, over 292 million tons of waste are generated each year, and that number is expected to double by 2050. Yet less than a third of our waste stream is actually recycled, largely because roughly a quarter of what ends up in recycling bins doesn't belong there.

EcoBin addresses this by using computer vision to automatically identify and categorize waste with **~95% accuracy**. It explains every prediction with a **Grad-CAM heatmap**, **learns from your corrections**, and includes a flashcard quiz with over **100 questions** to help people test and build their recycling knowledge.


<p>
  <img width=49% height=49% <img width="1781" height="902" alt="image" src="https://github.com/user-attachments/assets/4d11966a-44c7-4dd5-9251-3b979d3bd527" />
  <img width=49% height=49% <img width="1677" height="856" alt="image" src="https://github.com/user-attachments/assets/45a38cf7-3b89-4821-8264-6caa50ff5098" />


</p>
<p>
  <img width=49% height=49% <img width="1761" height="912" alt="image" src="https://github.com/user-attachments/assets/9fd6613d-42df-4e3f-972a-d9d4a909c19c" />
  <img width=49% height=49% <img width="1760" height="917" alt="image" src="https://github.com/user-attachments/assets/06a3482c-1d71-43f5-bced-d717273fcdec" />
</p>


**Live app:** https://eco-bin-sepia.vercel.app/

**Research Paper DOI:** https://arxiv.org/abs/2606.15547v1

**Kaggle notebook:** https://www.kaggle.com/code/ragbag84/ecobin-two-stage-waste-classification-pipeline

## Tech stack

### Frontend

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

### Backend

![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![Keras](https://img.shields.io/badge/Keras-D00000?style=for-the-badge&logo=keras&logoColor=white)

### Infrastructure

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![HuggingFace](https://img.shields.io/badge/HuggingFace_Spaces-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## Classification Pipeline

EcoBin uses a single-stage **EfficientNet-B0** image classifier. Given one photo it predicts which of **30 household-waste classes** the item belongs to and maps that class to one of three disposal pathways — **Recycling**, **Compost**, or **Garbage**. Images are fed to the model as raw 0-255 RGB pixels resized to 224×224 (EfficientNet-B0 normalizes internally), and the model returns the top class plus its softmax confidence. There is no contamination check — recyclable items are simply classified as Recycling.

The classifier is served by a FastAPI app on a HuggingFace Space and exposes three endpoints:

- `GET /health` — liveness/warmth probe.
- `POST /predict` — image → `{ item, pathway, confidence, low_confidence, gradcam, prediction_id, corrected_by_memory, ... }`.
- `POST /feedback` — `{ prediction_id, correct_item }` → stores a user correction.

### Class → pathway map

Each of the 30 classes maps to one of three pathways:

| Pathway | Classes |
|---|---|
| Recycling | aerosol_cans, aluminum_food_cans, aluminum_soda_cans, steel_food_cans, cardboard_boxes, cardboard_packaging, glass_beverage_bottles, glass_cosmetic_containers, glass_food_jars, plastic_detergent_bottles, plastic_soda_bottles, plastic_water_bottles, plastic_food_containers, newspaper, office_paper, magazines, paper_cups |
| Garbage | styrofoam_cups, styrofoam_food_containers, plastic_shopping_bags, plastic_straws, plastic_cup_lids, plastic_trash_bags, disposable_plastic_cutlery, clothing, shoes |
| Compost | food_waste, coffee_grounds, eggshells, tea_bags |

### Grad-CAM explainability

Every prediction returns a Grad-CAM overlay: the gradient of the predicted-class score with respect to the backbone's last convolutional feature map is pooled, ReLU'd, upsampled to 224×224, colored with a JET colormap, and alpha-blended over the original frame. The result is returned as a base64 PNG so the UI can show exactly what region of the image drove the classification.

### Correction memory (learning from mistakes)

When the model is wrong, the user can type the correct item. Rather than back-propagating into the CNN on a single example (which risks catastrophic forgetting), EcoBin stores the image's 1280-d embedding alongside the correct label in a tiny cosine-similarity memory. On every future prediction, the new image's embedding is compared against this memory; if it is very close to a stored correction, the model's guess is overridden and the result is flagged `corrected_by_memory`. This learns instantly, never touches the model weights, and persists to disk.

## Features

The app offers two features to help users make better disposal decisions.

1. The first is a free AI tool in the **Scan Waste Item** tab. You take a photo of the item you want to dispose of and EcoBin runs its EfficientNet-B0 classifier to identify the object, show a Grad-CAM heatmap of what it looked at, report its confidence (flagging low-confidence predictions), and tell you how to dispose of it. If it gets something wrong, you can correct it and EcoBin remembers so it won't repeat the mistake.

2. The second is the **Quiz Yourself** tab. We have over 100 flashcards in our database covering a wide range of waste items. Each quiz pulls up to 10 random cards and asks you to guess how each item should be disposed of — Recycling, Compost, or Garbage. After every question, you get an explanation of why your answer was right or wrong, and after all 10 you get a full results summary. You can retake the quiz up to 10 times.
