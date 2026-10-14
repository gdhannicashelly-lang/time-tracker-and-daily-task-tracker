let currentUser = null;
let activeTab = 'timer';
let authMode = 'login'; 
let activeTimerState = {
    status: 'out',
    timeInVal: '',
    startTime: null
};

let editModalInstance = null;

// Initialize demo entries, users, and activity logs in localStorage
if (!localStorage.getItem('timeTracker_entries')) {
    const seedEntries = [
        {
            id: '1',
            user: 'Dhannica Shelly C. Ganibe',
            email: 'employee@tracker.com',
            date: '2026-10-13',
            timeIn: '16:00',
            timeOut: '00:33',
            location: 'NOVA - SET 2',
            task: 'Keyword Mapping, getting clicks , Impressions, indexed or not',
            link: 'https://workspace.example/task1',
            hours: 4.0,
            notes: 'Open gsc click performance add filter into page...',
            ops: '-'
        },
        {
            id: '2',
            user: 'Dhannica Shelly C. Ganibe',
            email: 'employee@tracker.com',
            date: '2026-10-13',
            timeIn: '16:00',
            timeOut: '00:33',
            location: 'Fort Myers -Set 2',
            task: 'Keyword Mapping, getting clicks , Impressions, indexed or not',
            link: 'https://workspace.example/task2',
            hours: 4.0,
            notes: 'Open gsc click performance add filter into page...',
            ops: '-'
        }
    ];
    localStorage.setItem('timeTracker_entries', JSON.stringify(seedEntries));
}
if (!localStorage.getItem('timeTracker_users')) {
    const seedUsers = [
        { name: 'Dhannica Shelly C. Ganibe', email: 'employee@tracker.com', password: 'password', role: 'Employee' },
        { name: 'Sarah Jenkins', email: 'manager@tracker.com', password: 'password', role: 'Manager' },
        { name: 'Admin Master', email: 'admin@tracker.com', password: 'password', role: 'Admin' }
    ];
    localStorage.setItem('timeTracker_users', JSON.stringify(seedUsers));
}

if (!localStorage.getItem('timeTracker_activityLogs')) {
    const seedLogs = [
        {
            id: 'log-1',
            user: 'Dhannica Shelly C. Ganibe',
            role: 'Employee',
            action: 'Clock In',
            timeLogged: '04:00 PM',
            timestamp: 'Oct 13, 2026 04:00 PM',
            rawTimestamp: '2026-10-13T16:00:00'
        },
        {
            id: 'log-2',
            user: 'Dhannica Shelly C. Ganibe',
            role: 'Employee',
            action: 'Clock Out',
            timeLogged: '12:33 AM',
            timestamp: 'Oct 14, 2026 12:33 AM',
            rawTimestamp: '2026-10-14T00:33:00'
        }
    ];
    localStorage.setItem('timeTracker_activityLogs', JSON.stringify(seedLogs));
}

window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('timeTracker_activeUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        enterApp();
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    const entryDateEl = document.getElementById('entry-date');
    if (entryDateEl) entryDateEl.value = todayStr;

    updateClock();
    setInterval(updateClock, 1000);

    editModalInstance = new bootstrap.Modal(document.getElementById('editModal'));
});

// --- CLOCK & LIVE TIMER FUNCTIONS ---
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    const clockEl = document.getElementById('live-clock-display');
    const dateEl = document.getElementById('current-live-date');
    if (clockEl) clockEl.innerText = timeString;
    if (dateEl) dateEl.innerText = dateString;
}

function recordActivityLog(actionName) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const logs = JSON.parse(localStorage.getItem('timeTracker_activityLogs')) || [];
    const userName = currentUser ? currentUser.name : 'Dhannica Shelly C. Ganibe';
    const userRole = currentUser ? currentUser.role : 'Employee';

    const newLog = {
        id: Date.now().toString(),
        user: userName,
        role: userRole,
        action: actionName,
        timeLogged: timeStr,
        timestamp: `${dateStr} ${timeStr}`,
        rawTimestamp: now.toISOString()
    };

    logs.unshift(newLog);
    localStorage.setItem('timeTracker_activityLogs', JSON.stringify(logs));
}

