// Config & State
const CONFIG = {
    visitorPass: "0608",
    adminPass: "5341",
    storageKeyPhotos: "kouki_gallery_photos",
    storageKeyLang: "kouki_gallery_lang",
    storageKeyAuth: "kouki_gallery_auth"
};

const TEXTS = {
    ja: {
        welcomeTitle: "Kouki Galleryへようこそ",
        enterPass: "パスワードを入力してください",
        submit: "入室",
        incorrectPass: "パスワードが間違っています",
        adminLogin: "管理者ログイン",
        upload: "写真をアップロード",
        delete: "削除",
        logout: "ログアウト",
        galleryTitle: "写真集",
        noPhotos: "写真がありません。管理者が追加してください。",
        uploadSuccess: "アップロード完了！",
        uploadError: "画像の形式が無効か、サイズが大きすぎます（5MB制限）。",
        confirmDelete: "本当に削除しますか？"
    },
    en: {
        welcomeTitle: "Welcome to Kouki Gallery",
        enterPass: "Please enter password",
        submit: "Enter",
        incorrectPass: "Incorrect password",
        adminLogin: "Admin Login",
        upload: "Upload Photo",
        delete: "Delete",
        logout: "Logout",
        galleryTitle: "Photo Collection",
        noPhotos: "No photos yet. Admin needs to add some.",
        uploadSuccess: "Upload successful!",
        uploadError: "Invalid image format or file too large (Limit 5MB).",
        confirmDelete: "Are you sure you want to delete?"
    }
};

let currentLang = localStorage.getItem(CONFIG.storageKeyLang) || 'ja';

// DOM Elements
const elements = {
    langJa: document.getElementById('lang-ja'),
    langEn: document.getElementById('lang-en'),
    txtWelcome: document.getElementById('txt-welcome'),
    txtEnterPass: document.getElementById('txt-enter-pass'),
    btnSubmit: document.getElementById('btn-submit'),
    inputPass: document.getElementById('input-pass'),
    errorMsg: document.getElementById('error-msg'),
    galleryGrid: document.getElementById('gallery-grid'),
    uploadInput: document.getElementById('upload-input'),
    txtGalleryTitle: document.getElementById('txt-gallery-title'),
    btnLogout: document.getElementById('btn-logout'),
    btnUpload: document.getElementById('btn-upload') // Trigger for file input
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateLanguageUI();
    
    // Auth Check for Protected Pages
    const path = window.location.pathname;
    const isGallery = path.includes('gallery.html');
    const isDashboard = path.includes('dashboard.html');
    const auth = sessionStorage.getItem(CONFIG.storageKeyAuth);

    if (isGallery && auth !== 'visitor' && auth !== 'admin') {
        window.location.href = 'index.html';
    }
    if (isDashboard && auth !== 'admin') {
        window.location.href = 'admin.html'; // Redirect to admin login if trying to access dashboard directly
    }

    // Event Listeners
    if (elements.langJa) elements.langJa.addEventListener('click', () => setLang('ja'));
    if (elements.langEn) elements.langEn.addEventListener('click', () => setLang('en'));

    // Page Specific Init
    if (document.getElementById('login-page')) initLoginPage();
    if (document.getElementById('admin-login-page')) initAdminLoginPage();
    if (document.getElementById('gallery-page')) initGalleryPage();
    if (document.getElementById('dashboard-page')) initDashboardPage();
});

// -- Logic Functions --

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem(CONFIG.storageKeyLang, lang);
    updateLanguageUI();
}

function updateLanguageUI() {
    // Buttons state
    if (elements.langJa && elements.langEn) {
        if (currentLang === 'ja') {
            elements.langJa.classList.add('active');
            elements.langEn.classList.remove('active');
        } else {
            elements.langEn.classList.add('active');
            elements.langJa.classList.remove('active');
        }
    }

    // Text Content Update
    const t = TEXTS[currentLang];
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    
    // Using mapping for common IDs
    setText('txt-welcome', t.welcomeTitle);
    setText('txt-enter-pass', t.enterPass);
    setText('btn-submit', t.submit);
    setText('txt-gallery-title', t.galleryTitle);
    setText('btn-logout', t.logout);
    setText('btn-upload-label', t.upload); // Label for file input
    
    // Placeholders
    if (elements.inputPass) elements.inputPass.placeholder = "Password";
}

