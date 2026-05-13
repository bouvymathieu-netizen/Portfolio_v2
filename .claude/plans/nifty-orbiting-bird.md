# Ajout du projet HIGHLO_Bushi

## Context
Ajouter un nouveau projet YouTube Short (HIGHLO_Bushi) au portfolio, en suivant exactement le même pattern que le projet ADIDAS_Motion Vintage Market ajouté précédemment.

## Modifications

### 1. `index.html` — Icône desktop
Ajouter avant `</main>` :
```html
<div class="desktop-icon" data-window="highlo" data-category="realisation postproduction" style="top:356px;left:36px;">
  <div class="icon-box icon-box-dual overflow-hidden" style="width:44px;height:78px;border-radius:0;border-top:none;">
    <img src="assets/thumbnails/HIGHLO_Bushi.jpg" alt="HIGHLO_Bushi" class="w-full h-full object-cover" style="border-radius:0;">
  </div>
  <span class="icon-label">HIGHLO<wbr>Bushi</span>
</div>
```

### 2. `script.js` — Taille fenêtre
Ajouter dans l'objet `sizes` :
```
highlo: { w: 380, h: 675, title: 'HIGHLO<wbr>Bushi' },
```

### 3. `script.js` — Contenu fenêtre
Ajouter un `case 'highlo':` dans le switch, avec iframe YouTube (hc_kwML2-Z4) et description simple.

## Vérification
- Icône visible sur le desktop avec miniature
- Double-clic ouvre la fenêtre avec la vidéo
- Filtre catégorie fonctionne (réalisation/postproduction)
