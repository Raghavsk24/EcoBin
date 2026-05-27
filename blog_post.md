# Week 1 of 13: Building EcoBin

Hi Medium,

One week ago, I posted that I'd be completing 13 projects over my 13 weeks before college. I'm thrilled to announce that I've finished Week 1 by building EcoBin.

**View on Vercel:** https://eco-bin-sepia.vercel.app/

EcoBin is an AI-powered waste classification platform. You upload a photo of any waste item and EcoBin tells you which bin it belongs in. Under the hood, it's a two-stage deep learning pipeline that first identifies the object and then checks whether it's clean enough to actually be recycled.

This post walks through how I built it.

---

## Why recycling needs AI in the first place

The United States generates over **292 million tons of municipal solid waste every year**, and the EPA estimates that as much as 75% of it could be recycled. The actual recycling rate sits at about 33%. The gap comes from two problems:

1. **Wish-cycling:** people throw non-recyclable items into the recycling bin hoping they'll get recycled. They don't. They contaminate the entire batch.
2. **Lost recyclables:** people throw recyclables into the trash because they don't know the item is recyclable.

Both problems boil down to the same root cause: at the moment someone is holding a piece of waste in their hand, they don't know which bin it goes into. EcoBin is an attempt to remove that uncertainty.

---

## The architecture

EcoBin runs a two-stage classification pipeline.

- **Stage A: Base Waste Classifier.** A 30-class image classifier that identifies what the item is and maps it to a disposal pathway (`curbside_recycling`, `dropoff_recycling`, `garbage`, or `compost`).
- **Stage B: Contamination Classifier.** Runs only when Stage A routes the item to a recycling bin. It checks whether the item is actually clean enough to recycle, or whether visible contamination (food residue, grease, mold, paint) should redirect it to garbage.

I'll walk through each stage in turn.

---

## Stage A: Base Waste Classifier

### The dataset

