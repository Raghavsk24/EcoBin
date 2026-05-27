import zipfile, json, re, os

EXPLANATIONS = {
    'aerosol_cans': ('curbside_recycling', 'Empty aerosol cans are accepted in most curbside programs. Make sure the can is completely empty first.'),
    'alumnium_food_cans': ('curbside_recycling', 'Give it a quick rinse and drop it in the blue bin.'),
    'alumnium_soda_cans': ('curbside_recycling', 'Aluminium is endlessly recyclable. Always put cans in the curbside bin.'),
    'cardboard_boxes': ('curbside_recycling', 'Flatten it before placing in the blue bin to save sorting space.'),
    'clothing': ('dropoff_recycling', 'Textiles cannot go in the curbside bin. Bring to a donation box or textile drop-off depot.'),
    'glass_beverage_bottles': ('curbside_recycling', 'Glass is endlessly recyclable. Rinse and place in your blue bin.'),
    'glass_cosmetic_containers': ('curbside_recycling', 'Rinse out product residue before recycling in the blue bin.'),
    'glass_food_jars': ('curbside_recycling', 'Remove the metal lid, rinse, and recycle.'),
    'magazines': ('curbside_recycling', 'Glossy paper is accepted in most curbside recycling programs.'),
    'newspaper': ('curbside_recycling', 'Clean newspaper is one of the easiest items to recycle curbside.'),
    'office_paper': ('curbside_recycling', 'Clean paper goes in the blue bin. Bag shredded paper separately.'),
    'plastic_cup_lids': ('curbside_recycling', 'Hard plastic lids are generally accepted in curbside recycling.'),
    'plastic_detergent_bottles': ('curbside_recycling', 'Rinse thoroughly. Detergent residue can contaminate the whole batch.'),
    'plastic_food_containers': ('curbside_recycling', 'Rinse out all food residue before placing in the blue bin.'),
    'plastic_shopping_bags': ('dropoff_recycling', 'Bags jam sorting machinery. Return them to a grocery store drop-off bin instead.'),
    'plastic_soda_bottles': ('curbside_recycling', 'Empty the bottle, replace the cap, and place in the blue bin.'),
    'plastic_trash_bags': ('dropoff_recycling', 'Plastic film must go to a specialty drop-off, not the curbside bin.'),
    'plastic_water_bottles': ('curbside_recycling', 'One of the most commonly recycled plastics. Rinse and recycle.'),
    'shoes': ('dropoff_recycling', 'Footwear cannot go in the blue bin. Donate wearable shoes or use a footwear recycling drop-off.'),
    'steel_food_cans': ('curbside_recycling', 'Steel is highly recyclable. Give it a rinse and toss it in the blue bin.'),
    'aerosol_cans_contaminated': ('garbage', 'This aerosol can has visible contamination. Contaminated items spoil the entire recycling batch.'),
    'aluminum_food_cans_contaminated': ('garbage', 'Food residue makes this can non-recyclable. Always rinse cans before recycling.'),
    'aluminum_soda_cans_contaminated': ('garbage', 'Contamination means this can cannot be processed. Goes to garbage.'),
    'cardboard_boxes_contaminated': ('garbage', 'Grease soaks into cardboard fibres and ruins them. Contaminated cardboard goes in the garbage.'),
    'clothing_contaminated': ('garbage', 'Heavily soiled clothing cannot be donated or recycled. Goes to garbage.'),
    'glass_beverage_bottles_contaminated': ('garbage', 'Residue inside makes this bottle non-recyclable without thorough cleaning.'),
    'glass_cosmetic_containers_contaminated': ('garbage', 'Thick product residue makes this container non-recyclable.'),
    'glass_food_jars_contaminated': ('garbage', 'Food residue left in the jar would contaminate other recyclables in the batch.'),
    'magazine_contaminated': ('garbage', 'Water damage or heavy soiling makes paper non-recyclable.'),
    'newspaper_contaminated': ('garbage', 'Wet or soiled newspaper cannot be recycled.'),
    'office_paper_contaminated': ('garbage', 'Food stains or grease on paper make it non-recyclable.'),
    'plastic_cup_lid_contaminated': ('garbage', 'Residue on this lid would contaminate the recycling batch.'),
    'plastic_detergent_bottles_contaminated': ('garbage', 'Excessive product residue makes this bottle non-recyclable.'),
    'plastic_food_containers_contaminated': ('garbage', 'Food residue inside is the most common reason recyclables end up in landfill.'),
    'plastic_shopping_bags_contaminated': ('garbage', 'A contaminated bag cannot go to the drop-off bin. This goes to garbage.'),
    'plastic_soda_bottle_contaminated': ('garbage', 'Residue or contamination makes this bottle non-recyclable.'),
    'plastic_trash_bags_contaminated': ('garbage', 'Contaminated plastic film goes straight to garbage.'),
    'plastic_water_bottles_contaminated': ('garbage', 'A contaminated water bottle cannot be recycled.'),
    'shoe_contaminated': ('garbage', 'Heavily contaminated footwear cannot be donated or recycled.'),
    'steel_food_cans_contaminated': ('garbage', 'Food residue makes this can non-recyclable. Always rinse before recycling.'),
    'disposable_plastic_cutlery': ('garbage', 'Plastic utensils are too small and light for most sorting facilities to handle.'),
    'paper_cups': ('garbage', 'The plastic or wax lining inside makes paper cups non-recyclable in most programs.'),
    'plastic_straws': ('garbage', 'Straws are too small for recycling machinery and cause equipment jams.'),
    'styrofoam_cups': ('garbage', 'Expanded polystyrene (Styrofoam) is not accepted in most curbside programs.'),
    'styrofoam_food_containers': ('garbage', 'Styrofoam food containers are rarely recyclable and always go in the garbage.'),
    'styfrofoam_food_containers': ('garbage', 'Styrofoam food containers are rarely recyclable and always go in the garbage.'),
}

def stem_to_title(stem):
    s = re.sub(r'_\d+$', '', stem)
    contaminated = '_contaminated' in s
    s = s.replace('_contaminated', '')
    s = s.replace('alumnium', 'aluminium').replace('aluminum', 'aluminium').replace('styfrofoam', 'styrofoam')
    words = s.replace('_', ' ').title()
    if contaminated:
        words += ' (Contaminated)'
    return words

def get_key(stem):
    return re.sub(r'_\d+$', '', stem)

os.makedirs('web/public/quiz', exist_ok=True)
items = []

with zipfile.ZipFile('datasets/Test_Dataset.zip') as z:
    for name in sorted(z.namelist()):
        if name.endswith('/'):
            continue
        filename = os.path.basename(name)
        stem = os.path.splitext(filename)[0]
        key = get_key(stem)
        if key not in EXPLANATIONS:
            print(f'SKIP: no key for "{key}" ({filename})')
            continue
        pathway, note = EXPLANATIONS[key]
        with z.open(name) as src, open(f'web/public/quiz/{filename}', 'wb') as dst:
            dst.write(src.read())
        items.append({'image': f'/quiz/{filename}', 'title': stem_to_title(stem), 'pathway': pathway, 'note': note})

with open('web/public/quiz/index.json', 'w') as f:
    json.dump({'items': items}, f, indent=2)

print(f'Done: {len(items)} items')
for p in sorted(set(i['pathway'] for i in items)):
    print(f'  {p}: {sum(1 for i in items if i["pathway"]==p)}')