function clockAction(action) {
    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 5);
    const statusText = document.getElementById('clock-status-text');
    const btnIn = document.getElementById('btn-clock-in');
    const btnBreak = document.getElementById('btn-break');
    const btnBack = document.getElementById('btn-back');
    const btnOut = document.getElementById('btn-clock-out');
    const timeInInput = document.getElementById('entry-time-in');
    const timeOutInput = document.getElementById('entry-time-out');

    if (action === 'in') {
        activeTimerState.status = 'in';
        activeTimerState.timeInVal = timeStr;
        activeTimerState.startTime = now;

        if (timeInInput) timeInInput.value = timeStr;
        if (statusText) {
            statusText.innerText = 'Clocked In (' + timeStr + ')';
            statusText.className = 'fw-semibold text-success';
        }

        btnIn.className = 'btn btn-secondary fw-bold px-3 py-2 flex-fill flex-md-grow-0';
        btnIn.disabled = true;

        btnBreak.className = 'btn btn-warning fw-bold px-3 py-2 flex-fill flex-md-grow-0';
        btnBreak.disabled = false;

        btnOut.className = 'btn btn-danger fw-bold px-3 py-2 flex-fill flex-md-grow-0';
        btnOut.disabled = false;

        recordActivityLog('Clock In');
        showToast('Clocked in successfully at ' + timeStr, 'success');
    } else if (action === 'break') {
        activeTimerState.status = 'break';
        if (statusText) {
            statusText.innerText = 'On Break';
            statusText.className = 'fw-semibold text-warning placeholder-glow';
        }

        btnBreak.className = 'btn btn-secondary fw-bold px-3 py-2 flex-fill flex-md-grow-0';
        btnBreak.disabled = true;

        btnBack.className = 'btn btn-primary fw-bold px-3 py-2 flex-fill flex-md-grow-0';
        btnBack.disabled = false;

        recordActivityLog('Start Break');
        showToast('Break started.', 'info');
    } else if (action === 'back') {
        activeTimerState.status = 'in';
        if (statusText) {
            statusText.innerText = 'Clocked In (Resumed)';
            statusText.className = 'fw-semibold text-success';
        }

        btnBack.className = 'btn btn-secondary fw-bold px-3 py-2 flex-fill flex-md-grow-0';
        btnBack.disabled = true;

        btnBreak.className = 'btn btn-warning fw-bold px-3 py-2 flex-fill flex-md-grow-0';
        btnBreak.disabled = false;

        recordActivityLog('Back Time');
        showToast('Returned from break.', 'success');
    } else if (action === 'out') {
        activeTimerState.status = 'out';
        if (timeOutInput) timeOutInput.value = timeStr;

        if (statusText) {
            statusText.innerText = 'Clocked Out (' + timeStr + ')';
            statusText.className = 'fw-semibold text-warning';
        }

        btnIn.className = 'btn btn-success fw-bold px-3 py-2 flex-fill flex-md-grow-0';
        btnIn.disabled = false;

        btnBreak.className = 'btn btn-secondary fw-bold px-3 py-2 flex-fill flex-md-grow-0';
        btnBreak.disabled = true;

        btnBack.className = 'btn btn-secondary fw-bold px-3 py-2 flex-fill flex-md-grow-0';
        btnBack.disabled = true;

        btnOut.className = 'btn btn-secondary fw-bold px-3 py-2 flex-fill flex-md-grow-0';
        btnOut.disabled = true;

        if (activeTimerState.startTime) {
            const diffMs = now - activeTimerState.startTime;
            const diffHrs = Math.max(0.25, Math.round((diffMs / (1000 * 60 * 60)) * 4) / 4);
            const hoursInput = document.getElementById('entry-hours');
            if (hoursInput) hoursInput.value = diffHrs;
        }

        recordActivityLog('Clock Out');
        showToast('Clocked out at ' + timeStr, 'success');
    }
}

function calculateHours() {
    const timeIn = document.getElementById('entry-time-in').value;
    const timeOut = document.getElementById('entry-time-out').value;
    if (timeIn && timeOut) {
        const [inH, inM] = timeIn.split(':').map(Number);
        const [outH, outM] = timeOut.split(':').map(Number);
        let totalMin = (outH * 60 + outM) - (inH * 60 + inM);
        if (totalMin < 0) totalMin += 24 * 60;
        const hrs = Math.round((totalMin / 60) * 100) / 100;
        document.getElementById('entry-hours').value = hrs > 0 ? hrs : 0;
    }
}

