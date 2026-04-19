const API_URL = '/api';

// Toast function
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Check authentication
const token = localStorage.getItem('access_token');
if (!token) {
    console.log('No token found, redirecting to login');
    window.location.href = '/';  // Changed from index.html
}

// Display welcome message
const username = localStorage.getItem('username');
const welcomeMsg = document.getElementById('welcomeMsg');
if (welcomeMsg && username) {
    welcomeMsg.innerHTML = `Welcome, <span class="username-highlight">${username}</span>`;
}
// Load scorecards on page load
document.addEventListener('DOMContentLoaded', () => {
    loadScorecards();
});

// Add scorecard form handler
const addForm = document.getElementById('addScorecardForm');
if (addForm) {
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const scorecard = {
            source: document.getElementById('source').value,
            date: document.getElementById('date').value,
            reasoning: parseFloat(document.getElementById('reasoning').value),
            english: parseFloat(document.getElementById('english').value),
            gs: parseFloat(document.getElementById('gs').value),
            aptitude: parseFloat(document.getElementById('aptitude').value),
            attempt: parseFloat(document.getElementById('attempt').value),
            correct: parseFloat(document.getElementById('correct').value),
            wrong: parseFloat(document.getElementById('wrong').value),
            percentile: parseFloat(document.getElementById('percentile').value)
        };
        
        try {
            const response = await fetch(`${API_URL}/scorecards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(scorecard)
            });
            
            if (response.ok) {
                showToast('Scorecard added successfully!', 'success');
                addForm.reset();
                await loadScorecards(); // Real-time update
            } else {
                const error = await response.json();
                showToast(error.detail || 'Failed to add scorecard', 'error');
            }
        } catch (error) {
            showToast('Connection error', 'error');
        }
    });
}

// Load all scorecards
async function loadScorecards() {
    try {
        const response = await fetch(`${API_URL}/scorecards`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayScorecards(data.scorecards || []);
        } else if (response.status === 401) {
            logout();
        } else {
            showToast('Failed to load scorecards', 'error');
        }
    } catch (error) {
        console.error('Error loading scorecards:', error);
        showToast('Connection error', 'error');
    }
}

// Format number for display
function formatDisplayNumber(value) {
    if (value === null || value === undefined) return '0';
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return value.toString();
        }
        return parseFloat(value).toFixed(2).replace(/\.?0+$/, '');
    }
    return value;
}

// Display scorecards in table
function displayScorecards(scorecards) {
    const tbody = document.getElementById('scorecardBody');
    
    if (!scorecards || scorecards.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14">No scorecards found. Add your first entry!</td></tr>';
        updateStatistics([]); // Update stats with empty array
        return;
    }
    
    // Update statistics BEFORE displaying table
    updateStatistics(scorecards);
    
    tbody.innerHTML = scorecards.map(score => {
        const total = (score.reasoning || 0) + (score.english || 0) + (score.gs || 0) + (score.aptitude || 0);
        const accuracy = score.attempt > 0 ? ((score.correct / score.attempt) * 100) : 0;
        
        return `
            <tr>
                <td>${score.sno || 0}</td>
                <td>${escapeHtml(score.source || '')}</td>
                <td>${score.date || ''}</td>
                <td>${formatDisplayNumber(score.reasoning)}</td>
                <td>${formatDisplayNumber(score.english)}</td>
                <td>${formatDisplayNumber(score.gs)}</td>
                <td>${formatDisplayNumber(score.aptitude)}</td>
                <td>${formatDisplayNumber(total)}</td>
                <td>${formatDisplayNumber(score.attempt)}</td>
                <td>${formatDisplayNumber(score.correct)}</td>
                <td>${formatDisplayNumber(score.wrong)}</td>
                <td>${formatDisplayNumber(accuracy)}%</td>
                <td>${formatDisplayNumber(score.percentile)}</td>
                <td>
                    <button class="edit-btn" onclick="openEditModal('${score.id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteScorecard('${score.id}')">Delete</button>
                </td>
            <tr>
        `;
    }).join('');
}
// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Open edit modal
window.openEditModal = async function(id) {
    try {
        const response = await fetch(`${API_URL}/scorecards`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        const scorecard = data.scorecards.find(s => s.id === id);
        
        if (scorecard) {
            document.getElementById('editId').value = scorecard.id;
            document.getElementById('editSource').value = scorecard.source;
            document.getElementById('editDate').value = scorecard.date;
            document.getElementById('editReasoning').value = scorecard.reasoning;
            document.getElementById('editEnglish').value = scorecard.english;
            document.getElementById('editGs').value = scorecard.gs;
            document.getElementById('editAptitude').value = scorecard.aptitude;
            document.getElementById('editAttempt').value = scorecard.attempt;
            document.getElementById('editCorrect').value = scorecard.correct;
            document.getElementById('editWrong').value = scorecard.wrong;
            document.getElementById('editPercentile').value = scorecard.percentile;
            
            document.getElementById('editModal').style.display = 'block';
        }
    } catch (error) {
        showToast('Error loading scorecard data', 'error');
    }
};

// Edit form handler
const editForm = document.getElementById('editForm');
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editId').value;
        const updates = {
            source: document.getElementById('editSource').value,
            date: document.getElementById('editDate').value,
            reasoning: parseFloat(document.getElementById('editReasoning').value),
            english: parseFloat(document.getElementById('editEnglish').value),
            gs: parseFloat(document.getElementById('editGs').value),
            aptitude: parseFloat(document.getElementById('editAptitude').value),
            attempt: parseFloat(document.getElementById('editAttempt').value),
            correct: parseFloat(document.getElementById('editCorrect').value),
            wrong: parseFloat(document.getElementById('editWrong').value),
            percentile: parseFloat(document.getElementById('editPercentile').value)
        };
        
        try {
            const response = await fetch(`${API_URL}/scorecards/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            
            if (response.ok) {
                showToast('Scorecard updated successfully!', 'success');
                closeModal();
                await loadScorecards(); // Real-time update
            } else {
                showToast('Failed to update scorecard', 'error');
            }
        } catch (error) {
            showToast('Connection error', 'error');
        }
    });
}

