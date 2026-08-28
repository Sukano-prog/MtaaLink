/* ============================================================
   MtaaLink - Searchable Select Component
   ============================================================ */

export function createSearchableSelect(options, selectedValue = null, placeholder = 'Type to search...') {
    const container = document.createElement('div');
    container.className = 'searchable-select-container';
    container.style.position = 'relative';
    container.style.width = '100%';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control searchable-select-input';
    input.placeholder = placeholder;
    input.autocomplete = 'off';
    input.style.width = '100%';
    input.style.cursor = 'text';
    
    const hiddenSelect = document.createElement('select');
    hiddenSelect.className = 'searchable-select-hidden';
    hiddenSelect.style.display = 'none';
    
    let selectedLabel = '';
    options.forEach(function(opt) {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        hiddenSelect.appendChild(option);
        
        if (opt.value === selectedValue) {
            option.selected = true;
            selectedLabel = opt.label;
        }
    });
    
    if (selectedLabel) {
        input.value = selectedLabel;
        input.placeholder = '';
    } else {
        input.value = '';
        input.placeholder = placeholder;
    }
    
    const dropdown = document.createElement('div');
    dropdown.className = 'searchable-select-dropdown';
    dropdown.style.position = 'absolute';
    dropdown.style.top = '100%';
    dropdown.style.left = '0';
    dropdown.style.right = '0';
    dropdown.style.maxHeight = '250px';
    dropdown.style.overflowY = 'auto';
    dropdown.style.background = '#ffffff';
    dropdown.style.border = '1px solid #d1d5db';
    dropdown.style.borderRadius = '6px';
    dropdown.style.marginTop = '4px';
    dropdown.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
    dropdown.style.zIndex = '10000';
    dropdown.style.display = 'none';
    
    function renderDropdown(filter = '') {
        dropdown.innerHTML = '';
        const filterLower = filter.toLowerCase().trim();
        let hasResults = false;
        
        const filteredOptions = options.filter(function(opt) {
            if (!filterLower) return true;
            if (opt.value === '') return false;
            return (opt.label || '').toLowerCase().includes(filterLower);
        });
        
        const displayOptions = filterLower ? filteredOptions : options;
        
        displayOptions.forEach(function(opt) {
            hasResults = true;
            const item = document.createElement('div');
            item.className = 'searchable-select-item';
            item.style.padding = '8px 14px';
            item.style.cursor = 'pointer';
            item.style.borderBottom = '1px solid #f3f4f6';
            item.style.fontSize = '14px';
            item.style.color = '#1f2937';
            item.textContent = opt.label;
            
            if (filterLower && opt.value !== '') {
                const label = opt.label || '';
                const index = label.toLowerCase().indexOf(filterLower);
                if (index !== -1) {
                    const before = label.substring(0, index);
                    const match = label.substring(index, index + filterLower.length);
                    const after = label.substring(index + filterLower.length);
                    item.innerHTML = before + '<strong style="color:#2563eb;">' + match + '</strong>' + after;
                }
            }
            
            if (opt.value === hiddenSelect.value && opt.value !== '') {
                item.style.background = '#eff6ff';
                item.style.fontWeight = '500';
                item.dataset.selected = 'true';
            }
            
            item.addEventListener('mouseenter', function() {
                if (!this.dataset.selected || this.dataset.selected !== 'true') {
                    this.style.background = '#f3f4f6';
                }
            });
            item.addEventListener('mouseleave', function() {
                if (this.dataset.selected === 'true') {
                    this.style.background = '#eff6ff';
                } else {
                    this.style.background = '';
                }
            });
            
            item.addEventListener('click', function() {
                selectOption(opt.value, opt.label);
            });
            
            dropdown.appendChild(item);
        });
        
        if (!hasResults) {
            const empty = document.createElement('div');
            empty.className = 'searchable-select-empty';
            empty.style.padding = '12px';
            empty.style.color = '#9ca3af';
            empty.style.textAlign = 'center';
            empty.style.fontSize = '14px';
            empty.textContent = 'No members found';
            dropdown.appendChild(empty);
        }
    }
    
    function selectOption(value, label) {
        hiddenSelect.value = value;
        if (value) {
            input.value = label;
            input.placeholder = '';
        } else {
            input.value = '';
            input.placeholder = placeholder;
        }
        dropdown.style.display = 'none';
        
        const event = new Event('change', { bubbles: true });
        hiddenSelect.dispatchEvent(event);
    }
    
    input.addEventListener('focus', function() {
        renderDropdown(this.value);
        dropdown.style.display = 'block';
        if (this.value) {
            this.select();
        }
    });
    
    input.addEventListener('input', function() {
        const val = this.value;
        if (val === '') {
            hiddenSelect.value = '';
            const event = new Event('change', { bubbles: true });
            hiddenSelect.dispatchEvent(event);
        }
        renderDropdown(val);
        dropdown.style.display = 'block';
    });
    
    input.addEventListener('blur', function() {
        setTimeout(function() {
            dropdown.style.display = 'none';
            if (input.value === '' && hiddenSelect.value) {
                const selectedOpt = options.find(function(o) { return o.value === hiddenSelect.value; });
                if (selectedOpt) {
                    input.value = selectedOpt.label;
                    input.placeholder = '';
                }
            }
        }, 200);
    });
    
    input.addEventListener('keydown', function(e) {
        const items = dropdown.querySelectorAll('.searchable-select-item');
        let currentIndex = -1;
        items.forEach(function(el, idx) {
            if (el.dataset.selected === 'true') {
                currentIndex = idx;
            }
        });
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (items.length === 0) {
                renderDropdown(this.value);
                dropdown.style.display = 'block';
                return;
            }
            const nextIndex = currentIndex + 1;
            if (nextIndex < items.length) {
                items.forEach(function(el) { el.dataset.selected = 'false'; });
                items[nextIndex].dataset.selected = 'true';
                items[nextIndex].style.background = '#f3f4f6';
                items[nextIndex].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (items.length === 0) return;
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
            if (prevIndex >= 0 && prevIndex < items.length) {
                items.forEach(function(el) { el.dataset.selected = 'false'; });
                items[prevIndex].dataset.selected = 'true';
                items[prevIndex].style.background = '#f3f4f6';
                items[prevIndex].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = dropdown.querySelector('.searchable-select-item[data-selected="true"]');
            if (selected) {
                const label = selected.textContent;
                const opt = options.find(function(o) { return o.label === label; });
                if (opt) {
                    selectOption(opt.value, opt.label);
                }
            } else if (items.length === 1) {
                const firstItem = items[0];
                const label = firstItem.textContent;
                const opt = options.find(function(o) { return o.label === label; });
                if (opt) {
                    selectOption(opt.value, opt.label);
                }
            }
        } else if (e.key === 'Escape') {
            dropdown.style.display = 'none';
            input.blur();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!container.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    container.appendChild(input);
    container.appendChild(hiddenSelect);
    container.appendChild(dropdown);
    
    return container;
}