// --- AUTHENTICATION ---
function switchAuthTab(mode) {
    authMode = mode;
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const nameGroup = document.getElementById('name-group');
    const roleGroup = document.getElementById('role-group');
    const submitBtn = document.getElementById('auth-submit-btn');
    const subtitle = document.getElementById('auth-subtitle');

    if (mode === 'login') {
        tabLogin.className = 'btn btn-primary btn-sm';
        tabSignup.className = 'btn btn-outline-secondary btn-sm';
        nameGroup.classList.add('d-none');
        roleGroup.classList.add('d-none');
        submitBtn.innerText = 'Sign In';
        subtitle.innerText = 'Sign in to your account to continue';
    } else {
        tabSignup.className = 'btn btn-primary btn-sm';
        tabLogin.className = 'btn btn-outline-secondary btn-sm';
        nameGroup.classList.remove('d-none');
        roleGroup.classList.remove('d-none');
        submitBtn.innerText = 'Create Account';
        subtitle.innerText = 'Sign up for a new team account';
    }
}

function fillDemo(email) {
    document.getElementById('auth-email').value = email;
    document.getElementById('auth-password').value = 'password';
    switchAuthTab('login');
}

function handleAuth(event) {
    event.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const users = JSON.parse(localStorage.getItem('timeTracker_users')) || [];

    if (authMode === 'login') {
        const found = users.find(u => u.email === email && u.password === password);
        if (found) {
            currentUser = found;
            localStorage.setItem('timeTracker_activeUser', JSON.stringify(currentUser));
            enterApp();
            showToast('Welcome back, ' + currentUser.name + '!', 'success');
        } else {
            showToast('Invalid email or password.', 'error');
        }
    } else {
        const name = document.getElementById('auth-name').value.trim();
        const role = document.getElementById('auth-role').value;
        if (users.some(u => u.email === email)) {
            showToast('Email already registered.', 'error');
            return;
        }
        const newUser = { name, email, password, role };
        users.push(newUser);
        localStorage.setItem('timeTracker_users', JSON.stringify(users));
        currentUser = newUser;
        localStorage.setItem('timeTracker_activeUser', JSON.stringify(currentUser));
        enterApp();
        showToast('Account created successfully!', 'success');
    }
}

function logout() {
    localStorage.removeItem('timeTracker_activeUser');
    currentUser = null;
    document.getElementById('app-view').classList.add('d-none');
    document.getElementById('auth-view').classList.remove('d-none');
    showToast('Logged out successfully.', 'info');
}

function enterApp() {
    document.getElementById('auth-view').classList.add('d-none');
    document.getElementById('app-view').classList.remove('d-none');
    document.getElementById('user-role-badge').innerText = `Role: ${currentUser.role} (${currentUser.name})`;

    const navLogs = document.getElementById('nav-logs');
    const mobNavLogs = document.getElementById('mob-nav-logs');
    if (navLogs) navLogs.classList.remove('d-none');
    if (mobNavLogs) mobNavLogs.classList.remove('d-none');

    switchTab('timer');
}

// --- TABS ---
function switchTab(tab) {
    activeTab = tab;
    ['timer', 'dashboard', 'report', 'logs'].forEach(s => {
        const el = document.getElementById(`section-${s}`);
        const navBtn = document.getElementById(`nav-${s}`);
        const mobBtn = document.getElementById(`mob-nav-${s}`);

        if (s === tab) {
            if (el) el.classList.remove('d-none');
            if (navBtn) navBtn.className = 'nav-link active btn-sm';
            if (mobBtn) mobBtn.className = 'btn text-primary btn-sm flex-fill';
        } else {
            if (el) el.classList.add('d-none');
            if (navBtn) navBtn.className = 'nav-link text-secondary btn-sm';
            if (mobBtn) mobBtn.className = 'btn text-secondary btn-sm flex-fill';
        }
    });

    if (tab === 'dashboard') loadDashboard();
    if (tab === 'report') loadReportView();
    if (tab === 'logs') loadActivityLogView();
}

