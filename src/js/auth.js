// js/auth.js - Simple authentication
class SimpleAuth {
    constructor() {
        this.currentUser = null;
        this.ADMIN_USER = 'zaidu'; // Change this to your username
        this.initialize();
    }

    initialize() {
        this.checkAuth();
        this.setupAuthUI();
    }

    checkAuth() {
        const storedUser = localStorage.getItem('pitchDeckUser');
        if (storedUser === this.ADMIN_USER) {
            this.currentUser = storedUser;
            this.enableEditFeatures();
        } else {
            this.disableEditFeatures();
        }
    }

    setupAuthUI() {
        // Add login button to header if not authenticated
        if (!this.currentUser) {
            this.addLoginButton();
        }
    }

    addLoginButton() {
        const header = document.querySelector('.header .controls');
        if (header && !document.getElementById('loginBtn')) {
            const loginBtn = document.createElement('button');
            loginBtn.id = 'loginBtn';
            loginBtn.className = 'btn btn-outline';
            loginBtn.textContent = '🔐 Login';
            loginBtn.addEventListener('click', () => this.showLoginModal());
            header.appendChild(loginBtn);
        }
    }

    showLoginModal() {
        const password = prompt('Enter admin password:');
        if (password === 'ziver2024') { // Change this password
            this.currentUser = this.ADMIN_USER;
            localStorage.setItem('pitchDeckUser', this.ADMIN_USER);
            this.enableEditFeatures();
            alert('Welcome back! Edit mode enabled.');
        } else {
            alert('Invalid password');
        }
    }

    enableEditFeatures() {
        // Show edit button
        const editToggle = document.getElementById('editToggle');
        if (editToggle) editToggle.style.display = 'flex';
        
        // Enable image upload features
        this.enableImageUpload();
        
        // Remove login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.remove();
    }

    disableEditFeatures() {
        const editToggle = document.getElementById('editToggle');
        if (editToggle) editToggle.style.display = 'none';
    }

    enableImageUpload() {
        // Add image upload button
        const header = document.querySelector('.header .controls');
        if (header && !document.getElementById('uploadImageBtn')) {
            const uploadBtn = document.createElement('button');
            uploadBtn.id = 'uploadImageBtn';
            uploadBtn.className = 'btn btn-outline';
            uploadBtn.innerHTML = '🖼️ Add Image';
            uploadBtn.addEventListener('click', () => this.showImageUpload());
            header.appendChild(uploadBtn);
        }
    }

    showImageUpload() {
        // Implementation for image upload modal
        console.log('Image upload feature enabled for admin');
        // You can expand this to show the image upload modal
    }
}

// Initialize auth
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SimpleAuth());
} else {
    new SimpleAuth();
}