/* ============================================================
   Skeleton Screens - Improved Placeholder UI
   ============================================================ */

export const Skeletons = {
    
    // Dashboard stats skeleton
    stats: function() {
        return `
            <div class="skeleton-stats">
                ${Array(6).fill(0).map(() => `
                    <div class="skeleton-stat">
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-50"></div>
                        <div class="skeleton-line skeleton-line-lg skeleton-line-w-75" style="margin-top:6px;"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-33" style="margin-top:4px;"></div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Members list skeleton (table view)
    members: function(count = 8) {
        return `
            <div class="skeleton-table">
                <div class="skeleton-table-header">
                    <div class="skeleton-line skeleton-line-w-25"></div>
                    <div class="skeleton-line skeleton-line-w-25"></div>
                    <div class="skeleton-line skeleton-line-w-25"></div>
                    <div class="skeleton-line skeleton-line-w-25"></div>
                </div>
                ${Array(count).fill(0).map(() => `
                    <div class="skeleton-table-row">
                        <div class="skeleton-line skeleton-line-w-25"></div>
                        <div class="skeleton-line skeleton-line-w-25"></div>
                        <div class="skeleton-line skeleton-line-w-25"></div>
                        <div class="skeleton-line skeleton-line-w-25"></div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Members grid skeleton
    membersGrid: function(count = 8) {
        return `
            <div class="skeleton-members-grid">
                ${Array(count).fill(0).map(() => `
                    <div class="skeleton-member-card">
                        <div class="skeleton-circle skeleton-circle-lg"></div>
                        <div class="skeleton-line skeleton-line-w-75" style="margin:8px auto 4px auto;"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-50" style="margin:0 auto;"></div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Elections list skeleton
    elections: function(count = 4) {
        return `
            <div class="skeleton-elections">
                ${Array(count).fill(0).map(() => `
                    <div class="skeleton-election-card">
                        <div class="skeleton-line skeleton-line-lg skeleton-line-w-75"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-25" style="margin-top:4px;"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-50" style="margin-top:8px;"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-30" style="margin-top:4px;"></div>
                        <div style="display:flex;gap:8px;margin-top:12px;">
                            <div class="skeleton-line skeleton-line-sm" style="width:60px;"></div>
                            <div class="skeleton-line skeleton-line-sm" style="width:60px;"></div>
                            <div class="skeleton-line skeleton-line-sm" style="width:60px;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Meetings list skeleton
    meetings: function(count = 4) {
        return `
            <div class="skeleton-meetings">
                ${Array(count).fill(0).map(() => `
                    <div class="skeleton-meeting-card">
                        <div class="skeleton-line skeleton-line-lg skeleton-line-w-75"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-40" style="margin-top:4px;"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-60" style="margin-top:8px;"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-30" style="margin-top:4px;"></div>
                        <div style="display:flex;gap:8px;margin-top:12px;">
                            <div class="skeleton-line skeleton-line-sm" style="width:60px;"></div>
                            <div class="skeleton-line skeleton-line-sm" style="width:60px;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Groups list skeleton
    groups: function(count = 6) {
        return `
            <div class="skeleton-groups">
                ${Array(count).fill(0).map(() => `
                    <div class="skeleton-group-card">
                        <div class="skeleton-circle skeleton-circle-lg" style="margin:0 auto 10px auto;"></div>
                        <div class="skeleton-line skeleton-line-w-75" style="margin:0 auto 4px auto;"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-50" style="margin:0 auto;"></div>
                        <div style="display:flex;justify-content:center;gap:8px;margin-top:10px;">
                            <div class="skeleton-line skeleton-line-sm" style="width:40px;"></div>
                            <div class="skeleton-line skeleton-line-sm" style="width:40px;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Projects list skeleton
    projects: function(count = 4) {
        return `
            <div class="skeleton-projects">
                ${Array(count).fill(0).map(() => `
                    <div class="skeleton-project-card">
                        <div class="skeleton-line skeleton-line-lg skeleton-line-w-70"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-50" style="margin-top:4px;"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-80" style="margin-top:8px;"></div>
                        <div style="display:flex;gap:16px;margin-top:8px;">
                            <div class="skeleton-line skeleton-line-sm skeleton-line-w-25"></div>
                            <div class="skeleton-line skeleton-line-sm skeleton-line-w-25"></div>
                        </div>
                        <div style="display:flex;gap:8px;margin-top:12px;">
                            <div class="skeleton-line skeleton-line-sm" style="width:60px;"></div>
                            <div class="skeleton-line skeleton-line-sm" style="width:60px;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Table skeleton (for contributions, expenses, etc.)
    table: function(columns = 5, rows = 6) {
        const header = Array(columns).fill(0).map(() => 
            `<div class="skeleton-line skeleton-line-sm skeleton-line-w-75"></div>`
        ).join('');
        
        const body = Array(rows).fill(0).map(() => `
            <div class="skeleton-table-row">
                ${Array(columns).fill(0).map(() => 
                    `<div class="skeleton-line skeleton-line-sm skeleton-line-w-100"></div>`
                ).join('')}
            </div>
        `).join('');
        
        return `
            <div class="skeleton-table">
                <div class="skeleton-table-header">
                    ${header}
                </div>
                ${body}
            </div>
        `;
    },

    // Contribution types skeleton
    types: function(count = 6) {
        return `
            <div class="skeleton-types">
                ${Array(count).fill(0).map(() => `
                    <div class="skeleton-type-card">
                        <div class="skeleton-circle skeleton-circle-lg" style="margin:0 auto 10px auto;"></div>
                        <div class="skeleton-line skeleton-line-w-75" style="margin:0 auto 4px auto;"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-50" style="margin:0 auto;"></div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Expense categories skeleton
    expenseCategories: function(count = 6) {
        return `
            <div class="skeleton-types">
                ${Array(count).fill(0).map(() => `
                    <div class="skeleton-type-card">
                        <div class="skeleton-circle skeleton-circle-sm" style="margin:0 auto 8px auto;"></div>
                        <div class="skeleton-line skeleton-line-w-75" style="margin:0 auto 4px auto;"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-50" style="margin:0 auto;"></div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Announcements skeleton
    announcements: function(count = 4) {
        return `
            <div style="display:flex;flex-direction:column;gap:16px;">
                ${Array(count).fill(0).map(() => `
                    <div class="skeleton-card">
                        <div class="skeleton-line skeleton-line-lg skeleton-line-w-75"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-25" style="margin-top:4px;"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-50" style="margin-top:8px;"></div>
                        <div class="skeleton-line skeleton-line-sm skeleton-line-w-30" style="margin-top:4px;"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};

// Export for use in pages
window.Skeletons = Skeletons;
