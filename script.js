import {
    DEMO_GROUPS,
    addWinners,
    getParticipants,
    getPublicCheckUrl,
    getRoomID,
    getWinners,
    listenWinners,
    resetDemoWinners
} from './demo-state.js';

const musicPlaylist = [
    { name: '【新年好馬】', file: '【新年好馬】.mp3' },
    { name: '【我說新年好】', file: '【我說新年好】.mp3' },
    { name: '【歡歡喜喜HuaHuaHeHe】', file: '【歡歡喜喜HuaHuaHeHe】.mp3' },
    { name: '【新年就是要你HAPPY】', file: '【新年就是要你HAPPY】.mp3' },
    { name: '【好運步步高】', file: '【好運步步高】.mp3' }
];

const roomID = getRoomID();
let allParticipants = [];
let winnersHistory = [];
let selectedGroupKey = 'demo_a';
let currentSongIndex = 0;
let isLoopAll = false;

const getEl = (id) => document.getElementById(id);
const drawBtn = getEl('draw-btn');
const drawVideo = getEl('draw-video');
const resultArea = getEl('result-area');
const resultContent = getEl('result-content');
const dataPanel = getEl('data-panel');
const settingPanel = getEl('setting-panel');
const celebrationOverlay = getEl('celebration-overlay');
const bgMusic = getEl('bg-music');
const musicPanelWrapper = getEl('music-panel-wrapper');
const musicListDiv = getEl('music-list');
const musicToggleBtn = getEl('music-toggle-btn');
const btnConfirmData = getEl('btn-confirm-data');
const fileOptions = document.querySelectorAll('.file-option');
const roomDisplay = getEl('current-room-display');

window.closeResultModal = () => {
    resultArea.style.display = 'none';
    celebrationOverlay.style.display = 'none';
};
window.closeSettings = () => settingPanel.classList.remove('active');

document.addEventListener('DOMContentLoaded', () => {
    if (roomDisplay) roomDisplay.innerText = roomID;

    listenWinners(roomID, (winners) => {
        winnersHistory = winners;
        updateStats();
    });

    generateQRCode();
    initMusicSystem();
    bindDemoGroupSelector();
    bindPanels();
    loadDemoGroup(selectedGroupKey, false);

    if (drawBtn) drawBtn.addEventListener('click', startDrawProcess);
    if (drawVideo) drawVideo.addEventListener('ended', showResults);
});

function bindDemoGroupSelector() {
    fileOptions.forEach((opt) => {
        opt.addEventListener('click', () => {
            fileOptions.forEach((option) => option.classList.remove('selected'));
            opt.classList.add('selected');
            selectedGroupKey = opt.getAttribute('data-group') || 'demo_a';
        });
    });

    if (btnConfirmData) {
        btnConfirmData.addEventListener('click', (event) => {
            event.stopPropagation();
            loadDemoGroup(selectedGroupKey, true);
        });
    }
}

function bindPanels() {
    const setupPanel = (panel, excludeSelector) => {
        if (!panel) return;
        panel.addEventListener('click', (event) => {
            if (event.target.closest(excludeSelector) || event.target.closest('button')) return;
            closeOtherPanels(panel);
            panel.classList.toggle('active');
        });
    };

    setupPanel(dataPanel, '.file-option');
    setupPanel(settingPanel, 'input');
    setupPanel(musicPanelWrapper, '.music-item');
}

function closeOtherPanels(currentPanel) {
    [dataPanel, settingPanel, musicPanelWrapper].forEach((panel) => {
        if (panel && panel !== currentPanel) panel.classList.remove('active');
    });
}

function loadDemoGroup(groupKey, showMessage) {
    selectedGroupKey = groupKey;
    allParticipants = getParticipants(groupKey);
    updateStats();

    const group = DEMO_GROUPS[groupKey] || DEMO_GROUPS.demo_a;
    if (showMessage) {
        Swal.fire({
            title: 'Demo 名單已載入',
            text: `${group.label}，共 ${allParticipants.length} 筆假資料`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    }
}

function updateStats() {
    const totalCountEl = getEl('total-count');
    const remainCountEl = getEl('remain-count');
    if (!totalCountEl || !remainCountEl) return;

    totalCountEl.innerText = allParticipants.length;
    const winnersKeys = new Set(winnersHistory.map((winner) => `${winner.zone}_${winner.name}`));
    const remainCount = allParticipants.filter((person) => !winnersKeys.has(`${person.zone}_${person.name}`)).length;
    remainCountEl.innerText = remainCount;
}

function startDrawProcess() {
    resultArea.style.display = 'none';
    celebrationOverlay.style.display = 'none';

    if (allParticipants.length === 0) {
        Swal.fire('請先載入 Demo 名單', '請點擊左上角資料夾，選擇一組假名單。', 'warning');
        return;
    }

    const count = parseInt(getEl('draw-count').value, 10);
    const prizeName = getEl('prize-name').value || 'Demo 獎項';
    const winnersKeys = new Set(winnersHistory.map((winner) => `${winner.zone}_${winner.name}`));
    const pool = allParticipants.filter((person) => !winnersKeys.has(`${person.zone}_${person.name}`));

    if (pool.length < count) {
        Swal.fire('注意', '剩餘 Demo 人數不足，請重置結果或切換名單。', 'warning');
        return;
    }

    const currentWinners = [];
    for (let i = 0; i < count; i += 1) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const winner = pool.splice(randomIndex, 1)[0];
        currentWinners.push({ ...winner, prize: prizeName });
    }

    window.tempCurrentWinners = currentWinners;
    if (bgMusic) bgMusic.volume = 0.1;

    if (drawVideo) {
        drawVideo.style.display = 'block';
        drawVideo.currentTime = 0;
        const playPromise = drawVideo.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => setTimeout(showResults, 600));
        }
    } else {
        showResults();
    }
}

