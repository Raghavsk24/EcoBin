import json
import re

# Load the quiz data
with open(r'C:\Users\senth\EcoBin\web\public\quiz\index.json', 'r') as f:
    quiz_data = json.load(f)

# Find items with potential grammatical issues
issues = []
for item in quiz_data['items']:
    note = item['note']
    # Look for "This is a <word>s" pattern
    match = re.search(r"This is a (\w+s(?:\s+\w+)*)\.", note)
    if match:
        issues.append({
            'image': item['image'],
            'note': note,
            'match': match.group(1)
        })

if issues:
    print(f"Found {len(issues)} potential issues:")
    for issue in issues[:10]:
        print(f"\n{issue['image']}")
        print(f"Match: 'This is a {issue['match']}'")
else:
    print("No grammatical issues found!")
