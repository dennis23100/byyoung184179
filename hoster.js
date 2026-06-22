import { getRoomID, groupWinnersByBatch, listenWinners } from './demo-state.js';

const roomID = getRoomID();
const roomDisplay = document.getElementById('room-id-display');
const listArea = document.getElementById('host-list-area');

if (roomDisplay) roomDisplay.innerText = roomID;

listenWinners(roomID, (winners) => {
    if (!winners.length) {
        listArea.innerHTML = '<div class="waiting-msg">目前無任何 Demo 中獎資料。請先從抽獎頁執行一次抽獎。</div>';
        return;
    }

    renderHostView(groupWinnersByBatch(winners, true));
});

function renderHostView(batches) {
    let fullHtml = '';

    batches.forEach((batch, index) => {
        const prizeName = batch[0].prize;
        const isLatest = index === 0;
        let titleClass = 'prize-section-title';
        let contentClass = 'prize-content-wrapper';

        if (isLatest) {
            titleClass += ' latest-batch expanded';
            contentClass += ' show';
        } else {
            titleClass += ' old-batch';
        }

        const icon = isLatest ? '🟢' : '⚫';
        fullHtml += `
            <div class="${titleClass}" onclick="toggleSection(this)">
                <span>${icon} ${prizeName} 中獎名單</span>
            </div>
        `;

        fullHtml += `<div class="${contentClass}">`;

        batch.sort((a, b) => zoneNumber(a.zone) - zoneNumber(b.zone) || a.zone.localeCompare(b.zone));

        const zoneMap = {};
        batch.forEach((winner) => {
            if (!zoneMap[winner.zone]) zoneMap[winner.zone] = [];
            zoneMap[winner.zone].push(winner.name);
        });

        for (const [zone, names] of Object.entries(zoneMap)) {
            fullHtml += `
                <div class="zone-group">
                    <span class="zone-title">${zone}</span>
                    <span class="zone-names">${names.join('、')}</span>
                </div>
            `;
        }

        fullHtml += '</div>';
    });

    listArea.innerHTML = fullHtml;
}

window.toggleSection = (titleElement) => {
    titleElement.classList.toggle('expanded');
    const content = titleElement.nextElementSibling;
    content.classList.toggle('show');
};

function zoneNumber(zone) {
    const match = String(zone).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}
