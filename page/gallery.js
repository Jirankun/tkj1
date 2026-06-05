'use strict';

// Configuration
const CFG = {
  JSON_PATHS: ['/DB/photos.json', '/photos.json'],
  BASE_URL: window.location.origin || 'https://tkj1.pages.dev',
  APP: { 
    scheme: 'tkjone', 
    path: 'photo', 
    pkgs: ['com.tkjone.app'], 
    fallback: 'https://github.com/Jirankun/TKJ-One/releases' 
  }
};

// State
let allData = [];
let filteredData = [];
let currentItem = null;
let videoObserver = null;
let playingVideo = null;
let savedScrollY = 0;

// Scroll preservation
const saveScroll = () => { savedScrollY = window.scrollY; };
const restoreScroll = () => { 
  setTimeout(() => window.scrollTo(0, savedScrollY), 10); 
};

// Check if item is video
const isVideo = (item) => {
  if (!item) return false;
  if (item.gender && String(item.gender).toLowerCase() === 'video') return true;
  const url = typeof item === 'string' ? item : (item.url || item.src || '');
  if (!url) return false;
  const clean = String(url).trim().split('?')[0].split('#')[0].toLowerCase();
  const isCatbox = clean.includes('catbox.moe');
  const hasExt = /\.(mp4|webm|mov|mkv|m4v|ogv|avi)$/i.test(clean);
  return isCatbox && hasExt;
};

// Clean URL
const cleanUrl = (url) => {
  if (!url) return '';
  return String(url).trim().replace(/\s/g, '');
};

// Protect media from download
const protect = (el) => {
  if (!el) return;
  ['contextmenu','dragstart','selectstart','copy'].forEach(e => 
    el.addEventListener(e, ev => ev.preventDefault(), {passive:false})
  );
  if (el.tagName === 'IMG') { 
    el.draggable = false; 
    el.style.pointerEvents = 'none'; 
  }
  if (el.tagName === 'VIDEO') {
    el.setAttribute('controlsList', 'nodownload');
  }
};

// Render gallery grid
const render = (list) => {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  grid.innerHTML = '';
  
  if (!list.length) { 
    empty.classList.remove('hidden'); 
    return; 
  }
  empty.classList.add('hidden');
  
  list.forEach((item, index) => {
    const isVid = isVideo(item);
    const card = document.createElement('div');
    card.className = 'card';
    
    if (isVid) {
      const loadingAttr = index < 6 ? 'eager' : 'lazy';
      card.innerHTML = `
        <video class="card-media" src="${cleanUrl(item.url)}" muted playsinline loop preload="metadata" crossorigin="anonymous" decoding="async" loading="${loadingAttr}"></video>
        <div class="card-info">
          <div class="card-title">${item.title || '#' + item.name}</div>
          <div class="card-meta">
            <span class="badge badge-video">Video</span>
          </div>
        </div>
      `;
      const vid = card.querySelector('video');
      protect(vid);
      observeVideo(vid);
      vid.addEventListener('loadedmetadata', () => { 
        if (vid.offsetParent && !vid.paused) vid.play().catch(()=>{}); 
      }, {once:true});
    } else {
      const loadingAttr = index < 6 ? 'eager' : 'lazy';
      const priorityAttr = index < 6 ? 'high' : 'auto';
      card.innerHTML = `
        <img class="card-media" src="${cleanUrl(item.url)}" alt="${item.title || item.name}" loading="${loadingAttr}" decoding="async" fetchpriority="${priorityAttr}">
        <div class="card-info">
          <div class="card-title">${item.title || '#' + item.name}</div>
          <div class="card-meta">
            <span class="badge badge-photo">Foto</span>
          </div>
        </div>
      `;
      protect(card.querySelector('img'));
    }
    
    card.onclick = () => openModal(item);
    grid.appendChild(card);
  });
};

