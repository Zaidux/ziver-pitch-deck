// js/auth.js - Enhanced Authentication with Secret Dot
class SecretAuth {
    constructor() {
        this.currentUser = null;
        this.tapCount = 0;
        this.lastTapTime = 0;
        this.initialize();
    }

    initialize() {
        this.checkAuth();
        this.createSecretDot();
        this.setupAuthUI();
    }

    createSecretDot() {
        const dot = document.createElement('div');
        dot.id = 'secretAuthDot';
        dot.innerHTML = '•';
        dot.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 20px;
            height: 20px;
            background: transparent;
            color: var(--text-muted);
            font-size: 24px;
            cursor: pointer;
            z-index: 1000;
            user-select: none;
            opacity: 0.3;
            transition: opacity 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleSecretTap();
        });

        dot.addEventListener('mouseenter', () => {
            dot.style.opacity = '0.6';
        });

        dot.addEventListener('mouseleave', () => {
            dot.style.opacity = '0.3';
        });

        document.body.appendChild(dot);
    }

    handleSecretTap() {
        const now = Date.now();
        if (now - this.lastTapTime > 1000) {
            this.tapCount = 0;
        }
        
        this.tapCount++;
        this.lastTapTime = now;

        if (this.tapCount === 3) {
            this.showLoginModal();
        } else if (this.tapCount === 4) {
            this.showRegistrationModal();
        }

        // Reset after 2 seconds
        setTimeout(() => {
            this.tapCount = 0;
        }, 2000);
    }

    showLoginModal() {
        const email = prompt('🔐 Admin Login\n\nEnter your email:');
        if (email) {
            this.authenticateUser(email, 'login');
        }
    }

    showRegistrationModal() {
        const name = prompt('👤 Registration\n\nEnter your name:');
        if (name) {
            const email = prompt('Enter your email:');
            if (email) {
                this.authenticateUser(email, 'register', name);
            }
        }
    }

    async authenticateUser(email, action, name = null) {
        try {
            const endpoint = action === 'login' ? '/api/auth/login' : '/api/auth/register';
            const body = action === 'login' ? { email } : { email, name };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (result.success) {
                this.currentUser = result.user;
                localStorage.setItem('pitchDeckUser', JSON.stringify(result.user));
                
                if (result.isAdmin) {
                    this.enableAdminFeatures();
                    alert('✅ Welcome back, Admin! Edit features enabled.');
                } else {
                    alert('✅ Welcome! Basic access granted.');
                }
            } else {
                alert('❌ Authentication failed. Please try again.');
            }
        } catch (error) {
            console.error('Auth error:', error);
            alert('❌ Network error. Please check your connection.');
        }
    }

    checkAuth() {
        const storedUser = localStorage.getItem('pitchDeckUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            this.enableAdminFeatures();
        } else {
            this.disableAdminFeatures();
        }
    }

    setupAuthUI() {
        if (!this.currentUser) {
            this.disableAdminFeatures();
        }
    }

    enableAdminFeatures() {
        // Show edit button
        const editToggle = document.getElementById('editToggle');
        if (editToggle) {
            editToggle.style.display = 'flex';
        }

        // Enable image upload features
        this.enableImageUpload();
    }

    disableAdminFeatures() {
        const editToggle = document.getElementById('editToggle');
        if (editToggle) {
            editToggle.style.display = 'none';
        }

        const uploadBtn = document.getElementById('uploadImageBtn');
        if (uploadBtn) {
            uploadBtn.remove();
        }
    }

    enableImageUpload() {
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
        const imageModal = document.getElementById('imageUploadModal');
        if (imageModal) {
            imageModal.classList.add('active');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('pitchDeckUser');
        this.disableAdminFeatures();
        alert('Logged out successfully.');
    }
}

// Initialize auth
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SecretAuth());
} else {
    new SecretAuth();
}