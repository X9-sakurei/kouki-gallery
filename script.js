import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// Initialize Firebase
if (location.protocol === 'file:') {
    alert("Error: You are opening this file directly (file://). Firebase requires a web server (http:// or https://) to work. PLease host the file or run a local server.");
}

if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
    alert("Error: Firebase is not configured. Please open 'firebase-config.js' and paste your API keys.");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Config & State
const CONFIG = {
    visitorPass: "0608",
    adminPass: "5341",
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
        uploadError: "画像の処理に失敗しました。",
        confirmDelete: "本当に削除しますか？",
        storageWarning: "写真データはクラウド（Firebase）に保存されます。"
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
        uploadError: "Failed to process image.",
        confirmDelete: "Are you sure you want to delete?",
        storageWarning: "Photos are stored in the cloud (Firebase)."
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
    btnUpload: document.getElementById('btn-upload')
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
        window.location.href = 'admin.html';
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
    if (elements.langJa && elements.langEn) {
        if (currentLang === 'ja') {
            elements.langJa.classList.add('active');
            elements.langEn.classList.remove('active');
        } else {
            elements.langEn.classList.add('active');
            elements.langJa.classList.remove('active');
        }
    }

    const t = TEXTS[currentLang];
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setText('txt-welcome', t.welcomeTitle);
    setText('txt-enter-pass', t.enterPass);
    setText('btn-submit', t.submit);
    setText('txt-gallery-title', t.galleryTitle);
    setText('btn-logout', t.logout);
    setText('btn-upload-label', t.upload);
    setText('txt-storage-warning', t.storageWarning);

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
    renderGallery(false);
    elements.btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem(CONFIG.storageKeyAuth);
        window.location.href = 'index.html';
    });
}

function initDashboardPage() {
    renderGallery(true);

    elements.btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem(CONFIG.storageKeyAuth);
        window.location.href = 'index.html';
    });

    elements.uploadInput.addEventListener('change', async function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const btnLabel = document.getElementById('btn-upload-label');
        const originalLabel = btnLabel.textContent;
        btnLabel.textContent = "Compressing...";
        elements.btnUpload.disabled = true;

        try {
            // 1. Compress
            const compressedBase64 = await compressImage(file, 800, 0.6);

            // 2. Upload to Firebase Storage
            btnLabel.textContent = "Uploading...";
            const storageRef = ref(storage, 'photos/' + Date.now() + '.jpg');
            await uploadString(storageRef, compressedBase64, 'data_url');
            const downloadURL = await getDownloadURL(storageRef);

            // 3. Save Metadata to Firestore
            await addDoc(collection(db, "photos"), {
                url: downloadURL,
                date: new Date().toISOString(),
                createdAt: Date.now()
            });

            alert(TEXTS[currentLang].uploadSuccess);
            // No need to reload, onSnapshot will handle UI update

        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Check console for details.");
        } finally {
            btnLabel.textContent = originalLabel;
            elements.btnUpload.disabled = false;
        }
    });
}

// -- Photo Management (Firebase) --

function deletePhoto(id, url) { // Firestore Doc ID and Image URL needed
    if (!confirm(TEXTS[currentLang].confirmDelete)) return;

    // Delete from Firestore
    deleteDoc(doc(db, "photos", id)).then(() => {
        // Try to delete from Storage (best effort)
        // Extract path from URL roughly or store storage path in DB. 
        // For simplicity, we assume we can create a ref from the URL if it's standard firebase storage
        try {
            const fileRef = ref(storage, url);
            deleteObject(fileRef).catch(e => console.log("Storage delete error", e));
        } catch (e) { console.log(e); }
    }).catch(e => {
        console.error("Delete failed: ", e);
        alert("Delete failed");
    });
}

function renderGallery(isAdmin) {
    const grid = elements.galleryGrid;

    // Real-time listener
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        grid.innerHTML = '';

        if (snapshot.empty) {
            grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1;">${TEXTS[currentLang].noPhotos}</p>`;
            return;
        }

        snapshot.forEach((doc) => {
            const photo = doc.data();
            const card = document.createElement('div');
            card.className = 'photo-card fade-in';

            let html = `<img src="${photo.url}" alt="Gallery Photo">`;

            if (isAdmin) {
                // Pass doc.id and photo.url to delete
                html += `<button class="delete-btn" data-id="${doc.id}" data-url="${photo.url}">🗑️</button>`;
            }

            card.innerHTML = html;
            grid.appendChild(card);
        });

        // Attach event listeners for dynamic buttons
        if (isAdmin) {
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Use currentTarget to ensure we get the button, not the icon inside
                    const id = e.currentTarget.dataset.id;
                    const url = e.currentTarget.dataset.url;
                    deletePhoto(id, url);
                });
            });
        }
    }, (error) => {
        console.error("Error getting photos: ", error);
        if (error.code === 'permission-denied') {
            grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: red;">Permission Denied. Check Firestore Rules.</p>`;
        } else if (error.code === 'unavailable') {
            grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1; color: red;">Network Error. Check internet connection.</p>`;
        }
    });
}

// -- Helper Functions --

function compressImage(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}
