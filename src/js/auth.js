// js/auth.js - FIXED VERSION WITH VISIBLE DOT
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
            top: 15px;
            right: 15px;
            width: 30px;
            height: 30px;
            background: rgba(0, 230, 118, 0.1);
            color: var(--primary);
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10000;
            user-select: none;
            opacity: 0.7;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: 1px solid var(--primary);
            box-shadow: 0 2px 10px rgba(0, 230, 118, 0.3);
        `;
        
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleSecretTap();
        });

        dot.addEventListener('mouseenter', () => {
            dot.style.opacity = '1';
            dot.style.transform = 'scale(1.1)';
            dot.style.background = 'rgba(0, 230, 118, 0.2)';
        });

        dot.addEventListener('mouseleave', () => {
            dot.style.opacity = '0.7';
            dot.style.transform = 'scale(1)';
            dot.style.background = 'rgba(0, 230, 118, 0.1)';
        });

        // Add to body
        document.body.appendChild(dot);
        console.log('Secret auth dot created and visible');
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
            dot.style.background = 'rgba(0, 230, 118, 0.4)';
            setTimeout(() => {
                dot.style.background = 'rgba(0, 230, 118, 0.1)';
            }, 200);
        }

        if (this.tapCount === 3) {
            this.showLoginModal();
        } else if (this.tapCount === 4) {
            this.showRegistrationModal();
            this.tapCount = 0; // Reset after registration
        }

        // Reset after 2 seconds
        setTimeout(() => {
            if (this.tapCount < 3) {
                this.tapCount = 0;
            }
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
            console.log(`Authenticating user: ${email}, action: ${action}`);
            
            // For demo purposes - you can replace this with actual API call
            if (action === 'login') {
                // Check if user exists in localStorage
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
                // Register new user
                const users = JSON.parse(localStorage.getItem('pitchDeckUsers') || '[]');
                const newUser = {
                    id: Date.now(),
                    email: email,
                    name: name,
                    is_admin: users.length === 0, // First user becomes admin
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
        
        // Show edit button
        const editToggle = document.getElementById('editToggle');
        if (editToggle) {
            editToggle.style.display = 'flex';
        }

        // Enable image upload features
        this.enableImageUpload();

        // Update dot color for admin
        const dot = document.getElementById('secretAuthDot');
        if (dot) {
            dot.style.background = 'rgba(0, 230, 118, 0.3)';
            dot.style.color = '#00e676';
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

        // Reset dot color
        const dot = document.getElementById('secretAuthDot');
        if (dot) {
            dot.style.background = 'rgba(0, 230, 118, 0.1)';
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

    logout() {
        this.currentUser = null;
        localStorage.removeItem('pitchDeckCurrentUser');
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