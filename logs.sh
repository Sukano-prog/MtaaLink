#!/bin/bash
# MtaaLink - View Logs

echo "=========================================="
echo "  MtaaLink - View Logs"
echo "=========================================="
echo ""
echo "Select log to view:"
echo "  1) Backend log"
echo "  2) Frontend log"
echo "  3) Tail backend log (live)"
echo "  4) Tail frontend log (live)"
echo "  5) Exit"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1) cat ~/MtaaLink/logs/backend.log ;;
    2) cat ~/MtaaLink/logs/frontend.log ;;
    3) tail -f ~/MtaaLink/logs/backend.log ;;
    4) tail -f ~/MtaaLink/logs/frontend.log ;;
    5) exit ;;
    *) echo "Invalid choice" ;;
esac
