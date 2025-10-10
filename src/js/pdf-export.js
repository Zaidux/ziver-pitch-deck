// js/pdf-export.js - SIMPLIFIED WORKING VERSION
class PDFExporter {
    constructor() {
        console.log('PDFExporter initializing...');
        this.initialize();
    }

    initialize() {
        const exportBtn = document.getElementById('exportBtn');
        const exportOptions = document.querySelectorAll('.export-option');
        const closeModal = document.getElementById('closeModal');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.showExportModal();
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideExportModal();
            });
        }

        exportOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const format = e.currentTarget.getAttribute('data-format');
                this.handleExport(format);
            });
        });

        document.addEventListener('click', (e) => {
            const modal = document.getElementById('exportModal');
            if (e.target === modal) {
                this.hideExportModal();
            }
        });

        console.log('PDFExporter initialized');
    }

    showExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) modal.classList.add('active');
    }

    hideExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) modal.classList.remove('active');
    }

    async handleExport(format) {
        this.hideExportModal();
        
        switch(format) {
            case 'pdf':
                await this.exportToPDF();
                break;
            case 'png':
                await this.exportCurrentSlideToPNG();
                break;
            case 'pptx':
                alert('PowerPoint export coming soon! Using PDF for now.');
                await this.exportToPDF();
                break;
        }
    }

    async exportToPDF() {
        console.log('Starting PDF export...');
        
        // Check if jsPDF is available
        if (typeof jspdf === 'undefined') {
            alert('PDF library loading... Please wait and try again.');
            return;
        }

        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;

        if (totalSlides === 0) {
            alert('No slides found to export.');
            return;
        }

        const loadingIndicator = this.createLoadingIndicator('Preparing PDF...');
        document.body.appendChild(loadingIndicator);

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Store current state
            const currentSlide = window.currentSlide || 0;

            for (let i = 0; i < totalSlides; i++) {
                loadingIndicator.innerHTML = this.createLoadingHTML(`Capturing slide ${i + 1}/${totalSlides}`);
                
                const slide = slides[i];
                
                // Make slide temporarily visible
                const originalDisplay = slide.style.display;
                const originalOpacity = slide.style.opacity;
                const originalTransform = slide.style.transform;
                
                slide.style.display = 'block';
                slide.style.opacity = '1';
                slide.style.transform = 'translateX(0)';
                slide.style.position = 'fixed';
                slide.style.left = '0';
                slide.style.top = '0';
                slide.style.zIndex = '9999';
                slide.style.width = '100vw';
                slide.style.height = '100vh';
                slide.style.background = '#0a0a0a';

                // Wait for render
                await new Promise(resolve => setTimeout(resolve, 500));

                const canvas = await html2canvas(slide, {
                    scale: 1.5,
                    useCORS: true,
                    backgroundColor: '#0a0a0a',
                    logging: true,
                    width: slide.scrollWidth,
                    height: slide.scrollHeight,
                    windowWidth: slide.scrollWidth,
                    windowHeight: slide.scrollHeight
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.9);

                // Add page if not first slide
                if (i > 0) {
                    pdf.addPage();
                }

                // Calculate dimensions
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
                const imgWidthPdf = imgWidth * ratio;
                const imgHeightPdf = imgHeight * ratio;
                const x = (pageWidth - imgWidthPdf) / 2;
                const y = (pageHeight - imgHeightPdf) / 2;

                // Add to PDF
                pdf.addImage(imgData, 'JPEG', x, y, imgWidthPdf, imgHeightPdf);

                // Restore slide
                slide.style.display = originalDisplay;
                slide.style.opacity = originalOpacity;
                slide.style.transform = originalTransform;
                slide.style.position = '';
                slide.style.zIndex = '';
                slide.style.background = '';
            }

            // Save PDF
            pdf.save('ziver-pitch-deck.pdf');
            console.log('PDF export completed');

        } catch (error) {
            console.error('PDF export error:', error);
            alert('PDF export failed: ' + error.message);
        } finally {
            // Cleanup
            if (loadingIndicator && document.body.contains(loadingIndicator)) {
                document.body.removeChild(loadingIndicator);
            }
            
            // Return to current slide
            if (window.goToSlide && currentSlide !== undefined) {
                setTimeout(() => window.goToSlide(currentSlide), 500);
            }
        }
    }

    async exportCurrentSlideToPNG() {
        const slides = document.querySelectorAll('.slide');
        const currentSlideIndex = window.currentSlide || 0;
        const slide = slides[currentSlideIndex];
        
        if (!slide) {
            alert('No slide found to export.');
            return;
        }

        const loadingIndicator = this.createLoadingIndicator('Generating PNG...');
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

        } catch (error) {
            console.error('PNG export error:', error);
            alert('PNG export failed: ' + error.message);
        } finally {
            if (loadingIndicator && document.body.contains(loadingIndicator)) {
                document.body.removeChild(loadingIndicator);
            }
        }
    }

    createLoadingIndicator(text) {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(10, 10, 10, 0.95); color: #00e676; padding: 20px 30px;
            border-radius: 12px; z-index: 10000; border: 1px solid #00e676;
            font-family: Inter, sans-serif; font-weight: 600; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex; align-items: center; gap: 12px;
        `;
        indicator.innerHTML = this.createLoadingHTML(text);
        return indicator;
    }

    createLoadingHTML(text) {
        return `
            <div style="width: 24px; height: 24px; border: 3px solid #00e676; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></div>
            <span>${text}</span>
        `;
    }
}

// Initialize when ready
document.addEventListener('DOMContentLoaded', function() {
    new PDFExporter();
});