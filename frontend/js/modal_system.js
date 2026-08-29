// MtaaLink - Modal System

// ===================== MODAL MANAGER =====================

var ModalManager = {
    currentType: null,
    currentId: null,
    isEdit: false,

    open: function(type, data) {
        data = data || null;
        var overlay = document.getElementById('modalOverlay');
        var title = document.getElementById('modalTitle');
        var body = document.getElementById('modalBody');
        var footer = document.getElementById('modalFooter');
        
        if (!overlay || !title || !body || !footer) {
            console.error('Modal elements not found');
            return;
        }
        
        this.currentType = type;
        this.isEdit = !!data;
        this.currentId = data?.id || null;
        
        var titles = {
            'member': data ? 'Edit Member' : 'Add New Member',
            'meeting': data ? 'Edit Meeting' : 'Schedule Meeting',
            'contribution': data ? 'Edit Contribution' : 'Record Contribution',
            'announcement': data ? 'Edit Announcement' : 'Send Announcement',
            'campaign': data ? 'Edit Campaign' : 'Start Campaign',
            'expense': data ? 'Edit Expense' : 'Add Expense',
            'group': data ? 'Edit Group' : 'Create Group'
        };
        
        title.textContent = titles[type] || 'Modal';
        
        var formHtml = this.getFormHTML(type, data);
        body.innerHTML = formHtml;
        
        var buttonText = data ? 'Update' : 'Create';
        var buttonIcon = data ? 'fa-save' : 'fa-plus';
        var buttonClass = data ? 'btn-success' : 'btn-primary';
        
        footer.innerHTML = 
            '<button class="btn btn-outline" onclick="ModalManager.close()">Cancel</button>' +
            '<button class="btn ' + buttonClass + '" onclick="ModalManager.submit()">' +
                '<i class="fas ' + buttonIcon + '"></i> ' + buttonText +
            '</button>';
        
        overlay.style.display = 'flex';
        setTimeout(function() {
            var firstInput = document.querySelector('#modalForm input, #modalForm textarea, #modalForm select');
            if (firstInput) firstInput.focus();
        }, 100);
    },

    close: function() {
        var overlay = document.getElementById('modalOverlay');
        if (overlay) overlay.style.display = 'none';
        this.currentType = null;
        this.currentId = null;
        this.isEdit = false;
    },

    getFormHTML: function(type, data) {
        data = data || {};
        var html = '<form id="modalForm">';
        
        if (type === 'member') {
            html += '<div class="form-group"><label>First Name <span class="required">*</span></label><input type="text" class="form-control" name="first_name" value="' + (data.first_name || '') + '" required></div>';
            html += '<div class="form-group"><label>Last Name <span class="required">*</span></label><input type="text" class="form-control" name="last_name" value="' + (data.last_name || '') + '" required></div>';
            html += '<div class="form-group"><label>Phone <span class="required">*</span></label><input type="tel" class="form-control" name="phone" value="' + (data.phone || '') + '" required></div>';
            html += '<div class="form-group"><label>Email</label><input type="email" class="form-control" name="email" value="' + (data.email || '') + '"></div>';
            html += '<div class="form-group"><label>Role</label><select class="form-control" name="role">';
            html += '<option value="member">Member</option><option value="elder">Elder</option><option value="secretary">Secretary</option><option value="treasurer">Treasurer</option>';
            html += '</select></div>';
        } else if (type === 'meeting') {
            html += '<div class="form-group"><label>Title <span class="required">*</span></label><input type="text" class="form-control" name="title" value="' + (data.title || '') + '" required></div>';
            html += '<div class="form-row"><div class="form-group"><label>Date <span class="required">*</span></label><input type="date" class="form-control" name="date" value="' + (data.date || '') + '" required></div>';
            html += '<div class="form-group"><label>Time <span class="required">*</span></label><input type="time" class="form-control" name="time" value="' + (data.time || '') + '" required></div></div>';
            html += '<div class="form-group"><label>Location</label><input type="text" class="form-control" name="location" value="' + (data.location || '') + '"></div>';
            html += '<div class="form-group"><label>Agenda</label><textarea class="form-control" name="agenda" rows="3">' + (data.agenda || '') + '</textarea></div>';
        } else if (type === 'contribution') {
            html += '<div class="form-group"><label>Amount <span class="required">*</span></label><input type="number" class="form-control" name="amount" value="' + (data.amount || '') + '" required></div>';
            html += '<div class="form-group"><label>Status</label><select class="form-control" name="status"><option value="pending">Pending</option><option value="paid">Paid</option></select></div>';
        } else {
            html += '<p>Form for ' + type + ' coming soon</p>';
        }
        
        html += '</form>';
        return html;
    },

    submit: function() {
        var form = document.getElementById('modalForm');
        if (!form) { showToast('Form not found', 'error'); return; }
        var data = Object.fromEntries(new FormData(form));
        showToast('✅ Saved!', 'success');
        this.close();
        var currentPage = document.querySelector('.nav-link.active')?.dataset.page || 'dashboard';
        navigateTo(currentPage);
    }
};

// ============================================================
// EXPOSE
// ============================================================

window.ModalManager = ModalManager;
