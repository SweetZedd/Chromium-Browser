// Initialize Feather icons and load data
document.addEventListener('DOMContentLoaded', async () => {
    feather.replace();
    await loadExtensions();
    await loadCategories();
});

// Load extensions from the database
async function loadExtensions(category = 'All Extensions') {
    try {
        const grid = document.getElementById('extensionGrid');
        grid.innerHTML = '';

        let extensions;
        if (category === 'All Extensions') {
            const response = await fetch('/api/extensions');
            extensions = await response.json();
        } else {
            const response = await fetch(`/api/categories/${category}/extensions`);
            extensions = await response.json();
        }

        extensions.forEach(extension => {
            const card = createExtensionCard(extension);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading extensions:', error);
        showError('Failed to load extensions. Please try again later.');
    }
}

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
                </div>
            </div>
        </div>
    `;

    // Re-initialize Feather icons for the new content
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
        loadExtensions(e.target.textContent);
    }
});

// Set up search functionality
document.getElementById('searchButton').addEventListener('click', async () => {
    try {
        const searchTerm = document.getElementById('searchInput').value;
        const response = await fetch(`/api/extensions/search?q=${encodeURIComponent(searchTerm)}`);
        const extensions = await response.json();

        const grid = document.getElementById('extensionGrid');
        grid.innerHTML = '';

        extensions.forEach(extension => {
            const card = createExtensionCard(extension);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error searching extensions:', error);
        showError('Failed to search extensions. Please try again later.');
    }
});

// Handle search on enter key
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('searchButton').click();
    }
});