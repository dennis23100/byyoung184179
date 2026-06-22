import { getRoomID, groupWinnersByBatch, listenWinners } from './demo-state.js';

const listContainer = document.getElementById('admin-list');
const roomID = getRoomID();
let expandedBatches = new Set();

listenWinners(roomID, (winners) => {
    if (!winners.length) {
        listContainer.innerHTML = `<div style="padding:20px; text-align:center; color:#888;">目前房間 [${roomID}] 無 Demo 中獎資料</div>`;
        return;
    }

    renderList(groupWinnersByBatch(winners, false));
});

function renderList(batches) {
    let html = '';

    batches.forEach((batch) => {
        const firstWinner = batch[0];
        const date = new Date(firstWinner.timestamp);
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        const batchId = firstWinner.timestamp.toString();
        const isOpen = expandedBatches.has(batchId);

        batch.sort((a, b) => zoneNumber(a.zone) - zoneNumber(b.zone) || a.zone.localeCompare(b.zone));

        html += `
            <div class="accordion-header"
                 onclick="toggleAccordion(this)"
                 data-id="${batchId}">
                <span>批次：${firstWinner.prize}</span>
                <span class="batch-time">${timeStr}</span>
            </div>
            <div class="accordion-content ${isOpen ? 'show' : ''}">
        `;

        batch.forEach((winner) => {
            const isClaimed = winner.isClaimed === true;
            const rowClass = isClaimed ? 'claim-item claimed' : 'claim-item';
            const btnText = isClaimed ? 'Demo 已領取 ✅' : 'Demo 未領取';
            const btnClass = isClaimed ? 'check-btn active' : 'check-btn';

            html += `
                <div class="${rowClass}">
                    <div>
                        <span class="name-info">${winner.name}</span>
                        <span class="meta-info">[${winner.zone}]</span>
                    </div>
                    <button class="${btnClass}" onclick="showReadOnlyNotice()">${btnText}</button>
                </div>
            `;
        });

        html += '</div>';
    });

    listContainer.innerHTML = html;
}

window.toggleAccordion = (btn) => {
    const content = btn.nextElementSibling;
    const batchId = btn.getAttribute('data-id');
    content.classList.toggle('show');

    if (!batchId) return;
    if (content.classList.contains('show')) expandedBatches.add(batchId);
    else expandedBatches.delete(batchId);
};

window.showReadOnlyNotice = () => {
    Swal.fire({
        icon: 'info',
        title: '唯讀 Demo',
        text: '公開作品集版本不會修改領獎狀態，避免暴露正式後台操作。'
    });
};

function zoneNumber(zone) {
    const match = String(zone).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}
