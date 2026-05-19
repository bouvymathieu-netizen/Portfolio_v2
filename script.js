// ─── Clock ───
function updateClock() {
  const now = new Date();
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const day = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const clockDesktop = document.getElementById('clock-desktop');
  if (clockDesktop) clockDesktop.textContent = `${day} ${date} ${month}  ${h}:${m}`;
}
updateClock();
setInterval(updateClock, 10000);


// ─── État global ───
let zIndex = 100;
let dragState = null;   // { type, element, offsetX, offsetY }
let windowCount = 0;
const DESKTOP = document.getElementById('desktop');
const openWindows = {}; // type → element, pour éviter les doublons

const isMobile = window.matchMedia('(max-width: 768px), (max-height: 600px)').matches;

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
    const rect = icon.getBoundingClientRect();
    dragState = {
      type: 'icon',
      element: icon,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
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

// ─── Mobile : appui long → drag, tap simple → fenêtre ───
if (isMobile) {
let longPressTimer = null;
let longPressActive = false;
let touchStartPos = null;

icons.forEach(icon => {
  icon.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartPos = { x: t.clientX, y: t.clientY };
    longPressActive = false;

    longPressTimer = setTimeout(() => {
      longPressActive = true;
      circlePaused = true;
      const rect = icon.getBoundingClientRect();
      dragState = {
        type: 'icon',
        element: icon,
        offsetX: t.clientX - rect.left,
        offsetY: t.clientY - rect.top,
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
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        clearTimeout(longPressTimer);
        touchStartPos = null;
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

  const sizes = {
    vimeo:  { w: 640, h: 409, title: 'Portfolio_Homepage' },
    manou:  { w: 640, h: 360, title: 'Manou<wbr>Vaste Monde' },
    nikon:  { w: 720, h: 500, title: 'NIKON<wbr>Mono no Aware' },
    puma:   { w: 380, h: 675, title: 'PUMAxDECATHLON<wbr>Aftermovie' },
    ol:     { w: 380, h: 675, title: 'OLxLALIGUE<wbr>Aftermovie' },
    youtube:{ w: 720, h: 454, title: 'SAMPLE<wbr>Raska Isia' },
    eafut:  { w: 380, h: 725, title: 'EA<wbr>Fut<wbr>Birthday' },
    earatings:{ w: 720, h: 454, title: 'EA<wbr>Ratings<wbr>OM' },
    adidas: { w: 380, h: 675, title: 'ADIDAS<wbr>Vintage Market' },
    highlo: { w: 380, h: 675, title: 'HIGHLO<wbr>Bushi' },
    jumpman:{ w: 380, h: 675, title: 'JUMPMAN<wbr>fx' },
    kanaga: { w: 380, h: 675, title: 'KANAGA<wbr>Foule Désirs' },
    laligue:{ w: 380, h: 675, title: 'LALIGUE<wbr>Lyon street food festival' },
    pola:   { w: 380, h: 675, title: 'LALIGUE<wbr>Pola freestyle' },
    nikon2024:{ w: 720, h: 454, title: 'NIKON<wbr>2024' },
    pumacrampons:{ w: 720, h: 454, title: 'PUMA<wbr>Crampons' },
    wallace: { w: 720, h: 454, title: 'PUNCHOLOGUE<wbr>Wallace Cleaver' },
    sofianee:{ w: 720, h: 454, title: 'SOFIANEE<wbr>Gold digger' },
    udol:   { w: 380, h: 675, title: 'UDOL<wbr>Gameday' },
    unibet: { w: 380, h: 675, title: 'UNIBET<wbr>Greg MMA' },
    unibetnasri:{ w: 380, h: 675, title: 'UNIBET<wbr>Greg MMA x SAmir NASRI' },
    anooki: { w: 380, h: 675, title: 'VILLEDELYON<wbr>Anooki' },
    whentocop:{ w: 380, h: 675, title: 'WHENTOCOP<wbr>Nike Air max' },
    plus33fm:{ w: 380, h: 675, title: 'PLUS33<wbr>Motion' },
    plus33logos:{ w: 720, h: 454, title: 'PLUS33<wbr>Logos Animées' },
    olmaillot:{ w: 720, h: 454, title: 'OL<wbr>Nouveau Maillot' },
    cv:     { w: 600, h: 800, title: 'CV' },
    contact:{ w: 440, h: 460, title: 'Contact' },
  };
  const cfg = sizes[type] || sizes.vimeo;
  const offset = 30 + windowCount * 24;

  win.style.width = `${cfg.w}px`;
  win.style.height = `${cfg.h}px`;
    win.style.zIndex = baseZ;
  // centré
  win.style.left = `${(window.innerWidth - cfg.w) / 2}px`;
  win.style.top = `${(window.innerHeight - cfg.h) / 2}px`;

  // Contenu
  let bodyHTML = '';
  switch (type) {
    case 'vimeo':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 overflow-hidden mb-3" style="position:relative;">
            <iframe src="https://player.vimeo.com/video/1055991297?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=1&amp;muted=1&amp;loop=1"
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
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/DBd60DzZuKg?autoplay=1&amp;mute=1"
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

    case 'puma':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/I2QqF8yEKqE?autoplay=1&amp;mute=1"
                    title="PUMA_x_DECATHLON_Aftermovie" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Retour en image sur la Draft organisée par @said_piedscarres et @yannoujr pour sélectionner les meilleures pépites pour la 1vs1 Cup cet été. <span class="dots">...</span></span>

            <div class="hidden text-gray-500 mt-1 leading-relaxed space-y-1">
              <span class="block">Client : @greengardenops</span>
              <span class="block">Captation & Montage : @mathieu.bouvy</span>
            </div>

            <button onclick="var d=this.previousElementSibling,dots=d.previousElementSibling.querySelector('.dots');d.classList.toggle('hidden');dots.classList.toggle('hidden');this.textContent=d.classList.contains('hidden')?'▼ Développer les crédits':'▲ Réduire les crédits'"
                    class="text-gray-600 hover:text-gray-400 transition-colors mt-1 block text-xs">
              ▼ Développer les crédits
            </button>
          </div>
        </div>`;
      break;

    case 'ol':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/_PudK3T0x7E?autoplay=1&amp;mute=1"
                    title="OL_x_LALIGUE_Aftermovie" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Les coulisses de notre shooting Third avec les commerçants et habitants du Vieux Lyon 🎥 <span class="dots">...</span></span>

            <div class="hidden text-gray-500 mt-1 leading-relaxed space-y-1">
              <span class="block">Client : @greengardenops</span>
              <span class="block">Captation & Montage : @mathieu.bouvy</span>
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
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/6qIcuHd1Vzc?autoplay=1&amp;mute=1"
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
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/MqOMdPY08zU?autoplay=1&amp;mute=1"
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
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/gJcIfowmhUU?autoplay=1&amp;mute=1"
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
            <iframe src="https://player.vimeo.com/video/1104271031?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=1&amp;muted=1"
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
                <img src="assets/photos/pdp.jpg" alt="Mathieu Bouvy" class="w-full h-full object-cover">
              </div>
            </div>

            <!-- Contact -->
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:#38bdf8">Contact</h3>
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
              <h3 class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:#38bdf8">Compétences</h3>
              <div class="flex flex-wrap gap-1.5">
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(56,189,248,0.15);">Montage vidéo</span>
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(167,139,250,0.15);">Motion Design</span>
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(56,189,248,0.15);">Photographie</span>
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(167,139,250,0.15);">Sport & Lifestyle</span>
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(56,189,248,0.15);">Jeu Vidéo</span>
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(167,139,250,0.15);">YouTube / Reels</span>
                <span class="px-2.5 py-1 text-xs rounded-md bg-white/5 text-gray-300" style="border:1px solid rgba(56,189,248,0.15);">Concerts</span>
              </div>
            </div>

            <!-- Langues -->
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:#38bdf8">Langues</h3>
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
              <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color:#a78bfa">Expériences</h3>
              <div class="space-y-4">

                <div class="border-l-2 pl-3" style="border-color:rgba(167,139,250,0.3)">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-white font-medium text-sm">Punchologue</p>
                    <span class="text-gray-600 text-xs whitespace-nowrap pt-0.5">Déc 2022 — Sept 2024</span>
                  </div>
                  <p class="text-gray-500 text-xs mt-0.5">Monteur / Motion Designer <span class="text-gray-600">(Stage)</span></p>
                  <p class="text-gray-500 text-xs mt-1 leading-relaxed">Montage YouTube/Reels et photos de concerts.</p>
                </div>

                <div class="border-l-2 pl-3" style="border-color:rgba(167,139,250,0.3)">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-white font-medium text-sm">Green Garden Digital</p>
                    <span class="text-gray-600 text-xs whitespace-nowrap pt-0.5">Sept 2023 — Oct 2025</span>
                  </div>
                  <p class="text-gray-500 text-xs mt-0.5">Vidéaste / Motion Designer <span class="text-gray-600">(Alternance)</span></p>
                  <p class="text-gray-500 text-xs mt-1 leading-relaxed">Projets sport, lifestyle et jeux vidéo.</p>
                </div>

                <div class="border-l-2 pl-3" style="border-color:rgba(167,139,250,0.3)">
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
              <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color:#a78bfa">Formations</h3>
              <div class="space-y-3">
                <div class="border-l-2 pl-3" style="border-color:rgba(167,139,250,0.3)">
                  <p class="text-white text-sm">Bachelor Audiovisuel</p>
                  <p class="text-gray-500 text-xs">2021 — 2024 · Ynov Lyon</p>
                </div>
                <div class="border-l-2 pl-3" style="border-color:rgba(167,139,250,0.3)">
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

    case 'adidas':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/SM4wgYJgu90?autoplay=1&amp;mute=1"
                    title="ADIDAS_Vintage Market" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Adidas — Vintage Market.</span>
          </div>
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

    case 'jumpman':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/iFTW1UsKPcA?autoplay=1&amp;mute=1"
                    title="JUMPMAN_fx" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Jumpman — fx.</span>
          </div>
        </div>`;
      break;

    case 'kanaga':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/QhXHbWDuPns?autoplay=1&amp;mute=1"
                    title="KANAGA_Foule Désirs" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Kanaga — Foule Désirs.</span>
          </div>
        </div>`;
      break;

    case 'laligue':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/YolF_YnCvR4?autoplay=1&amp;mute=1"
                    title="LALIGUE_Lyon street food festival" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">LaLigue — Lyon street food festival.</span>
          </div>
        </div>`;
      break;

    case 'pola':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/hjx62AR7fRA?autoplay=1&amp;mute=1"
                    title="LALIGUE_Pola freestyle" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">LaLigue — Pola freestyle.</span>
          </div>
        </div>`;
      break;

    case 'nikon2024':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/VENqrlGnch0?autoplay=1&amp;mute=1"
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

    case 'pumacrampons':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/RX4TBKkIyHw?autoplay=1&amp;mute=1"
                    title="PUMA_Crampons" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">PUMA — Crampons.</span>
          </div>
        </div>`;
      break;

    case 'wallace':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/9aXbaUvzN_g?autoplay=1&amp;mute=1"
                    title="PUNCHOLOGUE_Wallace Cleaver" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Punchologue — Comprendre Baiser de Wallace Cleaver.</span>
          </div>
        </div>`;
      break;

    case 'sofianee':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/eTLyLNciZJ4?autoplay=1&amp;mute=1"
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

    case 'udol':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/hrv_cswZlZQ?autoplay=1&amp;mute=1"
                    title="UDOL_Gameday" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">UDOL — Gameday.</span>
          </div>
        </div>`;
      break;

    case 'unibet':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/Cc8gvhsg1XU?autoplay=1&amp;mute=1"
                    title="UNIBET_Greg MMA" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Unibet — Greg MMA.</span>
          </div>
        </div>`;
      break;

    case 'unibetnasri':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/FI33Ajr09xE?autoplay=1&amp;mute=1"
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

    case 'anooki':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/gncKO_CvF60?autoplay=1&amp;mute=1"
                    title="VILLEDELYON_Anooki" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Ville de Lyon — Anooki.</span>
          </div>
        </div>`;
      break;

    case 'whentocop':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/8Pns-vbShtg?autoplay=1"
                    title="WHENTOCOP_Nike Air max" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Whentocop — Nike Air max.</span>
          </div>
        </div>`;
      break;

    case 'plus33fm':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/3L9IsKxEKFI?autoplay=1&amp;mute=1"
                    title="PLUS33FM_Motion" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Plus33FM — Motion.</span>
          </div>
        </div>`;
      break;

    case 'olmaillot':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/kr7wSxyoZwE?autoplay=1&amp;mute=1"
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

    case 'plus33logos':
      bodyHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1 min-h-0 bg-black/40 rounded-lg overflow-hidden mb-3">
            <iframe class="w-full h-full" src="https://www.youtube.com/embed/OLX8yLoVE88?autoplay=1&amp;mute=1"
                    title="PLUS33_Logos Animées" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="origin" allowfullscreen>
            </iframe>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-400 leading-relaxed space-y-1 px-5 pb-4">
            <span class="block">Plus33FM — Logos Animées.</span>
          </div>
        </div>`;
      break;

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
      const box = dragState.element.querySelector('.icon-box');
      if (box) box.style.scale = '1';
      const label = dragState.element.querySelector('.icon-label');
      if (label) label.style.scale = '1';
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
  adidas: ['adidas', 'olmaillot'],
  decathlon: ['puma'],
  ol: ['ol', 'olmaillot'],
  puma: ['puma', 'pumacrampons'],
  eafc: ['eafut', 'earatings'],
  highlo: ['highlo'],
  laligue: ['laligue', 'pola'],
  unibet: ['unibet', 'unibetnasri'],
  whentocop: ['whentocop'],
};

let activeBrand = null;

function filterBrand(brand) {
  const icons = document.querySelectorAll('.desktop-icon');

  if (activeBrand === brand) {
    activeBrand = null;
    icons.forEach(icon => icon.classList.remove('dimmed'));
    document.querySelectorAll('.brand-logo').forEach(l => l.classList.remove('brand-active'));
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
    l.classList.toggle('brand-active', l.dataset.brand === brand);
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
let circleAnimId = null;
let circlePaused = false;

// ─── Positionnement en cercle des projets + rotation lente ───
function shuffleProjectIcons() {
  const projectIcons = document.querySelectorAll('.desktop-icon[data-category]');
  if (!projectIcons.length) return;

  // Sur mobile, on garde aussi le cercle — plus grand et qui dépasse
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const radius = Math.min(380, Math.min(window.innerWidth, window.innerHeight) * 0.45);
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

    const depthScale = 1 + 0.3 * sinA;
    const box = icon.querySelector('.icon-box');
    if (box) box.style.scale = depthScale;
    const label = icon.querySelector('.icon-label');
    if (label) label.style.scale = depthScale;
    icon.style.zIndex = Math.round(50 + 30 * sinA);
  });
}

function startCircleRotation() {
  if (circleAnimId) cancelAnimationFrame(circleAnimId);
  let last = performance.now();
  let scrollVel = 0;

  // Le scroll alimente uniquement la rotation du cercle, pas la page
  document.addEventListener('wheel', e => {
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
    if (e.target.closest('.menu-bar')) return;
    if (e.target.closest('#logos-panel')) return;
    touchStartY = e.touches[0].clientY;
    touchActive = true;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!touchActive) return;
    const dy = e.touches[0].clientY - touchStartY;
    scrollVel += dy * 0.5;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchend', () => { touchActive = false; }, { passive: true });

  function tick(now) {
    const dt = now - last;
    last = now;

    // Decay naturelle de la vélocité
    scrollVel += (0 - scrollVel) * 0.08;

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
shuffleProjectIcons();

// ─── Recalculer le cercle au resize ───
window.addEventListener('resize', () => {
  if (document.querySelectorAll('.desktop-icon[data-category]').length === 0) return;
  circleCenterX = window.innerWidth / 2;
  circleCenterY = window.innerHeight / 2;
  if (isMobile) {
    circleRadius = Math.min(380, Math.min(window.innerWidth, window.innerHeight) * 0.45);
  } else {
    circleRadius = Math.min(380, Math.min(window.innerWidth, window.innerHeight) * 0.3);
  }
  updateCirclePositions();
});

// ─── Ouvrir un projet à l'honneur + scroller vers le bureau ───
function openFeatured(type) {
  const win = openWindow(type);
  setTimeout(() => {
    document.getElementById('desktop').scrollIntoView({ behavior: 'smooth' });
  }, 150);
}

// ─── Scroll-driven marquee ───
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
  let marqueePos = 0;
  let smoothVel = 0;

  const BASE_SPEED = 0.25;
  const SCROLL_GAIN = 0.15;

  // Le scroll alimente aussi la vitesse du marquee
  document.addEventListener('wheel', e => {
    smoothVel += e.deltaY * 0.5;
  }, { passive: false });

  function tickMarquee() {
    smoothVel += (0 - smoothVel) * 0.1;
    const speed = BASE_SPEED + smoothVel * SCROLL_GAIN;
    marqueePos += speed;

    const wrap = marqueeTrack.scrollWidth / 2;
    if (marqueePos >= wrap) marqueePos -= wrap;
    if (marqueePos < 0) marqueePos += wrap;

    marqueeTrack.style.transform = `translateX(${-marqueePos}px)`;
    requestAnimationFrame(tickMarquee);
  }
  tickMarquee();
}

// ─── Anti-gravity hover : les voisins s'écartent au survol et reviennent ───
(function() {
  if (isMobile) return;
  const icons = document.querySelectorAll('.desktop-icon');

  function clearRepulsion() {
    icons.forEach(icon => {
      icon.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      icon.style.transform = '';
    });
  }

  function applyRepulsion(source) {
    const RADIUS = 180;
    const FORCE = 35;
    const doff = DESKTOP.getBoundingClientRect();
    const srcRect = source.getBoundingClientRect();
    const srcCX = srcRect.left - doff.left + srcRect.width / 2;
    const srcCY = srcRect.top  - doff.top  + srcRect.height / 2;

    icons.forEach(icon => {
      if (icon === source) return;
      const rect = icon.getBoundingClientRect();
      const cx = rect.left - doff.left + rect.width / 2;
      const cy = rect.top  - doff.top  + rect.height / 2;
      const dx = cx - srcCX;
      const dy = cy - srcCY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < RADIUS && dist > 0) {
        const strength = (1 - dist / RADIUS) * FORCE;
        const angle = Math.atan2(dy, dx);
        icon.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        icon.style.transform = `translate(${Math.cos(angle) * strength}px, ${Math.sin(angle) * strength}px)`;
      }
    });
  }

  icons.forEach(icon => {
    icon.addEventListener('mouseenter', () => {
      if (dragState) return;
      applyRepulsion(icon);
    });
    icon.addEventListener('mouseleave', () => {
      clearRepulsion();
    });
  });
})();

// ─── Drag sidebar ───
const sidebar = document.querySelector('.sidebar');
const sidebarDragbar = document.querySelector('.sidebar-dragbar');
if (sidebar && sidebarDragbar && !isMobile) {
  let sd = false, sX, sY, sL, sT;

  sidebarDragbar.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    sd = true;
    const r = sidebar.getBoundingClientRect();
    const dr = DESKTOP.getBoundingClientRect();
    sX = e.clientX;
    sY = e.clientY;
    sL = r.left - dr.left;
    sT = r.top - dr.top;
    sidebar.style.left = sL + 'px';
    sidebar.style.top = sT + 'px';
    sidebar.style.transform = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!sd) return;
    sidebar.style.left = (sL + e.clientX - sX) + 'px';
    sidebar.style.top = (sT + e.clientY - sY) + 'px';
  });

  document.addEventListener('mouseup', () => { sd = false; });
}




// ─── Mobile sidebar toggle ───
(function() {
  const btn = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!btn || !sidebar || !overlay) return;

  function openSidebar() { sidebar.classList.add('open'); overlay.classList.add('visible'); }
  function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('visible'); }

  btn.addEventListener('click', openSidebar);
  overlay.addEventListener('click', closeSidebar);

  // Close on window resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) closeSidebar();
  });
})();

// ─── Navigation ───
function scrollToAbout() {
  document.body.classList.remove('overflow-hidden');
  document.getElementById('retour-btn')?.classList.remove('hidden');
  setTimeout(() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }), 10);
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
