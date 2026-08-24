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

# Get members for attendance
response = requests.get(f'{base_url}/members/', headers=headers)
members = response.json() if response.ok else []
member_ids = [m.get('id') for m in members if m.get('id')]
print(f"Found {len(member_ids)} members")

for meeting in meetings:
    meeting_id = meeting.get('id')
    title = meeting.get('title', '')
    status = meeting.get('status', '')
    
    print(f"\nProcessing: {title[:35]}... (status: {status})")
    
    # If not completed, mark as completed
    if status != 'completed':
        try:
            response = requests.post(
                f'{base_url}/meetings/{meeting_id}/complete/',
                headers=headers
            )
            if response.status_code in [200, 201]:
                print(f"  ✅ Marked as completed")
            else:
                print(f"  ❌ Failed to complete: {response.text[:80]}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    # Add attendance if members exist
    if member_ids and len(member_ids) >= 3:
        num_attend = random.randint(3, min(10, len(member_ids)))
        selected = random.sample(member_ids, num_attend)
        
        try:
            response = requests.post(
                f'{base_url}/meetings/{meeting_id}/attendance',
                headers=headers,
                json=selected
            )
            if response.status_code in [200, 201]:
                print(f"  ✅ Added {len(selected)} attendance records")
            else:
                print(f"  ❌ Attendance failed: {response.text[:80]}")
        except Exception as e:
            print(f"  ❌ Attendance error: {e}")

print("\n✅ All meetings processed!")

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

cursor.execute("""
    SELECT m.title, COUNT(ma.id) as total, SUM(ma.attended) as present
    FROM meetings m
    LEFT JOIN meeting_attendance ma ON m.id = ma.meeting_id
    GROUP BY m.id
    HAVING total > 0
""")
results = cursor.fetchall()
print("\n=== Meetings with Attendance ===")
for title, total, present in results:
    print(f"  {title[:35]}... - {present or 0}/{total} attended")
conn.close()