// Apply filters
const applyFilters = () => {
  const query = document.getElementById('search').value.toLowerCase().trim();
  const filter = document.querySelector('.filter-btn.active')?.dataset.f || 'all';
  
  filteredData = allData.filter(item => {
    const isVid = isVideo(item);
    const matchSearch = !query || 
      (item.name||'').toLowerCase().includes(query) || 
      (item.title||'').toLowerCase().includes(query);
    const matchFilter = filter === 'all' || 
      (filter === 'video' && isVid) || 
      (filter === 'photo' && !isVid);
    return matchSearch && matchFilter;
  });
  
  render(filteredData);
};

// Open detail modal
const openModal = (item) => {
  saveScroll();
  currentItem = item;
  pauseThumbnails();
  
  const isVid = isVideo(item);
  const img = document.getElementById('md-img');
  const vid = document.getElementById('md-vid');
  
  img.style.display = isVid ? 'none' : 'block';
  vid.style.display = isVid ? 'block' : 'none';
  
  if (isVid) {
    vid.src = cleanUrl(item.url);
    vid.load();
    protect(vid);
    img.src = '';
    vid.addEventListener('loadedmetadata', () => vid.play().catch(()=>{}), {once:true});
  } else {
    img.src = cleanUrl(item.url);
    protect(img);
    vid.src = '';
  }
  
  document.getElementById('md-title').textContent = item.title || '#' + item.name;
  document.getElementById('md-desc').textContent = item.desc || 'Tidak ada deskripsi';
  document.getElementById('md-meta').textContent = `👤 ${item.gender||'-'} • 📅 ${item.date||'-'}`;
  
  document.getElementById('modal').classList.add('active');
  document.getElementById('md-share').onclick = () => shareItem(item);
  document.getElementById('md-app').onclick = () => showAppModal();
};

const closeModal = () => {
  document.getElementById('modal').classList.remove('active');
  document.getElementById('md-img').src = '';
  const vid = document.getElementById('md-vid');
  vid.pause();
  vid.src = '';
  resumeThumbnails();
  restoreScroll();
  currentItem = null;
};

// Open full view
const openFullView = (item) => {
  saveScroll();
  currentItem = item;
  pauseThumbnails();
  
  document.querySelector('.header')?.classList.add('hidden');
  document.getElementById('gallery')?.classList.add('hidden');
  
  const fv = document.getElementById('full-view');
  fv.classList.add('active');
  
  const img = document.getElementById('fv-img');
  const vid = document.getElementById('fv-vid');
  const isVid = isVideo(item);
  
  img.style.display = isVid ? 'none' : 'block';
  vid.style.display = isVid ? 'block' : 'none';
  
  if (isVid) {
    vid.src = cleanUrl(item.url);
    vid.load();
    protect(vid);
    img.src = '';
    vid.addEventListener('loadedmetadata', () => vid.play().catch(()=>{}), {once:true});
  } else {
    img.src = cleanUrl(item.url);
    protect(img);
    vid.src = '';
  }
  
  document.getElementById('fv-title').textContent = item.title || '#' + item.name;
  document.getElementById('fv-desc').textContent = item.desc || 'Tidak ada deskripsi';
  document.getElementById('fv-meta').textContent = `👤 ${item.gender||'-'} • 📅 ${item.date||'-'}`;
  
  document.getElementById('fv-share').onclick = () => shareItem(item);
  document.getElementById('fv-app').onclick = () => showAppModal();
  
  // Update URL for deep linking
  history.pushState({photoName: item.name}, '', `/photo/${item.name}`);
};

const closeFullView = () => {
  document.getElementById('full-view').classList.remove('active');
  document.getElementById('gallery')?.classList.remove('hidden');
  document.querySelector('.header')?.classList.remove('hidden');
  
  document.getElementById('fv-img').src = '';
  const vid = document.getElementById('fv-vid');
  vid.pause();
  vid.src = '';
  
  resumeThumbnails();
  restoreScroll();
  
  // Navigate back in history without reloading
  const currentPath = location.pathname;
  if (currentPath.startsWith('/photo/')) {
    history.pushState({}, '', '/');
  }
  currentItem = null;
};

