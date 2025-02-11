// Initialize Feather icons and load data
document.addEventListener('DOMContentLoaded', async () => {
    feather.replace();
    // Only load initial page of extensions
    await loadExtensions(undefined, 0, 10);
    await loadCategories();

    // Set up intersection observer for infinite scroll
    setupInfiniteScroll();
});

// Load extensions from the database with pagination
async function loadExtensions(category = 'All Extensions', page = 0, limit = 10, append = false) {
    try {
        const grid = document.getElementById('extensionGrid');
        if (!append) {
            grid.innerHTML = '';
        }

        let extensions;
        if (category === 'All Extensions') {
            const response = await fetch(`/api/extensions?page=${page}&limit=${limit}`);
            extensions = await response.json();
        } else {
            const response = await fetch(`/api/categories/${category}/extensions?page=${page}&limit=${limit}`);
            extensions = await response.json();
        }

        if (extensions.length === 0 && page === 0) {
            grid.innerHTML = '<div class="col-12"><p class="text-center">No extensions found</p></div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        extensions.forEach(extension => {
            const card = createExtensionCard(extension);
            fragment.appendChild(card);
        });
        grid.appendChild(fragment);

        return extensions.length === limit; // Return true if there might be more extensions
    } catch (error) {
        console.error('Error loading extensions:', error);
        showError('Failed to load extensions. Please try again later.');
        return false;
    }
}

// Set up infinite scroll
function setupInfiniteScroll() {
    let currentPage = 0;
    let loading = false;
    let hasMore = true;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !loading && hasMore) {
                loadNextPage();
            }
        });
    }, { threshold: 0.1 });

    // Observe the last card
    function observeLastCard() {
        const cards = document.querySelectorAll('.extension-card');
        if (cards.length > 0) {
            observer.observe(cards[cards.length - 1]);
        }
    }

    // Throttled scroll handler for loading next page
    async function loadNextPage() {
        if (loading || !hasMore) return;
        loading = true;
        currentPage++;

        const category = document.querySelector('.list-group-item.active').textContent;
        hasMore = await loadExtensions(category, currentPage, 10, true);

        loading = false;
        observeLastCard();
    }

    // Initial observation
    observeLastCard();
}

// Debounced search function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Set up search functionality with debouncing
document.getElementById('searchInput').addEventListener('input', 
    debounce(async (e) => {
        try {
            const searchTerm = e.target.value;
            if (searchTerm.length < 2) return; // Don't search for very short terms

            const response = await fetch(`/api/extensions/search?q=${encodeURIComponent(searchTerm)}`);
            const extensions = await response.json();

            const grid = document.getElementById('extensionGrid');
            grid.innerHTML = '';

            if (extensions.length === 0) {
                grid.innerHTML = '<div class="col-12"><p class="text-center">No matching extensions found</p></div>';
                return;
            }

            const fragment = document.createDocumentFragment();
            extensions.forEach(extension => {
                const card = createExtensionCard(extension);
                fragment.appendChild(card);
            });
            grid.appendChild(fragment);
        } catch (error) {
            console.error('Error searching extensions:', error);
            showError('Failed to search extensions. Please try again later.');
        }
    }, 300) // Wait 300ms after user stops typing
);


// Load categories from the database
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        const categoryList = document.getElementById('categoryList');

        // Keep the "All Extensions" option
        categoryList.innerHTML = `
            <a href="#" class="list-group-item list-group-item-action active">All Extensions</a>
        `;

        categories.forEach(category => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'list-group-item list-group-item-action';
            item.textContent = category.name;
            categoryList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Failed to load categories. Please try again later.');
    }
}

// Create extension card element
function createExtensionCard(extension) {
    const col = document.createElement('div');
    col.className = 'col-md-6';

    col.innerHTML = `
        <div class="card extension-card" data-category="${extension.category?.name || ''}">
            <div class="card-img-top p-4">
                <i data-feather="${extension.icon}"></i>
            </div>
            <div class="card-body">
                <h5 class="card-title">${extension.name}</h5>
                <p class="card-text">${extension.description}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="rating">
                        <i data-feather="star" class="text-warning"></i>
                        ${extension.rating}
                    </div>
                    <small class="text-muted">${extension.users} users</small>
                </div>
                <div class="d-flex gap-2 mt-3">
                    <button class="btn btn-primary flex-grow-1" onclick="handleInstall(${extension.id})">
                        <i data-feather="download"></i>
                        Install
                    </button>
                    <button class="btn btn-outline-secondary" onclick="showExtensionDetails(${JSON.stringify(extension).replace(/"/g, '&quot;')})">
                        <i data-feather="info"></i>
                        Details
                    </button>
                    <button class="btn btn-outline-primary" onclick="launchExtensionApp(${JSON.stringify(extension).replace(/"/g, '&quot;')})">
                        <i data-feather="play"></i>
                        Run
                    </button>
                </div>
            </div>
        </div>
    `;

    feather.replace();
    return col;
}

