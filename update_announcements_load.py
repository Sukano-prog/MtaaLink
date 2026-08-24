import re

with open('/home/laki/MtaaLink/frontend/js/pages/announcements.js', 'r') as f:
    content = f.read()

old = '''async function loadAnnouncements() {
    const container = document.getElementById('announcementsContainer');
    
    try {
        announcementsData = await getAnnouncements();
        renderAnnouncementsList();'''

new = '''async function loadAnnouncements() {
    const container = document.getElementById('announcementsContainer');
    
    try {
        const params = {};
        const status = document.getElementById('statusFilter')?.value;
        if (status) params.status = status;
        if (searchQuery) params.search = searchQuery;
        
        announcementsData = await getAnnouncements(params);
        renderAnnouncementsList();'''

if old in content:
    content = content.replace(old, new)
    with open('/home/laki/MtaaLink/frontend/js/pages/announcements.js', 'w') as f:
        f.write(content)
    print("✅ Updated loadAnnouncements")
else:
    print("❌ Pattern not found")
