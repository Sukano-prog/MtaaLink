/* ============================================================
   Management System - Elections Page (Complete)
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
