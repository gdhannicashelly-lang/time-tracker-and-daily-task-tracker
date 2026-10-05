// --- STATE & SESSION MANAGEMENT ---
let currentSession = localStorage.getItem('custom_time_tracker_session');
currentSession = currentSession ? JSON.parse(currentSession) : null;

let reportsData = localStorage.getItem('custom_time_tracker_reports');
reportsData = reportsData ? JSON.parse(reportsData) : [];

let activeTimerState = localStorage.getItem('custom_time_tracker_timer');
activeTimerState = activeTimerState ? JSON.parse(activeTimerState) : { status: 'idle', timeIn: null, timeOut: null };

window.addEventListener('DOMContentLoaded', () => {
    if (currentSession) {
        initAppSession();
    } else {
        document.getElementById('loginOverlay').classList.remove('hidden');
        document.getElementById('appContainer').classList.add('hidden');
    }
    
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('inputDate');
    if (dateInput) dateInput.value = today;
});

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const role = document.getElementById('loginRole').value;
    
    let username = 'User';
    const parts = email.split('@');
    if (parts.length > 0 && parts[0]) {
        username = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }

    currentSession = { username: username, role: role };
    localStorage.setItem('custom_time_tracker_session', JSON.stringify(currentSession));
    initAppSession();
}

function initAppSession() {
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');

    document.getElementById('loggedInUserDisplay').textContent = currentSession.username;
    document.getElementById('loggedInRoleDisplay').textContent = currentSession.role.toUpperCase();

    const opsNoteBox = document.querySelector('.manager-only');
    if (currentSession.role === 'user') {
        if (opsNoteBox) opsNoteBox.style.display = 'none';
    } else {
        if (opsNoteBox) opsNoteBox.style.display = 'flex';
    }

    updateTimerUI();
    renderTable();
}

function logoutSession() {
    localStorage.removeItem('custom_time_tracker_session');
    location.reload();
}

// --- LIVE TIMER LOGIC ---
function handleTimer(action) {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (action === 'timeIn') {
        activeTimerState.status = 'working';
        activeTimerState.timeIn = now;
        activeTimerState.timeOut = null;
    } else if (action === 'break') {
        activeTimerState.status = 'onbreak';
    } else if (action === 'back') {
        activeTimerState.status = 'working';
    } else if (action === 'timeOut') {
        activeTimerState.status = 'completed';
        activeTimerState.timeOut = now;
    }

    localStorage.setItem('custom_time_tracker_timer', JSON.stringify(activeTimerState));
    updateTimerUI();
}

function updateTimerUI() {
    const pill = document.getElementById('statusPill');
    const displayIn = document.getElementById('displayTimeIn');
    const displayOut = document.getElementById('displayTimeOut');

    const btnIn = document.getElementById('btnTimeIn');
    const btnBreak = document.getElementById('btnBreak');
    const btnBack = document.getElementById('btnBack');
    const btnOut = document.getElementById('btnTimeOut');

    displayIn.textContent = activeTimerState.timeIn ? activeTimerState.timeIn : '--:--';
    displayOut.textContent = activeTimerState.timeOut ? activeTimerState.timeOut : '--:--';

    btnIn.disabled = false;
    btnBreak.disabled = true;
    btnBack.disabled = true;
    btnOut.disabled = true;

    pill.className = 'status-pill';

    if (activeTimerState.status === 'idle') {
        pill.textContent = 'Status: Idle';
        pill.classList.add('idle');
    } else if (activeTimerState.status === 'working') {
        pill.textContent = 'Status: Working';
        pill.classList.add('working');
        btnIn.disabled = true;
        btnBreak.disabled = false;
        btnOut.disabled = false;
    } else if (activeTimerState.status === 'onbreak') {
        pill.textContent = 'Status: On Break';
        pill.classList.add('onbreak');
        btnIn.disabled = true;
        btnBack.disabled = false;
        btnOut.disabled = false;
    } else if (activeTimerState.status === 'completed') {
        pill.textContent = 'Status: Completed';
        pill.classList.add('completed');
        btnBreak.disabled = true;
        btnBack.disabled = true;
        btnOut.disabled = true;
    }
}

