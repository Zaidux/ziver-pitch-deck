// js/auth.js - SIMPLIFIED WORKING VERSION
class SecretAuth {
    constructor() {
        this.currentUser = null;
        this.tapCount = 0;
        this.lastTapTime = 0;
        console.log('SecretAuth initializing...');
        this.initialize();
    }

    initialize() {
        this.checkAuth();
        this.createSecretDot();
        this.setupAuthUI();
        console.log('SecretAuth initialized');
    }

    createSecretDot() {
        // Remove existing dot if any
        const existingDot = document.getElementById('secretAuthDot');
        if (existingDot) {
            existingDot.remove();
        }

        const dot = document.createElement('div');
        dot.id = 'secretAuthDot';
        dot.innerHTML = '•';
        dot.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background: rgba(0, 230, 118, 0.2);
            color: #00e676;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10000;
            user-select: none;
            opacity: 0.8;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: 2px solid #00e676;
            box-shadow: 0 4px 15px rgba(0, 230, 118, 0.4);
        `;

        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleSecretTap();
        });

        dot.addEventListener('mouseenter', () => {
            dot.style.opacity = '1';
            dot.style.transform = 'scale(1.2)';
            dot.style.background = 'rgba(0, 230, 118, 0.3)';
        });

        dot.addEventListener('mouseleave', () => {
            dot.style.opacity = '0.8';
            dot.style.transform = 'scale(1)';
            dot.style.background = 'rgba(0, 230, 118, 0.2)';
        });

        // Add to body immediately
        document.body.appendChild(dot);
        console.log('Secret auth dot created - should be visible now');
    }

    handleSecretTap() {
        const now = Date.now();
        if (now - this.lastTapTime > 1000) {
            this.tapCount = 0;
        }

        this.tapCount++;
        this.lastTapTime = now;

        console.log(`Secret tap count: ${this.tapCount}`);

        // Visual feedback
        const dot = document.getElementById('secretAuthDot');
        if (dot) {
            dot.style.background = 'rgba(0, 230, 118, 0.5)';
            setTimeout(() => {
                dot.style.background = 'rgba(0, 230, 118, 0.2)';
            }, 200);
        }

        if (this.tapCount === 3) {
            this.showLoginModal();
            this.tapCount = 0;
        } else if (this.tapCount === 4) {
            this.showRegistrationModal();
            this.tapCount = 0;
        }

        // Reset after 2 seconds
        setTimeout(() => {
            this.tapCount = 0;
        }, 2000);
    }

    showLoginModal() {
        const email = prompt('🔐 Admin Login\n\nEnter your email:');
        if (email && email.trim()) {
            this.authenticateUser(email.trim(), 'login');
        }
    }

    showRegistrationModal() {
        const name = prompt('👤 Registration\n\nEnter your name:');
        if (name && name.trim()) {
            const email = prompt('Enter your email:');
            if (email && email.trim()) {
                this.authenticateUser(email.trim(), 'register', name.trim());
            }
        }
    }

    async authenticateUser(email, action, name = null) {
        try {
            console.log(`Authenticating: ${email}, action: ${action}`);

            if (action === 'login') {
                const users = JSON.parse(localStorage.getItem('pitchDeckUsers') || '[]');
                const user = users.find(u => u.email === email);

                if (user) {
                    this.currentUser = user;
                    localStorage.setItem('pitchDeckCurrentUser', JSON.stringify(user));
                    this.enableAdminFeatures();
                    alert('✅ Welcome back! Edit features enabled.');
                } else {
                    alert('❌ User not found. Tap the dot 4 times to register.');
                }
            } else if (action === 'register') {
                const users = JSON.parse(localStorage.getItem('pitchDeckUsers') || '[]');
                const newUser = {
                    id: Date.now(),
                    email: email,
                    name: name,
                    is_admin: users.length === 0,
                    created_at: new Date().toISOString()
                };

                users.push(newUser);
                localStorage.setItem('pitchDeckUsers', JSON.stringify(users));
                localStorage.setItem('pitchDeckCurrentUser', JSON.stringify(newUser));

                this.currentUser = newUser;
                this.enableAdminFeatures();
                alert(`✅ Registration successful! ${newUser.is_admin ? 'You are now an admin.' : 'Welcome!'}`);
            }

        } catch (error) {
            console.error('Auth error:', error);
            alert('❌ Authentication error. Please try again.');
        }
    }

    checkAuth() {
        try {
            const storedUser = localStorage.getItem('pitchDeckCurrentUser');
            if (storedUser) {
                this.currentUser = JSON.parse(storedUser);
                this.enableAdminFeatures();
                console.log('User authenticated:', this.currentUser.email);
            } else {
                this.disableAdminFeatures();
                console.log('No user authenticated');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.disableAdminFeatures();
        }
    }

    setupAuthUI() {
        if (!this.currentUser) {
            this.disableAdminFeatures();
        }
    }

    enableAdminFeatures() {
        console.log('Enabling admin features');
        
        const editToggle = document.getElementById('editToggle');
        if (editToggle) {
            editToggle.style.display = 'flex';
        }

        this.enableImageUpload();

        const dot = document.getElementById('secretAuthDot');
        if (dot) {
            dot.style.background = 'rgba(0, 230, 118, 0.4)';
        }
    }

    disableAdminFeatures() {
        console.log('Disabling admin features');
        
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
        const imageModal = document.getElementById('imageUploadModal');
        if (imageModal) {
            imageModal.classList.add('active');
        }
    }
}

// Initialize immediately
document.addEventListener('DOMContentLoaded', function() {
    new SecretAuth();
});