// ─── État global ───
let zIndex = 100;
let dragState = null;   // { type, element, offsetX, offsetY }
let windowCount = 0;
const DESKTOP = document.getElementById('desktop');
const openWindows = {}; // type → element, pour éviter les doublons

const isMobile = window.matchMedia('(max-width: 768px), (max-height: 600px)').matches;

// Sur mobile : verrouiller le scroll dès le départ
if (isMobile) {
  document.documentElement.style.setProperty('overflow', 'hidden', 'important');
  document.body.style.setProperty('overflow', 'hidden', 'important');
}

// ─── Icônes ───
const icons = document.querySelectorAll('.desktop-icon');

// Sélection (desktop only)
if (!isMobile) {
icons.forEach(icon => {
  icon.addEventListener('mousedown', e => {
    if (dragState) return;
    icons.forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
  });
});
DESKTOP.addEventListener('mousedown', e => {
  if (e.target === DESKTOP) icons.forEach(i => i.classList.remove('selected'));
});
}

// ─── Drag d'icônes ───
if (!isMobile) {
icons.forEach(icon => {
  icon.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    icon.dataset._dragged = 'false';
    const doff = DESKTOP.getBoundingClientRect();
    dragState = {
      type: 'icon',
      element: icon,
      offsetX: e.clientX - doff.left - icon.offsetLeft,
      offsetY: e.clientY - doff.top - icon.offsetTop,
      startX: e.clientX,
      startY: e.clientY,
      detached: false,
    };
    icon.classList.add('dragging');
    e.preventDefault();
  });
});
}

// ─── Clic → fenêtre (desktop) ───
if (!isMobile) {
icons.forEach(icon => {
  icon.addEventListener('click', () => {
    if (icon.dataset._dragged === 'true') {
      icon.dataset._dragged = 'false';
      return;
    }
    const type = icon.dataset.window;
    if (type) openWindow(type);
  });
});
}

// ─── Mobile : appui long → drag, tap simple → fenêtre, swipe → rotation cercle ───
if (isMobile) {
let longPressTimer = null;
let longPressActive = false;
let touchStartPos = null;
let iconSwipeActive = false;
let swipeStartAngle = 0;
let swipeRefX = 0;
let swipePrevX = 0;
let swipeLastDx = 0;
let swipeVel = 0;

icons.forEach(icon => {
  icon.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartPos = { x: t.clientX, y: t.clientY };
    longPressActive = false;
    iconSwipeActive = false;

    longPressTimer = setTimeout(() => {
      longPressActive = true;
      circlePaused = true;
      const doff = DESKTOP.getBoundingClientRect();
      dragState = {
        type: 'icon',
        element: icon,
        offsetX: t.clientX - doff.left - icon.offsetLeft,
        offsetY: t.clientY - doff.top - icon.offsetTop,
      };
      icon.classList.add('dragging');
    }, 350);
  }, { passive: true });

  icon.addEventListener('touchmove', e => {
    if (longPressActive) {
      e.preventDefault();
      const t = e.touches[0];
      const doff = DESKTOP.getBoundingClientRect();
      icon.style.left = `${t.clientX - dragState.offsetX - doff.left}px`;
      icon.style.top = `${t.clientY - dragState.offsetY - doff.top}px`;
    } else if (touchStartPos) {
      const t = e.touches[0];
      const dx = t.clientX - touchStartPos.x;
      const dy = t.clientY - touchStartPos.y;
      if (iconSwipeActive) {
        // Swipe en cours : positionner le cercle directement comme le marquee
        const totalDx = t.clientX - swipeRefX;
        circleAngle = swipeStartAngle - totalDx * 0.004;
        updateCirclePositions();
        swipeLastDx = t.clientX - swipePrevX;
        swipeVel = swipeVel * 0.6 + swipeLastDx * 0.4;
        swipePrevX = t.clientX;
        e.preventDefault();
      } else if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        clearTimeout(longPressTimer);
        iconSwipeActive = true;
        circlePaused = true; // gèle la rotation auto pendant le swipe pour éviter le tremblement
        scrollVel = 0;
        swipeStartAngle = circleAngle;
        swipeRefX = t.clientX;
        swipePrevX = t.clientX;
        swipeLastDx = 0;
        swipeVel = 0;
        const totalDx = t.clientX - swipeRefX;
        circleAngle = swipeStartAngle - totalDx * 0.004;
        updateCirclePositions();
        e.preventDefault();
      }
    }
  }, { passive: false });

  icon.addEventListener('touchend', e => {
    clearTimeout(longPressTimer);
    if (longPressActive) {
      dragState = null;
      icon.classList.remove('dragging');
      longPressActive = false;
      circlePaused = false;
    } else if (iconSwipeActive) {
      // Fin du swipe : appliquer le momentum basé sur le dernier delta
      scrollVel = -swipeVel * 12;
      iconSwipeActive = false;
      circlePaused = false;
    } else if (touchStartPos) {
      // Tap simple → ouvre la fenêtre
      const type = icon.dataset.window;
      if (type) openWindow(type);
    }
    touchStartPos = null;
  }, { passive: true });

  icon.addEventListener('touchcancel', () => {
    clearTimeout(longPressTimer);
    if (longPressActive) {
      dragState = null;
      icon.classList.remove('dragging');
      longPressActive = false;
      circlePaused = false;
    }
    iconSwipeActive = false;
    circlePaused = false;
    touchStartPos = null;
  }, { passive: true });
});
}

