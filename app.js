// Initialize Feather icons
document.addEventListener('DOMContentLoaded', () => {
    feather.replace();
    loadExtensions();
});

// Sample extension data
const extensions = [
    {
        id: 1,
        name: "Privacy Guardian",
        description: "Enhanced privacy protection and tracker blocking",
        category: "Security",
        icon: "shield",
        rating: 4.5,
        users: "100K+"
    },
    {
        id: 2,
        name: "Tab Manager Pro",
        description: "Efficient tab organization and management",
        category: "Productivity",
        icon: "layers",
        rating: 4.8,
        users: "50K+"
    },
    {
        id: 3,
        name: "Dev Tools Plus",
        description: "Advanced developer tools and debugging features",
        category: "Development",
        icon: "code",
        rating: 4.7,
        users: "75K+"
    }
    // Add more sample extensions as needed
];

// Load extensions into the grid
function loadExtensions(category = 'All Extensions') {
    const grid = document.getElementById('extensionGrid');
    grid.innerHTML = '';

    const filteredExtensions = category === 'All Extensions' 
        ? extensions 
        : extensions.filter(ext => ext.category === category);

    filteredExtensions.forEach(extension => {
        const card = createExtensionCard(extension);
        grid.appendChild(card);
    });
}

// Create extension card element
function createExtensionCard(extension) {
    const col = document.createElement('div');
    col.className = 'col-md-6';

    col.innerHTML = `
        <div class="card extension-card">
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
    // In a real implementation, this would handle the installation process
    alert('Please note: Direct extension installation requires proper authorization. Please visit the official Chrome Web Store to install this extension.');
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
document.getElementById('searchButton').addEventListener('click', () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const grid = document.getElementById('extensionGrid');
    grid.innerHTML = '';

    const filteredExtensions = extensions.filter(ext => 
        ext.name.toLowerCase().includes(searchTerm) || 
        ext.description.toLowerCase().includes(searchTerm)
    );

    filteredExtensions.forEach(extension => {
        const card = createExtensionCard(extension);
        grid.appendChild(card);
    });
});

// Handle search on enter key
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('searchButton').click();
    }
});