// Try to open app with deep link
const tryOpenApp = (itemName) => {
  saveScroll();
  const schemeUrl = `${CFG.APP.scheme}://${CFG.APP.path}/${encodeURIComponent(itemName)}`;
  
  // Try opening via iframe (works on most mobile browsers)
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = schemeUrl;
  document.body.appendChild(iframe);
  
  // Show fallback modal after delay
  setTimeout(() => {
    document.getElementById('app-modal').classList.add('active');
    document.body.removeChild(iframe);
  }, 1500);
};

const showAppModal = () => { 
  if (currentItem && currentItem.name) {
    tryOpenApp(currentItem.name);
  } else {
    document.getElementById('app-modal').classList.add('active'); 
  }
};

const closeAppModal = () => { 
  document.getElementById('app-modal').classList.remove('active'); 
  restoreScroll(); 
};

document.getElementById('btn-dl').onclick = () => { 
  closeAppModal(); 
  location.replace(CFG.APP.fallback); 
};

// Share functionality
const shareItem = (item) => {
  const cleanLink = `${CFG.BASE_URL}/photo/${item.name}`;
  if (navigator.share) {
    navigator.share({ 
      title: item.title || '#' + item.name, 
      text: item.title || '#' + item.name, 
      url: cleanLink 
    }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(cleanLink).then(()=> toast('Link disalin'));
  }
};

// Video observer for thumbnails
const observeVideo = (el) => { 
  if (videoObserver) videoObserver.observe(el); 
};

const initVideoObserver = () => {
  videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      // Pause if modal or full view is open
      if (document.querySelector('.modal-overlay.active, #full-view.active')) { 
        entry.target.pause(); 
        return; 
      }
      if (entry.isIntersecting) {
        entry.target.play().catch(()=>{});
      } else {
        entry.target.pause();
      }
    });
  }, {threshold: 0.5});
};

const pauseThumbnails = () => { 
  document.querySelectorAll('.card-media').forEach(v => { 
    if (v.tagName === 'VIDEO' && !v.paused) {
      playingVideo = v;
      v.pause();
    }
  }); 
};

const resumeThumbnails = () => { 
  if (playingVideo && document.contains(playingVideo)) {
    const rect = playingVideo.getBoundingClientRect();
    if (rect.top < innerHeight) {
      playingVideo.play().catch(()=>{});
    }
    playingVideo = null;
  }
};

// Confirm dialog handlers
window.openConfirm = () => { 
  if (window.parent !== window) {
    window.parent.postMessage({type: 'OPEN_CONFIRM'}, '*'); 
  }
};

window.closeConfirm = () => { 
  if (window.parent !== window) {
    window.parent.postMessage({type: 'CLOSE_CONFIRM'}, '*'); 
  }
};

window.startChat = () => {
  document.getElementById('confirm').classList.remove('active');
  if (window.parent !== window) {
    window.parent.postMessage({type: 'START_CHAT'}, '*');
  }
};

// Load JSON safely
const safeJSON = async (paths) => {
  for (const path of paths) {
    try {
      const response = await fetch(path + '?t=' + Date.now());
      if (!response.ok) continue;
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('json')) continue;
      const text = await response.text();
      if (text.trim()[0] !== '[' && text.trim()[0] !== '{') continue;
      return JSON.parse(text);
    } catch (e) {
      console.warn(`Failed to load ${path}:`, e);
    }
  }
  throw new Error('Gagal memuat data galeri. Coba refresh halaman.');
};

