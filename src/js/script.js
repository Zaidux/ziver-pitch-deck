document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const slideNav = document.getElementById('slideNav');
    const toggleNav = document.getElementById('toggleNav');
    const slidesContainer = document.querySelector('.slides-container');
    const navItems = document.querySelectorAll('.slide-nav-item');
    const prevButton = document.getElementById('prevSlide');
    const nextButton = document.getElementById('nextSlide');
    const exportBtn = document.getElementById('exportBtn');
    const exportModal = document.getElementById('exportModal');
    const exportOptions = document.querySelectorAll('.export-option');
    const editToggle = document.getElementById('editToggle');
    
    let currentSlide = 0;
    let editMode = false;
    
    // Initialize slides
    function initSlides() {
        // Clear existing slides
        slidesContainer.innerHTML = '';
        
        // Create all slides
        for (let i = 0; i < 13; i++) {
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.dataset.slide = i;
            
            // Add content based on slide number
            if (i === 0) {
                slide.classList.add('title-slide');
                slide.innerHTML = `
                    <div class="slide-content">
                        <h1 contenteditable="false">Ziver: A New Era of DePIN & Social-Backed Finance</h1>
                        <h2 contenteditable="false">AI That Understands, Finance That Rewards Trust</h2>
                        <p contenteditable="false">Powering a new economy where reputation is the new currency.</p>
                        <p contenteditable="false">Presenter: Zaidu, Founder of Ziver</p>
                    </div>
                `;
            } else {
                // Add content for other slides
                slide.innerHTML = `
                    <div class="slide-content">
                        <h2 contenteditable="false">Slide ${i+1} Title</h2>
                        <div class="visual-placeholder">Visual content for slide ${i+1}</div>
                        <p contenteditable="false">Content for slide ${i+1} will go here.</p>
                    </div>
                `;
            }
            
            slidesContainer.appendChild(slide);
        }
        
        // Activate first slide
        document.querySelector('.slide').classList.add('active');
    }
    
    // Initialize the slides
    initSlides();
    const slides = document.querySelectorAll('.slide');
    
    // Toggle navigation
    toggleNav.addEventListener('click', () => {
        slideNav.classList.toggle('hidden');
    });
    
    // Navigate to slide
    function goToSlide(index) {
        if (index < 0) index = 0;
        if (index >= slides.length) index = slides.length - 1;
        
        slides[currentSlide].classList.remove('active');
        navItems[currentSlide].classList.remove('active');
        
        slides[index].classList.add('active');
        navItems[index].classList.add('active');
        
        currentSlide = index;
        
        // Update URL hash
        window.location.hash = `slide-${index + 1}`;
    }
    
    // Navigation items click
    navItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            goToSlide(index);
        });
    });
    
    // Previous and next buttons
    prevButton.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
    });
    
    nextButton.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToSlide(currentSlide - 1);
        } else if (e.key === 'ArrowRight') {
            goToSlide(currentSlide + 1);
        } else if (e.key === 'Escape') {
            exportModal.classList.remove('active');
        }
    });
    
    // Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);
    
    function handleSwipe() {
        const swipeThreshold = 50;
        
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe left - next slide
            goToSlide(currentSlide + 1);
        }
        
        if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe right - previous slide
            goToSlide(currentSlide - 1);
        }
    }
    
    // Export functionality
    exportBtn.addEventListener('click', () => {
        exportModal.classList.add('active');
    });
    
    exportOptions.forEach(option => {
        option.addEventListener('click', () => {
            const format = option.getAttribute('data-format');
            exportDeck(format);
            exportModal.classList.remove('active');
        });
    });
    
    // Close modal when clicking outside
    exportModal.addEventListener('click', (e) => {
        if (e.target === exportModal) {
            exportModal.classList.remove('active');
        }
    });
    
    // Export function
    function exportDeck(format) {
        switch(format) {
            case 'pdf':
                exportToPDF();
                break;
            case 'png':
                exportToPNG();
                break;
            case 'pptx':
                alert('PowerPoint export would require server-side processing. For now, you can use the PDF export.');
                break;
        }
    }
    
    function exportToPDF() {
        const element = document.querySelector('.slides-container');
        const opt = {
            margin: 10,
            filename: 'ziver-pitch-deck.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        
        html2pdf().set(opt).from(element).save();
    }
    
    function exportToPNG() {
        html2canvas(document.querySelector('.slides-container')).then(canvas => {
            const link = document.createElement('a');
            link.download = 'ziver-pitch-deck.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
    
    // Toggle edit mode
    editToggle.addEventListener('click', () => {
        editMode = !editMode;
        const editableElements = document.querySelectorAll('[contenteditable]');
        
        editableElements.forEach(el => {
            el.contentEditable = editMode;
            if (editMode) {
                el.style.borderBottom = '2px dashed var(--cyber-green)';
                el.style.padding = '5px';
                el.style.borderRadius = '4px';
                el.style.background = 'rgba(0, 255, 65, 0.05)';
            } else {
                el.style.borderBottom = 'none';
                el.style.padding = '0';
                el.style.background = 'transparent';
            }
        });
        
        editToggle.textContent = editMode ? '💾 Save Changes' : '✏️ Edit Mode';
        editToggle.classList.toggle('glow-text', editMode);
    });
    
    // Check URL for slide parameter
    function checkUrlForSlide() {
        const hash = window.location.hash;
        if (hash) {
            const slideNum = parseInt(hash.replace('#slide-', ''));
            if (!isNaN(slideNum) && slideNum >= 1 && slideNum <= slides.length) {
                goToSlide(slideNum - 1);
            }
        }
    }
    
    // Initialize based on URL
    checkUrlForSlide();
});