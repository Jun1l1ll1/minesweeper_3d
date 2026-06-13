// App UI elements used by the PWA install flow and status display
const installNotice = document.getElementById('installNotice');
const installButton = document.getElementById('install-button');
const settingsDialog = document.getElementById('settings-container');
const refreshButton = document.getElementById('refresh-btn');
const statusText = document.getElementById('pwa-status');

let deferredPrompt;
// let boardScale = 1;
// let initialPinchDistance = null;
// let initialBoardScale = 1;
// const minBoardScale = 0.4;
// const maxBoardScale = 3;

// const clampBoardScale = (value) => Math.min(maxBoardScale, Math.max(minBoardScale, value));
// const updateBoardScale = (value) => {
//     boardScale = clampBoardScale(value);
//     const boardInner = document.querySelector('.board-inner');
//     if (boardInner) {
//         boardInner.style.transform = `scale(${boardScale})`;
//     }
// };

// const getTouchDistance = (touches) => {
//     const [a, b] = touches;
//     return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
// };

function updateStatus() {
    const isOnline = navigator.onLine;
    statusText.textContent = isOnline
        ? 'You are online. Your PWA is ready to work offline when installed.'
        : 'You are offline. The app will still work with cached content.';
}

window.addEventListener('load', () => {
    updateStatus();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(() => console.log('Service Worker registered.'))
            .catch((err) => console.error('SW registration failed:', err));
    }

    // const board = document.querySelector('.board');
    // updateBoardScale(boardScale);

    // if (board) {
    //     board.addEventListener('wheel', (event) => {
    //         event.preventDefault();
    //         const delta = -event.deltaY * 0.002;
    //         if (delta === 0) return;
    //         updateBoardScale(boardScale * (1 + delta));
    //     }, { passive: false });

    //     board.addEventListener('touchstart', (event) => {
    //         if (event.touches.length !== 2) return;
    //         initialPinchDistance = getTouchDistance(event.touches);
    //         initialBoardScale = boardScale;
    //     }, { passive: false });

    //     board.addEventListener('touchmove', (event) => {
    //         if (event.touches.length !== 2 || initialPinchDistance === null) return;
    //         event.preventDefault();
    //         const currentDistance = getTouchDistance(event.touches);
    //         const scaleFactor = currentDistance / initialPinchDistance;
    //         updateBoardScale(initialBoardScale * scaleFactor);
    //     }, { passive: false });

    //     const resetPinch = () => {
    //         initialPinchDistance = null;
    //     };
    //     board.addEventListener('touchend', resetPinch);
    //     board.addEventListener('touchcancel', resetPinch);
    // }
});

// Update the status message whenever connectivity changes
window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);


// Listen for the install prompt event to show a custom install UI
window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.classList.remove('hidden');
});

installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
        console.log('PWA install accepted.');
    } else {
        console.log('PWA install dismissed.');
    }
    deferredPrompt = null;
    installButton.classList.add('hidden');
});

refreshButton.addEventListener('click', () => {
    window.location.reload();
});
