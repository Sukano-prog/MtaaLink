/* ============================================================
   MtaaLink - Elections Page (Complete)
   ============================================================ */

import { 
    getElections, getElection, createElection, updateElection, 
    startElection, closeElection, getElectionResults, castVote,
    getMembers, getVoterCodes, generateVoterCodes, verifyVoterCode,
    getCurrentUser
} from '../core/api.js';
import { showToast, showError, showSuccess } from '../components/toast.js';
import { showFormModal, showConfirm, showModal, closeModal } from '../components/modal.js';

let electionsData = [];
let membersData = [];
let currentElectionId = null;
let selectedElection = null;
let resultsInterval = null;

const ELECTION_TYPES = [
    { value: 'org_elders', label: 'Organization Elders' },
    { value: 'chairperson', label: 'Chairperson' },
    { value: 'secretary', label: 'Secretary' },
    { value: 'treasurer', label: 'Treasurer' },
    { value: 'committee', label: 'Committee' },
    { value: 'general', label: 'General Election' },
    { value: 'custom', label: 'Custom Election' }
];

const STATUS_COLORS = {
    draft: 'badge-gray',
    active: 'badge-success',
    closed: 'badge-warning',
    finalized: 'badge-info'
};

export async function renderElections() {
    const content = document.getElementById('pageContent');
    
    try {
        membersData = await getMembers().catch(() => []);
        
        content.innerHTML = `
            <div class="page-header">
                <h2>Elections</h2>
                <button class="btn btn-primary" id="addElectionBtn">Create Election</button>
            </div>
            
            <div class="filter-bar">
                <div class="filter-box">
                    <select id="statusFilter" class="form-control form-select">
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                        <option value="finalized">Finalized</option>
                    </select>
                </div>
                <span class="election-count" id="electionCount">0 elections</span>
            </div>
            
            <div id="electionsContainer">
                ${Skeletons.elections()}
            </div>
        `;
        
        document.getElementById('addElectionBtn').addEventListener('click', function() {
            openElectionModal();
        });
        
        document.getElementById('statusFilter').addEventListener('change', function() {
            filterElections();
        });
        
        await loadElections();
        startAutoRefresh();
        
    } catch (error) {
        content.innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load elections: ${error.message}</p>
                <button class="btn btn-primary" onclick="renderElections()">Retry</button>
            </div></div>
        `;
    }
}

function startAutoRefresh() {
    if (resultsInterval) {
        clearInterval(resultsInterval);
        resultsInterval = null;
    }
    // Only refresh if we're on the elections page
    resultsInterval = setInterval(function() {
        const container = document.getElementById('electionsContainer');
        if (!container) {
            clearInterval(resultsInterval);
            resultsInterval = null;
            return;
        }
        const hasActive = electionsData.some(function(e) { return e.status === 'active'; });
        if (hasActive) {
            loadElections();
        }
    }, 3000);
}

async function loadElections() {
    try {
        electionsData = await getElections();
        renderElectionsList();
        document.getElementById('electionCount').textContent = electionsData.length + ' elections';
    } catch (error) {
        document.getElementById('electionsContainer').innerHTML = `
            <div class="card"><div class="card-body">
                <p style="color:var(--danger);">Failed to load elections: ${error.message}</p>
                <button class="btn btn-primary" onclick="loadElections()">Retry</button>
            </div></div>
        `;
    }
}

function filterElections() {
    const status = document.getElementById('statusFilter').value;
    let filtered = electionsData;
    
    if (status) {
        filtered = filtered.filter(function(e) {
            return e.status === status;
        });
    }
    
    renderElectionsList(filtered);
    document.getElementById('electionCount').textContent = filtered.length + ' elections';
}

function renderElectionsList(filtered = null) {
    const container = document.getElementById('electionsContainer');
    const elections = filtered !== null ? filtered : electionsData;
    
    if (elections.length === 0) {
        container.innerHTML = `
            <div class="card"><div class="card-body">
                <div class="empty-state">
                    <p class="text-muted">No elections found</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addElectionBtn').click()">
                        Create your first election
                    </button>
                </div>
            </div></div>
        `;
        return;
    }
    
    let html = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;">`;
    
    elections.forEach(function(e) {
        const statusBadge = STATUS_COLORS[e.status] || 'badge-gray';
        const isActive = e.status === 'active';
        const isDraft = e.status === 'draft';
        const isClosed = e.status === 'closed';
        const isFinalized = e.status === 'finalized';
        
        html += `
            <div class="card" style="border-left:4px solid ${isActive ? 'var(--success)' : isDraft ? 'var(--gray)' : 'var(--warning)'};">
                <div class="card-body">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div>
                            <h4 style="margin:0;">${e.title}</h4>
                            <span style="font-size:var(--font-size-xs);color:var(--gray-400);">${e.election_type}</span>
                        </div>
                        <span class="badge ${statusBadge}">${e.status}</span>
                    </div>
                    <div style="font-size:var(--font-size-sm);color:var(--gray-500);margin-top:6px;">
                        ${e.description || 'No description'}
                    </div>
                    <div style="margin-top:8px;font-size:var(--font-size-sm);color:var(--gray-500);">
                        <div>Start: ${new Date(e.start_date).toLocaleString()}</div>
                        <div>End: ${new Date(e.end_date).toLocaleString()}</div>
                        <div>Candidates: ${e.candidate_count || 0}</div>
                        <div>Votes: ${e.vote_count || 0} / ${e.voter_count || 0} (${e.voter_count ? Math.round((e.vote_count / e.voter_count) * 100) : 0}%)</div>
                    </div>
                    ${isActive ? `
                        <div style="margin-top:8px;padding:8px;background:var(--success-light);border-radius:var(--radius-md);border-left:3px solid var(--success);">
                            <span style="font-size:var(--font-size-xs);font-weight:600;color:var(--success);">LIVE - Voting in progress</span>
                        </div>
                    ` : ''}
                    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-primary view-election" data-id="${e.id}">View</button>
                        ${isDraft ? `
                            <button class="btn btn-sm btn-outline edit-election" data-id="${e.id}">Edit</button>
                            <button class="btn btn-sm btn-success start-election" data-id="${e.id}">Start</button>
                            <button class="btn btn-sm btn-info manage-codes" data-id="${e.id}">Voter Codes</button>
                        ` : ''}
                        ${isActive ? `
                            <button class="btn btn-sm btn-warning close-election" data-id="${e.id}">Close</button>
                            <button class="btn btn-sm btn-info manage-codes" data-id="${e.id}">Voter Codes</button>
                            ${localStorage.getItem('voted_' + e.id) === 'true' ? 
                                `<button class="btn btn-sm btn-secondary" disabled style="opacity:0.6;cursor:not-allowed;">Voted</button>` :
                                `<button class="btn btn-sm btn-primary voter-portal" data-id="${e.id}">Vote</button>`
                            }
                            <button class="btn btn-sm btn-success results-election" data-id="${e.id}">Live Results</button>
                        ` : ''}
                        ${(isClosed || isFinalized) ? `
                            <button class="btn btn-sm btn-success results-election" data-id="${e.id}">View Results</button>
                        ` : ''}
                        ${isClosed ? `
                            <button class="btn btn-sm btn-success finalize-election" data-id="${e.id}">Finalize</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    container.querySelectorAll('.view-election').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const election = electionsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (election) viewElectionDetail(election);
        });
    });
    
    container.querySelectorAll('.edit-election').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const election = electionsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (election) openElectionModal(election);
        });
    });
    
    container.querySelectorAll('.start-election').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const election = electionsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (election) startElectionHandler(election);
        });
    });
    
    container.querySelectorAll('.close-election').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const election = electionsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (election) closeElectionHandler(election);
        });
    });
    
    container.querySelectorAll('.results-election').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const election = electionsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (election) {
                console.log('Showing results for:', election.title);
                viewElectionResults(election);
            }
        });
    });
    
    container.querySelectorAll('.finalize-election').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const election = electionsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (election) finalizeElectionHandler(election);
        });
    });
    
    container.querySelectorAll('.manage-codes').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const election = electionsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (election) manageVoterCodes(election);
        });
    });
    
    container.querySelectorAll('.voter-portal').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const election = electionsData.find(function(e) { return e.id === this.dataset.id; }.bind(this));
            if (election) openVoterPortal(election);
        });
    });
}

