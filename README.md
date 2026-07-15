# EcoBin

EcoBin is an AI-powered smart bin that helps people sort their waste correctly and learn better recycling habits. It runs an EfficientNet-B0 image classifier that reaches about **96 percent accuracy** across 30 household waste categories from a single photo of the disposed item, then maps that classification to one of three disposal pathways: `Recycling`, `Compost`, or `Garbage`.  I built a physical prototype using jenga blocks for the exterior, an HC-SR04 ultrasonic sensor to detect when an item is dropped onto the tray, a cardboard tray to hold the item, an SG90 servo motor to rotate the tray, an Arduino Uno R3 to power the circuit, and a web app running on an iPad to photograph the item and send it for inference. EcoBin won ***2nd Place Grand Award at the Arizona State Science & Engineering Fair.***

- **Live app:** https://eco-bin-sepia.vercel.app/
- **Research Paper DOI:** https://arxiv.org/abs/2606.15547v1
- **Kaggle notebook:** https://www.kaggle.com/code/ragbag84/ecobin-two-stage-waste-classification-pipeline

<br>

<table>
   <tr>
    <td><img src="https://github.com/user-attachments/assets/5bf15a3c-adfd-4dc6-bdcc-51a6b361d3d5" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/e98f63d4-677b-46fa-8c1d-047ba7a7f52d" width="100%"/></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/26fd5811-8dcc-4872-8feb-3711de8d8f10" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/ad03c401-9024-4f0a-a07a-e0a624fb3011" width="100%"/></td>
  </tr>
</table> 

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

## Hardware Design
### Setup

The AI smart bin contains two bins that disposed waste items can be sorted into: compost bin and garabge bin. Items that are classified as recycling by the waste classification model are re-routed to garbage. 

| **Hardware Component** | **Description** |
| ------------------ | ----------- |
| **Arduino Uno:** | Microcontroller that powers the servo motor and ultrasonic sensor |
| **HC-SR04 Ultrasonic Sensor:** | Constantly sends an echo out and back (up to a 30 centimeter threshold) to detect if a waste item has been dropped onto the cardboard tray |
| **SG90 Servo Motor** | Rotates 60 degrees to the left if the disposed item is classified as compost and rotates 60 degrees to the right if the disposed item is classified as garbage. The rotation of the servo motor pushed the cardboard tray containing the waste item to rottate as well, which results in the item falling in an angle to its appropriate bin. |
| **Ipad Camera** | The iPad rear-view camera allows us to a picture of the waste classification object and run inference through HuggingFace Spaces to determine what bin it should be sorted into. We used an iPad camera becuase it acts as a touch screen for this smart trash can, allowing the user to visualize the picture of the waste object in a gradCam AI view, read the confidence level and correct the model if its wrong" |

### Inference Backend
The inference backend is a FastAPI service that lives inside the `/inference` directory. It classifies a waste image with the trained EfficientNetB0 model, returns a Grad-CAM explainability
overlay that allows the uer to visualize what parts of the image affected the AI's classification of the item the most through a heatmap and uses a ***reinforcement learning technique*** called correction-memory, which allows the user to correct the models mistakes and those msitakes are then saved to memory, which the model learns from so it doesn't repeat the same mistake twice. The inference backend is connected to a Next.js frontend that's deployed on Vercel. This app runs on the iPad and acts as a touchscreen to the smart bin, adding another layer of technology onto it. 
