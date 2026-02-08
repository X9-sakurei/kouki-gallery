// Configuration
const CONFIG = {
    SITE_PASS: '0608',
    ADMIN_PASS: '5341',
    STORAGE_KEY: 'photo_gallery_db'
};

// State Management
let photos = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || [];

// Utils
function savePhotos() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(photos));
}

// Authentication Logic
function checkSitePassword() {
    const input = document.getElementById('site-pass-input').value;
    const error = document.getElementById('site-error');
    
    if (input === CONFIG.SITE_PASS) {
        sessionStorage.setItem('site_auth', 'true');
        showMainGallery();
    } else {
        error.style.display = 'block';
        error.textContent = 'パスワードが違います';
    }
}

function checkAdminPassword() {
    const input = document.getElementById('admin-pass-input').value;
    const error = document.getElementById('admin-error');
    
    if (input === CONFIG.ADMIN_PASS) {
        sessionStorage.setItem('admin_auth', 'true');
        showAdminDashboard();
    } else {
        error.style.display = 'block';
        error.textContent = '管理者パスワードが違います';
    }
}

// Rendering
function renderGallery() {
    const container = document.getElementById('gallery-items');
    if (!container) return;
    
    container.innerHTML = photos.length > 0 
        ? photos.map(photo => `
            <div class="photo-card" onclick="openLightbox('${photo.id}')">
                <img src="${photo.data}" alt="Photo">
                <div class="photo-overlay">
                    <p>${new Date(photo.date).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('')
        : '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">まだ写真がありません</p>';
}

function renderAdminItems() {
    const container = document.getElementById('admin-items');
    if (!container) return;
    
    container.innerHTML = photos.map(photo => `
        <div class="admin-item">
            <img src="${photo.data}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
            <button class="delete-btn" onclick="deletePhoto('${photo.id}')">削除</button>
        </div>
    `).join('');
}

// Actions
async function handleUpload(event) {
    const files = event.target.files;
    if (!files.length) return;

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const newPhoto = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                data: e.target.result,
                date: new Date().toISOString()
            };
            photos.unshift(newPhoto);
            savePhotos();
            renderAdminItems();
        };
        reader.readAsDataURL(file);
    }
}

function deletePhoto(id) {
    if (confirm('この写真を削除してもよろしいですか？')) {
        photos = photos.filter(p => p.id !== id);
        savePhotos();
        renderAdminItems();
    }
}

// Page Transitions
function showMainGallery() {
    document.getElementById('landing-screen').classList.add('hidden');
    document.getElementById('gallery-screen').classList.remove('hidden');
    renderGallery();
}

function showAdminDashboard() {
    document.getElementById('admin-login-screen').classList.add('hidden');
    document.getElementById('admin-dashboard-screen').classList.remove('hidden');
    renderAdminItems();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if deep linked to admin
    if (window.location.pathname.includes('admin.html')) {
        if (sessionStorage.getItem('admin_auth') === 'true') {
            showAdminDashboard();
        }
    } else {
        if (sessionStorage.getItem('site_auth') === 'true') {
            showMainGallery();
        }
    }
});
