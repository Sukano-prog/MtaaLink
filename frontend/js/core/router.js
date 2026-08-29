/* ============================================================
   MtaaLink - Router
   ============================================================ */

import { renderDashboard } from '../pages/dashboard.js';
import { renderMembers } from '../pages/members.js';
import { renderMeetings } from '../pages/meetings.js';
import { renderContributions } from '../pages/contributions.js';
import { renderContributionTypes } from '../pages/contribution_types.js';
import { renderGroups } from '../pages/groups.js';
import { renderAnnouncements } from '../pages/announcements.js';
import { renderSettings } from '../pages/settings.js';
import { renderReports } from '../pages/reports.js';
import { renderProjects } from '../pages/projects.js';
import { renderEvents } from '../pages/events.js';
import { renderExpenses } from '../pages/expenses.js';
import { renderElections } from '../pages/elections.js';

// SINGLE pageMap declaration
const pageMap = {
    'dashboard': renderDashboard,
    'members': renderMembers,
    'meetings': renderMeetings,
    'groups': renderGroups,
    'contributions': renderContributions,
    'contribution_types': renderContributionTypes,
    'announcements': renderAnnouncements,
    'settings': renderSettings,
    'reports': renderReports,
    'projects': renderProjects,
    'events': renderEvents,
    'expenses': renderExpenses,
    'elections': renderElections
};

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
}

let currentPage = 'dashboard';

function saveCurrentPage(page) {
    currentPage = page;
    localStorage.setItem('current_page', page);
}

function getSavedPage() {
    return localStorage.getItem('current_page') || 'dashboard';
}

export async function navigateTo(page) {
    closeSidebar();
    saveCurrentPage(page);
    
    document.querySelectorAll('.nav-link').forEach(function(link) {
        link.classList.toggle('active', link.dataset.page === page);
    });
    
    const titles = {
        dashboard: 'Dashboard',
        members: 'Members',
        meetings: 'Meetings',
        groups: 'Groups',
        contributions: 'Contributions',
        contribution_types: 'Contribution Types',
        announcements: 'Announcements',
        settings: 'Settings',
        reports: 'Reports',
        projects: 'Projects',
        events: 'Events',
        expenses: 'Expenses',
        elections: 'Elections'
    };
    
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[page] || page;
    
    const content = document.getElementById('pageContent');
    if (content) {
        // Skeleton will be shown by the page render function
    }
    
    const pageFn = pageMap[page];
    if (pageFn) {
        try {
            await pageFn();
        } catch (error) {
            if (content) {
                content.innerHTML = `
                    <div class="card"><div class="card-body">
                        <p style="color:var(--danger);">Error: ${error.message}</p>
                        <button class="btn btn-primary" onclick="navigateTo('${page}')">Retry</button>
                    </div></div>
                `;
            }
        }
    } else {
        if (content) {
            content.innerHTML = `
                <div class="card"><div class="card-body">
                    <h3>${titles[page] || page}</h3>
                    <p class="text-muted">Page coming soon...</p>
                </div></div>
            `;
        }
    }
}

export function restorePage() {
    const savedPage = getSavedPage();
    if (pageMap[savedPage]) {
        navigateTo(savedPage);
    } else {
        navigateTo('dashboard');
    }
}

document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !menuToggle?.contains(e.target)) {
            closeSidebar();
        }
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeSidebar();
});

window.addEventListener('resize', function() {
    if (window.innerWidth > 768) closeSidebar();
});

window.navigateTo = navigateTo;
window.closeSidebar = closeSidebar;
window.restorePage = restorePage;
