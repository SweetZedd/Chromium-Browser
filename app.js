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
                <button class="btn btn-primary mt-3 w-100" onclick="handleInstall(${extension.id})">
                    <i data-feather="download"></i>
                    Install Extension
                </button>
            </div>
        </div>
    `;

    // Re-initialize Feather icons for the new content
    feather.replace();
    return col;
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