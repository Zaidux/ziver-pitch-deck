// js/script.js - UPDATED WITH FILE UPLOAD
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
                        // Use default content if database is empty
                        slidesData = window.slidesData || [];
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
        slide.dataset.slideOrder = index;

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
                    <div class="visual-placeholder ${hasImage ? 'has-image' : ''}" data-slide-order="${index}">
                        ${visualContent}
                        <div class="image-upload-btn" data-slide-order="${index}">
                            <span>+</span>
                            <input type="file" accept="image/*" style="display: none;">
                        </div>
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
            const slideOrder = slide.dataset.slideOrder || currentIndex;
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

            const response = await fetch(`/api/slides/${slideOrder}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title,
                    content: content
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('Slide content saved successfully');
            } else {
                console.error('Failed to save slide content:', result.error);
            }
        } catch (error) {
            console.error('Error saving slide:', error);
        }
    }

    // Setup image upload buttons
    function setupImageUpload() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('image-upload-btn') || e.target.closest('.image-upload-btn')) {
                const uploadBtn = e.target.classList.contains('image-upload-btn') ? e.target : e.target.closest('.image-upload-btn');
                const fileInput = uploadBtn.querySelector('input[type="file"]');
                fileInput?.click();
            }
        });

        // Handle file selection
        document.addEventListener('change', async (e) => {
            if (e.target.type === 'file' && e.target.files.length > 0) {
                const file = e.target.files[0];
                const slideOrder = e.target.closest('.image-upload-btn')?.dataset.slideOrder;
                
                if (slideOrder !== undefined && file) {
                    await uploadImageForSlide(slideOrder, file);
                }
                
                // Reset file input
                e.target.value = '';
            }
        });
    }

    async function uploadImageForSlide(slideOrder, file) {
        const loadingIndicator = createLoadingIndicator('Uploading image...');
        document.body.appendChild(loadingIndicator);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                await saveImageForSlide(slideOrder, result.imageUrl);
            } else {
                alert('File upload failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            if (loadingIndicator && document.body.contains(loadingIndicator)) {
                document.body.removeChild(loadingIndicator);
            }
        }
    }

    async function saveImageForSlide(slideOrder, imageUrl) {
        try {
            const response = await fetch(`/api/slides/${slideOrder}/image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageUrl: imageUrl
                })
            });

            const result = await response.json();

            if (result.success) {
                // Update the visual placeholder
                const slide = slides[slideOrder];
                const visualPlaceholder = slide.querySelector('.visual-placeholder');
                visualPlaceholder.classList.add('has-image');
                visualPlaceholder.innerHTML = `
                    <img src="${imageUrl}" alt="Slide image" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-lg);">
                    <div class="image-upload-btn" data-slide-order="${slideOrder}">
                        <span>+</span>
                        <input type="file" accept="image/*" style="display: none;">
                    </div>
                `;
                
                console.log('Image saved successfully');
            } else {
                alert('Failed to save image: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving image:', error);
            alert('Error saving image: ' + error.message);
        }
    }

    function createLoadingIndicator(text) {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(10, 10, 10, 0.95); color: #00e676; padding: 20px 30px;
            border-radius: 12px; z-index: 10000; border: 1px solid #00e676;
            font-family: Inter, sans-serif; font-weight: 600; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex; align-items: center; gap: 12px;
        `;
        indicator.innerHTML = `
            <div style="width: 24px; height: 24px; border: 3px solid #00e676; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></div>
            <span>${text}</span>
        `;
        return indicator;
    }

    // Initialize the slides
    initSlides().then(() => {
        setupImageUpload();
    });

    // ... rest of your existing code (navigation, export, etc.) remains the same ...
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