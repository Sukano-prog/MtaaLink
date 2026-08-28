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
}

window.renderElections = renderElections;
