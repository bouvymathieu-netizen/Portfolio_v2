import re
with open(r'C:\Users\Utilisateur\mon-portfolio\index.html', 'r', encoding='utf-8') as f:
    html = f.read()
icons = re.findall(r'data-window="([^"]+)"', html)
print(f"Total icons with data-window: {len(icons)}")
for i, name in enumerate(icons):
    cat_match = re.search(r'data-window="' + name + r'"[^>]*data-category="([^"]*)"', html)
    c = cat_match.group(1) if cat_match else 'N/A'
    print(f"  {i+1}. {name:20s} category: {c}")