// --- SPREADSHEET REPORT LOGIC ---
function addReport(e) {
    e.preventDefault();

    const newRow = {
        id: Date.now(),
        author: currentSession.username,
        date: document.getElementById('inputDate').value,
        month: document.getElementById('inputMonth').value,
        set: document.getElementById('inputSet').value,
        location: document.getElementById('inputLocation').value,
        taskHeader: document.getElementById('inputTaskHeader').value,
        taskDetails: document.getElementById('inputTaskDetails').value,
        taskLink: document.getElementById('inputTaskLink').value,
        hours: document.getElementById('inputHours').value,
        notes: document.getElementById('inputNotes').value,
        opsNote: currentSession.role !== 'user' ? document.getElementById('inputOpsNote').value : '',
        timeIn: activeTimerState.timeIn ? activeTimerState.timeIn : '--:--',
        timeOut: activeTimerState.timeOut ? activeTimerState.timeOut : '--:--',
        archived: false
    };

    reportsData.unshift(newRow);
    localStorage.setItem('custom_time_tracker_reports', JSON.stringify(reportsData));

    document.getElementById('reportForm').reset();
    document.getElementById('inputDate').value = new Date().toISOString().split('T')[0];
    
    renderTable();
    alert('Report row successfully saved to spreadsheet ledger!');
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    const archiveTbody = document.getElementById('archiveTableBody');
    const archiveSection = document.getElementById('archiveSection');
    
    tbody.innerHTML = '';
    archiveTbody.innerHTML = '';

    const activeRows = reportsData.filter(row => !row.archived);
    const archivedRows = reportsData.filter(row => row.archived);

    document.getElementById('recordCountBadge').textContent = activeRows.length + ' entries';

    if (activeRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #71717a; padding: 25px;">No spreadsheet entries found.</td></tr>';
    }

    let totalMinutesAccumulated = 0;

    activeRows.forEach(row => {
        const tr = document.createElement('tr');
        const canManage = currentSession.role === 'manager' || currentSession.role === 'admin';
        const isOwner = row.author === currentSession.username;
        const opsNoteVal = row.opsNote ? row.opsNote : '';
        const notesVal = row.notes ? row.notes : '<span style="color:#adb5bd;">-</span>';
        const linkVal = row.taskLink ? '<a href="' + row.taskLink + '" target="_blank" class="task-link-anchor" style="color:#38bdf8;"><i class="fa-solid fa-link"></i> Open Link</a>' : '<span style="color:#adb5bd;">None</span>';

        let hStr = String(row.hours || '').toLowerCase();
        let parsedMins = 0;
        if (hStr.includes('hr')) {
            let num = parseFloat(hStr);
            if (!isNaN(num)) parsedMins += num * 60;
        }
        if (hStr.includes('min')) {
            let num = parseFloat(hStr);
            if (!isNaN(num)) parsedMins += num;
        }
        if (!hStr.includes('hr') && !hStr.includes('min')) {
            let num = parseFloat(hStr);
            if (!isNaN(num)) parsedMins += num * 60;
        }
        totalMinutesAccumulated += parsedMins;

        let opsNoteHTML = '';
        if (canManage) {
            opsNoteHTML = '<input type="text" value="' + opsNoteVal + '" onchange="updateOpsNote(' + row.id + ', this.value)" style="width: 150px; padding: 4px 8px; font-size: 0.8rem; border:1px solid #3f3f46; border-radius:4px; background:#27272a; color:#fff;" placeholder="Add ops note...">';
        } else {
            opsNoteHTML = row.opsNote ? row.opsNote : '<span style="color:#adb5bd;">-</span>';
        }

        let actionHTML = '';
        if (isOwner || canManage) {
            actionHTML = '<div style="display:flex; gap:4px; flex-direction:column;">' +
                '<button onclick="openEditModal(' + row.id + ')" class="btn" style="padding: 4px 8px; font-size: 0.75rem; background: #3b82f6; color: white;"><i class="fa-solid fa-pen-to-square"></i> Edit</button>' +
                '</div>';
        } else {
            actionHTML = '<span style="color:#adb5bd; font-size:0.75rem;">View Only</span>';
        }

        tr.innerHTML = 
            '<td>' + row.date + '<br><small style="color:#f43f5e; font-weight:600;"><i class="fa-solid fa-user"></i> ' + row.author + '</small></td>' +
            '<td><strong>' + row.timeIn + '</strong></td>' +
            '<td><strong>' + row.timeOut + '</strong></td>' +
            '<td>' + row.location + '<br><small style="color:#71717a;">' + row.month + ' | ' + row.set + '</small></td>' +
            '<td><strong>' + row.taskHeader + '</strong><div class="task-details-cell" style="white-space: pre-wrap; font-size:0.8rem; color:#d4d4d8; margin-top:4px;">' + row.taskDetails + '</div></td>' +
            '<td>' + linkVal + '</td>' +
            '<td><span class="badge-tag" style="font-size:0.75rem; background:#27272a; padding:3px 6px; border-radius:4px; color:#f43f5e;">' + row.hours + '</span></td>' +
            '<td>' + notesVal + '</td>' +
            '<td>' + opsNoteHTML + '</td>' +
            '<td>' + actionHTML + '</td>';

        tbody.appendChild(tr);
    });

    // Append Total Work Hours Summary Row
    let overrideHours = localStorage.getItem('custom_total_hours_override');
    let finalHoursText = overrideHours ? overrideHours : '';
    
    if (!overrideHours) {
        let totalHrsCalc = Math.floor(totalMinutesAccumulated / 60);
        let totalMinsCalc = totalMinutesAccumulated % 60;
        if (totalHrsCalc > 0 && totalMinsCalc > 0) {
            finalHoursText = totalHrsCalc + ' hours and ' + totalMinsCalc + ' minutes';
        } else if (totalHrsCalc > 0) {
            finalHoursText = totalHrsCalc + ' hours';
        } else {
            finalHoursText = totalMinsCalc + ' minutes';
        }
    }

    const totalTr = document.createElement('tr');
    totalTr.style.background = '#166534';
    totalTr.style.fontWeight = 'bold';
    totalTr.style.color = '#ffffff';
    totalTr.innerHTML = 
        '<td colspan="6" style="text-align: right; padding: 12px;">Total Work Hours</td>' +
        '<td style="padding: 12px;" colspan="3">' + finalHoursText + '</td>' +
        '<td style="padding: 12px;"><button onclick="openTotalHoursEditModal(\'' + finalHoursText + '\')" class="btn" style="padding: 4px 8px; font-size: 0.75rem; background: #3b82f6; color: white;"><i class="fa-solid fa-pen-to-square"></i> Edit Total</button></td>';
    tbody.appendChild(totalTr);

    // Render Separate Archive Section Only if archived tasks exist
    if (archivedRows.length > 0) {
        archiveSection.style.display = 'block';
        document.getElementById('archiveCountBadge').textContent = archivedRows.length + ' archived';

        archivedRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.classList.add('archived-row');
            const canManage = currentSession.role === 'manager' || currentSession.role === 'admin';
            const isOwner = row.author === currentSession.username;
            const opsNoteVal = row.opsNote ? row.opsNote : '';
            const notesVal = row.notes ? row.notes : '<span style="color:#adb5bd;">-</span>';
            const linkVal = row.taskLink ? '<a href="' + row.taskLink + '" target="_blank" class="task-link-anchor" style="color:#38bdf8;"><i class="fa-solid fa-link"></i> Open Link</a>' : '<span style="color:#adb5bd;">None</span>';

            let opsNoteHTML = row.opsNote ? row.opsNote : '<span style="color:#adb5bd;">-</span>';

            let actionHTML = '';
            if (isOwner || canManage) {
                actionHTML = '<div style="display:flex; gap:4px; flex-direction:column;">' +
                    '<button onclick="openEditModal(' + row.id + ')" class="btn" style="padding: 4px 8px; font-size: 0.75rem; background: #3b82f6; color: white;"><i class="fa-solid fa-pen-to-square"></i> Edit</button>' +
                    '</div>';
            } else {
                actionHTML = '<span style="color:#adb5bd; font-size:0.75rem;">View Only</span>';
            }

            tr.innerHTML = 
                '<td>' + row.date + '<br><small style="color:#f43f5e; font-weight:600;"><i class="fa-solid fa-user"></i> ' + row.author + '</small></td>' +
                '<td><strong>' + row.timeIn + '</strong></td>' +
                '<td><strong>' + row.timeOut + '</strong></td>' +
                '<td>' + row.location + '<br><small style="color:#71717a;">' + row.month + ' | ' + row.set + '</small></td>' +
                '<td><strong>' + row.taskHeader + '</strong><div class="task-details-cell" style="white-space: pre-wrap; font-size:0.8rem; color:#d4d4d8; margin-top:4px;">' + row.taskDetails + '</div></td>' +
                '<td>' + linkVal + '</td>' +
                '<td><span class="badge-tag" style="font-size:0.75rem; background:#27272a; padding:3px 6px; border-radius:4px; color:#f43f5e;">' + row.hours + '</span></td>' +
                '<td>' + notesVal + '</td>' +
                '<td>' + opsNoteHTML + '</td>' +
                '<td>' + actionHTML + '</td>';

            archiveTbody.appendChild(tr);
        });
    } else {
        archiveSection.style.display = 'none';
    }
}