// Show extension details in PiP window
function showExtensionDetails(extension) {
    // Remove existing modal if any
    const existingModal = document.getElementById('extensionModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'extensionModal';
    modal.className = 'modal pip fade show';
    modal.style.display = 'block';
    modal.setAttribute('tabindex', '-1');

    const isWallet = extension.category?.name === 'Wallet';
    const securityNote = isWallet
        ? `<div class="alert alert-warning">
            <i data-feather="shield"></i>
            <strong>Security Notice:</strong> This is a cryptocurrency wallet extension. 
            Always verify you're installing from the official Chrome Web Store.
           </div>`
        : '';

    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header" id="modalHeader">
                    <h5 class="modal-title">${extension.name}</h5>
                    <button type="button" class="btn-close" onclick="closeModal()"></button>
                </div>
                <div class="modal-body">
                    ${securityNote}
                    <div class="extension-icon">
                        <i data-feather="${extension.icon}" style="width: 32px; height: 32px;"></i>
                    </div>
                    <div class="extension-details">
                        <p class="description">${extension.description}</p>
                        <div class="stats d-flex gap-3 mb-2">
                            <div class="rating">
                                <i data-feather="star" class="text-warning"></i>
                                <span>${extension.rating} rating</span>
                            </div>
                            <div class="users">
                                <i data-feather="users"></i>
                                <span>${extension.users} users</span>
                            </div>
                        </div>
                        <div class="category">
                            <strong>Category:</strong> ${extension.category?.name || 'Uncategorized'}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">Close</button>
                    <button type="button" class="btn btn-sm btn-primary" onclick="handleInstall(${extension.id})">
                        <i data-feather="download"></i>
                        Install
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    feather.replace();

    // Add drag functionality
    const modalDialog = modal.querySelector('.modal-dialog');
    const modalHeader = modal.querySelector('#modalHeader');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    modalHeader.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === modalHeader) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, modalDialog);
        }
    }

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('extensionModal');
    if (modal) {
        modal.remove();
        document.body.classList.remove('modal-open');
    }
}

// Handle extension installation
function handleInstall(extensionId) {
    // Get the extension details
    fetch(`/api/extensions/${extensionId}`)
        .then(response => response.json())
        .then(extension => {
            const isWalletExtension = extension.categoryId === getWalletCategoryId();
            const message = isWalletExtension
                ? `IMPORTANT: For wallet extensions, always verify you're installing from the official Chrome Web Store. ` +
                  `Never share your recovery phrase or private keys.\n\n` +
                  `Please visit the official Chrome Web Store to install ${extension.name}.`
                : `Please note: Direct extension installation requires proper authorization. ` +
                  `Please visit the official Chrome Web Store to install this extension.`;

            alert(message);
        })
        .catch(error => {
            console.error('Error fetching extension details:', error);
            alert('Please visit the official Chrome Web Store to install this extension.');
        });
}

// Helper function to get wallet category ID
async function getWalletCategoryId() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        const walletCategory = categories.find(cat => cat.name === 'Wallet');
        return walletCategory ? walletCategory.id : null;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return null;
    }
}

// Show error message
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `<i data-feather="alert-circle"></i> ${message}`;
    document.querySelector('main').insertBefore(alertDiv, document.querySelector('.row'));
    feather.replace();

    // Remove the alert after 5 seconds
    setTimeout(() => alertDiv.remove(), 5000);
}

// Set up category filtering
document.getElementById('categoryList').addEventListener('click', (e) => {
    if (e.target.classList.contains('list-group-item')) {
        e.preventDefault();

        // Update active state
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('active');
        });
        e.target.classList.add('active');

        // Load filtered extensions
        loadExtensions(e.target.textContent, 0, 10); // Reset page to 0
    }
});


