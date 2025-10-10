// js/script.js - UPDATED VERSION WITH GLOBAL VARIABLES
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const slideNav = document.getElementById('slideNav');
    const toggleNav = document.getElementById('toggleNav');
    const slidesContainer = document.querySelector('.slides-container');
    const navItemsContainer = document.querySelector('.slide-nav-items');
    const prevButton = document.getElementById('prevSlide');
    const nextButton = document.getElementById('nextSlide');
    const exportBtn = document.getElementById('exportBtn');
    const exportModal = document.getElementById('exportModal');
    const exportOptions = document.querySelectorAll('.export-option');
    const editToggle = document.getElementById('editToggle');
    const closeModal = document.getElementById('closeModal');

    // Make these global for pdf-export.js
    window.currentSlide = 0;
    let editMode = false;
    let slides = [];

    // Initialize slides using the external slidesData from content.js
    function initSlides() {
        // Clear existing slides and nav items
        slidesContainer.innerHTML = '';
        if (navItemsContainer) {
            navItemsContainer.innerHTML = '';
        }

        // Create all slides from the slidesData (now in content.js)
        slidesData.forEach((slideData, index) => {
            // Create slide element
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
                        ${slideData.presenter ? `<p contenteditable="false">${slideData.presenter}</p>` : ''}
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

            // Create navigation item
            if (navItemsContainer) {
                const navItem = document.createElement('div');
                navItem.className = 'slide-nav-item';
                navItem.textContent = slideData.title;
                navItem.addEventListener('click', () => goToSlide(index));
                navItemsContainer.appendChild(navItem);
            }
        });

        // Get reference to all slides and nav items
        slides = document.querySelectorAll('.slide');
        const navItems = document.querySelectorAll('.slide-nav-item');

        // Activate first slide
        goToSlide(0);
    }

    // Navigate to slide - MAKE THIS GLOBAL
    window.goToSlide = function(index) {
        if (index < 0) index = 0;
        if (index >= slides.length) index = slides.length - 1;

        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });

        // Remove active class from all nav items
        const navItems = document.querySelectorAll('.slide-nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Show selected slide
        if (slides[index]) {
            slides[index].classList.add('active');
        }

        // Activate corresponding nav item
        if (navItems[index]) {
            navItems[index].classList.add('active');
        }

        window.currentSlide = index;

        // Update URL hash
        window.location.hash = `slide-${index + 1}`;
    }

    // Initialize the slides
    initSlides();

    // Toggle navigation
    if (toggleNav) {
        toggleNav.addEventListener('click', () => {
            if (slideNav) {
                slideNav.classList.toggle('hidden');
            }
        });
    }

    // Previous and next buttons
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            window.goToSlide(window.currentSlide - 1);
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            window.goToSlide(window.currentSlide + 1);
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            window.goToSlide(window.currentSlide - 1);
        } else if (e.key === 'ArrowRight') {
            window.goToSlide(window.currentSlide + 1);
        } else if (e.key === 'Escape') {
            if (exportModal) exportModal.classList.remove('active');
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
            window.goToSlide(window.currentSlide + 1);
        }

        if (touchEndX > touchStartX + swipeThreshold) {
            window.goToSlide(window.currentSlide - 1);
        }
    }

    // Export functionality
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (exportModal) exportModal.classList.add('active');
        });
    }

    // Close modal when clicking outside or close button
    if (exportModal) {
        exportModal.addEventListener('click', (e) => {
            if (e.target === exportModal) {
                exportModal.classList.remove('active');
            }
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (exportModal) exportModal.classList.remove('active');
        });
    }

    // Export options - REMOVE the basic PDF function since we have pdf-export.js
    exportOptions.forEach(option => {
        option.addEventListener('click', () => {
            const format = option.getAttribute('data-format');
            if (format === 'pdf') {
                // This will be handled by pdf-export.js
                console.log('PDF export triggered');
            } else if (format === 'png') {
                // This will be handled by pdf-export.js
                console.log('PNG export triggered');
            } else {
                alert(`${format.toUpperCase()} export would require additional processing. For now, please use the PDF export.`);
            }
            if (exportModal) exportModal.classList.remove('active');
        });
    });

    // Toggle edit mode
    if (editToggle) {
        editToggle.addEventListener('click', () => {
            editMode = !editMode;
            const editableElements = document.querySelectorAll('[contenteditable]');

            editableElements.forEach(el => {
                el.contentEditable = editMode;
                if (editMode) {
                    el.style.borderBottom = '2px dashed var(--primary)';
                    el.style.padding = '5px';
                    el.style.borderRadius = '4px';
                    el.style.background = 'rgba(0, 230, 118, 0.05)';
                } else {
                    el.style.borderBottom = 'none';
                    el.style.padding = '0';
                    el.style.background = 'transparent';
                }
            });

            editToggle.textContent = editMode ? '💾 Save Changes' : '✏️ Edit Mode';
            if (editToggle.classList) {
                editToggle.classList.toggle('active', editMode);
            }
        });
    }

    // Check URL for slide parameter
    function checkUrlForSlide() {
        const hash = window.location.hash;
        if (hash) {
            const slideNum = parseInt(hash.replace('#slide-', ''));
            if (!isNaN(slideNum) && slideNum >= 1 && slideNum <= slides.length) {
                window.goToSlide(slideNum - 1);
            }
        }
    }

    // Initialize based on URL
    checkUrlForSlide();

    console.log('Ziver Pitch Deck initialized successfully');
    console.log(`Total slides: ${slides.length}`);
});