function showResults() {
    if (drawVideo) drawVideo.style.display = 'none';
    if (bgMusic) bgMusic.volume = 1.0;

    const winners = window.tempCurrentWinners || [];
    if (!winners.length) return;

    const storedWinners = addWinners(roomID, winners);
    renderResultArea(storedWinners);

    celebrationOverlay.style.backgroundImage = `url('movies.gif?t=${Date.now()}')`;
    celebrationOverlay.style.display = 'block';
}

function renderResultArea(winners) {
    winners.sort((a, b) => zoneNumber(a.zone) - zoneNumber(b.zone) || a.zone.localeCompare(b.zone));

    const groups = {};
    winners.forEach((winner) => {
        if (!groups[winner.zone]) groups[winner.zone] = [];
        groups[winner.zone].push(winner.name);
    });

    let html = `<h2>🎉 ${getEl('prize-name').value || 'Demo 獎項'} 中獎名單 🎉</h2>`;
    for (const [zone, names] of Object.entries(groups)) {
        html += `<div class="zone-group"><span class="zone-title">${zone}</span><span class="zone-names">${names.join('、')}</span></div>`;
    }
    resultContent.innerHTML = html;
    resultArea.style.display = 'block';
}

window.resetWinners = () => {
    Swal.fire({
        title: '重置 Demo 結果？',
        text: `這只會清空本瀏覽器房間 [${roomID}] 的展示資料，不會刪除任何真實資料。`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: '重置 Demo'
    }).then((result) => {
        if (result.isConfirmed) {
            resetDemoWinners(roomID);
            resultArea.style.display = 'none';
            celebrationOverlay.style.display = 'none';
            Swal.fire('已重置', 'Demo 中獎資料已清空。', 'success');
        }
    });
};

function generateQRCode() {
    const qrContainer = getEl('qrcode');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, { text: getPublicCheckUrl(roomID), width: 180, height: 180 });
}

function initMusicSystem() {
    if (!musicListDiv || !bgMusic) return;

    const loopBtn = document.createElement('button');
    loopBtn.className = 'music-item loop-mode';
    loopBtn.innerHTML = '🔁 循環播放 (全部)';
    loopBtn.onclick = (event) => {
        event.stopPropagation();
        startLoopAll();
    };
    musicListDiv.appendChild(loopBtn);

    musicPlaylist.forEach((song, index) => {
        const btn = document.createElement('button');
        btn.className = 'music-item';
        btn.innerText = song.name;
        if (index === 0) btn.classList.add('active');
        btn.onclick = (event) => {
            event.stopPropagation();
            playSingleSong(index);
        };
        musicListDiv.appendChild(btn);
    });

    bgMusic.src = musicPlaylist[0].file;
    bgMusic.volume = 1.0;
    bgMusic.loop = true;
    bgMusic.addEventListener('ended', () => {
        if (!isLoopAll) return;
        currentSongIndex = (currentSongIndex + 1) % musicPlaylist.length;
        playSongByIndex(currentSongIndex);
    });

    if (musicToggleBtn) {
        musicToggleBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            bgMusic.muted = !bgMusic.muted;
            updateMuteBtn();
        });
    }
}

function playSingleSong(index) {
    isLoopAll = false;
    currentSongIndex = index;
    bgMusic.loop = true;
    updateMusicUI(index + 1);
    playSongByIndex(index);
}

function startLoopAll() {
    isLoopAll = true;
    bgMusic.loop = false;
    updateMusicUI(0);
    if (bgMusic.paused) playSongByIndex(currentSongIndex);
}

function playSongByIndex(index) {
    bgMusic.src = musicPlaylist[index].file;
    bgMusic.play().then(updateMuteBtn).catch(() => updateMuteBtn());
}

function updateMusicUI(activeIndex) {
    const btns = musicListDiv.querySelectorAll('.music-item');
    btns.forEach((button, index) => {
        button.classList.toggle('active', index === activeIndex);
    });
}

function updateMuteBtn() {
    if (!musicToggleBtn) return;
    musicToggleBtn.innerText = bgMusic.muted ? '🔇' : '🔊';
    musicToggleBtn.style.background = bgMusic.muted ? '#d32f2f' : '#28a745';
}

function zoneNumber(zone) {
    const match = String(zone).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}
