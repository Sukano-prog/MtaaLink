import requests
import json
import random
import sqlite3

# Get token
with open('/home/laki/MtaaLink/token.txt', 'r') as f:
    token = f.read().strip()

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

base_url = 'http://localhost:8000/api/v1'

# Get all meetings
response = requests.get(f'{base_url}/meetings/', headers=headers)
meetings = response.json() if response.ok else []

print(f"Found {len(meetings)} meetings")

# Sample minutes templates
minutes_templates = [
    "The meeting was called to order. All agenda items were discussed. Decisions were made on key issues. Next meeting scheduled.",
    "Discussed community development projects. Approved budget for upcoming activities. Formed committee for implementation.",
    "Reviewed progress on ongoing projects. Addressed challenges faced. Agreed on next steps. Meeting concluded successfully.",
    "Discussed water project status. Agreed on maintenance plan. Scheduled follow-up meeting.",
    "Reviewed village security matters. Formed neighborhood watch committee. Agreed on reporting structure.",
    "Discussed education matters. Planned school renovation. Approved fundraising drive."
]

for meeting in meetings:
    meeting_id = meeting.get('id')
    title = meeting.get('title', '')
    status = meeting.get('status', '')
    
    print(f"\nProcessing: {title[:35]}... (status: {status})")
    
    # If not completed, mark as completed with minutes
    if status != 'completed':
        minutes = random.choice(minutes_templates)
        try:
            response = requests.post(
                f'{base_url}/meetings/{meeting_id}/complete?minutes={minutes}',
                headers=headers
            )
            if response.status_code in [200, 201]:
                print(f"  ✅ Marked as completed")
            else:
                print(f"  ❌ Failed: {response.text[:80]}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    # Add attendance if members exist (if not already added)
    # Get members
    response_members = requests.get(f'{base_url}/members/', headers=headers)
    members = response_members.json() if response_members.ok else []
    member_ids = [m.get('id') for m in members if m.get('id')]
    
    if member_ids and len(member_ids) >= 3:
        # Check if attendance already exists
        response_check = requests.get(f'{base_url}/meetings/{meeting_id}', headers=headers)
        if response_check.ok:
            data = response_check.json()
            attendance = data.get('attendance', [])
            if len(attendance) == 0:
                num_attend = random.randint(3, min(10, len(member_ids)))
                selected = random.sample(member_ids, num_attend)
                try:
                    response_att = requests.post(
                        f'{base_url}/meetings/{meeting_id}/attendance',
                        headers=headers,
                        json=selected
                    )
                    if response_att.status_code in [200, 201]:
                        print(f"  ✅ Added {len(selected)} attendance records")
                except Exception as e:
                    pass

print("\n✅ All meetings completed!")

# Show summary
conn = sqlite3.connect('/home/laki/MtaaLink/mtaalink.db')
cursor = conn.cursor()
cursor.execute("""
    SELECT status, COUNT(*) FROM meetings GROUP BY status
""")
results = cursor.fetchall()
print("\n=== Meeting Status Summary ===")
for status, count in results:
    print(f"  {status}: {count}")
conn.close()