// Optimized PiP window management
const activePipWindows = new Set();

// Launch extension app in PiP mode with optimizations
async function launchExtensionApp(extension) {
    const pipId = `extension-app-${extension.id}`;

    // Reuse existing PiP if possible
    const existingPip = document.getElementById(pipId);
    if (existingPip) {
        existingPip.style.display = 'block';
        return;
    }

    if (activePipWindows.size >= 3) {
        const oldestPip = activePipWindows.values().next().value;
        closeExtensionApp(oldestPip);
    }

    try {
        // Fetch manifest using cached response if available
        const manifestResponse = await fetch(`/api/extensions/${extension.id}/manifest`, {
            cache: 'force-cache'
        });
        const manifest = await manifestResponse.json();

        // Create and setup PiP window with performance optimizations
        const pip = document.createElement('div');
        pip.id = pipId;
        pip.className = 'modal pip app-pip fade show';
        pip.style.display = 'block';

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header" id="${pipId}-header">
                        <div class="d-flex align-items-center">
                            <i data-feather="${extension.icon}" class="me-2"></i>
                            <h5 class="modal-title">${extension.name}</h5>
                        </div>
                        <div class="pip-controls">
                            <button type="button" class="btn btn-sm btn-outline-secondary me-2" onclick="minimizeExtensionApp('${pipId}')">
                                <i data-feather="minus"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="closeExtensionApp('${pipId}')">
                                <i data-feather="x"></i>
                            </button>
                        </div>
                    </div>
                    <div class="modal-body app-container">
                        ${manifest.criticalPermissions?.length || manifest.hostPermissions?.length ? `
                            <div class="alert alert-info">
                                ${manifest.criticalPermissions?.length ? `
                                    <div class="mb-2">
                                        <strong>Permissions:</strong> ${manifest.criticalPermissions.join(', ')}
                                    </div>
                                ` : ''}
                                ${manifest.hostPermissions?.length ? `
                                    <div>
                                        <strong>Host Access:</strong> ${manifest.hostPermissions.join(', ')}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                        <iframe 
                            src="about:blank"
                            class="extension-frame"
                            sandbox="allow-scripts allow-same-origin"
                            loading="lazy"
                            data-src="${manifest.action?.default_popup || 'about:blank'}">
                        </iframe>
                    </div>
                </div>
            </div>
        `;

        fragment.appendChild(modalContent);
        pip.appendChild(fragment);
        document.body.appendChild(pip);

        // Lazy load iframe content
        const iframe = pip.querySelector('iframe');
        if (iframe.dataset.src !== 'about:blank') {
            requestIdleCallback(() => {
                iframe.src = iframe.dataset.src;
            });
        }

        // Initialize Feather icons only for the new content
        feather.replace(pip.querySelectorAll('[data-feather]'));

        // Add drag functionality with performance optimization
        addDragFunctionality(pip, pipId);

        // Track active PiP windows
        activePipWindows.add(pipId);
    } catch (error) {
        console.error('Error launching extension:', error);
        alert('Failed to launch extension. Please try again later.');
    }
}

// Helper function for drag functionality
function addDragFunctionality(pip, pipId) {
    const modalDialog = pip.querySelector('.modal-dialog');
    const modalHeader = pip.querySelector(`#${pipId}-header`);
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    modalHeader.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target.closest('.pip-controls')) return;

        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === modalHeader || modalHeader.contains(e.target)) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, modalDialog);
        }
    }

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
}

// Minimize extension app
function minimizeExtensionApp(pipId) {
    const pip = document.getElementById(pipId);
    if (pip) {
        const modalBody = pip.querySelector('.modal-body');
        const minimizeBtn = pip.querySelector('.pip-controls .btn-outline-secondary i');

        if (modalBody.style.display === 'none') {
            modalBody.style.display = 'block';
            minimizeBtn.setAttribute('data-feather', 'minus');
        } else {
            modalBody.style.display = 'none';
            minimizeBtn.setAttribute('data-feather', 'maximize-2');
        }
        feather.replace();
    }
}

// Close extension app
function closeExtensionApp(pipId) {
    const pip = document.getElementById(pipId);
    if (pip) {
        pip.remove();
        activePipWindows.delete(pipId);
    }
}