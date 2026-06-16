# EcoBin

EcoBin is an AI-powered waste classification platform that helps people sort their waste correctly and learn better recycling habits. Waste is a massive problem. In the United States alone, over 292 million tons of waste are generated each year, and that number is expected to double by 2050. Yet less than a third of our waste stream is actually recycled, largely because roughly a quarter of what ends up in recycling bins doesn't belong there.

EcoBin addresses this by using computer vision to automatically identify and categorize waste with **~95% accuracy**. It also includes a flashcard quiz with over **100 questions** to help people test and build their recycling knowledge.


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
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

### Backend

![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow_2.19-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![Keras](https://img.shields.io/badge/Keras-D00000?style=for-the-badge&logo=keras&logoColor=white)

### Infrastructure

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![HuggingFace](https://img.shields.io/badge/HuggingFace_Spaces-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## Classification Pipeline

EcoBin takes a two-stage approach to solving the waste classification problem. It trains a **Stage A: Base Waste Classifier** to categorize items into either garbage, curbside recycling, drop-off recycling or compost based on their material composition. Itt then trains a Stage B: Contamination Classifier to classify items as either a clean recyclable or a contaminated recyclable. Stage B is only run on items classified as either curbside or drop-off recycling by Stage A. If it determines an item is contaminated, it overrides its final disposal pathway to garabge; otherwise, the item retains its original recycling classification. 

### Stage A: Base Waste Classifier

Stage A is a transfer learning model built on **EfficientNetV2-S**, pretrained on ImageNet and fine-tuned on the [Recyclable and Household Waste Classification Dataset](https://www.kaggle.com/datasets/alistairking/recyclable-and-household-waste-classification) which contains 15,000 images across 30 classes covering plastic, paper, cardboard, glass, metal, organic waste, and textiles.

**Training runs in two phases:**

**Phase 1 - Head warmup:** The EfficientNetV2-S backbone stays frozen. Only the new classification head (Global Average Pooling → Dropout → 30-class softmax) trains. This stabilises the head's weights before the backbone is touched.

**Phase 2 - Backbone fine-tuning:** The top half of the backbone is unfrozen and fine-tuned with a warmup-cosine learning rate schedule peaking at 1e-4. Every BatchNormalization layer stays frozen throughout Phase 2 to prevent running statistics from drifting on small fine-tune batches.

Each of the 30 classes is mapped to one of four disposal pathways using the recycling guidelines for the City of Phoenix:

| Pathway | Classes |
|---|---|
| Curbside recycling | aerosol_cans, aluminum_food_cans, aluminum_soda_cans, cardboard_boxes, cardboard_packaging, glass_beverage_bottles, glass_cosmetic_containers, glass_food_jars, magazines, newspaper, office_paper, plastic_cup_lids, plastic_detergent_bottles, plastic_food_containers, plastic_soda_bottles, plastic_water_bottles, steel_food_cans |
| Drop-off recycling | Plastic bags, straws, trash bags, styrofoam (5 classes) |
| Compost | Coffee grounds, eggshells, food waste, tea bags (4 classes) |
| Garbage | Clothing, disposable cutlery, paper cups, shoes (4 classes) |

**Results:** The Stage A: Base Waste Classifier achieved a 87.3%  accuracy rate and **96.3% pathway-adjusted accuracy** on the held-out test set. Pathway-adjusted accuracy counts a prediction as correct if the predicted class maps to the same disposal bin as the true class becuase it doesn't matter if the model confuses two similar classes like `cardboard_packaging` and `cardboard_boxes` if they both should be disposed off in curbside recycling. 

### Stage B: Contamination Classifier

Stage B runs only when Stage A routes an item to a recycling pathway (crubside or drop-off recycling). It checks whether the item is clean enough to recycle or whether contamination should redirect it to garbage.

**The synthetic data problem:** No public dataset of clean vs contaminated recyclables exists. Therefore, we have to create a synthetic dataset of clean vs contaminated images to train the Stage B: Contamination Classifier. We generated this synthetic dataset using a three step pipeline.

1. **Segment the object:**  We use [U2-Net](https://github.com/xuebinqin/U-2-Net) via `rembg` to produce a soft alpha mask for each source image. The we use morphological closing  fills interior holes and a Gaussian blur feathers the mask edges.
2. **Composite a contamination texture:**  We sample a texture from the [Waste Contamination Textures Dataset](https://www.kaggle.com/datasets/ragbag84/waste-contamination-textures-dataset) (40 textures across 8 contaminant types), randomly transform it, and alpha-blend onto the object surface using the U2-Net mask as a compositing  boundary to ensure the contamination texture lands on the object and not on the background of the image.
3. **Log metadata:** Each generated image is logged to a manifest CSV with source class, contaminant type, and severity level (light / medium / heavy).  The manifest is used to build a leak-free train/val/test split where contaminated siblings of a clean image always land in the same split.

Total output: **9,000 images** (1,000 clean sources × 8 contaminant types).

Stage B shares the EfficientNetV2-S backbone with Stage A and swaps the head for a 9-class softmax: one `clean` class and one class per contaminant type. It achieved **~85% accuracy** on the synthetic test set. 


## Features

The app offers two features to help users make better disposal decisions.

1. The first is a free AI tool in the **Scan Waste Item** tab. You upload a photo of the item you want to dispose of and EcoBin runs its two-stage neural network to identify the object, assess its condition, and tell you how to dispose of it.

2. The second is the **Quiz Yourself** tab. We have over 100 flashcards in our database covering a wide range of waste items. Each quiz pulls up to 10 random cards and asks you to guess how each item should be disposed of. After every question, you get an explanation of why your answer was right or wrong, and after all 10 you get a full results summary. You can retake the quiz up to 10 times.