// ─── Fenêtres ───
function openWindow(type) {
  // Évite les doublons : si une fenêtre du même type existe déjà, on la ramène au premier plan
  if (openWindows[type] && document.body.contains(openWindows[type])) {
    const existing = openWindows[type];
    existing.classList.remove('minimized');
    zIndex++;
    existing.style.zIndex = zIndex;
    // marquer la fenêtre comme focus
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    return existing;
  }

  windowCount++;
  const baseZ = zIndex + 10;

  const win = document.createElement('div');
  win.className = 'window';

  const project = PROJECTS[type];
  const sizes = {
    vimeo:  { w: 640, h: 409, title: 'Portfolio_Homepage' },
    cv:     { w: 600, h: 800, title: 'CV' },
    contact:{ w: 440, h: 460, title: 'Contact' },
  };
  const cfg = project ? { w: project.w, h: project.h, title: project.title } : (sizes[type] || sizes.vimeo);
  const offset = 30 + windowCount * 24;

  win.style.width = `${cfg.w}px`;
  win.style.height = `${cfg.h}px`;
    win.style.zIndex = baseZ;
  // centré
  win.style.left = `${(window.innerWidth - cfg.w) / 2}px`;
  win.style.top = `${(window.innerHeight - cfg.h) / 2}px`;

  // Contenu
  let bodyHTML = '';
  if (project) {
    bodyHTML = buildProjectBody(project);
  } else {
  switch (type) {
    case 'vimeo':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 overflow-hidden mb-3" style="position:relative;">
            <iframe src="https://player.vimeo.com/video/1055991297?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=1&amp;loop=1"
                    frameborder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    style="position:absolute;top:0;left:0;width:100%;height:100%;border-radius:8px;"
                    title="Portfolio Homepage">
            </iframe>
          </div>
          <p class="flex-shrink-0 text-xs text-gray-400 leading-relaxed px-5 pb-4">Bienvenue sur mon portfolio.</p>
        </div>`;
      break;

    case 'nikon':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/DBd60DzZuKg?autoplay=1"
                    title="NIKON_Mono no Aware" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block"><span class="italic">&laquo;&nbsp;Mono no Aware&nbsp;&raquo;</span> est un concept esthétique et spirituel japonais, pouvant être traduit comme &laquo;&nbsp;l'empathie envers les choses&nbsp;&raquo; ou &laquo;&nbsp;la sensibilité pour l'éphémère&nbsp;&raquo;. <span class="dots">...</span></span>

            <div class="hidden text-gray-500 mt-1 leading-relaxed space-y-1">
              <span class="block">Réalisation : Julien ROOSE, Anthony VUILLEROT</span>
              <span class="block">Scénario : Julien ROOSE</span>
              <span class="block">Casting : Cheyenne BOUTAULT</span>
              <span class="block">Photographie : Mathieu BOUVY, Maxime SADRIN</span>
              <span class="block">Son : Anthony VUILLEROT</span>
              <span class="block">Montage : Anthony VUILLEROT</span>
              <span class="block">VFX : Mathieu BOUVY</span>
              <span class="block">Étalonnage : Mathieu BOUVY</span>
              <span class="block">Mixage son : Anthony VUILLEROT</span>
              <span class="block">Remerciements à : Thomas AUBERTIN, Clément DAZIN, Océane DUMAS, Marie NIETO, Alexandre ROOSE, Didier ROOSE</span>
              <div class="mt-4 bg-black/40 rounded-lg overflow-hidden" style="aspect-ratio:16/9;">
                <iframe class="w-full h-full" src="https://www.youtube.com/embed/zlpTs5XeEN4?autoplay=0"
                        title="Making of - Mono no Aware" frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerpolicy="origin" allowfullscreen>
                </iframe>
              </div>
              <span class="block text-gray-600 text-xs mt-2">Making of</span>
            </div>

            <button onclick="var d=this.previousElementSibling,dots=d.previousElementSibling.querySelector('.dots');d.classList.toggle('hidden');dots.classList.toggle('hidden');this.textContent=d.classList.contains('hidden')?'▼ Développer les crédits':'▲ Réduire les crédits'"
                    class="text-gray-600 hover:text-gray-400 transition-colors mt-1 block text-xs">
              ▼ Développer les crédits
            </button>
          </div>
        </div>`;
      break;

    case 'youtube':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/6qIcuHd1Vzc?autoplay=1"
                    title="YouTube video player" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Raska et Isia s'affrontent pour trouver la bonne boîte et repartir avec un mystérieux cadeau. <span class="dots">...</span></span>

            <div class="hidden text-gray-500 mt-1 leading-relaxed space-y-1">
              <span class="block text-gray-400">Qui sera le plus stratège et repartira avec la bonne boîte ? La réponse est dans cet épisode…</span>
              <span class="block">Présentateur : @ryan_mahie</span>
              <span class="block">Réalisation : @anthony.debrant @justiine.v @ryan_mahie</span>
              <span class="block">Model : @mediabelmefre</span>
              <span class="block">Designer : @flor.fantasy</span>
              <span class="block">Photographe : @pierre.bars</span>
              <span class="block">Production : @Mothaiba</span>
              <span class="block">Montage : @mathieu.bouvy</span>
              <span class="block">Étalonnage : @mathieu.bouvy</span>
              <span class="block">Motion designer : @louietlavue</span>
              <span class="block">Photo : @mths.raw</span>
            </div>

            <button onclick="var d=this.previousElementSibling,dots=d.previousElementSibling.querySelector('.dots');d.classList.toggle('hidden');dots.classList.toggle('hidden');this.textContent=d.classList.contains('hidden')?'▼ Développer les crédits':'▲ Réduire les crédits'"
                    class="text-gray-600 hover:text-gray-400 transition-colors mt-1 block text-xs">
              ▼ Développer les crédits
            </button>
          </div>
        </div>`;
      break;

    case 'eafut':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/MqOMdPY08zU?autoplay=1"
                    title="EA_Fut_Birthday" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Quel ballon d'or est né le 17.04.01 ? <span class="dots">...</span></span>

            <div class="hidden text-gray-500 mt-1 leading-relaxed space-y-1">
              <span class="block">Creative lead : @enneite.drllb</span>
              <span class="block">Filmaker : @docteurrayan_</span>
              <span class="block">Motion & Editing : @mathieu.bouvy</span>
              <span class="block">Sound : @Kraft_production</span>
              <span class="block">Client : @easportsfcfr</span>
              <span class="block">Athlete : @bradley_dls</span>
              <span class="block">Talent : @mouloutrk</span>
            </div>

            <button onclick="var d=this.previousElementSibling,dots=d.previousElementSibling.querySelector('.dots');d.classList.toggle('hidden');dots.classList.toggle('hidden');this.textContent=d.classList.contains('hidden')?'▼ Développer les crédits':'▲ Réduire les crédits'"
                    class="text-gray-600 hover:text-gray-400 transition-colors mt-1 block text-xs">
              ▼ Développer les crédits
            </button>
          </div>
        </div>`;
      break;

    case 'earatings':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/gJcIfowmhUU?autoplay=1"
                    title="EA_Ratings_OM" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Lever de rideau ! Decouvrez les notes #FC25 de nos Olympiens et dites nous en commentaires ce que vous en pensez ! <span class="dots">...</span></span>

            <div class="hidden text-gray-500 mt-1 leading-relaxed space-y-1">
              <span class="block">Creative Lead : @ralfone @enneite.drllb</span>
              <span class="block">Real : @spireprod</span>
              <span class="block">Filming : @dam_koman @mathieu.bouvy @kfrmd</span>
              <span class="block">Editing : @mathieu.bouvy</span>
              <span class="block">Dop : @romanefleury_</span>
              <span class="block">Vfx : @karlouchki</span>
              <span class="block">Setup : @picturebylouis</span>
              <span class="block">Talent : @bigcolombien @benj.da.silva</span>
              <span class="block">Club : @olympiquedemarseille</span>
              <span class="block">Client : @easportsfcfr</span>
            </div>

            <button onclick="var d=this.previousElementSibling,dots=d.previousElementSibling.querySelector('.dots');d.classList.toggle('hidden');dots.classList.toggle('hidden');this.textContent=d.classList.contains('hidden')?'▼ Developper les credits':'▲ Reduire les credits'"
                    class="text-gray-600 hover:text-gray-400 transition-colors mt-1 block text-xs">
              ▼ Developper les credits
            </button>
          </div>
        </div>`;
      break;

    case 'manou':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 overflow-hidden mb-3" style="position:relative;">
            <iframe src="https://player.vimeo.com/video/1104271031?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=1"
                    frameborder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    style="position:absolute;top:0;left:0;width:100%;height:100%;"
                    title="Manou_Vaste Monde">
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block italic leading-relaxed">
              Comme un semblant d'harmonie dans le désordre,<br>
              à travers la frénésie du béton <span class="dots">...</span>
            </span>

            <div class="hidden text-gray-500 mt-1 leading-relaxed space-y-1">
              <span class="block italic text-gray-400">
                se cache un sentiment nouveau,<br>
                une envie d'ailleurs,<br>
                et d'ici.<br>
                Explorer ce n'est plus fuir.<br>
                c'est faire avec.
              </span>
              <span class="block">DA/conception : @manoubxr @manou_.bxr</span>
              <span class="block">Video : @mathieu.bouvy</span>
              <span class="block">Photography : @hugo_lbp</span>
              <span class="block">Models : @_ziifloow @gaby_bnrd @oswena_ @lenny_flrt</span>
              <span class="block">Special thanks : @terredecuir @merlainefeutre</span>
            </div>

            <button onclick="var d=this.previousElementSibling,dots=d.previousElementSibling.querySelector('.dots');d.classList.toggle('hidden');dots.classList.toggle('hidden');this.textContent=d.classList.contains('hidden')?'▼ Développer les crédits':'▲ Réduire les crédits'"
                    class="text-gray-600 hover:text-gray-400 transition-colors mt-1 block text-xs">
              ▼ Développer les crédits
            </button>
          </div>
        </div>`;
      break;

    case 'cv':
      bodyHTML = `
        <div class="flex h-full text-sm">

          <!-- ─── Colonne gauche : contact / compétences ─── -->
          <div class="w-[35%] bg-white/[0.03] p-5 flex flex-col gap-5 flex-shrink-0 overflow-y-auto">

            <!-- Avatar -->
            <div class="flex flex-col items-center gap-3">
              <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-white/[0.08]">
                <img src="assets/photos/pdp_v2.jpg" alt="Mathieu Bouvy" class="w-full h-full object-cover">
              </div>
            </div>

            <!-- Contact -->
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:#C32933">Contact</h3>
              <div class="space-y-1.5 text-xs text-gray-400">
                <p class="text-white font-medium text-sm">MATHIEU BOUVY</p>
                <p class="text-gray-500 text-xs">Vidéaste</p>
                <p class="pt-2 leading-relaxed">bouvy.mathieu@gmail.com</p>
                <p>+33 6 52 32 18 03</p>
                <p class="text-gray-600">Lyon, France</p>
              </div>
            </div>

            <!-- Compétences -->
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:#C32933">Compétences</h3>
              <div class="flex flex-wrap gap-1.5">
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(195,41,51,0.15);">Montage vidéo</span>
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(195,41,51,0.15);">Motion Design</span>
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(195,41,51,0.15);">Photographie</span>
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(195,41,51,0.15);">Sport & Lifestyle</span>
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(195,41,51,0.15);">Jeu Vidéo</span>
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(195,41,51,0.15);">YouTube / Reels</span>
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(195,41,51,0.15);">Concerts</span>
              </div>
            </div>

            <!-- Langues -->
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:#C32933">Langues</h3>
              <div class="space-y-1 text-xs text-gray-400">
                <p>Français <span class="text-gray-600">— Natif</span></p>
                <p>Anglais <span class="text-gray-600">— Professionnel</span></p>
              </div>
            </div>
          </div>

          <!-- ─── Colonne droite : expériences / formations ─── -->
          <div class="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">

            <!-- En-tête -->
            <div>
              <h1 class="text-2xl font-bold text-white tracking-tight">MATHIEU BOUVY</h1>
              <p class="text-sm text-gray-500">Vidéaste</p>
            </div>

            <!-- Expériences -->
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color:#C32933">Expériences</h3>
              <div class="space-y-4">

                <div class="border-l-2 pl-3" style="border-color:rgba(195,41,51,0.3)">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-white font-medium text-sm">Punchologue</p>
                    <span class="text-gray-600 text-xs whitespace-nowrap pt-0.5">Déc 2022 — Sept 2024</span>
                  </div>
                  <p class="text-gray-500 text-xs mt-0.5">Monteur / Motion Designer <span class="text-gray-600">(Stage)</span></p>
                  <p class="text-gray-500 text-xs mt-1 leading-relaxed">Montage YouTube/Reels et photos de concerts.</p>
                </div>

                <div class="border-l-2 pl-3" style="border-color:rgba(195,41,51,0.3)">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-white font-medium text-sm">Green Garden Digital</p>
                    <span class="text-gray-600 text-xs whitespace-nowrap pt-0.5">Sept 2023 — Oct 2025</span>
                  </div>
                  <p class="text-gray-500 text-xs mt-0.5">Vidéaste / Motion Designer <span class="text-gray-600">(Alternance)</span></p>
                  <p class="text-gray-500 text-xs mt-1 leading-relaxed">Projets sport, lifestyle et jeux vidéo.</p>
                </div>

                <div class="border-l-2 pl-3" style="border-color:rgba(195,41,51,0.3)">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-white font-medium text-sm">Freelance</p>
                    <span class="text-gray-600 text-xs whitespace-nowrap pt-0.5">Oct 2025 — Présent</span>
                  </div>
                  <p class="text-gray-500 text-xs mt-0.5">Vidéaste / Monteur indépendant</p>
                  <p class="text-gray-500 text-xs mt-1 leading-relaxed">Spécialisé dans les projets sport, lifestyle et jeux vidéo. Collaboration avec des agences et marques en production audiovisuelle.</p>
                </div>

              </div>
            </div>

            <!-- Formations -->
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color:#C32933">Formations</h3>
              <div class="space-y-3">
                <div class="border-l-2 pl-3" style="border-color:rgba(195,41,51,0.3)">
                  <p class="text-white text-sm">Bachelor Audiovisuel</p>
                  <p class="text-gray-500 text-xs">2021 — 2024 · Ynov Lyon</p>
                </div>
                <div class="border-l-2 pl-3" style="border-color:rgba(195,41,51,0.3)">
                  <p class="text-white text-sm">Baccalauréat Général</p>
                  <p class="text-gray-500 text-xs">Option Cinéma Audiovisuel</p>
                </div>
              </div>
            </div>

            <!-- Boutons d'action -->
            <div class="flex gap-3 mt-auto pt-4 border-t border-white/5">
              <a href="https://instagram.com/mathieu.bouvy" target="_blank"
                 class="flex-1 py-2.5 rounded-lg text-xs font-medium text-center transition-all duration-200
                        bg-white/5 border border-white/10 text-gray-300
                        hover:bg-white/10 hover:border-white/20 hover:text-white
                        active:scale-[0.98]">
                Instagram
              </a>
              <a href="assets/CV_Mathieu_Bouvy.pdf" target="_blank"
                 class="flex-1 py-2.5 rounded-lg text-xs font-medium text-center transition-all duration-200
                        bg-white/5 border border-white/10 text-gray-300
                        hover:bg-white/10 hover:border-white/20 hover:text-white
                        active:scale-[0.98]">
                Télécharger PDF
              </a>
            </div>
          </div>
        </div>`;
      break;

    case 'contact':
      bodyHTML = `
        <div class="space-y-4 p-5">
          <p class="text-xs text-gray-400">Laissez-moi un message.</p>
          <form onsubmit="sendContact(event)">
            <div class="space-y-3">
              <input type="text" placeholder="Nom" class="contact-field" id="contact-name">
              <input type="email" placeholder="Email" class="contact-field" id="contact-email">
              <textarea placeholder="Message" class="contact-field" rows="4" id="contact-msg"></textarea>
            </div>
            <button type="submit"
                    class="mt-5 w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                           bg-white/5 border border-white/10 text-gray-300
                           hover:bg-white/10 hover:border-white/20 hover:text-white
                           active:scale-[0.98]">
              Envoyer
            </button>
          </form>
        </div>`;
      break;

    case 'highlo':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/hc_kwML2-Z4?autoplay=1"
                    title="HIGHLO_Bushi" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">HighLo — Bushi.</span>
          </div>
        </div>`;
      break;

    case 'nikon2024':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/VENqrlGnch0?autoplay=1"
                    title="NIKON_2024" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">NIKON — 2024.</span>
          </div>
        </div>`;
      break;

    case 'sofianee':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/eTLyLNciZJ4?autoplay=1"
                    title="SOFIANEE_Gold digger" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Sofianee — Gold digger.</span>
          </div>
        </div>`;
      break;

    case 'unibetnasri':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/FI33Ajr09xE?autoplay=1"
                    title="UNIBET_Greg MMA x SAmir NASRI" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Unibet — Greg MMA x SAmir NASRI.</span>
          </div>
        </div>`;
      break;

    case 'olmaillot':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/kr7wSxyoZwE?autoplay=1"
                    title="OL_Nouveau Maillot" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">OL — Nouveau maillot extérieur.</span>
          </div>
        </div>`;
      break;

  }
  }

  win.innerHTML = `
    <div class="window-titlebar">
      <div class="window-controls">
        <button class="window-btn window-btn-close" data-action="close" title="Fermer"></button>
        <button class="window-btn window-btn-minimize" data-action="minimize" title="Réduire"></button>
        <button class="window-btn window-btn-maximize" data-action="maximize" title="Agrandir"></button>
      </div>
      <span class="window-title">${cfg.title}</span>
    </div>
    <div class="window-body">${bodyHTML}</div>
  `;

  DESKTOP.appendChild(win);

  if (project) setupProjectCarousel(win, project);

  // ─── Focus ───
  function focus() {
    zIndex++;
    win.style.zIndex = zIndex;
    icons.forEach(i => i.classList.remove('selected'));
  }
  win.addEventListener('mousedown', focus);
  focus();

  // ─── Boutons titre (fermer, réduire, agrandir) ───
  win.querySelectorAll('.window-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === 'close') closeWindow(win);
      else if (action === 'minimize') {
        if (win.classList.contains('maximized')) restoreWindow(win);
        else win.classList.add('minimized');
      }
      else if (action === 'maximize') maximizeWindow(win);
    });
  });

  // ─── Drag de fenêtre (par la titlebar) ───
  if (!isMobile) {
  const titlebar = win.querySelector('.window-titlebar');
  titlebar.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (e.target.closest('.window-btn')) return;

    focus();
    const rect = win.getBoundingClientRect();
    dragState = {
      type: 'window',
      element: win,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    e.preventDefault();
  });
  }

  // ─── Redimensionnement ───
  if (!isMobile) {
  const dirs = ['e', 's', 'se', 'sw'];
  dirs.forEach(dir => {
    const handle = document.createElement('div');
    handle.className = `resize-handle resize-handle-${dir}`;
    win.appendChild(handle);

    handle.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      focus();

      const rect = win.getBoundingClientRect();
      const doff = DESKTOP.getBoundingClientRect();
      dragState = {
        type: 'resize',
        element: win,
        direction: dir,
        startX: e.clientX,
        startY: e.clientY,
        startW: rect.width,
        startH: rect.height,
        startL: rect.left - doff.left,
        startT: rect.top - doff.top,
      };
    });
  });
  }
  openWindows[type] = win;
  updateBurgerState();
  return win;
}

function closeWindow(win) {
  // Retire du suivi des doublons
  for (const key in openWindows) {
    if (openWindows[key] === win) delete openWindows[key];
  }
  win.classList.add('closing');
  setTimeout(() => win.remove(), 180);
  windowCount = Math.max(0, windowCount - 1);
  updateBurgerState();
}

// ─── Burger mobile : devient "retour" quand une fenêtre est ouverte ───
function updateBurgerState() {
  if (!isMobile) return;
  const btn = document.getElementById('mobile-menu-btn');
  if (!btn) return;
  const hasWindow = Object.values(openWindows).some((w) => document.body.contains(w));
  if (hasWindow) {
    btn.dataset.mode = 'back';
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>';
  } else {
    btn.dataset.mode = 'menu';
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>';
  }
}

// ─── Restaurer la taille initiale (bouton jaune) ───
function restoreWindow(win) {
  if (win.classList.contains('maximized')) {
    win.classList.remove('maximized');
    win.style.width = win.dataset.prevW;
    win.style.height = win.dataset.prevH;
    win.style.left = win.dataset.prevL;
    win.style.top = win.dataset.prevT;
  }
}

// ─── Agrandir / restaurer ───
function maximizeWindow(win) {
  const MENU_H = 36;
  if (win.classList.contains('maximized')) {
    win.classList.remove('maximized');
    win.style.width = win.dataset.prevW;
    win.style.height = win.dataset.prevH;
    win.style.left = win.dataset.prevL;
    win.style.top = win.dataset.prevT;
  } else {
    win.dataset.prevW = win.style.width;
    win.dataset.prevH = win.style.height;
    win.dataset.prevL = win.style.left;
    win.dataset.prevT = win.style.top;
    win.classList.add('maximized');
    win.style.left = '0';
    win.style.top = `${MENU_H}px`;
    win.style.width = '100%';
    win.style.height = `calc(100% - ${MENU_H}px)`;
  }
}

// ─── Mouse move / up globaux ───
document.addEventListener('mousemove', e => {
  if (!dragState) return;

  const el = dragState.element;

  // ─── Redimensionnement ───
  if (dragState.type === 'resize') {
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const dir = dragState.direction;
    const MIN_W = 300;
    const MIN_H = 200;

    let newW = dragState.startW;
    let newH = dragState.startH;
    let newL = dragState.startL;
    let newT = dragState.startT;

    if (dir.includes('e')) newW = Math.max(MIN_W, dragState.startW + dx);
    if (dir.includes('s')) newH = Math.max(MIN_H, dragState.startH + dy);
    if (dir.includes('w')) {
      newW = Math.max(MIN_W, dragState.startW - dx);
      newL = dragState.startL + dragState.startW - newW;
    }

    el.style.width  = `${newW}px`;
    el.style.height = `${newH}px`;
    el.style.left   = `${newL}px`;
    el.style.top    = `${newT}px`;
    return;
  }

  // ─── Drag icône / fenêtre ───
  const doff = DESKTOP.getBoundingClientRect();
  let x = e.clientX - dragState.offsetX - doff.left;
  let y = e.clientY - dragState.offsetY - doff.top;

  // Détacher du cercle si le drag dépasse 10px
  if (dragState.type === 'icon') {
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    // Marquer comme dragé pour éviter l'ouverture de fenêtre
    if (dx*dx + dy*dy > 16) dragState.element.dataset._dragged = 'true';
    if (!dragState.detached && dragState.element.dataset.category && dx*dx + dy*dy > 100) {
      dragState.detached = true;
      dragState.element.dataset.detached = 'true';
      dragState.element.style.zIndex = 90;
      dragState.element.style.scale = String(ICON_SCALE);
      // Si le cercle était en pause, le relancer
      circlePaused = false;
    }
  }

  if (dragState.type === 'window') {
    y = Math.max(0, y);
  }

  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;

});

document.addEventListener('mouseup', () => {
  if (dragState) {
    dragState.element.classList.remove('dragging');
    dragState = null;
  }
});
document.addEventListener('touchend', () => {
  // Sécurité : cleanup dragState au cas où touchend sur l'icône n'a pas marché
  if (dragState && dragState.type === 'icon') {
    dragState.element.classList.remove('dragging');
    dragState = null;
  }
});

// ─── Filtre par catégorie (Réalisation / Post-Production) ───
let activeCategory = null;

function resetFilter() {
  activeCategory = null;
  activeBrand = null;
  document.querySelectorAll('.desktop-icon').forEach(icon => icon.classList.remove('dimmed'));
  document.querySelectorAll('.menu-category').forEach(el => el.classList.remove('active-category'));
  document.querySelectorAll('.brand-logo').forEach(l => l.classList.remove('brand-active'));
}

function filterCategory(cat) {
  const icons = document.querySelectorAll('.desktop-icon');

  // Désactivation si on reclique sur la même catégorie
  if (activeCategory === cat) {
    activeCategory = null;
    icons.forEach(icon => icon.classList.remove('dimmed'));
    document.querySelectorAll('.menu-category').forEach(el => el.classList.remove('active-category'));
    return;
  }

  activeCategory = cat;

  // Appliquer le filtre (CV et Contact sans catégorie restent toujours visibles)
  icons.forEach(icon => {
    if (!icon.dataset.category) return;
    const cats = icon.dataset.category.split(' ');
    icon.classList.toggle('dimmed', !cats.includes(cat));
  });

  document.querySelectorAll('.menu-category').forEach(el => {
    el.classList.toggle('active-category', el.dataset.category === cat);
  });

  // Reset brand filter si actif
  if (activeBrand) {
    activeBrand = null;
    document.querySelectorAll('.brand-logo').forEach(l => l.classList.remove('brand-active'));
  }
}

// ─── Filtre par marque ───
const brandProjects = {
  adidas: ['olmaillot', 'lyonenmodefunk', 'intersportadidas'],
  decathlon: [],
  ol: ['olmaillot', 'lyonenmodefunk'],
  puma: [],
  eafc: ['eafut', 'earatings'],
  highlo: ['highlo'],
  laligue: [],
  unibet: ['unibetnasri'],
  whentocop: [],
  boatpartysplit: ['boatpartysplit'],
  intersport: ['intersportadidas'],
};

let activeBrand = null;

function filterBrand(brand) {
  const icons = document.querySelectorAll('.desktop-icon');

  if (activeBrand === brand) {
    activeBrand = null;
    icons.forEach(icon => icon.classList.remove('dimmed'));
    document.querySelectorAll('.brand-logo').forEach(l => {
      l.classList.remove('brand-active');
      l.style.opacity = '';
      l.style.filter = '';
    });
    return;
  }

  activeBrand = brand;

  if (activeCategory) {
    activeCategory = null;
    document.querySelectorAll('.menu-category').forEach(el => el.classList.remove('active-category'));
  }

  const windows = brandProjects[brand] || [];
  icons.forEach(icon => {
    if (!icon.dataset.window) return;
    icon.classList.toggle('dimmed', !windows.includes(icon.dataset.window));
  });

  document.querySelectorAll('.brand-logo').forEach(l => {
    const isMatch = l.dataset.brand === brand;
    l.classList.toggle('brand-active', isMatch);
    if (isMatch) {
      l.style.opacity = '1';
      l.style.filter = '';
    } else {
      l.style.opacity = '0.2';
      l.style.filter = 'brightness(0) invert(0.6)';
    }
  });
}

// Click handlers sur les logos
document.querySelectorAll('.brand-logo').forEach(logo => {
  logo.addEventListener('click', () => filterBrand(logo.dataset.brand));
});

// ─── Variables globales pour la rotation du cercle ───
let circleAngle = 0;
let circleCenterX = 0;
let circleCenterY = 0;
let circleRadius = 0;
let circleBaseRadius = 0;
let circleAnimId = null;
let circlePaused = false;
let scrollVel = 0;
const ICON_SCALE = 1.8; // facteur d'agrandissement des vignettes
const MAX_SCROLL_SPEED = 120; // vélocité de scroll pour un élargissement max
const RADIUS_EXPAND = 0.3;    // élargissement max du cercle (+30%)

// ─── Positionnement en cercle des projets + rotation lente ───
function shuffleProjectIcons() {
  const projectIcons = document.querySelectorAll('.desktop-icon[data-category]');
  if (!projectIcons.length) return;

  // Utiliser les dimensions réelles du desktop pour un centrage parfait
  const dw = DESKTOP.clientWidth;
  const dh = DESKTOP.clientHeight;
  const cx = dw / 2;
  const cy = dh / 2;
  const radiusMultiplier = isMobile ? 0.55 : 0.37;
  const radius = Math.min(480, Math.min(dw, dh) * radiusMultiplier);
  const count = projectIcons.length;
  const step = (2 * Math.PI) / count;

  // Créer les angles de base (un cercle complet)
  const angles = Array.from({ length: count }, (_, i) => i * step - Math.PI / 2);

  // Fisher-Yates shuffle des angles
  for (let i = angles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [angles[i], angles[j]] = [angles[j], angles[i]];
  }

  // Stocker l'angle de chaque icône
  projectIcons.forEach((icon, i) => {
    icon.dataset.angle = angles[i];
  });

  // Sauvegarder les paramètres du cercle pour la rotation
  circleCenterX = cx;
  circleCenterY = cy;
  circleBaseRadius = radius;
  circleRadius = radius;

  // Position initiale + démarrer la rotation
  circleAngle = 0;
  updateCirclePositions();
  startCircleRotation();
}

function updateCirclePositions() {
  const icons = document.querySelectorAll('.desktop-icon[data-category]');
  const radiusY = circleRadius * 0.45;

  icons.forEach(icon => {
    if (icon.dataset.detached === 'true') return;
    const angle = parseFloat(icon.dataset.angle) + circleAngle;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    const x = circleCenterX + circleRadius * cosA;
    const y = circleCenterY + radiusY * sinA;
    const halfW = icon.offsetWidth / 2 || 44;
    const halfH = icon.offsetHeight / 2 || 50;
    icon.style.left = `${x - halfW}px`;
    icon.style.top = `${y - halfH}px`;

    const depth = (sinA + 1) / 2; // 0 (fond) → 1 (avant)
    const depthScale = ICON_SCALE * (1 + 0.42 * sinA);
    const box = icon.querySelector('.icon-box');
    if (box) {
      // Léger halo lumineux sur l'icône la plus en avant (désactivé sur mobile pour les perfs)
      if (!isMobile) {
        const glow = Math.max(0, sinA) * 18;
        box.style.boxShadow = glow > 0 ? `0 0 ${glow}px rgba(255,255,255,${0.04 + depth * 0.06})` : 'none';
      }
    }
    icon.style.scale = depthScale;
    icon.style.zIndex = Math.round(50 + 40 * sinA);
    // Fondu doux : l'icône derrière s'estompe quand une autre passe devant
    // Respecter le filtre dimmed si actif
    if (!icon.classList.contains('dimmed')) {
      icon.style.opacity = 0.78 + 0.22 * depth;
    } else {
      icon.style.opacity = '';
    }
  });
}

function startCircleRotation() {
  if (circleAnimId) cancelAnimationFrame(circleAnimId);
  let last = performance.now();
  scrollVel = 0;

  // Le scroll alimente uniquement la rotation du cercle, pas la page
  document.addEventListener('wheel', e => {
    if (e.target.closest && e.target.closest('#photo-view')) return; // laisse scroller la galerie
    e.preventDefault();
    scrollVel += e.deltaY * 0.3;
  }, { passive: false });

  // Sur mobile : le swipe vertical fait tourner le cercle
  let touchStartY = 0;
  let touchActive = false;
  document.addEventListener('touchstart', e => {
    // Ignorer si on touche une icône, une fenêtre ou le menu
    if (e.target.closest('.desktop-icon')) return;
    if (e.target.closest('.window')) return;
    if (e.target.closest('.mode-toggle')) return;
    if (e.target.closest('#logos-panel')) return;
    if (e.target.closest('#photo-view')) return;
    touchStartY = e.touches[0].clientY;
    touchActive = true;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!touchActive) return;
    const dy = e.touches[0].clientY - touchStartY;
    scrollVel += dy * 1.0;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchend', () => { touchActive = false; }, { passive: true });

  function tick(now) {
    const dt = now - last;
    last = now;

    // Decay naturelle de la vélocité
    scrollVel += (0 - scrollVel) * 0.04;

    // Élargit le cercle selon la vitesse de scroll (désactivé sur mobile)
    if (!isMobile) {
      const speedFactor = Math.min(Math.abs(scrollVel) / MAX_SCROLL_SPEED, 1);
      const targetRadius = circleBaseRadius * (1 + RADIUS_EXPAND * speedFactor);
      circleRadius += (targetRadius - circleRadius) * 0.1;
    }

    const speed = dt * 0.00002 + scrollVel * 0.0006;

    if (!circlePaused && (!dragState || dragState.detached)) {
      circleAngle += speed;
      updateCirclePositions();
    }
    circleAnimId = requestAnimationFrame(tick);
  }
  tick(performance.now());
}

// Pause la rotation pendant le drag d'une icône (sauf si déjà détachée)
document.addEventListener('mousedown', e => {
  if (e.target.closest('.desktop-icon[data-category]') && !e.target.closest('[data-detached]')) circlePaused = true;
});
document.addEventListener('mouseup', () => { circlePaused = false; });

// Attendre que le layout soit stable avant de positionner les icônes (évite le décalage au lancement)
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    shuffleProjectIcons();
  });
});

// ─── Recalculer le cercle au resize ───
window.addEventListener('resize', () => {
  if (document.querySelectorAll('.desktop-icon[data-category]').length === 0) return;
  const dw = DESKTOP.clientWidth;
  const dh = DESKTOP.clientHeight;
  circleCenterX = dw / 2;
  circleCenterY = dh / 2;
  if (isMobile) {
    circleBaseRadius = Math.min(480, Math.min(dw, dh) * 0.55);
  } else {
    circleBaseRadius = Math.min(480, Math.min(dw, dh) * 0.37);
  }
  circleRadius = circleBaseRadius;
  updateCirclePositions();
});

// ─── Scroll-driven marquee (pixels, période mesurée à chaque frame) ───
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
  const logos = marqueeTrack.querySelectorAll('.brand-logo');
  const half = Math.floor(logos.length / 2);
  let marqueePos = 0;
  let smoothVel = 0;
  let wrap = 0;

  const BASE_SPEED = 0.25;
  const SCROLL_GAIN = 0.15;

  document.addEventListener('wheel', e => {
    smoothVel += e.deltaY * 0.5;
  }, { passive: false });

  let marqueeTouchY = 0;
  let marqueeTouching = false;
  document.addEventListener('touchstart', e => {
    if (e.target.closest('.desktop-icon') || e.target.closest('.window') || e.target.closest('.mode-toggle')) return;
    marqueeTouchY = e.touches[0].clientY;
    marqueeTouching = true;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!marqueeTouching) return;
    const dy = e.touches[0].clientY - marqueeTouchY;
    smoothVel += dy * 0.8;
    marqueeTouchY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', () => { marqueeTouching = false; }, { passive: true });

  const marqueeContainer = document.querySelector('.marquee-container');
  if (marqueeContainer) {
    let logoTouchX = 0;
    let logoTouchStartPos = 0;
    let logoTouchPrevX = 0;
    let logoVel = 0;
    let logoTouching = false;

    marqueeContainer.addEventListener('touchstart', e => {
      logoTouchX = e.touches[0].clientX;
      logoTouchStartPos = marqueePos;
      logoTouchPrevX = e.touches[0].clientX;
      logoVel = 0;
      logoTouching = true;
    }, { passive: true });

    marqueeContainer.addEventListener('touchmove', e => {
      if (!logoTouching) return;
      const dx = logoTouchX - e.touches[0].clientX;
      marqueePos = logoTouchStartPos + dx;
      const deltaX = logoTouchPrevX - e.touches[0].clientX;
      logoVel = logoVel * 0.6 + deltaX * 0.4;
      logoTouchPrevX = e.touches[0].clientX;
      smoothVel = 0;
      if (wrap > 0) {
        if (marqueePos >= wrap) marqueePos -= wrap;
        if (marqueePos < 0) marqueePos += wrap;
      }
      e.preventDefault();
    }, { passive: false });

    marqueeContainer.addEventListener('touchend', () => {
      logoTouching = false;
      // Inertie : on continue sur la lancée du swipe
      smoothVel = logoVel / SCROLL_GAIN;
    }, { passive: true });
    marqueeContainer.addEventListener('touchcancel', () => { logoTouching = false; }, { passive: true });
  }

  function tickMarquee() {
    // Mesure de la période (exacte, auto-corrigée à chaque frame)
    if (logos.length >= 2) {
      const w = logos[half].offsetLeft - logos[0].offsetLeft;
      if (w > 0) wrap = w;
    }

    smoothVel += (0 - smoothVel) * 0.05;
    const speed = BASE_SPEED + smoothVel * SCROLL_GAIN;
    marqueePos += speed;

    if (wrap > 0) {
      if (marqueePos >= wrap) marqueePos -= wrap;
      if (marqueePos < 0) marqueePos += wrap;
    }

    marqueeTrack.style.transform = `translateX(${-marqueePos}px)`;
    requestAnimationFrame(tickMarquee);
  }
  tickMarquee();
}

// ─── Mobile sidebar toggle ───
(function() {
  const btn = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!btn || !sidebar || !overlay) return;

  function openSidebar() { sidebar.classList.add('open'); overlay.classList.add('visible'); }
  function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('visible'); }

  btn.addEventListener('click', () => {
    if (btn.dataset.mode === 'back') {
      let frontWin = null;
      let maxZ = -1;
      Object.values(openWindows).forEach((w) => {
        if (!document.body.contains(w)) return;
        const z = parseInt(w.style.zIndex, 10) || 0;
        if (z > maxZ) { maxZ = z; frontWin = w; }
      });
      if (frontWin) closeWindow(frontWin);
      return;
    }
    openSidebar();
  });
  overlay.addEventListener('click', closeSidebar);

  // Fermer le drawer quand on clique sur un item du menu
  sidebar.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', closeSidebar);
  });

  // Close on window resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) closeSidebar();
  });
})();

// ─── Navigation ───
function scrollToAbout() {
  // Sur la page photo, revenir d'abord au mode vidéo pour dévoiler la section À propos
  if (currentMode === 'photo') setMode('video');
  document.body.classList.remove('overflow-hidden');
  document.getElementById('retour-btn')?.classList.remove('hidden');
  document.getElementById('logos-panel')?.classList.add('fade-hidden');
  // Sur mobile, libérer aussi le desktop du fullscreen lock
  if (isMobile) {
    document.getElementById('desktop').style.overflow = 'visible';
    document.getElementById('desktop').style.height = 'auto';
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }
  setTimeout(() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }), 10);
}

function retourAuBureau() {
  document.getElementById('retour-btn')?.classList.add('hidden');
  document.getElementById('logos-panel')?.classList.remove('fade-hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (isMobile) {
    document.getElementById('desktop').style.overflow = 'hidden';
    document.getElementById('desktop').style.height = '100dvh';
    document.documentElement.style.setProperty('overflow', 'hidden', 'important');
    document.body.style.setProperty('overflow', 'hidden', 'important');
  }
  setTimeout(() => document.body.classList.add('overflow-hidden'), 300);
}

// ─── Contact ───
function sendContact(e) {
  e.preventDefault();
  const name = document.getElementById('contact-name')?.value.trim() || '';
  const email = document.getElementById('contact-email')?.value.trim() || '';
  const msg = document.getElementById('contact-msg')?.value.trim() || '';
  const body = `Nom: ${name}\nEmail: ${email}\n\n${msg}`;
  window.location.href = `mailto:bouvy.mathieu@gmail.com?subject=Portfolio&body=${encodeURIComponent(body)}`;
}

// ─── Mode Vidéo / Photo ───
let currentMode = 'video';
let basePhotos = [];
let galleryPhotos = [];
let galleryIndex = 0;
let currentRow = [];
let currentRowWidth = 0;
let containerWidth = 0;
let rowHeight = 0;
const BATCH = 40;

function setMode(mode) {
  currentMode = mode;
  document.body.classList.toggle('mode-photo', mode === 'photo');
  const toggle = document.getElementById('mode-toggle');
  if (toggle) toggle.classList.toggle('photo-active', mode === 'photo');
  document.querySelectorAll('.mode-toggle-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  if (mode === 'photo') {
    circlePaused = true;
    resetFilter();
    if (!basePhotos.length) loadGallery();
  } else {
    circlePaused = false;
  }
}

// ─── Galerie photo (layout justifié + scroll infini) ───
function photoFor(i) {
  return basePhotos[i % basePhotos.length];
}

function layout() {
  const grid = document.getElementById('photo-grid');
  containerWidth = (grid && grid.clientWidth) || window.innerWidth;
  rowHeight = window.innerWidth < 768 ? 150 : 240;
}

function flushRow(scale) {
  const grid = document.getElementById('photo-grid');
  const rowEl = document.createElement('div');
  rowEl.className = 'photo-row';
  rowEl.style.height = `${Math.round(rowHeight * scale)}px`;
  currentRow.forEach((entry) => {
    const cell = document.createElement('figure');
    cell.className = 'photo-item';
    cell.style.width = `${Math.round(entry.width * scale)}px`;
    const p = entry.photo;
    cell.innerHTML = `<img src="${p.thumb}" alt="" loading="lazy" decoding="async">`;
    cell.addEventListener('click', () => openLightbox(entry.index));
    rowEl.appendChild(cell);
  });
  grid.appendChild(rowEl);
  currentRow = [];
  currentRowWidth = 0;
}

function appendPhotos(count) {
  if (!basePhotos.length) return;
  for (let k = 0; k < count; k++) {
    const index = galleryPhotos.length;
    const photo = photoFor(index);
    galleryPhotos.push(photo);
    const w = rowHeight * (photo.aspect || 1);
    currentRow.push({ photo, index, width: w });
    currentRowWidth += w;
    if (currentRowWidth >= containerWidth * 0.92) flushRow(containerWidth / currentRowWidth);
  }
}

function renderAll() {
  const grid = document.getElementById('photo-grid');
  layout();
  grid.innerHTML = '';
  currentRow = [];
  currentRowWidth = 0;
  if (!galleryPhotos.length) {
    grid.innerHTML = '<p class="photo-empty">Aucune photo pour l\'instant.<br>Ajoute tes images dans <code>to add/</code> puis lance <code>npm run photos</code>.</p>';
    return;
  }
  const photos = galleryPhotos.slice();
  galleryPhotos = [];
  photos.forEach((p) => {
    const index = galleryPhotos.length;
    galleryPhotos.push(p);
    const w = rowHeight * (p.aspect || 1);
    currentRow.push({ photo: p, index, width: w });
    currentRowWidth += w;
    if (currentRowWidth >= containerWidth * 0.92) flushRow(containerWidth / currentRowWidth);
  });
}

async function loadGallery() {
  const grid = document.getElementById('photo-grid');
  if (!grid) return;
  try {
    const res = await fetch('assets/gallery/photos.json');
    basePhotos = await res.json();
  } catch {
    basePhotos = [];
  }
  // Ordre aléatoire (Fisher-Yates)
  for (let i = basePhotos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [basePhotos[i], basePhotos[j]] = [basePhotos[j], basePhotos[i]];
  }
  galleryPhotos = [];
  currentRow = [];
  currentRowWidth = 0;
  layout();
  grid.innerHTML = '';
  if (!basePhotos.length) {
    grid.innerHTML = '<p class="photo-empty">Aucune photo pour l\'instant.<br>Ajoute tes images dans <code>to add/</code> puis lance <code>npm run photos</code>.</p>';
    return;
  }
  appendPhotos(BATCH * 2);
}

// Scroll infini en bas de la page photo
const photoViewEl = document.getElementById('photo-view');
if (photoViewEl) {
  photoViewEl.addEventListener('scroll', () => {
    if (photoViewEl.scrollTop + photoViewEl.clientHeight >= photoViewEl.scrollHeight - 400) {
      appendPhotos(BATCH);
    }
  });
}

window.addEventListener('resize', () => {
  if (document.body.classList.contains('mode-photo') && galleryPhotos.length) renderAll();
});

// ─── Lightbox ───
function openLightbox(i) {
  if (!galleryPhotos.length) return;
  galleryIndex = i;
  updateLightbox();
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}
function updateLightbox() {
  const p = galleryPhotos[galleryIndex];
  if (!p) return;
  const img = document.getElementById('lightbox-img');
  img.src = p.full;
  img.alt = '';
  document.getElementById('lightbox-caption').textContent = '';
  document.getElementById('lightbox-count').textContent = `${galleryIndex + 1} / ${galleryPhotos.length}`;
}
function lightboxPrev() {
  galleryIndex = (galleryIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
  updateLightbox();
}
function lightboxNext() {
  galleryIndex = (galleryIndex + 1) % galleryPhotos.length;
  updateLightbox();
}

(function () {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn) {
      const action = btn.dataset.action;
      if (action === 'close') closeLightbox();
      else if (action === 'prev') lightboxPrev();
      else if (action === 'next') lightboxNext();
      return;
    }
    if (e.target.id === 'lightbox-img') lightboxNext();
    else if (e.target === lb) closeLightbox();
  });

  let tx = 0;
  lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) (dx < 0 ? lightboxNext() : lightboxPrev());
  }, { passive: true });
})();

document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowLeft') lightboxPrev();
  else if (e.key === 'ArrowRight') lightboxNext();
});

// ─── Barre espace : pause/lecture de la vidéo au premier plan ───
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space') return;
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;

  const windows = document.querySelectorAll('.window');
  let front = null;
  let maxZ = -1;
  windows.forEach((w) => {
    const z = parseInt(w.style.zIndex, 10) || 0;
    if (z > maxZ) { maxZ = z; front = w; }
  });
  if (!front) return;
  const video = front.querySelector('video');
  if (!video) return;

  e.preventDefault();
  if (video.paused) video.play();
  else video.pause();
});

// ─── Projets (manifest data-driven) ───
let PROJECTS = {};

async function loadProjects() {
  try {
    const res = await fetch('assets/projects.json');
    const arr = await res.json();
    PROJECTS = {};
    arr.forEach((p) => { PROJECTS[p.id] = p; });
  } catch (e) {
    console.error('projects.json introuvable', e);
  }
}
loadProjects();

function embedUrl(item) {
  if (item.provider === 'vimeo') {
    return `https://player.vimeo.com/video/${item.id}?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1`;
  }
  return `https://www.youtube.com/embed/${item.id}?autoplay=1`;
}

function buildProjectBody(project) {
  const credits = project.credits || [];
  const creditsHTML = credits.map((c) => `<span class="block">${c}</span>`).join('\n');
  const creditsToggle = credits.length
    ? '<button class="project-credits-btn text-gray-600 hover:text-gray-400 transition-colors mt-1 block text-xs">▼ Développer les crédits</button>'
    : '';
  return `
    <div class="flex flex-col h-full">
      <div class="flex-1 min-h-0 relative bg-black/40 overflow-hidden">
        <div class="project-media"></div>
        <button class="project-nav project-prev" aria-label="Précédent">&#8249;</button>
        <button class="project-nav project-next" aria-label="Suivant">&#8250;</button>
        <span class="project-counter"></span>
        <span class="project-label"></span>
      </div>
      <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4 pt-3">
        <span class="block">${project.description || ''}</span>
        <div class="project-credits hidden text-gray-500 mt-1 leading-relaxed space-y-1">${creditsHTML}</div>
        ${creditsToggle}
      </div>
    </div>`;
}

function setupProjectCarousel(win, project) {
  const media = project.media || [];
  let index = 0;
  const mediaEl = win.querySelector('.project-media');
  const counterEl = win.querySelector('.project-counter');
  const prevBtn = win.querySelector('.project-prev');
  const nextBtn = win.querySelector('.project-next');
  const labelEl = win.querySelector('.project-label');

  function render(i) {
    if (!media.length) return;
    index = (i + media.length) % media.length;
    const item = media[index];
    if (item.type === 'video') {
      if (item.src) {
        mountVideoPlayer(mediaEl, item);
      } else {
        const allow = item.provider === 'vimeo'
          ? 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share'
          : 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        mediaEl.innerHTML = `<iframe class="w-full h-full" src="${embedUrl(item)}" frameborder="0" allow="${allow}" allowfullscreen title="${project.title}" style="position:absolute;inset:0;width:100%;height:100%;"></iframe>`;
      }
    } else {
      mediaEl.innerHTML = `<img src="${item.src}" alt="" class="w-full h-full object-contain" style="position:absolute;inset:0;background:#000;">`;
    }
    const multiple = media.length > 1;
    prevBtn.style.display = multiple ? '' : 'none';
    nextBtn.style.display = multiple ? '' : 'none';
    counterEl.textContent = multiple ? `${index + 1} / ${media.length}` : '';
    if (labelEl) labelEl.textContent = item.label || '';
  }

  prevBtn.addEventListener('click', () => render(index - 1));
  nextBtn.addEventListener('click', () => render(index + 1));
  render(0);

  const creditsBtn = win.querySelector('.project-credits-btn');
  if (creditsBtn) {
    creditsBtn.addEventListener('click', () => {
      const credits = win.querySelector('.project-credits');
      const isOpen = !credits.classList.contains('hidden');
      credits.classList.toggle('hidden', isOpen);
      creditsBtn.textContent = isOpen ? '▼ Développer les crédits' : '▲ Réduire les crédits';
    });
  }
}

// ─── Lecteur vidéo custom (auto-hébergé) ───
function formatTime(s) {
  if (!isFinite(s) || s < 0) return '0:00';
  s = Math.floor(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}

function mountVideoPlayer(container, item) {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-player';

  const video = document.createElement('video');
  video.src = item.src;
  if (item.poster) video.poster = item.poster;
  video.autoplay = true;
  video.playsInline = true;
  video.loop = true;
  video.preload = 'auto';
  wrapper.appendChild(video);

  const loading = document.createElement('div');
  loading.className = 'video-loading';
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  loading.appendChild(spinner);
  wrapper.appendChild(loading);

  const bigPlay = document.createElement('button');
  bigPlay.className = 'video-big-play';
  bigPlay.innerHTML = '&#9654;';
  bigPlay.addEventListener('click', () => video.play());
  wrapper.appendChild(bigPlay);

  const controls = document.createElement('div');
  controls.className = 'video-controls';

  const playBtn = document.createElement('button');
  playBtn.className = 'video-control-btn';
  playBtn.innerHTML = '&#10074;&#10074;';
  controls.appendChild(playBtn);

  const time = document.createElement('span');
  time.className = 'video-time';
  time.textContent = '0:00 / 0:00';
  controls.appendChild(time);

  const progress = document.createElement('div');
  progress.className = 'video-progress';
  const fill = document.createElement('div');
  fill.className = 'video-progress-fill';
  progress.appendChild(fill);
  controls.appendChild(progress);

  const muteBtn = document.createElement('button');
  muteBtn.className = 'video-control-btn';
  muteBtn.innerHTML = '&#128266;';
  controls.appendChild(muteBtn);

  const fsBtn = document.createElement('button');
  fsBtn.className = 'video-control-btn';
  fsBtn.innerHTML = '&#x26F6;';
  controls.appendChild(fsBtn);

  wrapper.appendChild(controls);

  function togglePlay() {
    if (video.paused) video.play();
    else video.pause();
  }
  function updateUI() {
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    fill.style.width = pct + '%';
    time.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    playBtn.innerHTML = video.paused ? '&#9654;' : '&#10074;&#10074;';
    wrapper.classList.toggle('paused', video.paused);
  }

  playBtn.addEventListener('click', togglePlay);
  video.addEventListener('click', togglePlay);
  bigPlay.addEventListener('click', () => video.play());

  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    muteBtn.innerHTML = video.muted ? '&#128263;' : '&#128266;';
  });

  fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (wrapper.requestFullscreen) wrapper.requestFullscreen();
  });

  let hideTimer = null;

  // Drag de la barre de lecture (souris + tactile)
  let seeking = false;
  function seekFromEvent(e) {
    if (!video.duration) return;
    const rect = progress.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * video.duration;
    fill.style.width = (pct * 100) + '%';
    time.textContent = `${formatTime(pct * video.duration)} / ${formatTime(video.duration)}`;
  }
  progress.addEventListener('pointerdown', (e) => {
    seeking = true;
    wrapper.classList.add('seeking');
    clearTimeout(hideTimer);
    try { progress.setPointerCapture(e.pointerId); } catch (err) {}
    seekFromEvent(e);
    e.preventDefault();
  });
  progress.addEventListener('pointermove', (e) => {
    if (!seeking) return;
    seekFromEvent(e);
  });
  function endSeek() {
    seeking = false;
    wrapper.classList.remove('seeking');
    wrapper.classList.add('active');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => wrapper.classList.remove('active'), 1000);
  }
  progress.addEventListener('pointerup', endSeek);
  progress.addEventListener('pointercancel', endSeek);

  video.addEventListener('timeupdate', updateUI);
  video.addEventListener('play', updateUI);
  video.addEventListener('pause', updateUI);
  video.addEventListener('loadedmetadata', updateUI);

  // Indicateur de chargement
  loading.classList.add('visible');
  video.addEventListener('canplay', () => loading.classList.remove('visible'));
  video.addEventListener('playing', () => loading.classList.remove('visible'));
  video.addEventListener('waiting', () => loading.classList.add('visible'));
  video.addEventListener('error', () => loading.classList.remove('visible'));

  // Auto-masquage des contrôles pendant la lecture
  wrapper.addEventListener('mousemove', () => {
    wrapper.classList.add('active');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => wrapper.classList.remove('active'), 1000);
  });
  wrapper.addEventListener('mouseleave', () => wrapper.classList.remove('active'));

  container.innerHTML = '';
  container.appendChild(wrapper);
  updateUI();
  // Autoplay fiable : l'attribut seul peut être ignoré, on force play()
  video.play().catch(() => {});
}

// ─── Écran de chargement + intro du cercle ───
let introPlayed = false;
function playIntro() {
  if (introPlayed || !circleBaseRadius) return;
  introPlayed = true;
  if (isMobile) return; // pas d'animation d'ouverture sur mobile
  circleRadius = circleBaseRadius * 1.6;
  scrollVel = 80;
}
function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader || loader.classList.contains('hidden')) return;
  loader.classList.add('hidden');
  setTimeout(() => loader.remove(), 600);
  playIntro();
}
window.addEventListener('load', hideLoader);
setTimeout(() => hideLoader(), 4000);