// --- CRUD & AUTOMATIC ACTIVITY LOG ---
function saveTaskEntry(event) {
    event.preventDefault();
    const entries = JSON.parse(localStorage.getItem('timeTracker_entries')) || [];

    const dateVal = document.getElementById('entry-date').value;
    const timeInVal = document.getElementById('entry-time-in').value;
    const timeOutVal = document.getElementById('entry-time-out').value;
    const locationVal = document.getElementById('entry-location').value;
    const taskVal = document.getElementById('entry-task').value;
    const linkVal = document.getElementById('entry-link').value || '#';
    const hoursVal = parseFloat(document.getElementById('entry-hours').value) || 0;
    const notesVal = document.getElementById('entry-notes').value;
    const opsVal = document.getElementById('entry-ops').value;

    const newEntry = {
        id: Date.now().toString(),
        user: currentUser.name,
        email: currentUser.email,
        date: dateVal,
        timeIn: timeInVal,
        timeOut: timeOutVal,
        location: locationVal,
        task: taskVal,
        link: linkVal,
        hours: hoursVal,
        notes: notesVal,
        ops: opsVal
    };

    entries.unshift(newEntry);
    localStorage.setItem('timeTracker_entries', JSON.stringify(entries));

    // Automatically record activity log entry
    const logs = JSON.parse(localStorage.getItem('timeTracker_activityLogs')) || [];
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const autoLog = {
        id: 'log-' + Date.now(),
        user: currentUser.name,
        role: currentUser.role,
        action: 'Clock Out',
        timeLogged: timeOutVal || formattedTime,
        timestamp: `${formattedDate} ${timeOutVal || formattedTime}`,
        rawTimestamp: new Date(`${dateVal}T${timeOutVal || '00:00'}`).toISOString()
    };

    logs.unshift(autoLog);
    localStorage.setItem('timeTracker_activityLogs', JSON.stringify(logs));

    document.getElementById('task-entry-form').reset();
    document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];

    showToast('Task added and Activity Log updated automatically!', 'success');
    switchTab('report');
}

function deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this ledger entry?')) return;
    let entries = JSON.parse(localStorage.getItem('timeTracker_entries')) || [];
    entries = entries.filter(e => e.id !== id);
    localStorage.setItem('timeTracker_entries', JSON.stringify(entries));
    renderTable();
    showToast('Entry deleted.', 'info');
}

let editingEntryId = null;
function openEditModal(id) {
    const entries = JSON.parse(localStorage.getItem('timeTracker_entries')) || [];
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    editingEntryId = id;
    document.getElementById('edit-date').value = entry.date;
    document.getElementById('edit-location').value = entry.location;
    document.getElementById('edit-time-in').value = entry.timeIn;
    document.getElementById('edit-time-out').value = entry.timeOut;
    document.getElementById('edit-task').value = entry.task;
    document.getElementById('edit-link').value = entry.link;
    document.getElementById('edit-hours').value = entry.hours;
    document.getElementById('edit-notes').value = entry.notes;
    document.getElementById('edit-ops').value = entry.ops;

    editModalInstance.show();
}

function saveEditedEntry(event) {
    event.preventDefault();
    let entries = JSON.parse(localStorage.getItem('timeTracker_entries')) || [];
    const idx = entries.findIndex(e => e.id === editingEntryId);
    if (idx === -1) return;

    entries[idx] = {
        ...entries[idx],
        date: document.getElementById('edit-date').value,
        location: document.getElementById('edit-location').value,
        timeIn: document.getElementById('edit-time-in').value,
        timeOut: document.getElementById('edit-time-out').value,
        task: document.getElementById('edit-task').value,
        link: document.getElementById('edit-link').value,
        hours: parseFloat(document.getElementById('edit-hours').value) || 0,
        notes: document.getElementById('edit-notes').value,
        ops: document.getElementById('edit-ops').value
    };

    localStorage.setItem('timeTracker_entries', JSON.stringify(entries));
    editModalInstance.hide();
    renderTable();
    showToast('Entry updated successfully!', 'success');
}

// --- REPORTS & TABLES ---
function loadReportView() {
    const entries = JSON.parse(localStorage.getItem('timeTracker_entries')) || [];
    
    const locSet = new Set(entries.map(e => e.location));
    const locSelect = document.getElementById('filter-location');
    if (locSelect) {
        locSelect.innerHTML = '<option value="">All Locations / Sets</option>';
        locSet.forEach(loc => { locSelect.innerHTML += `<option value="${loc}">${loc}</option>`; });
    }

    const userSet = new Set(entries.map(e => e.user));
    const userSelect = document.getElementById('filter-user');
    if (userSelect) {
        userSelect.innerHTML = '<option value="">All Team Members</option>';
        userSet.forEach(u => { userSelect.innerHTML += `<option value="${u}">${u}</option>`; });
    }

    renderTable();
}

