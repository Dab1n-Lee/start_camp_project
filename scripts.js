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

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
const themeToggleIcon = document.getElementById('theme-toggle-icon');
const themeToggleLabel = document.getElementById('theme-toggle-label');

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    if (themeToggleLabel) {
        themeToggleLabel.textContent = theme === 'light' ? 'Light' : 'Dark';
    }
    if (themeToggleIcon) {
        themeToggleIcon.setAttribute('data-lucide', theme === 'light' ? 'sun' : 'moon');
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }
    if (themeToggle) {
        themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }
    localStorage.setItem('theme', theme);
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme);
} else {
    applyTheme('dark');
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const nextTheme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(nextTheme);
    });
}

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

// Gamification quiz and locked rewards
const quizQuestions = document.getElementById('quiz-questions');
const submitQuizButton = document.getElementById('submit-quiz');
const resetQuizButton = document.getElementById('reset-quiz');
const prevQuestionButton = document.getElementById('prev-question');
const nextQuestionButton = document.getElementById('next-question');
const quizSummary = document.getElementById('quiz-summary');
const quizStatus = document.getElementById('quiz-status');
const quizFeedback = document.getElementById('quiz-feedback');
const pointsDisplay = document.getElementById('points-display');
const quizProgress = document.getElementById('quiz-progress');
const gameModal = document.getElementById('game-modal');
const gameModalMessage = document.getElementById('game-modal-message');
let quizPoints = 0;
let quizAnswers = [];
let quizSelections = [];
let quizCompleted = false;
let currentQuestionIndex = 0;

function updatePoints() {
    if (pointsDisplay) {
        pointsDisplay.textContent = `${quizPoints}P`;
    }
}

function clearCardFeedback(card) {
    const feedback = card.querySelector('.answer-feedback');
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'answer-feedback mt-3 text-sm';
    }
    card.classList.remove('quiz-correct', 'quiz-wrong');
}

function updateQuizProgress() {
    const quizCards = Array.from(document.querySelectorAll('.quiz-card'));
    quizCards.forEach((card, index) => {
        card.classList.toggle('is-active', index === currentQuestionIndex);
        card.classList.toggle('hidden', index !== currentQuestionIndex);
    });

    if (quizProgress) {
        const visibleIndex = Math.min(currentQuestionIndex + 1, quizCards.length);
        quizProgress.textContent = `${visibleIndex} / ${quizCards.length}`;
    }

    if (prevQuestionButton) {
        prevQuestionButton.disabled = currentQuestionIndex === 0;
        prevQuestionButton.classList.toggle('opacity-50', currentQuestionIndex === 0);
        prevQuestionButton.classList.toggle('cursor-not-allowed', currentQuestionIndex === 0);
    }

    if (nextQuestionButton) {
        const isLast = currentQuestionIndex >= quizCards.length - 1;
        nextQuestionButton.disabled = isLast;
        nextQuestionButton.classList.toggle('opacity-50', isLast);
        nextQuestionButton.classList.toggle('cursor-not-allowed', isLast);
    }

    if (submitQuizButton) {
        submitQuizButton.disabled = false;
        submitQuizButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function resetQuizState() {
    quizPoints = 0;
    quizAnswers = [];
    quizSelections = [];
    quizCompleted = false;
    currentQuestionIndex = 0;
    updatePoints();

    document.querySelectorAll('.quiz-card').forEach((card) => {
        clearCardFeedback(card);
    });

    document.querySelectorAll('#quiz-questions input[type="radio"]').forEach((input) => {
        input.checked = false;
        input.disabled = false;
    });

    if (quizSummary) {
        quizSummary.classList.add('hidden');
        quizSummary.textContent = '';
    }
    if (quizStatus) {
        quizStatus.textContent = '5문제를 모두 맞혀보세요.';
    }
    if (quizFeedback) {
        quizFeedback.textContent = '문제를 선택한 뒤 정답 확인 버튼을 눌러 주세요.';
    }
    if (submitQuizButton) {
        submitQuizButton.disabled = false;
        submitQuizButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    if (resetQuizButton) {
        resetQuizButton.classList.add('hidden');
    }
    updateQuizProgress();
}

if (quizQuestions) {
    quizQuestions.addEventListener('change', (event) => {
        const selectedInput = event.target.closest('input[type="radio"]');
        if (!selectedInput) return;

        const card = selectedInput.closest('.quiz-card');
        if (!card) return;

        const questionIndex = Number(card.dataset.questionIndex);
        const selectedValue = selectedInput.value;

        if (quizAnswers[questionIndex] === 'correct' || quizAnswers[questionIndex] === 'wrong') {
            if (quizFeedback) {
                quizFeedback.textContent = '이미 판정한 문제입니다.';
            }
            return;
        }

        quizSelections[questionIndex] = selectedValue;
        clearCardFeedback(card);

        if (quizFeedback) {
            quizFeedback.textContent = '선택한 답을 확인 버튼으로 판정해 주세요.';
        }
    });
}

if (prevQuestionButton) {
    prevQuestionButton.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex -= 1;
            updateQuizProgress();
        }
    });
}