Stage A is trained on the [Recyclable and Household Waste Classification Dataset](https://www.kaggle.com/datasets/alistairking/recyclable-and-household-waste-classification) from Kaggle. It has **15,000 images across 30 classes** covering plastic, paper, cardboard, glass, metal, organic waste, and textiles. Every class has exactly 500 images, so there's no imbalance to worry about.

![Class distribution](Waste%20Classification%20Dataset%20Audit/class_distribution_bar_chart.png)

Each class is also split into two subcategories: `default` (clean, product-style backgrounds) and `real_world` (in-the-wild photos with varied lighting and busy backgrounds). The split lets you measure how well the model generalises beyond studio conditions, which is exactly what we care about for a deployed app where users are taking phone-camera photos in their kitchens.

### Mapping classes to disposal pathways

The United States has over 19,000 municipalities and every one of them has different recycling rules. To keep things tractable, I used the [recycling guidelines for the City of Phoenix](https://www.phoenix.gov/publicworks/garbage/recycling) (my hometown) to map each of the 30 classes to one of four disposal pathways. Most plastics, papers, metals, and glass go to curbside recycling. Plastic bags, styrofoam, and textiles go to drop-off recycling. Tea bags, eggshells, and food waste go to compost. Disposable cutlery, paper cups, and plastic straws go to garbage.

### The model

Stage A is a transfer learning model built on top of **EfficientNetV2-S**, a convolutional neural network pretrained on ImageNet. By starting from those weights instead of training from scratch, the model picks up waste-specific patterns much faster and with far less data than it would otherwise need. The classification head is a simple Global Average Pooling layer followed by Dropout and a 30-class softmax output.

### Training

Training happens in two phases.

In **Phase 1**, the EfficientNetV2-S backbone stays frozen and only the new classification head learns. This is fast because almost all of the weights are locked, and it gets the head into a reasonable starting point without disturbing the pretrained features.

In **Phase 2**, I unfreeze the top half of the backbone and let it adapt slightly to waste imagery. The learning rate follows a warmup-cosine schedule that peaks at 1e-4. Every BatchNormalization layer stays frozen during Phase 2 to prevent the running statistics from drifting on the smaller batch sizes I was using.

The augmentation pipeline includes random rotation up to 30 degrees, random zoom of up to 20%, random translation of up to 15%, horizontal flips, brightness shifts, and contrast shifts. Augmentation prevents the model from memorising specific orientations or lighting conditions in the training set.

### Results

After Phase 2 finished, I plotted the training and validation curves.

![Stage A error metrics](Stage%20A%20Results/stage_a_error_metrics.png)

The training and validation accuracy curves track each other reasonably well, which is a good sign that the model is generalising rather than overfitting. The dashed grey vertical line marks the switch from Phase 1 to Phase 2.

Per-class accuracy on the held-out test set:

![Stage A per-class metrics](Stage%20A%20Results/stage_a_per_class_metrics.png)

The 30-class confusion matrix shows where the model is making mistakes:

![Stage A 30-class confusion matrix](Stage%20A%20Results/stage_a_confusion_matrix_classes.png)

Most of the off-diagonal mass lands inside disposal-pathway clusters: paper confused for paper, metal cans confused for other metal cans, glass containers confused for other glass containers. Those mistakes are visually plausible but they don't actually affect the bin the user ends up putting the item in. To see this more clearly, I collapsed the 30-class predictions down to the 4 disposal pathways:

![Stage A pathway confusion matrix](Stage%20A%20Results/stage_a_confusion_matrix_pathways.png)

The pathway-level matrix is significantly cleaner than the 30-class one. This motivates the **adjusted accuracy** metric: a prediction counts as correct if the predicted class and the true class map to the same disposal pathway, even when they're different classes. For example, if the model labels a `plastic_soda_bottle` as a `plastic_water_bottle`, both classes map to `curbside_recycling`, so the user still puts the item in the right bin.

![Stage A adjusted accuracy](Stage%20A%20Results/stage_a_adjusted_accuracy.png)

Adjusted accuracy is higher than raw class accuracy across the board, which confirms that most of Stage A's remaining errors are within-pathway confusions that don't affect the deployed decision.

### The domain gap

The single most important plot in the entire Stage A evaluation is the comparison between the `default` and `real_world` test subsets:

![Stage A default vs real-world](Stage%20A%20Results/stage_a_default_vs_real_world.png)

There's a clear gap. The model performs noticeably better on the clean, product-style `default` photos than it does on the messier `real_world` photos. Since the deployed app sees phone-camera photos in real lighting, the `real_world` number is the more honest predictor of how the model will behave in production.

This is the biggest open problem with Stage A. I'll come back to it at the end.

---

## Stage B: Contamination Classifier

### The synthetic data problem

Stage B needs labeled examples of *contaminated* recyclables: a glass jar with food residue, a cardboard box with grease stains, a plastic container with mold. No public dataset has anything close to this. So instead of collecting one, I built one synthetically.

The idea is straightforward. Take clean recyclable photos from the Stage A dataset, segment the object, paste random contamination textures onto the object's surface, and save the result alongside the unmodified clean original. Now you have paired clean and contaminated copies of the same object.

### Generation pipeline

The generation pipeline has three steps for each source image.

**Step 1: Segment the object.** I used [U2-Net](https://github.com/xuebinqin/U-2-Net) via the `rembg` library to produce a soft alpha mask for the object in each photo. A small morphological closing fills tiny interior holes (glass bottles are notorious for these), and a Gaussian blur feathers the edges of the mask so the contamination patch fades naturally at the object boundary instead of cutting off sharply.

**Step 2: Paste a contamination texture.** I scraped roughly 40 contamination texture images from various sources, grouped into 8 contaminant types: `coffee_stains`, `condiment_residue`, `dirt`, `food_residue`, `grease`, `mold`, `paint`, and `wet_paper_pulp`. The textures live in a separate [Kaggle dataset](https://www.kaggle.com/datasets/ragbag84/waste-contamination-textures-dataset). For each source image, I randomly select a texture, rotate it, scale it, flip it, and alpha-blend it with the underlying pixels using the object mask. The three-way weight (texture alpha times object mask times opacity scalar) keeps the contamination from spilling outside the object.

**Step 3: Save with metadata.** Each generated image gets logged in a manifest CSV with the source class, contaminant subgroup, severity level (light, medium, heavy), and a `source_stem` that links contaminated copies back to their clean original. This is what lets the training pipeline build a leak-free train/val/test split where every contaminated sibling of a clean image stays in the same split.

Total output: **9,000 images** (1,000 clean source images, 8 contaminated copies of each, one per contaminant type).

### The model

Stage B sits on top of the same EfficientNetV2-S backbone as Stage A and inherits all of its visual features. The only thing that changes is the classification head: it's swapped out for a new 9-class softmax that distinguishes `clean` from the 8 contaminant subgroups. The augmentation pipeline is identical to Stage A's.

### Results

![Stage B error metrics](Stage%20B%20Results/stage_b_error_metrics.png)

![Stage B per-class metrics](Stage%20B%20Results/stage_b_per_class_metrics.png)

Stage B performs well on its own synthetic test set. The 8 contaminant types are visually distinct enough that the model has no trouble telling them apart, and the clean-vs-contaminated decision is even cleaner than the subgroup decision. By severity level:

![Stage B by severity level](Stage%20B%20Results/stage_b_by_level.png)

By source class:

![Stage B by class](Stage%20B%20Results/stage_b_by_class.png)

These numbers look good. But there's a catch.

---

## The McNemar's test reality check

The real question isn't whether Stage B does well on synthetic data. It's whether adding Stage B actually improves the *full pipeline* on real-world contaminated images. To check, I built a small held-out test set of **99 real contaminated recyclables** (all of which should be routed to garbage) and ran both pipelines on it: Stage A alone versus Stage A + Stage B.

I used [McNemar's test](https://en.wikipedia.org/wiki/McNemar%27s_test) because it's the right tool for comparing two paired classifiers on the same set of examples. The test cares about discordant pairs: cases where one classifier got it right and the other got it wrong.

![McNemar contingency table](McNemar%20Test%20Results/mcnemar_contingency.png)

```json
{
  "stage_a_accuracy": 0.747,
  "full_pipeline_accuracy": 0.515,
  "both_correct": 27,
  "stage_a_only_correct": 47,
  "full_only_correct": 24,
  "both_wrong": 1,
  "discordant_pairs": 71,
  "statistic": 6.82,
  "p_value": 0.009,
  "significant_at_alpha_0.05": true
}
```

The result was not what I was hoping for. **Stage A alone is more accurate than the full pipeline.** Stage A reaches 74.7% accuracy on this test set; adding Stage B drops it to 51.5%. The p-value is 0.009, so the difference is statistically significant.

What's happening is that Stage B was trained on synthetic contamination (textures pasted onto clean objects) but is being asked to evaluate real contamination (actual food residue, actual grease, actual mold). The domain gap is large enough that Stage B's predictions on real images are barely better than random, and because it overrides Stage A's decision when it thinks something is contaminated, it ends up flipping correct predictions into wrong ones more often than the reverse.

This is a sharp lesson in synthetic data: it'll get you to a working prototype, but it won't get you to a deployed product. To make Stage B actually useful, I need real contaminated-recyclable training images. That's the next iteration.

In the deployed app, Stage B currently runs with a boosted `clean` class weight and a 90% contamination threshold, so it only overrides Stage A when it's very confident an item is contaminated. That mostly avoids the regression but doesn't get any value from Stage B either. The honest framing is that EcoBin v1 is a Stage A app with Stage B as scaffolding for v2.

---

## Deployment

The Vercel frontend is a Next.js 15 app with three tabs:

- **About:** project context and links.
- **Scan Waste Item:** photo upload with drag-and-drop, image preview, and inference via the HuggingFace Space API.
- **Quiz Yourself:** a 10-question flashcard quiz drawn from a database of 100+ waste items, with per-question feedback and a results summary at the end.

The inference backend is a FastAPI server running in a Docker container on HuggingFace Spaces. It exposes a single `POST /infer` endpoint that accepts a base64-encoded image, applies a face detection privacy gate (so faces in the frame get rejected before anything else runs), runs Stage A, conditionally runs Stage B, and returns a structured disposal recommendation.

Code is on [GitHub](https://github.com/Raghavsk24/EcoBin). The notebook is on [Kaggle](https://www.kaggle.com/code/ragbag84/ecobin-two-stage-waste-classification-pipeline). The Space is on [HuggingFace](https://huggingface.co/spaces/Raghavsk24/ecobin-inference).

---

## What's next

The biggest open problems with EcoBin are the two domain gaps:

1. **Stage A's domain gap.** Real phone-camera photos perform worse than studio photos. The fix is collecting real user data and fine-tuning on it. I'm going to add a feedback button to the app so users can flag wrong predictions, and use those corrections as fine-tuning data.
2. **Stage B's domain gap.** Synthetic contamination doesn't generalise. The fix is collecting real contaminated-recyclable images, which is harder because the data doesn't exist yet. I might collect a small dataset myself by photographing items from my own recycling bin.

I'm also planning to add support for more municipalities beyond Phoenix, so the app can adapt to local recycling rules.

That's Week 1. On to Week 2.

If you want to try it out, the app is live at https://eco-bin-sepia.vercel.app/.

Thanks for reading.

Raghav