function updateOpsNote(id, val) {
    let row = reportsData.find(r => r.id === id);
    if (row) {
        row.opsNote = val;
        localStorage.setItem('custom_time_tracker_reports', JSON.stringify(reportsData));
    }
}

// --- EDIT & MODAL HELPERS ---
function openEditModal(id) {
    let row = reportsData.find(r => r.id === id);
    if (!row) return;

    document.getElementById('editRecordId').value = row.id;
    document.getElementById('editDate').value = row.date || '';
    document.getElementById('editTimeIn').value = row.timeIn || '--:--';
    document.getElementById('editTimeOut').value = row.timeOut || '--:--';
    document.getElementById('editMonth').value = row.month || '';
    document.getElementById('editSet').value = row.set || '';
    document.getElementById('editLocation').value = row.location || '';
    document.getElementById('editTaskHeader').value = row.taskHeader || '';
    document.getElementById('editTaskDetails').value = row.taskDetails || '';
    document.getElementById('editTaskLink').value = row.taskLink || '';
    document.getElementById('editHours').value = row.hours || '';
    document.getElementById('editNotes').value = row.notes || '';

    const archiveBtn = document.getElementById('modalArchiveBtn');
    if (archiveBtn) {
        archiveBtn.innerHTML = row.archived ? '<i class="fa-solid fa-box-open"></i> Unarchive' : '<i class="fa-solid fa-box-archive"></i> Archive';
        archiveBtn.style.background = row.archived ? '#10b981' : '#f59e0b';
    }

    const modal = document.getElementById('editModalOverlay');
    if (modal) modal.style.display = 'flex';
}

