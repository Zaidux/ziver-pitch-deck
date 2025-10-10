// js/pdf-export.js
function initializePdfExport() {
    const exportBtn = document.getElementById('exportBtn');
    const exportModal = document.getElementById('exportModal');
    const exportOptions = document.querySelectorAll('.export-option');
    const closeModal = document.getElementById('closeModal');

    if (!exportBtn) return;

    // Open the export modal
    exportBtn.addEventListener('click', () => {
        if (exportModal) exportModal.classList.add('active');
    });

    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            exportModal.classList.remove('active');
        });
    }

    // Handle export option clicks
    exportOptions.forEach(option => {
        option.addEventListener('click', () => {
            const format = option.getAttribute('data-format');
            if (format === 'pdf') {
                exportToPDF();
            } else if (format === 'png') {
                exportToPNG();
            } else if (format === 'pptx') {
                alert('PowerPoint export requires server-side processing. Please use PDF export for now.');
            }
            if (exportModal) exportModal.classList.remove('active');
        });
    });
}

async function exportToPDF() {
    console.log('Starting PDF export...');
    
    // Store current state
    const originalSlide = window.currentSlide || 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(10, 10, 10, 0.95); color: var(--primary); padding: 20px 30px;
        border-radius: 12px; z-index: 10000; border: 1px solid var(--primary);
        font-family: Inter, sans-serif; font-weight: 600; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    loadingIndicator.innerHTML = `<div style="display: flex; align-items: center; gap: 12px;">
        <div class="spinner-large"></div>
        <span>Generating PDF... 0/${totalSlides}</span>
    </div>`;
    document.body.appendChild(loadingIndicator);

    try {
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < totalSlides; i++) {
            // Update loading indicator
            loadingIndicator.innerHTML = `<div style="display: flex; align-items: center; gap: 12px;">
                <div class="spinner-large"></div>
                <span>Generating PDF... ${i + 1}/${totalSlides}</span>
            </div>`;

            const slide = slides[i];
            
            // Make slide visible for capture
            slide.style.display = 'block';
            slide.style.opacity = '1';
            slide.style.transform = 'translateX(0)';
            slide.style.position = 'fixed';
            slide.style.left = '0';
            slide.style.top = '0';
            slide.style.zIndex = '9999';
            slide.style.background = '#0a0a0a';
            slide.style.width = '100vw';
            slide.style.height = '100vh';

            // Wait for slide to render
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(slide, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0a0a0a',
                logging: false,
                width: slide.scrollWidth,
                height: slide.scrollHeight,
                windowWidth: slide.scrollWidth,
                windowHeight: slide.scrollHeight
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            // Add new page for every slide after the first
            if (i > 0) {
                pdf.addPage();
            }

            // Calculate dimensions to fit the page
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
            const imgWidthPdf = imgWidth * ratio;
            const imgHeightPdf = imgHeight * ratio;
            const x = (pageWidth - imgWidthPdf) / 2;
            const y = (pageHeight - imgHeightPdf) / 2;

            pdf.addImage(imgData, 'JPEG', x, y, imgWidthPdf, imgHeightPdf);

            // Hide slide after capture
            slide.style.display = '';
            slide.style.position = '';
            slide.style.background = '';
            slide.style.width = '';
            slide.style.height = '';
        }

        // Save the PDF
        pdf.save('ziver-pitch-deck.pdf');
        console.log('PDF export completed successfully');

    } catch (error) {
        console.error('Error during PDF export:', error);
        alert('An error occurred while generating the PDF. Please try again.');
    } finally {
        // Cleanup
        document.body.removeChild(loadingIndicator);
        
        // Restore all slides to their original state
        const slides = document.querySelectorAll('.slide');
        slides.forEach((slide, index) => {
            slide.style.display = '';
            slide.style.position = '';
            slide.style.opacity = '';
            slide.style.transform = '';
            slide.style.background = '';
            slide.style.width = '';
            slide.style.height = '';
            slide.style.zIndex = '';
            slide.classList.remove('active');
        });
        
        // Go back to the original slide
        if (window.goToSlide) {
            window.goToSlide(originalSlide);
        }
    }
}

async function exportToPNG() {
    console.log('Starting PNG export...');
    
    const slide = document.querySelector('.slide.active');
    if (!slide) return;

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(10, 10, 10, 0.95); color: var(--primary); padding: 20px 30px;
        border-radius: 12px; z-index: 10000; border: 1px solid var(--primary);
        font-family: Inter, sans-serif; font-weight: 600;
    `;
    loadingIndicator.innerHTML = `<div style="display: flex; align-items: center; gap: 12px;">
        <div class="spinner-large"></div>
        <span>Generating PNG...</span>
    </div>`;
    document.body.appendChild(loadingIndicator);

    try {
        const canvas = await html2canvas(slide, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#0a0a0a',
            logging: false
        });

        const link = document.createElement('a');
        link.download = `ziver-slide-${window.currentSlide + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        console.log('PNG export completed');
    } catch (error) {
        console.error('Error during PNG export:', error);
        alert('An error occurred while generating the PNG. Please try again.');
    } finally {
        document.body.removeChild(loadingIndicator);
    }
}

// Initialize when the document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePdfExport);
} else {
    initializePdfExport();
}