function viewElectionDetail(election) {
    getElection(election.id)
        .then(function(detail) {
            const candidates = detail.candidates || [];
            const candidatesHtml = candidates.map(function(c, i) {
                return `<div style="padding:4px 0;border-bottom:1px dotted var(--gray-100);font-size:var(--font-size-sm);">
                    ${i + 1}. ${c.name} ${c.description ? '- ' + c.description : ''}
                </div>`;
            }).join('');
            
            showModal({
                title: election.title,
                content: `
                    <div style="margin-bottom:12px;">
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                            <span class="badge badge-${election.status}">${election.status}</span>
                            <span class="badge badge-gray">${election.election_type}</span>
                        </div>
                        <p>${election.description || 'No description'}</p>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:var(--font-size-sm);">
                            <div><strong>Start:</strong> ${new Date(election.start_date).toLocaleString()}</div>
                            <div><strong>End:</strong> ${new Date(election.end_date).toLocaleString()}</div>
                            <div><strong>Status:</strong> ${election.status}</div>
                            <div><strong>Type:</strong> ${election.election_type}</div>
                        </div>
                        ${candidates.length > 0 ? `
                            <div style="margin-top:12px;border-top:1px solid var(--gray-200);padding-top:12px;">
                                <strong>Candidates (${candidates.length})</strong>
                                ${candidatesHtml}
                            </div>
                        ` : ''}
                    </div>
                `,
                size: 'md',
                buttons: [
                    {
                        label: 'Close',
                        action: 'close',
                        class: 'btn-outline',
                        onClick: function(done) { done(); }
                    }
                ]
            });
        })
        .catch(function() {
            showError('Failed to load election details');
        });
}