// Load gallery data
const loadGallery = async () => {
  if (window.galleryLoaded) return;
  window.galleryLoaded = true;
  
  try {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
    
    const data = await safeJSON(CFG.JSON_PATHS);
    allData = Array.isArray(data) ? data : (data.photos || []);
    
    // Clean URLs
    allData.forEach(item => { 
      if (item.url) item.url = cleanUrl(item.url); 
    });
    
    // Sort by name
    allData.sort((a, b) => (parseInt(a.name) || 0) - (parseInt(b.name) || 0));
    filteredData = [...allData];
    
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('gallery').classList.remove('hidden');
    
    initVideoObserver();
    render(filteredData);
    
    // Handle photo route from URL
    handlePhotoRoute();
    
  } catch (error) { 
    document.getElementById('loading').classList.add('hidden'); 
    document.getElementById('error').textContent = error.message; 
    document.getElementById('error').classList.remove('hidden');
    document.getElementById('gallery').classList.remove('hidden');
  }
};

// Handle /photo/{name} route
const handlePhotoRoute = () => {
  try {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    const photoIndex = parts.findIndex(p => p === 'photo');
    
    if (photoIndex !== -1 && parts[photoIndex + 1]) {
      const photoName = decodeURIComponent(parts[photoIndex + 1]);
      
      // Wait for data to be loaded
      const tryFindAndOpen = () => {
        if (allData.length === 0) {
          setTimeout(tryFindAndOpen, 100);
          return;
        }
        
        const found = allData.find(x => 
          String(x.name).toLowerCase() === String(photoName).toLowerCase()
        );
        
        if (found) {
          openFullView(found);
        } else {
          toast('Foto "' + photoName + '" tidak ditemukan');
        }
      };
      
      tryFindAndOpen();
    }
  } catch (e) {
    console.error('Photo route error:', e);
  }
};

// Listen for messages from parent
window.addEventListener('message', (e) => {
  if (!e.data || !e.data.type) return;
  
  if (e.data.type === 'OPEN_PHOTO' && e.data.name) {
    const tryFindAndOpen = () => {
      if (allData.length === 0) {
        setTimeout(tryFindAndOpen, 100);
        return;
      }
      
      const found = allData.find(x => 
        String(x.name).toLowerCase() === String(e.data.name).toLowerCase()
      );
      
      if (found) {
        openFullView(found);
      } else {
        toast('Foto tidak ditemukan');
      }
    };
    tryFindAndOpen();
  }
  
  if (e.data.type === 'CLOSE_GISCUS') {
    // Giscus closed in parent, nothing to do here
  }
});

// Security canvas for tab switching detection
const initSecurityCanvas = () => {
  const canvas = document.getElementById('security-canvas');
  const ctx = canvas.getContext('2d');
  
  const resize = () => { 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
  };
  
  window.addEventListener('resize', resize);
  resize();
  
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      canvas.classList.add('active');
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ Aktivitas terdeteksi', canvas.width/2, canvas.height/2);
    } else { 
      canvas.classList.remove('active'); 
    }
  });
};

// Event listeners
document.getElementById('search').oninput = applyFilters;

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  };
});

document.getElementById('modal').onclick = (e) => { 
  if (e.target.id === 'modal') closeModal(); 
};

document.getElementById('full-view').onclick = (e) => { 
  if (e.target.id === 'full-view') closeFullView(); 
};

document.onkeydown = (e) => { 
  if (e.key === 'Escape') {
    closeModal(); 
    closeFullView();
  } 
};

// Handle browser back/forward
window.onpopstate = (e) => { 
  if (document.getElementById('full-view').classList.contains('active')) {
    closeFullView();
  }
};

window.onscroll = () => { 
  document.querySelector('.header').style.boxShadow = 
    scrollY > 10 ? '0 4px 12px rgba(0,0,0,0.4)' : 'none'; 
};

// Toast notification
const toast = (msg) => { 
  const t = document.getElementById('toast'); 
  t.textContent = msg; 
  t.classList.add('show'); 
  setTimeout(() => t.classList.remove('show'), 2500); 
};

// Initialize
initSecurityCanvas();
loadGallery();