function renderTable() {
    const entries = JSON.parse(localStorage.getItem('timeTracker_entries')) || [];
    const searchVal = document.getElementById('filter-search')?.value.toLowerCase() || '';
    const locVal = document.getElementById('filter-location')?.value || '';
    const userVal = document.getElementById('filter-user')?.value || '';

    const filtered = entries.filter(e => {
        const matchesSearch = e.task.toLowerCase().includes(searchVal) || 
                              e.location.toLowerCase().includes(searchVal) || 
                              e.user.toLowerCase().includes(searchVal);
        const matchesLoc = locVal ? e.location === locVal : true;
        const matchesUser = userVal ? e.user === userVal : true;
        return matchesSearch && matchesLoc && matchesUser;
    });

    const totalFilteredHours = filtered.reduce((acc, curr) => acc + (parseFloat(curr.hours) || 0), 0);
    const totalHoursEl = document.getElementById('ledger-total-hours');
    if (totalHoursEl) {
        totalHoursEl.innerText = `${totalFilteredHours.toFixed(1)} hrs`;
    }

    const tbody = document.getElementById('ledger-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-secondary py-4">No task entries found.</td></tr>`;
        return;
    }

    filtered.forEach(e => {
        const isOwner = currentUser && (
            currentUser.email === e.email || 
            currentUser.name === e.user || 
            currentUser.name.includes(e.user) || 
            e.user.includes(currentUser.name)
        );
        const canEdit = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager' || isOwner);

        const linkHtml = e.link && e.link !== '#' ? `<a href="${e.link}" target="_blank" class="text-info text-decoration-none"><i class="fa-solid fa-link"></i> View</a>` : '<span class="text-secondary">-</span>';

        tbody.innerHTML += `
            <tr>
                <td class="fw-semibold">${e.date}</td>
                <td class="font-monospace text-secondary">${e.timeIn}</td>
                <td class="font-monospace text-secondary">${e.timeOut}</td>
                <td><span class="badge bg-secondary bg-opacity-25 border border-secondary text-light">${e.location}</span></td>
                <td>${e.task}<br><small class="text-secondary">By: ${e.user}</small></td>
                <td>${linkHtml}</td>
                <td class="fw-bold text-primary">${e.hours} hrs</td>
                <td class="text-secondary">${e.notes || '-'}</td>
                <td class="text-warning fw-medium">${e.ops || '-'}</td>
                <td class="text-end">
                    ${canEdit ? `
                        <button type="button" onclick="openEditModal('${e.id}')" class="btn btn-sm btn-outline-secondary py-0 px-1 me-1" title="Edit Entry"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" onclick="deleteEntry('${e.id}')" class="btn btn-sm btn-outline-danger py-0 px-1" title="Delete Entry"><i class="fa-solid fa-trash"></i></button>
                    ` : '<small class="text-secondary">Read Only</small>'}
                </td>
            </tr>
        `;
    });
}

// --- ACTIVITY LOG VIEW & CALCULATIONS ---
function loadActivityLogView() {
    const logs = JSON.parse(localStorage.getItem('timeTracker_activityLogs')) || [];
    
    if (currentUser) {
        const initials = currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
        const avatarEl = document.getElementById('log-user-avatar');
        const nameEl = document.getElementById('log-user-name');
        const roleEl = document.getElementById('log-user-role');

        if (avatarEl) avatarEl.innerText = initials;
        if (nameEl) nameEl.innerText = currentUser.name;
        if (roleEl) roleEl.innerText = currentUser.role;
    }

    const userSelect = document.getElementById('activity-filter-user');
    if (userSelect) {
        if (currentUser && currentUser.role === 'Employee') {
            userSelect.innerHTML = `<option value="${currentUser.name}">${currentUser.name}</option>`;
            userSelect.value = currentUser.name;
            userSelect.disabled = true;
        } else {
            userSelect.disabled = false;
            const userSet = new Set(logs.map(l => l.user));
            userSelect.innerHTML = '<option value="">All Team Members</option>';
            userSet.forEach(u => { userSelect.innerHTML += `<option value="${u}">${u}</option>`; });
        }
    }
    
    renderActivityLog();
}