// Delete scorecard
window.deleteScorecard = async function(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        try {
            const response = await fetch(`${API_URL}/scorecards/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showToast('Scorecard deleted successfully!', 'success');
                await loadScorecards(); // Real-time update
            } else {
                showToast('Failed to delete scorecard', 'error');
            }
        } catch (error) {
            showToast('Connection error', 'error');
        }
    }
};

// Close modal
window.closeModal = function() {
    document.getElementById('editModal').style.display = 'none';
};

// Logout function
window.logout = function() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    showToast('Logged out successfully', 'info');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
};

// Event listeners
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

const closeModalBtn = document.getElementById('closeModalBtn');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeModal();
    }
}


// Calculate and update statistics based on Total scores only
function updateStatistics(scorecards) {
    console.log('Updating statistics with:', scorecards); // Debug log
    
    if (!scorecards || scorecards.length === 0) {
        console.log('No scorecards found, resetting stats to 0');
        document.getElementById('avgTotal').textContent = '0';
        document.getElementById('totalEntries').textContent = '0';
        document.getElementById('highestScore').textContent = '0';
        document.getElementById('lowestScore').textContent = '0';
        return;
    }
    
    // Calculate TOTAL for each scorecard (Reasoning + English + GS + Aptitude)
    const totals = scorecards.map(score => {
        const total = (score.reasoning || 0) + (score.english || 0) + (score.gs || 0) + (score.aptitude || 0);
        console.log(`Scorecard ${score.sno} - Total: ${total}`); // Debug log
        return total;
    });
    
    // Calculate AVERAGE of all totals
    const sum = totals.reduce((acc, val) => acc + val, 0);
    const average = sum / totals.length;
    
    // Find HIGHEST and LOWEST from totals only
    const highest = Math.max(...totals);
    const lowest = Math.min(...totals);
    
    console.log(`Stats - Average: ${average}, Highest: ${highest}, Lowest: ${lowest}, Total Entries: ${scorecards.length}`);
    
    // Update DOM elements
    const avgElement = document.getElementById('avgTotal');
    const entriesElement = document.getElementById('totalEntries');
    const highestElement = document.getElementById('highestScore');
    const lowestElement = document.getElementById('lowestScore');
    
    if (avgElement) avgElement.textContent = formatDisplayNumber(average);
    if (entriesElement) entriesElement.textContent = scorecards.length;
    if (highestElement) highestElement.textContent = formatDisplayNumber(highest);
    if (lowestElement) lowestElement.textContent = formatDisplayNumber(lowest);
}