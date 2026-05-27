import json

# Specific contaminant explanations based on item type
contaminated_explanations = {
    'aerosol_cans_contaminated': 'This is an Aerosol Can. Usually, it should be disposed off in curbside recycling. However, the presence of residual pressurized product means it can\'t be recycled anymore as it poses a fire and explosion hazard to sorting equipment and workers. Therefore, it should be disposed off in the garbage bin.',
    
    'aluminum_food_cans_contaminated': 'This is an Aluminium Food Can. Usually, it should be disposed off in curbside recycling. However, the presence of dried food remnants stuck to the interior means it can\'t be recycled anymore as it attracts pests and contaminates the aluminum recycling stream. Therefore, it should be disposed off in the garbage bin.',
    
    'aluminum_soda_cans_contaminated': 'This is an Aluminium Soda Can. Usually, it should be disposed off in curbside recycling. However, the presence of sticky residue from sugary liquid means it can\'t be recycled anymore as it causes contamination during the melting process. Therefore, it should be disposed off in the garbage bin.',
    
    'cardboard_boxes_contaminated': 'This is a Cardboard Box. Usually, it should be disposed off in curbside recycling. However, the presence of grease and oil stains means it can\'t be recycled anymore as it breaks down into pulp and ruins the paper fiber quality. Therefore, it should be disposed off in the garbage bin.',
    
    'clothing_contaminated': 'This is Clothing. Usually, it should be disposed off in drop-off recycling centers. However, the presence of heavy stains or damage means it can\'t be recycled anymore as the fibers are compromised. Therefore, it should be disposed off in the garbage bin.',
    
    'glass_beverage_bottles_contaminated': 'This is a Glass Beverage Bottle. Usually, it should be disposed off in curbside recycling. However, the presence of labels with adhesive residue and leftover liquid means it can\'t be recycled anymore as the adhesive contaminates the glass and the liquid causes mold. Therefore, it should be disposed off in the garbage bin.',
    
    'glass_cosmetic_containers_contaminated': 'This is a Glass Cosmetic Container. Usually, it should be disposed off in curbside recycling. However, the presence of cosmetic residue stuck to the interior means it can\'t be recycled anymore as the creams and oils interfere with the glass recycling process. Therefore, it should be disposed off in the garbage bin.',
    
    'glass_food_jars_contaminated': 'This is a Glass Food Jar. Usually, it should be disposed off in curbside recycling. However, the presence of dried food particles and sauce residue means it can\'t be recycled anymore as it attracts rodents and creates biocontamination. Therefore, it should be disposed off in the garbage bin.',
    
    'magazine_contaminated': 'This is a Magazine. Usually, it should be disposed off in curbside recycling. However, the presence of water damage and mold growth means it can\'t be recycled anymore as the wet fibers break apart and ruin the paper recycling batch. Therefore, it should be disposed off in the garbage bin.',
    
    'newspaper_contaminated': 'This is Newspaper. Usually, it should be disposed off in curbside recycling. However, the presence of moisture and ink bleeding means it can\'t be recycled anymore as wet newspaper creates clogs in sorting machinery. Therefore, it should be disposed off in the garbage bin.',
    
    'office_paper_contaminated': 'This is Office Paper. Usually, it should be disposed off in curbside recycling. However, the presence of coffee stains and water damage means it can\'t be recycled anymore as the contaminated fibers weaken the paper strength. Therefore, it should be disposed off in the garbage bin.',
    
    'plastic_cup_lid_contaminated': 'This is a Plastic Cup Lid. Usually, it should be disposed off in curbside recycling. However, the presence of dried beverage residue means it can\'t be recycled anymore as it gunks up sorting equipment and contaminates other plastics. Therefore, it should be disposed off in the garbage bin.',
    
    'plastic_detergent_bottles_contaminated': 'This is a Plastic Detergent Bottle. Usually, it should be disposed off in curbside recycling. However, the presence of residual detergent and chemical residue means it can\'t be recycled anymore as these hazardous chemicals are incompatible with plastic recycling processes. Therefore, it should be disposed off in the garbage bin.',
    
    'plastic_food_containers_contaminated': 'This is a Plastic Food Container. Usually, it should be disposed off in curbside recycling. However, the presence of congealed food particles and grease means it can\'t be recycled anymore as it creates blockages in processing equipment. Therefore, it should be disposed off in the garbage bin.',
    
    'plastic_shopping_bags_contaminated': 'This is a Plastic Shopping Bag. Usually, it should be disposed off in drop-off recycling centers. However, the presence of food remnants and contamination means it can\'t be recycled anymore as it jams sorting machinery and ruins other materials. Therefore, it should be disposed off in the garbage bin.',
    
    'plastic_soda_bottle_contaminated': 'This is a Plastic Soda Bottle. Usually, it should be disposed off in curbside recycling. However, the presence of syrupy residue and bacterial growth means it can\'t be recycled anymore as the sticky substance causes equipment jams and creates odors. Therefore, it should be disposed off in the garbage bin.',
    
    'plastic_trash_bags_contaminated': 'This is a Plastic Trash Bag. Usually, it should be disposed off in drop-off recycling centers. However, the presence of trash and debris inside means it can\'t be recycled anymore as it contaminates all materials it contacts. Therefore, it should be disposed off in the garbage bin.',
    
    'shoes_contaminated': 'This is a Shoe. Usually, it should be disposed off in drop-off recycling centers. However, the presence of severe wear, torn materials, and accumulated dirt means it can\'t be recycled anymore as the fibers are too compromised. Therefore, it should be disposed off in the garbage bin.',
}

# Load the quiz data
with open(r'C:\Users\senth\EcoBin\web\public\quiz\index.json', 'r') as f:
    quiz_data = json.load(f)

# Process each item
updated_count = 0
for item in quiz_data['items']:
    image_filename = item['image']
    
    # Check if this is a contaminated item
    if 'contaminated' in image_filename:
        # Extract the base name (e.g., "glass_beverage_bottles_contaminated" from the filename)
        base_name = image_filename.split('/')[-1].rsplit('_', 1)[0]
        
        # Find matching explanation
        for key in contaminated_explanations:
            if key in base_name or base_name.startswith(key.split('_contaminated')[0]):
                item['note'] = contaminated_explanations[key]
                updated_count += 1
                break

# Save the updated data
with open(r'C:\Users\senth\EcoBin\web\public\quiz\index.json', 'w') as f:
    json.dump(quiz_data, f, indent=2)

print(f"Successfully updated {updated_count} contaminated items with specific explanations!")
