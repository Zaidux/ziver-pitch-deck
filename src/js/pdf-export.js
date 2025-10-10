// js/pdf-export.js - UPDATED VERSION
function initializePdfExport() {
    const exportBtn = document.getElementById('exportBtn');
    const exportModal = document.getElementById('exportModal');
    const exportOptions = document.querySelectorAll('.export-option');
    const closeModal = document.getElementById('closeModal');

    if (!exportBtn) {
        console.log('Export button not found');
        return;
    }

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
        option.addEventListener('click', async () => {
            const format = option.getAttribute('data-format');
            if (format === 'pdf') {
                await exportToPDF();
            } else if (format === 'png') {
                await exportToPNG();
            } else if (format === 'pptx') {
                alert('PowerPoint export requires server-side processing. Please use PDF export for now.');
            }
            if (exportModal) exportModal.classList.remove('active');
        });
    });
}

async function exportToPDF() {
    console.log('Starting PDF export...');
    
    // Check if jsPDF is available
    if (typeof jsPDF === 'undefined') {
        alert('PDF library not loaded. Please check your internet connection.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;

    if (totalSlides === 0) {
        alert('No slides found to export.');
        return;
    }

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(10, 10, 10, 0.95); color: var(--primary); padding: 20px 30px;
        border-radius: 12px; z-index: 10000; border: 1px solid var(--primary);
        font-family: Inter, sans-serif; font-weight: 600; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        display: flex; align-items: center; gap: 12px;
    `;
    loadingIndicator.innerHTML = `
        <div class="spinner-large"></div>
        <span>Generating PDF... 0/${totalSlides}</span>
    `;
    document.body.appendChild(loadingIndicator);

    try {
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < totalSlides; i++) {
            // Update loading indicator
            loadingIndicator.innerHTML = `
                <div class="spinner-large"></div>
                <span>Generating PDF... ${i + 1}/${totalSlides}</span>
            `;

            const slide = slides[i];
            
            // Store original styles
            const originalDisplay = slide.style.display;
            const originalPosition = slide.style.position;
            
            // Make slide visible for capture
            slide.style.display = 'block';
            slide.style.position = 'fixed';
            slide.style.left = '0';
            slide.style.top = '0';
            slide.style.zIndex = '9999';
            slide.style.background = '#0a0a0a';
            slide.style.width = '100vw';
            slide.style.height = '100vh';
            slide.style.opacity = '1';
            slide.style.transform = 'translateX(0)';

            // Force a reflow
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(slide, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#0a0a0a',
                logging: false,
                width: slide.scrollWidth,
                height: slide.scrollHeight
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.9);

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

            // Restore original styles
            slide.style.display = originalDisplay;
            slide.style.position = originalPosition;
            slide.style.background = '';
            slide.style.width = '';
            slide.style.height = '';
            slide.style.zIndex = '';
            slide.style.left = '';
            slide.style.top = '';
        }

        // Save the PDF
        pdf.save('ziver-pitch-deck.pdf');
        console.log('PDF export completed successfully');

    } catch (error) {
        console.error('Error during PDF export:', error);
        alert('An error occurred while generating the PDF. Please try again.');
    } finally {
        // Cleanup
        if (document.body.contains(loadingIndicator)) {
            document.body.removeChild(loadingIndicator);
        }
        
        // Make sure we're back on the current slide
        if (window.goToSlide && window.currentSlide !== undefined) {
            setTimeout(() => window.goToSlide(window.currentSlide), 100);
        }
    }
}

async function exportToPNG() {
    console.log('Starting PNG export...');
    
    const slides = document.querySelectorAll('.slide');
    const currentSlideIndex = window.currentSlide || 0;
    const slide = slides[currentSlideIndex];
    
    if (!slide) {
        alert('No active slide found.');
        return;
    }

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(10, 10, 10, 0.95); color: var(--primary); padding: 20px 30px;
        border-radius: 12px; z-index: 10000; border: 1px solid var(--primary);
        font-family: Inter, sans-serif; font-weight: 600;
        display: flex; align-items: center; gap: 12px;
    `;
    loadingIndicator.innerHTML = `
        <div class="spinner-large"></div>
        <span>Generating PNG...</span>
    `;
    document.body.appendChild(loadingIndicator);

    try {
        const canvas = await html2canvas(slide, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#0a0a0a',
            logging: false
        });

        const link = document.createElement('a');
        link.download = `ziver-slide-${currentSlideIndex + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        console.log('PNG export completed');
    } catch (error) {
        console.error('Error during PNG export:', error);
        alert('An error occurred while generating the PNG. Please try again.');
    } finally {
        if (document.body.contains(loadingIndicator)) {
            document.body.removeChild(loadingIndicator);
        }
    }
}

// Initialize when the document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePdfExport);
} else {
    initializePdfExport();
}