function manageVoterCodes(election) {
    getVoterCodes(election.id)
        .then(function(voters) {
            const voterListHtml = voters.map(function(v) {
                const status = v.has_voted ? '[Voted]' : '[Not Voted]';
                return `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--gray-100);font-size:var(--font-size-sm);">
                        <div>
                            <strong>${v.member_name || 'Unknown'}</strong>
                            <div style="font-size:var(--font-size-xs);color:var(--gray-400);font-family:monospace;">${v.voter_code}</div>
                        </div>
                        <div>
                            <span class="badge badge-${v.has_voted ? 'success' : 'gray'}">${status}</span>
                            ${!v.has_voted ? `
                                <button class="btn btn-sm btn-outline resend-code" data-code="${v.voter_code}">Resend</button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
            showModal({
                title: 'Voter Codes: ' + election.title,
                content: `
                    <div style="margin-bottom:12px;">
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                            <button class="btn btn-sm btn-success" id="generateCodesBtn">Generate New Codes</button>
                            <span style="font-size:var(--font-size-xs);color:var(--gray-500);align-self:center;">
                                ${voters.length} voters registered
                            </span>
                        </div>
                        <div style="max-height:400px;overflow-y:auto;">
                            ${voterListHtml || '<p class="text-muted">No voter codes generated yet. Click "Generate New Codes" to create them.</p>'}
                        </div>
                    </div>
                `,
                size: 'lg',
                buttons: [
                    {
                        label: 'Close',
                        action: 'close',
                        class: 'btn-outline',
                        onClick: function(done) { done(); }
                    }
                ],
                onShow: function() {
                    document.getElementById('generateCodesBtn').addEventListener('click', function() {
                        generateVoterCodes(election.id)
                            .then(function(response) {
                                showSuccess(response.message || 'Codes generated!');
                                closeModal();
                                manageVoterCodes(election);
                            })
                            .catch(function(error) {
                                showError(error.message || 'Failed to generate codes');
                            });
                    });
                    
                    document.querySelectorAll('.resend-code').forEach(function(btn) {
                        btn.addEventListener('click', function() {
                            const code = this.dataset.code;
                            fetch('/api/v1/elections/resend-code/', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                                },
                                body: JSON.stringify({ voter_code: code })
                            })
                            .then(function(r) { return r.json(); })
                            .then(function() {
                                showSuccess('Code resent!');
                            })
                            .catch(function() {
                                showError('Failed to resend code');
                            });
                        });
                    });
                }
            });
        })
        .catch(function(error) {
            showError('Failed to load voter codes: ' + error.message);
        });
}

