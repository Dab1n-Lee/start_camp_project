// Initialize Lucide Icons
if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('is-ready');
});

// Highlight the active nav link on each page
function setActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('[data-page]').forEach(link => {
        const href = link.getAttribute('href') || '';
        const isActive = href === currentPath || (currentPath === 'index.html' && href === 'index.html');
        if (isActive) {
            link.classList.remove('text-zinc-400');
            link.classList.add('text-zinc-100');
        } else {
            link.classList.remove('text-zinc-100');
            link.classList.add('text-zinc-400');
        }
    });
}

setActiveNav();

// Hamburger Menu Drawer for mobile
const menuToggle = document.getElementById('menu-toggle');
const mobileDrawer = document.getElementById('mobile-drawer');
if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener('click', () => {
        mobileDrawer.classList.toggle('hidden');
    });

    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileDrawer.classList.add('hidden');
        });
    });
}

// Video Lightbox Modal Control (only on pages that include it)
const videoModal = document.getElementById('video-modal');
const playerContainer = document.getElementById('youtube-player-container');
const videoFallback = document.getElementById('video-fallback');
let videoLoadTimer = null;
let youtubePlayer = null;
let YT_API_ready = false;

// Load YouTube Iframe API if not already present
function ensureYouTubeAPI() {
    return new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
            YT_API_ready = true; return resolve(true);
        }
        // create global callback
        window.onYouTubeIframeAPIReady = function() {
            YT_API_ready = true;
            resolve(true);
        };
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        s.async = true;
        document.head.appendChild(s);
        // fallback: resolve after 5s even if API didn't call ready
        setTimeout(() => resolve(YT_API_ready), 6000);
    });
}
function openVideoModal(youtubeLink) {
    if (!videoModal || !playerContainer) return;
    if (videoFallback) videoFallback.classList.add('hidden');
    // show modal early
    videoModal.classList.remove('hidden');
    setTimeout(() => videoModal.classList.add('opacity-100'), 10);

    // create/destroy any existing player
    if (youtubePlayer && youtubePlayer.destroy) {
        try { youtubePlayer.destroy(); } catch (e) { console.warn(e); }
        youtubePlayer = null;
    }

    // Ensure API available then create player
    ensureYouTubeAPI().then((ready) => {
        if (!ready || !window.YT) {
            // show fallback UI
            if (videoFallback) videoFallback.classList.remove('hidden');
            return;
        }
        // extract videoId if a full URL provided
        let videoId = youtubeLink;
        try {
            const u = new URL(youtubeLink);
            // try to parse v= or path
            if (u.hostname.includes('youtube')) {
                if (u.searchParams.get('v')) videoId = u.searchParams.get('v');
                else videoId = u.pathname.split('/').pop();
            } else if (u.hostname.includes('youtu.be')) {
                videoId = u.pathname.split('/').pop();
            }
        } catch (e) {
            // not a full URL, maybe bare id
            if (youtubeLink.includes('/')) videoId = youtubeLink.split('/').pop();
        }

        // show spinner / hide fallback while loading
        if (videoFallback) videoFallback.classList.add('hidden');

        youtubePlayer = new YT.Player('youtube-player-container', {
            height: '360',
            width: '640',
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                modestbranding: 1,
                rel: 0,
                controls: 1,
                disablekb: 0,
                playsinline: 1
            },
            events: {
                'onReady': (e) => {
                    try { e.target.playVideo(); } catch (err) { console.warn('play failed', err); }
                    if (videoLoadTimer) { clearTimeout(videoLoadTimer); videoLoadTimer = null; }
                },
                'onError': (ev) => {
                    console.warn('YouTube player error', ev.data);
                    // show fallback link
                    if (videoFallback) videoFallback.classList.remove('hidden');
                    try { youtubePlayer.destroy(); } catch (e) { console.warn(e); }
                    youtubePlayer = null;
                }
            }
        });

        // If player doesn't become ready within 6s, show fallback
        videoLoadTimer = setTimeout(() => {
            if (videoFallback) videoFallback.classList.remove('hidden');
        }, 6000);
    });
}

function closeVideoModal() {
    if (!videoModal || !playerContainer) return;
    videoModal.classList.remove('opacity-100');
    setTimeout(() => {
        videoModal.classList.add('hidden');
        if (videoLoadTimer) { clearTimeout(videoLoadTimer); videoLoadTimer = null; }
        if (youtubePlayer && youtubePlayer.destroy) {
            try { youtubePlayer.destroy(); } catch (e) { console.warn(e); }
            youtubePlayer = null;
        }
        if (playerContainer) playerContainer.innerHTML = '';
        if (videoFallback) videoFallback.classList.add('hidden');
    }, 300);
}

// Contact Form Submission with clean modal instead of alert()
const contactForm = document.getElementById('contact-form');
const notifModal = document.getElementById('notif-modal');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (notifModal) {
            notifModal.classList.remove('hidden');
            setTimeout(() => {
                notifModal.classList.add('opacity-100');
            }, 10);
        }
        contactForm.reset();
    });
}

function closeNotifModal() {
    if (!notifModal) return;
    notifModal.classList.remove('opacity-100');
    setTimeout(() => {
        notifModal.classList.add('hidden');
    }, 300);
}
