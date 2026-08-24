#!/bin/bash

# Token from successful login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZGY2ZTZlNi0yMjRkLTQyNGItYWM3MS0xYTE2ODFiZmYzMDEiLCJ2aWxsYWdlX2lkIjoiZTQ4MjQ4NTAtMDk1Ni00ZDI1LThiMTgtOTdlYmE4NWEyZGM3Iiwicm9sZSI6ImFkbWluIiwic2Vzc2lvbl9pZCI6IjE0YjBkYzdjLTA5NGUtNDQxYy04ZmEwLTViNDNlMmU1NTY1YiIsImV4cCI6MTc4NzQyNzI5OH0.6lmiGZvxG35yQFg1t1U3fjwsmnQiuMNI1oO0bkatGqo"

echo "========================================="
echo "     MtaaLink - API Test Suite          "
echo "========================================="
echo ""

# 1. Health Check
echo "1. Health Check:"
curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || echo "Failed"
echo ""

# 2. Get Members
echo "2. Getting Members:"
curl -s -X GET "http://localhost:8000/api/v1/members/" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || echo "Failed"
echo ""

# 3. Create Group
echo "3. Creating Group:"
curl -s -X POST "http://localhost:8000/api/v1/groups/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Elders",
    "description": "Village elders group"
  }' | python3 -m json.tool 2>/dev/null || echo "Failed"
echo ""

# 4. Get Groups
echo "4. Getting Groups:"
curl -s -X GET "http://localhost:8000/api/v1/groups/" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || echo "Failed"
echo ""

# 5. Create Meeting
echo "5. Creating Meeting:"
curl -s -X POST "http://localhost:8000/api/v1/meetings/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Baraza la Wiki",
    "date": "2026-08-20",
    "time": "10:00:00",
    "location": "Village Hall",
    "quorum_required": 10
  }' | python3 -m json.tool 2>/dev/null || echo "Failed"
echo ""

# 6. Get Meetings
echo "6. Getting Meetings:"
curl -s -X GET "http://localhost:8000/api/v1/meetings/" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || echo "Failed"
echo ""

# 7. Create Contribution Type
echo "7. Creating Contribution Type:"
curl -s -X POST "http://localhost:8000/api/v1/contributions/types" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Harambee",
    "description": "Development fund"
  }' | python3 -m json.tool 2>/dev/null || echo "Failed"
echo ""

# 8. Get Dashboard
echo "8. Getting Dashboard:"
curl -s -X GET "http://localhost:8000/api/v1/reports/dashboard" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || echo "Failed"
echo ""

echo "========================================="
echo "              Done!                      "
echo "========================================="