function viewElectionResults(election) {
    getElectionResults(election.id)
        .then(function(results) {
            // Sort results by votes descending
            const sortedResults = results.results.sort(function(a, b) {
                return b.votes - a.votes;
            });
            
            // Build results HTML
            let resultsHtml = '<div style="padding:10px 0;">';
            
            if (sortedResults.length > 0) {
                sortedResults.forEach(function(r, i) {
                    const isWinner = i === 0 && results.total_votes > 0;
                    const barWidth = results.total_votes > 0 ? (r.votes / results.total_votes * 100) : 0;
                    
                    resultsHtml += `
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e5e7eb;">
                            <div>
                                ${isWinner ? '<span style="color:#22c55e;font-weight:bold;">WINNER - </span>' : ''}
                                <strong>${r.candidate_name}</strong>
                                <span style="color:#3b82f6;font-weight:bold;margin-left:8px;">${r.votes} votes</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;width:200px;">
                                <div style="background:#e5e7eb;border-radius:4px;height:8px;flex:1;">
                                    <div style="background:${isWinner ? '#22c55e' : '#3b82f6'};height:100%;width:${barWidth}%;border-radius:4px;"></div>
                                </div>
                                <span style="font-weight:600;min-width:40px;">${r.percentage || 0}%</span>
                            </div>
                        </div>
                    `;
                });
            } else {
                resultsHtml += '<p style="color:#6b7280;">No votes cast yet</p>';
            }
            
            resultsHtml += '</div>';
            
            // Build modal content
            const modalContent = `
                <div style="margin-bottom:16px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
                        <div style="padding:12px;background:#f9fafb;border-radius:6px;text-align:center;">
                            <div style="font-size:12px;color:#6b7280;">Total Votes</div>
                            <div style="font-size:24px;font-weight:700;color:#3b82f6;">${results.total_votes}</div>
                        </div>
                        <div style="padding:12px;background:#f9fafb;border-radius:6px;text-align:center;">
                            <div style="font-size:12px;color:#6b7280;">Voter Turnout</div>
                            <div style="font-size:24px;font-weight:700;color:#22c55e;">${results.turnout}%</div>
                        </div>
                        <div style="padding:12px;background:#f9fafb;border-radius:6px;text-align:center;">
                            <div style="font-size:12px;color:#6b7280;">Status</div>
                            <div style="font-size:18px;font-weight:600;">${results.status}</div>
                        </div>
                    </div>
                    <div style="border-top:1px solid #e5e7eb;padding-top:12px;">
                        <strong>Candidate Results</strong>
                        ${resultsHtml}
                    </div>
                </div>
            `;
            
            // Show the modal
            showModal({
                title: 'Results: ' + election.title,
                content: modalContent,
                size: 'lg',
                buttons: [
                    {
                        label: 'Refresh',
                        action: 'refresh',
                        class: 'btn-primary',
                        onClick: function(done) {
                            viewElectionResults(election);
                            done();
                        }
                    },
                    {
                        label: 'Close',
                        action: 'close',
                        class: 'btn-outline',
                        onClick: function(done) { done(); }
                    }
                ]
            });
        })
        .catch(function(error) {
            showError('Failed to load results: ' + error.message);
        });
}

