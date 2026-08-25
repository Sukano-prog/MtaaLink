#!/bin/bash

# Replace all "MtaaLink" with "Management System" in frontend files
find ~/MtaaLink/frontend -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" \) -exec sed -i 's/MtaaLink/Management System/g' {} \;

# Replace "Village Management" with "Management" in remaining places
find ~/MtaaLink/frontend -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" \) -exec sed -i 's/Village Management/Management/g' {} \;

# Fix specific cases where it might have been double-replaced
find ~/MtaaLink/frontend -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" \) -exec sed -i 's/Management System System/Management System/g' {} \;
find ~/MtaaLink/frontend -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" \) -exec sed -i 's/Install Management System/Install App/g' {} \;
find ~/MtaaLink/frontend -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" \) -exec sed -i 's/Management System Service Worker/Service Worker/g' {} \;

# Update PWA install text
sed -i 's/Install Management System/Install App/g' ~/MtaaLink/frontend/js/components/pwa-install.js
sed -i 's/Management System Management System/Management System/g' ~/MtaaLink/frontend/js/components/pwa-install.js

echo "✅ Complete rebrand done!"
