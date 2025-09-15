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
    let slides = [];

    // Initialize slides using the external slidesData
    function initSlides() {
        // Clear existing slides
        slidesContainer.innerHTML = '';

        // Create all slides from the slidesData
        slidesData.forEach((slideData, index) => {
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.dataset.slide = index;
            
            if (slideData.type === 'title') {
                slide.classList.add('title-slide');
                slide.innerHTML = `
                    <div class="slide-content">
                        <h1 contenteditable="false">${slideData.title}</h1>
                        <h2 contenteditable="false">${slideData.subtitle}</h2>
                        <p contenteditable="false">${slideData.tagline}</p>
                        <p contenteditable="false">${slideData.presenter}</p>
                    </div>
                `;
            } else {
                let contentHTML = '';
                
                slideData.sections.forEach(section => {
                    if (section.list && section.list.length > 0) {
                        contentHTML += `
                            <h3 contenteditable="false">${section.title}</h3>
                            <ul>
                                ${section.list.map(item => `<li contenteditable="false">${item}</li>`).join('')}
                            </ul>
                        `;
                    } else if (section.content) {
                        contentHTML += `
                            <h3 contenteditable="false">${section.title}</h3>
                            <p contenteditable="false">${section.content}</p>
                        `;
                    } else {
                        contentHTML += `
                            <h3 contenteditable="false">${section.title}</h3>
                        `;
                    }
                });
                
                slide.innerHTML = `
                    <div class="slide-content">
                        <h2 contenteditable="false">${slideData.title}</h2>
                        <div class="visual-placeholder">${slideData.visual}</div>
                        ${contentHTML}
                    </div>
                `;
            }
            
            slidesContainer.appendChild(slide);
        });

        // Get reference to all slides
        slides = document.querySelectorAll('.slide');
        
        // Activate first slide
        goToSlide(0);
    }

    // Navigate to slide
    function goToSlide(index) {
        if (index < 0) index = 0;
        if (index >= slides.length) index = slides.length - 1;

        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Remove active class from all nav items
        navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Show selected slide
        slides[index].classList.add('active');
        navItems[index].classList.add('active');

        currentSlide = index;

        // Update URL hash
        window.location.hash = `slide-${index + 1}`;
        
        console.log(`Navigated to slide ${index + 1}`);
    }

    // Initialize the slides
    initSlides();

    // Toggle navigation
    toggleNav.addEventListener('click', () => {
        slideNav.classList.toggle('hidden');
    });

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
        if (editToggle.classList) {
            editToggle.classList.toggle('glow-text', editMode);
        }
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
    
    // Debugging: Log when script is loaded
    console.log('Script loaded successfully');
    console.log(`Total slides: ${slides.length}`);
});