import { getRoomID, getWinners, groupWinnersByBatch, listenWinners } from './demo-state.js';

const roomID = getRoomID();
const celebrationOverlay = document.getElementById('celebration-overlay');
const resultDiv = document.getElementById('check-result');
const resultArea = document.getElementById('result-area');
const resultContent = document.getElementById('result-content');
const modalTitle = document.getElementById('modal-title');
const trophyBtn = document.getElementById('trophy-btn');
const trophyMenu = document.getElementById('trophy-menu');

let currentWinners = getWinners(roomID);

listenWinners(roomID, (winners) => {
    currentWinners = winners;
});

window.checkStatus = () => {
    const nameInput = document.getElementById('query-name');
    const name = nameInput.value.trim();

    resultDiv.innerHTML = '查詢中...';
    resultDiv.style.display = 'block';
    celebrationOverlay.style.display = 'none';
    celebrationOverlay.classList.remove('mobile-win-gif');

    if (!name) {
        Swal.fire('請輸入名字');
        resultDiv.style.display = 'none';
        return;
    }

    if (!currentWinners.length) {
        resultDiv.innerHTML = '<span class="loser-text">目前尚無 Demo 中獎名單。</span>';
        return;
    }

    const normalizedName = name.toLowerCase();
    const myPrizes = currentWinners.filter((winner) => winner.name.toLowerCase() === normalizedName);

    if (myPrizes.length > 0) {
        let html = '<div class="winner-text">🎉 恭喜！您中獎了！ 🎉</div>';
        myPrizes.forEach((prize) => {
            html += `<div style="margin-top:10px;">${prize.zone}<br><span style="color:#fff; font-size:1.2em; border:1px solid #fff; padding:2px 10px; border-radius:5px;">${prize.prize}</span></div>`;
        });
        resultDiv.innerHTML = html;

        celebrationOverlay.classList.add('mobile-win-gif');
        celebrationOverlay.style.backgroundImage = `url('movies1.gif?t=${Date.now()}')`;
        celebrationOverlay.style.display = 'block';
        celebrationOverlay.onclick = () => { celebrationOverlay.style.display = 'none'; };
    } else {
        resultDiv.innerHTML = '<span class="loser-text">目前查無您的 Demo 中獎紀錄。<br>請試試：林安妮、黃雅婷，或先從抽獎頁抽出新結果。</span>';
    }
};

if (trophyBtn && trophyMenu) {
    trophyBtn.addEventListener('click', () => {
        trophyMenu.style.display = trophyMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (event) => {
        if (!trophyBtn.contains(event.target) && !trophyMenu.contains(event.target)) {
            trophyMenu.style.display = 'none';
        }
    });
}

window.showAllWinners = () => {
    trophyMenu.style.display = 'none';
    const winners = [...currentWinners];
    if (!winners.length) {
        Swal.fire('目前沒有任何 Demo 中獎名單');
        return;
    }

    winners.sort((a, b) => zoneNumber(a.zone) - zoneNumber(b.zone) || a.zone.localeCompare(b.zone));

    const groups = {};
    winners.forEach((winner) => {
        if (!groups[winner.zone]) groups[winner.zone] = [];
        groups[winner.zone].push(`${winner.name} (${winner.prize})`);
    });

    let html = '';
    for (const [zone, items] of Object.entries(groups)) {
        html += `<div class="zone-group"><div class="zone-title">${zone}</div><div class="zone-names">${items.join('、')}</div></div>`;
    }
    modalTitle.innerText = '🏆 所有 Demo 中獎名單';
    resultContent.innerHTML = html;
    resultArea.style.display = 'block';
};

window.showBatchWinners = () => {
    trophyMenu.style.display = 'none';
    const winners = [...currentWinners];
    if (!winners.length) {
        Swal.fire('目前沒有任何 Demo 中獎名單');
        return;
    }

    const batches = groupWinnersByBatch(winners, false);
    let html = '';

    batches.forEach((batch) => {
        const firstWinner = batch[0];
        const date = new Date(firstWinner.timestamp);
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        batch.sort((a, b) => zoneNumber(a.zone) - zoneNumber(b.zone) || a.zone.localeCompare(b.zone));

        html += `
            <button class="accordion-header" onclick="toggleAccordion(this)">
                <span>${firstWinner.prize}</span>
                <span class="batch-time">${timeStr}</span>
            </button>
            <div class="accordion-content">
        `;

        batch.forEach((winner) => {
            html += `
                <div class="list-item-row">
                    <span style="font-size:1.1em;">${winner.name} <span class="zone-tag">${winner.zone}</span></span>
                </div>
            `;
        });

        html += '</div>';
    });

    modalTitle.innerText = '⏱️ 分批 Demo 中獎名單';
    resultContent.innerHTML = html;
    resultArea.style.display = 'block';
};

window.toggleAccordion = (btn) => {
    btn.classList.toggle('active');
    const content = btn.nextElementSibling;
    content.classList.toggle('show');
};

window.closeResultModal = () => { resultArea.style.display = 'none'; };

function zoneNumber(zone) {
    const match = String(zone).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}
