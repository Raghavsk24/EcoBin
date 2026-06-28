"""Class names + disposal-pathway map for the EcoBin inference Space.

The 30 classes the model recognises, each mapped to one of three disposal
pathways: ``Recycling`` / ``Garbage`` / ``Compost``. The model predicts all
three. ``PHYSICAL_BIN`` collapses Recycling into Garbage for a two-compartment
hardware build, but the EcoBin web app is software-only and always shows the
true predicted ``pathway``.
"""

from __future__ import annotations

IMG_SIZE = 224
CONFIDENCE_THRESHOLD = 0.65  # below this the UI should flag a low-confidence sort

# Sorted exactly as the model's output indices were assigned at train time
# (Keras sorts the class sub-directory names alphabetically).
CLASS_NAMES = sorted([
    "aerosol_cans", "aluminum_food_cans", "aluminum_soda_cans",
    "cardboard_boxes", "cardboard_packaging", "clothing", "coffee_grounds",
    "disposable_plastic_cutlery", "eggshells", "food_waste",
    "glass_beverage_bottles", "glass_cosmetic_containers", "glass_food_jars",
    "magazines", "newspaper", "office_paper", "paper_cups", "plastic_cup_lids",
    "plastic_detergent_bottles", "plastic_food_containers",
    "plastic_shopping_bags", "plastic_soda_bottles", "plastic_straws",
    "plastic_trash_bags", "plastic_water_bottles", "shoes", "steel_food_cans",
    "styrofoam_cups", "styrofoam_food_containers", "tea_bags",
])

DISPOSAL_MAP = {
    "aerosol_cans":              "Recycling",
    "aluminum_soda_cans":        "Recycling",
    "aluminum_food_cans":        "Recycling",
    "steel_food_cans":           "Recycling",
    "cardboard_boxes":           "Recycling",
    "cardboard_packaging":       "Recycling",
    "glass_beverage_bottles":    "Recycling",
    "glass_cosmetic_containers": "Recycling",
    "glass_food_jars":           "Recycling",
    "plastic_detergent_bottles": "Recycling",
    "plastic_soda_bottles":      "Recycling",
    "plastic_water_bottles":     "Recycling",
    "plastic_food_containers":   "Recycling",
    "newspaper":                 "Recycling",
    "office_paper":              "Recycling",
    "magazines":                 "Recycling",
    "paper_cups":                "Recycling",
    "styrofoam_cups":            "Garbage",
    "styrofoam_food_containers": "Garbage",
    "plastic_shopping_bags":     "Garbage",
    "plastic_straws":            "Garbage",
    "plastic_cup_lids":          "Garbage",
    "plastic_trash_bags":        "Garbage",
    "disposable_plastic_cutlery": "Garbage",
    "clothing":                  "Garbage",
    "shoes":                     "Garbage",
    "food_waste":                "Compost",
    "coffee_grounds":            "Compost",
    "eggshells":                 "Compost",
    "tea_bags":                  "Compost",
}

# Physical routing for a two-compartment build: Recycling shares the garbage bin.
PHYSICAL_BIN = {"Recycling": "Garbage", "Garbage": "Garbage", "Compost": "Compost"}


def pathway_for(item: str) -> str:
    """Predicted disposal pathway shown in the UI (Recycling/Garbage/Compost)."""
    return DISPOSAL_MAP.get(item, "Garbage")


def physical_bin_for(pathway: str) -> str:
    """Which of the two physical compartments an item routes to (Garbage/Compost)."""
    return PHYSICAL_BIN.get(pathway, "Garbage")


def pretty(item: str) -> str:
    """`plastic_water_bottles` -> `Plastic Water Bottles` for display."""
    return item.replace("_", " ").title()
