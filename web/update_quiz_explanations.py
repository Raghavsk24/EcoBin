import json
import os
from pathlib import Path

# Define the categories and their explanation templates
categories = {
    'Clean Recyclables': 'clean',
    'Contaminated Recyclables': 'contaminated',
    'Garbage': 'garbage'
}

# Map item names to the proper category
def get_item_category(filename):
    dataset_path = Path(r'C:\Users\senth\EcoBin\datasets\Flashcards\Test_Dataset')
    
    for category_name in categories:
        category_path = dataset_path / category_name
        if (category_path / filename).exists():
            return categories[category_name]
    
    return None

# Get all items to map their categories
items_by_category = {}
dataset_path = Path(r'C:\Users\senth\EcoBin\datasets\Flashcards\Test_Dataset')

for category_name in categories:
    category_path = dataset_path / category_name
    items_by_category[categories[category_name]] = [f.name for f in category_path.glob('*.jpg')]

# Create comprehensive explanation templates based on item filename
def generate_explanation(filename, title, pathway, category):
    """Generate explanation based on item type and category"""
    
    # Extract base name without number and extension
    base_name = '_'.join(filename.replace('.jpg', '').split('_')[:-1])
    
    # Clean Recyclables explanations
    if category == 'clean':
        if 'aerosol' in filename:
            return 'This is an Aerosol Can. It should be disposed off in curbside recycling because empty aerosol cans are made of recyclable metal and are accepted in most curbside programs once completely empty.'
        elif 'alumnium_food' in filename:
            return 'This is an Aluminium Food Can. It should be disposed off in curbside recycling because aluminium is endlessly recyclable and food cans are widely accepted after a quick rinse to remove food residue.'
        elif 'alumnium_soda' in filename:
            return 'This is an Aluminium Soda Can. It should be disposed off in curbside recycling because aluminium is endlessly recyclable and soda cans are highly valuable in recycling programs.'
        elif 'cardboard' in filename:
            return 'This is a Cardboard Box. It should be disposed off in curbside recycling because cardboard is one of the most commonly recycled materials and should be flattened to save space in sorting facilities.'
        elif 'glass' in filename and 'bottle' in filename:
            return 'This is a Glass Bottle. It should be disposed off in curbside recycling because glass is infinitely recyclable and bottles are easily sorted and can be made into new containers.'
        elif 'paper' in filename:
            return 'This is Paper. It should be disposed off in curbside recycling because clean paper is one of the easiest materials to recycle and has high value in recycling streams.'
        elif 'plastic_bottle' in filename:
            return 'This is a Plastic Bottle. It should be disposed off in curbside recycling because most plastic bottles are accepted in programs and are valuable for conversion into new plastic products.'
        elif 'steel' in filename or 'tin' in filename:
            return f'This is a {title}. It should be disposed off in curbside recycling because steel and tin are magnetic metals that are easily recovered and recycled into new products.'
        elif 'newspaper' in filename:
            return 'This is Newspaper. It should be disposed off in curbside recycling because newspaper is easily recyclable and highly sought after by recycling facilities.'
        elif 'magazine' in filename:
            return 'This is a Magazine. It should be disposed off in curbside recycling because magazines are acceptable recyclables though glossy paper requires careful processing.'
        elif 'jars' in filename or 'jar' in filename:
            return 'This is a Jar. It should be disposed off in curbside recycling because glass jars are infinitely recyclable and can be melted down to create new glass products.'
        else:
            return f'This is a {title}. It should be disposed off in curbside recycling because it is composed of recyclable materials and is accepted in most curbside programs.'
    
    # Contaminated Recyclables explanations
    elif category == 'contaminated':
        if 'aerosol' in filename:
            return 'This is an Aerosol Can. Usually, it should be disposed off in curbside recycling. However, the presence of residual pressurized product means it can\'t be recycled anymore as it poses a fire and explosion hazard. Therefore, it should be disposed off in the garbage bin.'
        elif 'alumnium_food' in filename:
            return 'This is an Aluminium Food Can. Usually, it should be disposed off in curbside recycling. However, the presence of dried or sticky food residue means it can\'t be recycled anymore as it contaminates the recycling stream and attracts pests. Therefore, it should be disposed off in the garbage bin.'
        elif 'alumnium_soda' in filename:
            return 'This is an Aluminium Soda Can. Usually, it should be disposed off in curbside recycling. However, the presence of remaining liquid means it can\'t be recycled anymore as it drips and contaminates other materials in the sorting process. Therefore, it should be disposed off in the garbage bin.'
        elif 'cardboard' in filename:
            return 'This is a Cardboard Box. Usually, it should be disposed off in curbside recycling. However, the presence of wet contamination or food stains means it can\'t be recycled anymore as it breaks down into pulp and ruins other paper fibers. Therefore, it should be disposed off in the garbage bin.'
        elif 'glass' in filename and 'bottle' in filename:
            return 'This is a Glass Bottle. Usually, it should be disposed off in curbside recycling. However, the presence of ceramic or other non-glass materials means it can\'t be recycled anymore as it breaks at different temperatures and contaminates the glass recycling process. Therefore, it should be disposed off in the garbage bin.'
        elif 'paper' in filename:
            return 'This is Paper. Usually, it should be disposed off in curbside recycling. However, the presence of food residue or excessive moisture means it can\'t be recycled anymore as it breaks down and contaminates other clean paper fibers. Therefore, it should be disposed off in the garbage bin.'
        elif 'plastic_bottle' in filename:
            return 'This is a Plastic Bottle. Usually, it should be disposed off in curbside recycling. However, the presence of chemical or hazardous contents means it can\'t be recycled anymore as it poses safety risks during processing. Therefore, it should be disposed off in the garbage bin.'
        elif 'plastic_bag' in filename:
            return 'This is a Plastic Bag with Contamination. It belongs in the garbage bin because plastic bags jam the sorting machinery in recycling facilities and any contamination makes it unsuitable for processing.'
        else:
            return f'This is a {title}. Usually, it should be disposed off in curbside recycling. However, contamination from food or hazardous materials means it can\'t be recycled anymore. Therefore, it should be disposed off in the garbage bin.'
    
    # Garbage explanations
    elif category == 'garbage':
        if 'plastic_bag' in filename:
            return 'This is a Plastic Bag. It belongs in the garbage bin because plastic bags jam the sorting machinery in recycling facilities and must never go in curbside recycling.'
        elif 'styrofoam' in filename or 'foam' in filename:
            return 'This is Styrofoam. It belongs in the garbage bin because styrofoam is not accepted in curbside recycling programs and takes hundreds of years to decompose.'
        elif 'ceramic' in filename:
            return 'This is a Ceramic Item. It belongs in the garbage bin because ceramics look like glass but have different melting points and contaminate glass recycling processes.'
        elif 'mirror' in filename:
            return 'This is a Mirror. It belongs in the garbage bin because mirrors are coated with reflective materials that are incompatible with standard glass recycling.'
        elif 'lightbulb' in filename or 'light_bulb' in filename:
            return 'This is a Light Bulb. It belongs in the garbage bin because light bulbs contain mercury and other hazardous materials that require special disposal facilities.'
        elif 'broken' in filename or 'shattered' in filename:
            return f'This is a {title}. It belongs in the garbage bin because broken or shattered items pose safety hazards to workers at recycling facilities.'
        elif 'soiled' in filename:
            return f'This is a {title}. It belongs in the garbage bin because soiled materials contaminate the recycling stream and cannot be effectively processed.'
        else:
            return f'This is a {title}. It belongs in the garbage bin because it is not accepted in curbside recycling programs or poses a safety hazard during processing.'
    
    return f'This is a {title}. Please see sorting instructions.'

# Load the quiz data
with open(r'C:\Users\senth\EcoBin\web\public\quiz\index.json', 'r') as f:
    quiz_data = json.load(f)

# Process each item
updated_count = 0
for item in quiz_data['items']:
    image_filename = os.path.basename(item['image'])
    category = get_item_category(image_filename)
    
    if category:
        new_explanation = generate_explanation(image_filename, item['title'], item['pathway'], category)
        item['note'] = new_explanation
        updated_count += 1
    else:
        print(f"Warning: Could not determine category for {image_filename}")

# Save the updated data
with open(r'C:\Users\senth\EcoBin\web\public\quiz\index.json', 'w') as f:
    json.dump(quiz_data, f, indent=2)

print(f"Successfully updated {updated_count} items!")