function renderActivityLog() {
    const logs = JSON.parse(localStorage.getItem('timeTracker_activityLogs')) || [];
    const entries = JSON.parse(localStorage.getItem('timeTracker_entries')) || [];
    
    let searchUser = document.getElementById('activity-filter-user')?.value || '';
    if (currentUser && currentUser.role === 'Employee') {
        searchUser = currentUser.name; // Enforce role-based restriction so employees only see their own logs
    }

    const searchAction = document.getElementById('activity-filter-action')?.value || '';
    const searchDate = document.getElementById('activity-filter-date')?.value || '';

    const filtered = logs.filter(l => {
        const matchesUser = searchUser ? l.user === searchUser : true;
        const matchesAction = searchAction ? l.action === searchAction : true;
        let matchesDate = true;
        if (searchDate) {
            const logDateStr = new Date(l.rawTimestamp).toISOString().split('T')[0];
            matchesDate = logDateStr === searchDate;
        }
        return matchesUser && matchesAction && matchesDate;
    });

    let totalTaskHours = 0;
    let totalBreakMs = 0;
    let currentlyClockedInCount = 0;

    const filteredEntries = entries.filter(e => {
        const matchesUser = searchUser ? e.user === searchUser : true;
        let matchesDate = true;
        if (searchDate) {
            matchesDate = e.date === searchDate;
        }
        return matchesUser && matchesDate;
    });

    filteredEntries.forEach(e => {
        totalTaskHours += (parseFloat(e.hours) || 0);
    });

    const userGrouped = {};
    filtered.forEach(l => {
        if (!userGrouped[l.user]) userGrouped[l.user] = [];
        userGrouped[l.user].push(l);
    });

    Object.keys(userGrouped).forEach(username => {
        const userLogs = userGrouped[username].sort((a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp));
        let lastClockIn = null;
        let lastBreakStart = null;

        userLogs.forEach(log => {
            const t = new Date(log.rawTimestamp).getTime();
            if (log.action === 'Clock In') {
                lastClockIn = t;
            } else if (log.action === 'Start Break') {
                lastBreakStart = t;
            } else if (log.action === 'Back Time') {
                if (lastBreakStart) {
                    totalBreakMs += (t - lastBreakStart);
                    lastBreakStart = null;
                }
            } else if (log.action === 'Clock Out') {
                if (lastClockIn) {
                    lastClockIn = null;
                }
            }
        });

        if (lastClockIn && !userLogs.some(l => l.action === 'Clock Out' && new Date(l.rawTimestamp).getTime() > lastClockIn)) {
            currentlyClockedInCount++;
        }
    });

    const totalBreakMins = Math.round(totalBreakMs / (1000 * 60));
    const displayHours = totalTaskHours > 0 ? totalTaskHours.toFixed(2) : '0.00';

    if (document.getElementById('log-total-hours')) {
        document.getElementById('log-total-hours').innerText = `${displayHours} hrs`;
    }
    if (document.getElementById('log-total-breaks')) {
        document.getElementById('log-total-breaks').innerText = `${totalBreakMins} mins`;
    }
    if (document.getElementById('log-active-sessions')) {
        document.getElementById('log-active-sessions').innerText = currentlyClockedInCount;
    }

    const tbody = document.getElementById('activity-log-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">No activity logs found.</td></tr>`;
        return;
    }

    filtered.forEach(log => {
        let badgeClass = 'bg-secondary';
        if (log.action === 'Clock In') badgeClass = 'bg-success';
        if (log.action === 'Start Break') badgeClass = 'bg-warning text-dark';
        if (log.action === 'Back Time') badgeClass = 'bg-info text-dark';
        if (log.action === 'Clock Out') badgeClass = 'bg-danger';

        const canDeleteLog = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager' || currentUser.name === log.user);

        tbody.innerHTML += `
            <tr>
                <td class="font-monospace text-secondary">${log.timestamp}</td>
                <td class="fw-bold text-white">${log.user}</td>
                <td><span class="badge bg-secondary bg-opacity-25 border border-secondary text-light">${log.role}</span></td>
                <td><span class="badge ${badgeClass}">${log.action}</span></td>
                <td class="font-monospace text-info fw-bold">${log.timeLogged}</td>
                <td class="text-end">
                    ${canDeleteLog ? `
                        <button type="button" onclick="deleteSingleActivityLog('${log.id}')" class="btn btn-sm btn-outline-danger py-0 px-1" title="Delete Log"><i class="fa-solid fa-trash"></i></button>
                    ` : '<small class="text-secondary">Read Only</small>'}
                </td>
            </tr>
        `;
    });
}