function openElectionModal(election = null) {
    const isEdit = !!election;
    currentElectionId = election?.id || null;
    
    const fields = [
        {
            id: 'title',
            label: 'Election Title',
            type: 'text',
            value: election?.title || '',
            required: true,
            placeholder: 'e.g., Organization Elders Election 2026'
        },
        {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            value: election?.description || '',
            required: false,
            rows: 3,
            placeholder: 'Describe the election...'
        },
        {
            id: 'election_type',
            label: 'Election Type',
            type: 'select',
            value: election?.election_type || 'general',
            required: true,
            options: ELECTION_TYPES
        },
        {
            id: 'start_date',
            label: 'Start Date & Time',
            type: 'datetime-local',
            value: election?.start_date ? new Date(election.start_date).toISOString().slice(0, 16) : '',
            required: true
        },
        {
            id: 'end_date',
            label: 'End Date & Time',
            type: 'datetime-local',
            value: election?.end_date ? new Date(election.end_date).toISOString().slice(0, 16) : '',
            required: true
        },
        {
            id: 'candidates',
            label: 'Candidates (one per line: name, description optional)',
            type: 'textarea',
            value: election?.candidates ? election.candidates.map(function(c) {
                return c.name + (c.description ? ' | ' + c.description : '');
            }).join('\n') : '',
            required: false,
            rows: 4,
            placeholder: 'John Doe\nJane Smith | Current Elder\nBob Brown'
        }
    ];
    
    showFormModal({
        title: isEdit ? 'Edit Election' : 'Create Election',
        fields: fields,
        size: 'md',
        submitLabel: isEdit ? 'Update' : 'Create',
        onSubmit: function(data, done) {
            const candidates = data.candidates ? data.candidates.split('\n')
                .filter(function(line) { return line.trim(); })
                .map(function(line) {
                    const parts = line.split('|').map(function(s) { return s.trim(); });
                    return {
                        id: 'cand_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                        name: parts[0],
                        description: parts[1] || null
                    };
                }) : [];
            
            const formattedData = {
                title: data.title,
                description: data.description || null,
                election_type: data.election_type,
                start_date: data.start_date,
                end_date: data.end_date,
                candidates: candidates,
                status: data.status || election?.status || 'draft'
            };
            
            // Pass the election ID directly from the outer scope
            const electionId = currentElectionId;
            console.log('Saving election - isEdit:', isEdit, 'id:', electionId);
            if (isEdit && electionId) {
                updateElection(electionId, formattedData)
                    .then(function() {
                        showSuccess('Election updated successfully');
                        done();
                        // Force refresh the list
                        loadElections();
                    })
                    .catch(function(error) {
                        showError(error.message || 'Failed to update election');
                    });
            } else {
                createElection(formattedData)
                    .then(function() {
                        showSuccess('Election created successfully');
                        done();
                        loadElections();
                    })
                    .catch(function(error) {
                        showError(error.message || 'Failed to create election');
                    });
            }
        }
    });
}

async function saveElection(data, isEdit, done) {
    try {
        if (isEdit && currentElectionId) {
            await updateElection(currentElectionId, data);
            showSuccess('Election updated successfully');
        } else {
            await createElection(data);
            showSuccess('Election created successfully');
        }
        currentElectionId = null;
        done();
        await loadElections();
    } catch (error) {
        showError(error.message || 'Failed to save election');
    }
}

function startElectionHandler(election) {
    showConfirm({
        title: 'Start Election',
        message: 'Start "' + election.title + '"? This will activate voting. Members can now cast votes.',
        confirmLabel: 'Start',
        confirmClass: 'btn-success',
        onConfirm: function(done) {
            startElection(election.id)
                .then(function() {
                    showSuccess('Election started successfully!');
                    done();
                    loadElections();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to start election');
                });
        }
    });
}

