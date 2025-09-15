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
    
    // Slide data
    const slidesData = [
        {
            type: 'title',
            title: 'Ziver: A New Era of DePIN & Social-Backed Finance',
            subtitle: 'AI That Understands, Finance That Rewards Trust',
            tagline: 'Powering a new economy where reputation is the new currency.',
            presenter: 'Presenter: Zaidu, Founder of Ziver'
        },
        {
            title: 'The Problem',
            visual: 'Split screen: AI black box vs. unrewarded engagement',
            sections: [
                {
                    title: 'The AI Hallucination & Reasoning Gap',
                    content: 'AI is often a "black box," and we can\'t trust its reasoning. It hallucinates, and there\'s no way to verify its logic.'
                },
                {
                    title: 'The Crypto Engagement Paradox',
                    content: 'While there\'s immense value in crypto, genuine, high-quality user engagement is rarely rewarded in a meaningful, transparent way.'
                }
            ]
        },
        // Add all other slides following this pattern
        // For brevity, I'm showing just the first two slides
    ];
    
    // Initialize slides
    function initSlides() {
        slidesContainer.innerHTML = '';
        
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
                slide.innerHTML = `
                    <div class="slide-content">
                        <h2 contenteditable="false">${slideData.title}</h2>
                        <div class="visual-placeholder">${slideData.visual}</div>
                        ${slideData.sections.map(section => `
                            <h3 contenteditable="false">${section.title}</h3>
                            <p contenteditable="false">${section.content}</p>
                        `).join('')}
                    </div>
                `;
            }
            
            slidesContainer.appendChild(slide);
        });
        
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
        }
    });
    
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
                el.style.borderBottom = '2px dashed var(--accent)';
                el.style.padding = '5px';
                el.style.borderRadius = '4px';
            } else {
                el.style.borderBottom = 'none';
                el.style.padding = '0';
            }
        });
        
        editToggle.textContent = editMode ? '✏️ Save Changes' : '✏️ Edit Mode';
    });
});