if (nextQuestionButton) {
    nextQuestionButton.addEventListener('click', () => {
        const quizCards = Array.from(document.querySelectorAll('.quiz-card'));
        if (currentQuestionIndex < quizCards.length - 1) {
            currentQuestionIndex += 1;
            updateQuizProgress();
        }
    });
}

if (submitQuizButton) {
    submitQuizButton.addEventListener('click', () => {
        const activeCard = document.querySelector('.quiz-card.is-active');
        if (!activeCard) return;

        const questionIndex = Number(activeCard.dataset.questionIndex);
        const selectedValue = quizSelections[questionIndex];

        if (selectedValue === undefined) {
            if (quizStatus) {
                quizStatus.textContent = '현재 문제를 선택해 주세요.';
            }
            if (quizFeedback) {
                quizFeedback.textContent = '현재 보이는 문제의 선택지를 먼저 골라주세요.';
            }
            return;
        }

        const correctAnswer = activeCard.dataset.correctAnswer;
        const feedback = activeCard.querySelector('.answer-feedback');
        const alreadyAnswered = quizAnswers[questionIndex] === 'correct' || quizAnswers[questionIndex] === 'wrong';

        if (alreadyAnswered) {
            if (quizFeedback) {
                quizFeedback.textContent = '이미 판정한 문제입니다. 다음 문제로 넘어가세요.';
            }
            return;
        }

        const selectedInput = activeCard.querySelector(`input[type="radio"][value="${CSS.escape(selectedValue)}"]`);
        const isCorrectAnswer = selectedInput?.dataset.correct === 'true' || selectedValue === correctAnswer;

        if (isCorrectAnswer) {
            quizAnswers[questionIndex] = 'correct';
            quizPoints += 100;
            updatePoints();
            activeCard.classList.add('quiz-correct');
            activeCard.classList.remove('quiz-wrong');
            if (feedback) {
                feedback.textContent = '정답!';
                feedback.className = 'answer-feedback feedback-correct mt-3 text-sm';
            }
        } else {
            quizAnswers[questionIndex] = 'wrong';
            activeCard.classList.add('quiz-wrong');
            activeCard.classList.remove('quiz-correct');
            if (feedback) {
                feedback.textContent = '오답입니다.';
                feedback.className = 'answer-feedback feedback-wrong mt-3 text-sm';
            }
        }

        const correctCount = quizAnswers.filter((answer) => answer === 'correct').length;
        if (quizSummary) {
            quizSummary.textContent = `현재까지 ${correctCount}문제를 맞혔어요! 포인트는 ${quizPoints}P 입니다.`;
            quizSummary.classList.remove('hidden');
        }
        if (quizStatus) {
            quizStatus.textContent = '이 문제는 판정됐습니다.';
        }
        if (quizFeedback) {
            quizFeedback.textContent = '다음 문제로 넘어가서 계속 풀어보세요.';
        }
        if (resetQuizButton) {
            resetQuizButton.classList.remove('hidden');
        }
        if (submitQuizButton) {
            submitQuizButton.disabled = false;
            submitQuizButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        activeCard.querySelectorAll('input[type="radio"]').forEach((input) => {
            input.disabled = true;
        });
    });
}

if (resetQuizButton) {
    resetQuizButton.addEventListener('click', resetQuizState);
}

document.querySelectorAll('.redeem-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        showGameModal('ㄴㄴ');
    });
});

function showGameModal(message) {
    if (!gameModal) return;
    if (gameModalMessage) {
        gameModalMessage.textContent = message;
    }
    gameModal.classList.remove('hidden');
    setTimeout(() => {
        gameModal.classList.add('opacity-100');
    }, 10);
}

function closeGameModal() {
    if (!gameModal) return;
    gameModal.classList.remove('opacity-100');
    setTimeout(() => {
        gameModal.classList.add('hidden');
    }, 300);
}

resetQuizState();