function closeElectionHandler(election) {
    showConfirm({
        title: 'Close Election',
        message: 'Close "' + election.title + '"? Voting will be disabled. Results will be final.',
        confirmLabel: 'Close',
        confirmClass: 'btn-warning',
        onConfirm: function(done) {
            closeElection(election.id)
                .then(function() {
                    showSuccess('Election closed successfully');
                    done();
                    loadElections();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to close election');
                });
        }
    });
}

function finalizeElectionHandler(election) {
    showConfirm({
        title: 'Finalize Election',
        message: 'Finalize "' + election.title + '"? Results will be locked and published.',
        confirmLabel: 'Finalize',
        confirmClass: 'btn-success',
        onConfirm: function(done) {
            updateElection(election.id, { status: 'finalized' })
                .then(function() {
                    showSuccess('Election finalized successfully!');
                    done();
                    loadElections();
                })
                .catch(function(error) {
                    showError(error.message || 'Failed to finalize election');
                });
        }
    });
}

// ===== VOTER PORTAL =====

function openVoterPortal(election) {
    showModal({
        title: 'Voter Portal: ' + election.title,
        content: `
            <div style="margin-bottom:12px;">
                <div style="background:var(--gray-50);padding:12px;border-radius:var(--radius-md);margin-bottom:12px;">
                    <p style="margin:0;font-size:var(--font-size-sm);color:var(--gray-600);">
                        Enter your voter code to cast your vote. 
                        Your voter code was provided to you by the org administrator.
                    </p>
                </div>
                <div class="form-group">
                    <label for="voterCodeInput">Voter Code</label>
                    <input type="text" id="voterCodeInput" class="form-control" placeholder="Enter your voter code (e.g., ELEC-XXXXXX-XXXXXX)" style="font-family:monospace;font-size:var(--font-size-md);">
                    <button class="btn btn-primary btn-block" id="verifyCodeBtn" style="margin-top:8px;">Verify Code</button>
                    <div class="form-helper">Your voter code is unique and confidential. Do not share it with anyone.</div>
                </div>
                <div id="voterCandidatesContainer" style="margin-top:12px;display:none;">
                    <div style="border-top:1px solid var(--gray-200);padding-top:12px;">
                        <strong>Select Your Candidate</strong>
                        <div id="candidateOptions" style="margin-top:8px;"></div>
                        <button class="btn btn-success btn-block" id="castVoteBtn" style="margin-top:12px;display:none;">Cast Your Vote</button>
                    </div>
                </div>
                <div id="voterStatus" style="margin-top:12px;"></div>
            </div>
        `,
        size: 'md',
        buttons: [
            {
                label: 'Close',
                action: 'close',
                class: 'btn-outline',
                onClick: function(done) { done(); }
            }
        ],
        onShow: function() {
            const voterCodeInput = document.getElementById('voterCodeInput');
            const verifyBtn = document.getElementById('verifyCodeBtn');
            const candidatesContainer = document.getElementById('voterCandidatesContainer');
            const candidateOptions = document.getElementById('candidateOptions');
            const castVoteBtn = document.getElementById('castVoteBtn');
            const voterStatus = document.getElementById('voterStatus');
            let selectedCandidate = null;
            let verifiedCode = '';
            
            verifyBtn.addEventListener('click', function() {
                const code = voterCodeInput.value.trim();
                if (!code) {
                    showStatus('Please enter your voter code', 'warning');
                    return;
                }
                
                verifyVoterCode(election.id, code)
                    .then(function(result) {
                        if (result.valid) {
                            verifiedCode = code;
                            showStatus('Valid voter code! Select your candidate below.', 'success');
                            loadCandidates(code);
                        } else {
                            // Check if the code was already used
                            if (result.message && result.message.includes('already been used')) {
                                showStatus('This voter code has already been used. You cannot vote again.', 'error');
                                // Permanently disable the voting UI
                                voterCodeInput.disabled = true;
                                verifyBtn.disabled = true;
                                castVoteBtn.style.display = 'none';
                                candidatesContainer.style.display = 'none';
                            } else {
                                showStatus(result.message || 'Invalid voter code', 'error');
                            }
                        }
                    })
                    .catch(function() {
                        showStatus('Error verifying voter code', 'error');
                    });
            });
            
            function loadCandidates(code) {
                getElection(election.id)
                    .then(function(detail) {
                        const candidates = detail.candidates || [];
                        
                        if (candidates.length === 0) {
                            showStatus('No candidates available for this election', 'warning');
                            return;
                        }
                        
                        candidatesContainer.style.display = 'block';
                        castVoteBtn.style.display = 'block';
                        
                        candidateOptions.innerHTML = candidates.map(function(c) {
                            return `
                                <div class="candidate-option" style="display:flex;align-items:center;gap:12px;padding:8px 12px;border:2px solid var(--gray-200);border-radius:var(--radius-md);margin-bottom:8px;cursor:pointer;transition:all 0.2s;">
                                    <input type="radio" name="candidate" value="${c.id}" id="cand_${c.id}" style="width:18px;height:18px;">
                                    <label for="cand_${c.id}" style="margin:0;cursor:pointer;flex:1;">
                                        <strong>${c.name}</strong>
                                        ${c.description ? `<div style="font-size:var(--font-size-xs);color:var(--gray-500);">${c.description}</div>` : ''}
                                    </label>
                                </div>
                            `;
                        }).join('');
                        
                        candidateOptions.querySelectorAll('.candidate-option').forEach(function(card) {
                            card.addEventListener('click', function() {
                                const radio = this.querySelector('input[type="radio"]');
                                radio.checked = true;
                                selectedCandidate = radio.value;
                                document.querySelectorAll('.candidate-option').forEach(function(el) {
                                    el.style.borderColor = 'var(--gray-200)';
                                    el.style.background = '';
                                });
                                this.style.borderColor = 'var(--primary)';
                                this.style.background = 'var(--primary-light)';
                            });
                        });
                        
                        castVoteBtn.addEventListener('click', function() {
                            if (!selectedCandidate) {
                                showStatus('Please select a candidate', 'warning');
                                return;
                            }
                            
                            const voteData = {
                                voter_code: verifiedCode,
                                candidate_id: selectedCandidate
                            };
                            
                            castVote(voteData)
                                .then(function(response) {
                                    showStatus('Your vote has been recorded successfully!', 'success');
                                    castVoteBtn.style.display = 'none';
                                    candidateOptions.innerHTML = '<p class="text-muted">You have successfully voted.</p>';
                                    voterCodeInput.disabled = true;
                                    verifyBtn.disabled = true;
                                    // Refresh results after voting
                                    // Store that this user voted in this election
                                    localStorage.setItem('voted_' + election.id, 'true');
                                    setTimeout(function() {
                                        closeModal();
                                        loadElections();
                                    }, 1500);
                                })
                                .catch(function(error) {
                                    showStatus(error.message || 'Failed to cast vote', 'error');
                                });
                        });
                    })
                    .catch(function() {
                        showStatus('Error loading candidates', 'error');
                    });
            }
            
            function showStatus(message, type) {
                const colors = {
                    success: 'var(--success)',
                    error: 'var(--danger)',
                    warning: 'var(--warning)',
                    info: 'var(--primary)'
                };
                voterStatus.innerHTML = `
                    <div style="padding:12px;background:${colors[type] || 'var(--gray-50)'}20;border-left:4px solid ${colors[type] || 'var(--gray)'};border-radius:var(--radius-md);">
                        <span style="color:${colors[type] || 'var(--gray)'};">${message}</span>
                    </div>
                `;
            }
        }
    });
}

window.renderElections = renderElections;
