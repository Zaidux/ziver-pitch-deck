// js/script.js - UPDATED WITH AUTO-SAVE AND + BUTTONS
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
    let saveTimeout = null;

    // Initialize slides from database
    async function initSlides() {
        try {
            // Clear existing slides and nav items
            slidesContainer.innerHTML = '';
            if (navItemsContainer) {
                navItemsContainer.innerHTML = '';
            }

            // Try to load from database first
            let slidesData = [];
            try {
                const response = await fetch('/api/slides');
                if (response.ok) {
                    const dbSlides = await response.json();
                    if (dbSlides.length > 0) {
                        slidesData = dbSlides.map(slide => slide.content || slide);
                    } else {
                        // Initialize with default content if database is empty
                        slidesData = window.slidesData || [];
                        await fetch('/api/slides/initialize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ slidesData })
                        });
                    }
                }
            } catch (error) {
                console.log('Using default slides data');
                slidesData = window.slidesData || [];
            }

            // Create all slides
            slidesData.forEach((slideData, index) => {
                createSlideElement(slideData, index);
            });

            // Get reference to all slides and nav items
            slides = document.querySelectorAll('.slide');
            const navItems = document.querySelectorAll('.slide-nav-item');

            // Activate first slide
            goToSlide(0);

            console.log('Slides initialized successfully');

        } catch (error) {
            console.error('Error initializing slides:', error);
        }
    }

    function createSlideElement(slideData, index) {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.dataset.slide = index;
        slide.dataset.slideId = slideData.id || index;

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

            if (slideData.sections) {
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
            }

            // Create visual placeholder with + button
            const hasImage = slideData.image_url;
            const visualContent = hasImage ? 
                `<img src="${slideData.image_url}" alt="${slideData.visual}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-lg);">` :
                slideData.visual;

            slide.innerHTML = `
                <div class="slide-content">
                    <h2 contenteditable="false">${slideData.title}</h2>
                    <div class="visual-placeholder ${hasImage ? 'has-image' : ''}" data-slide-index="${index}">
                        ${visualContent}
                        <div class="image-upload-btn" data-slide-index="${index}">+</div>
                    </div>
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

    // Auto-save functionality
    function setupAutoSave() {
        const editableElements = document.querySelectorAll('[contenteditable="true"]');
        
        editableElements.forEach(element => {
            element.addEventListener('input', debounce(() => {
                saveSlideContent();
            }, 1000));

            element.addEventListener('blur', () => {
                saveSlideContent();
            });
        });
    }

    function debounce(func, wait) {
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(saveTimeout);
                func(...args);
            };
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(later, wait);
        };
    }

    async function saveSlideContent() {
        if (!editMode) return;

        const currentIndex = window.currentSlide;
        const slide = slides[currentIndex];
        if (!slide) return;

        try {
            const slideId = slide.dataset.slideId || currentIndex;
            const title = slide.querySelector('h2')?.textContent || slide.querySelector('h1')?.textContent || '';
            
            // Extract content based on slide type
            let content = {};
            if (slide.classList.contains('title-slide')) {
                content = {
                    type: 'title',
                    title: slide.querySelector('h1')?.textContent || '',
                    subtitle: slide.querySelector('h2')?.textContent || '',
                    tagline: slide.querySelector('p')?.textContent || ''
                };
            } else {
                const sections = [];
                const sectionElements = slide.querySelectorAll('h3');
                
                sectionElements.forEach(sectionEl => {
                    const section = {
                        title: sectionEl.textContent || ''
                    };
                    
                    const nextEl = sectionEl.nextElementSibling;
                    if (nextEl && nextEl.tagName === 'UL') {
                        section.list = Array.from(nextEl.querySelectorAll('li')).map(li => li.textContent);
                    } else if (nextEl && nextEl.tagName === 'P') {
                        section.content = nextEl.textContent;
                    }
                    
                    sections.push(section);
                });
                
                content = {
                    type: 'content',
                    title: title,
                    sections: sections,
                    visual: slide.querySelector('.visual-placeholder')?.textContent || ''
                };
            }

            const response = await fetch(`/api/slides/${slideId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title,
                    content: content
                })
            });

            if (response.ok) {
                console.log('Slide content saved');
            } else {
                console.error('Failed to save slide content');
            }
        } catch (error) {
            console.error('Error saving slide:', error);
        }
    }

    // Setup image upload buttons
    function setupImageUpload() {
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('image-upload-btn')) {
                const slideIndex = e.target.dataset.slideIndex;
                await showImageUploadForSlide(slideIndex);
            }
        });
    }

    async function showImageUploadForSlide(slideIndex) {
        const imageUrl = prompt('Enter image URL:');
        if (imageUrl && imageUrl.trim()) {
            await saveImageForSlide(slideIndex, imageUrl.trim());
        }
    }

    async function saveImageForSlide(slideIndex, imageUrl) {
        try {
            const slide = slides[slideIndex];
            const slideId = slide.dataset.slideId || slideIndex;

            const response = await fetch(`/api/slides/${slideId}/image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageUrl: imageUrl
                })
            });

            if (response.ok) {
                // Update the visual placeholder
                const visualPlaceholder = slide.querySelector('.visual-placeholder');
                visualPlaceholder.classList.add('has-image');
                visualPlaceholder.innerHTML = `
                    <img src="${imageUrl}" alt="Slide image" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-lg);">
                    <div class="image-upload-btn" data-slide-index="${slideIndex}">+</div>
                `;
                
                alert('Image saved successfully!');
            } else {
                alert('Failed to save image');
            }
        } catch (error) {
            console.error('Error saving image:', error);
            alert('Error saving image');
        }
    }

    // Initialize the slides
    initSlides().then(() => {
        setupImageUpload();
    });

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

    // Export options
    exportOptions.forEach(option => {
        option.addEventListener('click', () => {
            const format = option.getAttribute('data-format');
            if (format === 'pdf') {
                console.log('PDF export triggered');
            } else if (format === 'png') {
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

            // Setup auto-save when entering edit mode
            if (editMode) {
                setupAutoSave();
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
});