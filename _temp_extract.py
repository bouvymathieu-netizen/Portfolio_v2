import re
with open(r'C:\Users\Utilisateur\mon-portfolio\script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find each case block
pattern = re.compile(r"case '(\w+)':\s*bodyHTML\s*=\s*`(.*?)`;", re.DOTALL)
for m in pattern.finditer(content):
    name = m.group(1)
    body = m.group(2)
    title_match = re.search(r'<span class="block">([^<]+)</span>', body)
    if title_match:
        title = title_match.group(1)
        print(f'{name:20s} => {title}')