function deleteSingleActivityLog(id) {
    if (!confirm('Are you sure you want to delete this activity log entry?')) return;
    let logs = JSON.parse(localStorage.getItem('timeTracker_activityLogs')) || [];
    logs = logs.filter(l => l.id !== id);
    localStorage.setItem('timeTracker_activityLogs', JSON.stringify(logs));
    renderActivityLog();
    showToast('Activity log entry deleted.', 'info');
}

function clearActivityLogs() {
    if (!confirm('Are you sure you want to clear all team activity logs?')) return;
    localStorage.removeItem('timeTracker_activityLogs');
    renderActivityLog();
    showToast('Activity logs cleared.', 'info');
}

// --- DASHBOARD CHARTS ---
let hoursChartInstance = null;

function loadDashboard() {
    let entries = JSON.parse(localStorage.getItem('timeTracker_entries')) || [];
    const users = JSON.parse(localStorage.getItem('timeTracker_users')) || [];
    const logs = JSON.parse(localStorage.getItem('timeTracker_activityLogs')) || [];

    // If logged in as an Employee, filter dashboard stats strictly to their own data
    if (currentUser && currentUser.role === 'Employee') {
        entries = entries.filter(e => e.email === currentUser.email || e.user === currentUser.name);
    }

    const totalHours = entries.reduce((acc, curr) => acc + (parseFloat(curr.hours) || 0), 0);
    const totalTasks = entries.length;
    const locations = new Set(entries.map(e => e.location));

    // Calculate Active Team: Count users currently clocked in (has 'Clock In' without a subsequent 'Clock Out')
    const activeUserSet = new Set();
    const sortedLogs = [...logs].sort((a, b) => new Date(a.rawTimestamp) - new Date(b.rawTimestamp));
    
    sortedLogs.forEach(l => {
        if (l.action === 'Clock In') {
            activeUserSet.add(l.user);
        } else if (l.action === 'Clock Out') {
            activeUserSet.delete(l.user);
        }
    });

    document.getElementById('stat-total-hours').innerText = totalHours.toFixed(1) + ' hrs';
    document.getElementById('stat-total-tasks').innerText = totalTasks;
    document.getElementById('stat-total-locations').innerText = locations.size;
    document.getElementById('stat-total-users').innerText = activeUserSet.size;

    document.getElementById('summary-role').innerText = currentUser.role;
    document.getElementById('summary-avg-hours').innerText = totalTasks ? (totalHours / totalTasks).toFixed(1) + ' hrs' : '0 hrs';

    const locCounts = {};
    entries.forEach(e => { locCounts[e.location] = (locCounts[e.location] || 0) + (parseFloat(e.hours) || 0); });
    let topLoc = '-';
    let maxHrs = -1;
    for (const [loc, hrs] of Object.entries(locCounts)) {
        if (hrs > maxHrs) { maxHrs = hrs; topLoc = loc; }
    }
    document.getElementById('summary-top-location').innerText = topLoc;

    renderChart(locCounts);
}

function renderChart(locCounts) {
    const ctx = document.getElementById('hoursChart').getContext('2d');
    if (hoursChartInstance) hoursChartInstance.destroy();

    const labels = Object.keys(locCounts);
    const data = Object.values(locCounts);

    hoursChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [{
                label: 'Hours Completed',
                data: data.length ? data : [0],
                backgroundColor: '#0d6efd',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#adb5bd' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#adb5bd' } }
            }
        }
    });
}

// --- CSV EXPORT ---
function exportCSV() {
    const entries = JSON.parse(localStorage.getItem('timeTracker_entries')) || [];
    if (entries.length === 0) {
        showToast('No entries to export.', 'error');
        return;
    }

    let csv = 'Date,Time In,Time Out,Location/Month/Set,Task,Task Link,Hours Completed,Notes,Ops Note,User\n';
    entries.forEach(e => {
        csv += `"${e.date}","${e.timeIn}","${e.timeOut}","${e.location}","${e.task}","${e.link}",${e.hours},"${e.notes || ''}","${e.ops || ''}","${e.user}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'time_and_task_ledger.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('CSV exported successfully!', 'success');
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');

    toastMsg.innerText = message;
    if (type === 'success') {
        toastIcon.className = 'fa-solid fa-circle-check text-success fs-5';
    } else if (type === 'error') {
        toastIcon.className = 'fa-solid fa-circle-exclamation text-danger fs-5';
    } else {
        toastIcon.className = 'fa-solid fa-circle-info text-info fs-5';
    }

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}