function closeEditModal() {
    const modal = document.getElementById('editModalOverlay');
    if (modal) modal.style.display = 'none';
}

function saveEditedReport(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editRecordId').value);
    let row = reportsData.find(r => r.id === id);

    if (row) {
        row.date = document.getElementById('editDate').value;
        row.timeIn = document.getElementById('editTimeIn').value;
        row.timeOut = document.getElementById('editTimeOut').value;
        row.month = document.getElementById('editMonth').value;
        row.set = document.getElementById('editSet').value;
        row.location = document.getElementById('editLocation').value;
        row.taskHeader = document.getElementById('editTaskHeader').value;
        row.taskDetails = document.getElementById('editTaskDetails').value;
        row.taskLink = document.getElementById('editTaskLink').value;
        row.hours = document.getElementById('editHours').value;
        row.notes = document.getElementById('editNotes').value;

        localStorage.setItem('custom_time_tracker_reports', JSON.stringify(reportsData));
        closeEditModal();
        renderTable();
        alert('Spreadsheet row successfully updated!');
    }
}

function modalToggleArchive() {
    const id = parseInt(document.getElementById('editRecordId').value);
    let row = reportsData.find(r => r.id === id);
    if (row) {
        row.archived = !row.archived;
        localStorage.setItem('custom_time_tracker_reports', JSON.stringify(reportsData));
        closeEditModal();
        renderTable();
        alert(row.archived ? 'Record archived successfully.' : 'Record unarchived successfully.');
    }
}

function modalDeleteRecord() {
    const id = parseInt(document.getElementById('editRecordId').value);
    if (confirm('Are you sure you want to permanently delete this task entry?')) {
        reportsData = reportsData.filter(row => row.id !== id);
        localStorage.setItem('custom_time_tracker_reports', JSON.stringify(reportsData));
        closeEditModal();
        renderTable();
        alert('Record permanently deleted.');
    }
}

function openTotalHoursEditModal(currentText) {
    const newHours = prompt('Edit Total Work Hours:', currentText);
    if (newHours !== null && newHours.trim() !== '') {
        localStorage.setItem('custom_total_hours_override', newHours);
        renderTable();
        alert('Total work hours updated successfully!');
    }
}

// Explicit global bindings
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEditedReport = saveEditedReport;
window.modalToggleArchive = modalToggleArchive;
window.modalDeleteRecord = modalDeleteRecord;
window.openTotalHoursEditModal = openTotalHoursEditModal;