// -- Page Specific Init Functions --

function initLoginPage() {
    elements.btnSubmit.addEventListener('click', () => {
        const val = elements.inputPass.value;
        if (val === CONFIG.visitorPass) {
            sessionStorage.setItem(CONFIG.storageKeyAuth, 'visitor');
            window.location.href = 'gallery.html';
        } else {
            elements.errorMsg.textContent = TEXTS[currentLang].incorrectPass;
            elements.errorMsg.style.display = 'block';
        }
    });

    // Handle Enter Key
    elements.inputPass.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elements.btnSubmit.click();
    });
}

function initAdminLoginPage() {
    elements.btnSubmit.addEventListener('click', () => {
        const val = elements.inputPass.value;
        if (val === CONFIG.adminPass) {
            sessionStorage.setItem(CONFIG.storageKeyAuth, 'admin');
            window.location.href = 'dashboard.html';
        } else {
            elements.errorMsg.textContent = TEXTS[currentLang].incorrectPass;
            elements.errorMsg.style.display = 'block';
        }
    });
    
    elements.inputPass.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elements.btnSubmit.click();
    });
}

function initGalleryPage() {
    renderGallery(false); // false = not admin mode
    elements.btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem(CONFIG.storageKeyAuth);
        window.location.href = 'index.html';
    });
}

function initDashboardPage() {
    renderGallery(true); // true = admin mode
    
    elements.btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem(CONFIG.storageKeyAuth);
        window.location.href = 'index.html';
    });

    // File Upload Handler
    elements.uploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Size Limit (5MB for LocalStorage safety)
        if (file.size > 5 * 1024 * 1024) {
            alert(TEXTS[currentLang].uploadError);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = function() {
            const base64String = reader.result;
            savePhoto(base64String);
        }
        reader.readAsDataURL(file);
    });
}

// -- Photo Management --

function getPhotos() {
    const json = localStorage.getItem(CONFIG.storageKeyPhotos);
    return json ? JSON.parse(json) : [];
}

function savePhoto(base64) {
    const photos = getPhotos();
    const newPhoto = {
        id: Date.now(),
        src: base64,
        date: new Date().toISOString()
    };
    photos.unshift(newPhoto); // Add to beginning
    try {
        localStorage.setItem(CONFIG.storageKeyPhotos, JSON.stringify(photos));
        alert(TEXTS[currentLang].uploadSuccess);
        location.reload(); // Refresh to show new photo
    } catch (e) {
        alert("Storage Full! Cannot save more photos in LocalStorage.");
    }
}

function deletePhoto(id) {
    if (!confirm(TEXTS[currentLang].confirmDelete)) return;
    
    const photos = getPhotos();
    const newPhotos = photos.filter(p => p.id !== id);
    localStorage.setItem(CONFIG.storageKeyPhotos, JSON.stringify(newPhotos));
    location.reload();
}

function renderGallery(isAdmin) {
    const photos = getPhotos();
    const grid = elements.galleryGrid;
    grid.innerHTML = '';

    if (photos.length === 0) {
        grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1;">${TEXTS[currentLang].noPhotos}</p>`;
        return;
    }

    photos.forEach(photo => {
        const card = document.createElement('div');
        card.className = 'photo-card fade-in';
        
        let html = `<img src="${photo.src}" alt="Gallery Photo">`;
        
        if (isAdmin) {
            html += `<button class="delete-btn" onclick="deletePhoto(${photo.id})">🗑️</button>`;
        }
        
        card.innerHTML = html;
        grid.appendChild(card);
    });
}
