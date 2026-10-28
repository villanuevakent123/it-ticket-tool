const GIST_URL = "https://api.github.com/gists/19ed8886620db9ca1d0ecd21d8b187fb";
const PAT = "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";

let allTickets = [];

async function loadTickets() {
    const container = document.getElementById('ticketsContainer');
    container.innerHTML = '<p class="loading">Loading tickets...</p>';

    try {
        const response = await fetch(GIST_URL);
        if (!response.ok) throw new Error("Gist fetch failed");
        const gist = await response.json();
        allTickets = JSON.parse(gist.files['tickets.json'].content);
    } catch (err) {
        console.log('⚠️ Using local storage fallback:', err);
        allTickets = JSON.parse(localStorage.getItem('itTickets') || '[]');
    }

    updateStats();
    renderTickets(allTickets);
}

function renderTickets(tickets) {
    const container = document.getElementById('ticketsContainer');
    if (!tickets.length) {
        container.innerHTML = '<p class="loading">No tickets found.</p>';
        return;
    }

    container.innerHTML = tickets.map(ticket => `
        <div class="ticket-card priority-${ticket.urgency}">
            <h3>${ticket.id} — ${ticket.storeName}</h3>
            <p><strong>📍 Location:</strong> ${ticket.storeLocation}</p>
            <p><strong>👤 Contact:</strong> ${ticket.contactPerson} | ${ticket.contactNumber}</p>
            <p><strong>🖥️ POS Terminal:</strong> ${ticket.posTerminal}</p>
            <p><strong>⚠️ Issue:</strong> ${ticket.issueTypeLabel}</p>
            <p><strong>📝 Description:</strong> ${ticket.description}</p>
            <p><strong>🔥 Urgency:</strong> ${ticket.urgencyLabel}</p>
            <p><strong>🕐 Submitted:</strong> ${ticket.submittedAt}</p>
            <p><strong>📊 Status:</strong> <span class="status-badge">${ticket.status}</span></p>
            <div class="ticket-actions">
                <button onclick="updateStatus('${ticket.id}', 'In Progress')" style="background:#bfdbfe;">Mark In Progress</button>
                <button onclick="updateStatus('${ticket.id}', 'Resolved')" style="background:#bbf7d0;">Mark Resolved</button>
                <button onclick="updateStatus('${ticket.id}', 'Closed')" style="background:#e5e7eb;">Close</button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    document.getElementById('countHigh').textContent = allTickets.filter(t => t.urgency === 'high').length;
    document.getElementById('countMedium').textContent = allTickets.filter(t => t.urgency === 'medium').length;
    document.getElementById('countLow').textContent = allTickets.filter(t => t.urgency === 'low').length;
    document.getElementById('countResolved').textContent = allTickets.filter(t => t.status === 'Resolved').length;
}

async function updateStatus(ticketId, newStatus) {
    const idx = allTickets.findIndex(t => t.id === ticketId);
    if (idx === -1) return;
    
    allTickets[idx].status = newStatus;
    
    try {
        const res = await fetch(GIST_URL, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${PAT}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: {
                    'tickets.json': {
                        content: JSON.stringify(allTickets, null, 2)
                    }
                }
            })
        });

        if (!res.ok) throw new Error("Update failed");
        renderTickets(allTickets);
        updateStats();
        alert(`✅ Ticket ${ticketId} updated to "${newStatus}"`);
    } catch (err) {
        console.log('⚠️ Local save only:', err);
        localStorage.setItem('itTickets', JSON.stringify(allTickets));
        renderTickets(allTickets);
        updateStats();
        alert(`✅ Saved locally (Gist not connected): ${ticketId} → ${newStatus}`);
    }
}

// Filter tickets by status
document.getElementById('filterStatus').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'all') renderTickets(allTickets);
    else renderTickets(allTickets.filter(t => t.status === val));
});

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', loadTickets);

// Load on page open
loadTickets();
