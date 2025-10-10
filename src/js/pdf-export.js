// js/pdf-export.js - FIXED COORDINATES ISSUE
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
        if (typeof jspdf === 'undefined' || !window.jspdf) {
            alert('PDF library not loaded properly. Please refresh the page and try again.');
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
                
                // Store original state
                const originalState = {
                    display: slide.style.display,
                    opacity: slide.style.opacity,
                    transform: slide.style.transform,
                    position: slide.style.position,
                    zIndex: slide.style.zIndex,
                    left: slide.style.left,
                    top: slide.style.top,
                    width: slide.style.width,
                    height: slide.style.height,
                    background: slide.style.background
                };
                
                // Make slide temporarily visible for capture
                Object.assign(slide.style, {
                    display: 'block',
                    opacity: '1',
                    transform: 'translateX(0)',
                    position: 'fixed',
                    left: '0',
                    top: '0',
                    zIndex: '9999',
                    width: '100vw',
                    height: '100vh',
                    background: '#0a0a0a'
                });

                // Wait for render and ensure DOM updates
                await new Promise(resolve => {
                    setTimeout(resolve, 300);
                    slide.offsetHeight; // Force reflow
                });

                let canvas;
                try {
                    canvas = await html2canvas(slide, {
                        scale: 1.2, // Slightly lower scale for stability
                        useCORS: true,
                        backgroundColor: '#0a0a0a',
                        logging: true,
                        width: slide.scrollWidth,
                        height: slide.scrollHeight,
                        windowWidth: slide.scrollWidth,
                        windowHeight: slide.scrollHeight,
                        onclone: (clonedDoc, element) => {
                            // Ensure styles are preserved in clone
                            const clonedSlide = clonedDoc.querySelector('.slide[data-slide="' + i + '"]');
                            if (clonedSlide) {
                                clonedSlide.style.width = '100%';
                                clonedSlide.style.height = '100%';
                                clonedSlide.style.background = '#0a0a0a';
                            }
                        }
                    });
                } catch (canvasError) {
                    console.error('Canvas capture error:', canvasError);
                    throw new Error('Failed to capture slide ' + (i + 1));
                }

                // Validate canvas
                if (!canvas || canvas.width === 0 || canvas.height === 0) {
                    throw new Error('Empty canvas generated for slide ' + (i + 1));
                }

                const imgData = canvas.toDataURL('image/jpeg', 0.85);

                // Add page if not first slide
                if (i > 0) {
                    pdf.addPage();
                }

                // Calculate dimensions with safety checks
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                
                if (imgWidth <= 0 || imgHeight <= 0) {
                    throw new Error('Invalid image dimensions for slide ' + (i + 1));
                }

                const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
                const imgWidthPdf = imgWidth * ratio;
                const imgHeightPdf = imgHeight * ratio;
                
                // Ensure coordinates are valid numbers
                const x = Math.max(0, (pageWidth - imgWidthPdf) / 2);
                const y = Math.max(0, (pageHeight - imgHeightPdf) / 2);

                // Validate coordinates before adding to PDF
                if (isNaN(x) || isNaN(y) || isNaN(imgWidthPdf) || isNaN(imgHeightPdf)) {
                    throw new Error('Invalid coordinates calculated for PDF');
                }

                console.log(`Adding slide ${i + 1} to PDF:`, { x, y, width: imgWidthPdf, height: imgHeightPdf });

                // Add to PDF with error handling
                try {
                    pdf.addImage(imgData, 'JPEG', x, y, imgWidthPdf, imgHeightPdf);
                } catch (pdfError) {
                    console.error('PDF addImage error:', pdfError);
                    throw new Error('Failed to add slide ' + (i + 1) + ' to PDF');
                }

                // Restore slide to original state
                Object.assign(slide.style, originalState);
            }

            // Save PDF
            pdf.save('ziver-pitch-deck-' + new Date().getTime() + '.pdf');
            console.log('PDF export completed successfully');

        } catch (error) {
            console.error('PDF export error:', error);
            alert('PDF export failed: ' + error.message + '\n\nPlease try again in desktop mode.');
        } finally {
            // Cleanup - ensure all slides are restored
            slides.forEach(slide => {
                slide.style.display = '';
                slide.style.opacity = '';
                slide.style.transform = '';
                slide.style.position = '';
                slide.style.zIndex = '';
                slide.style.left = '';
                slide.style.top = '';
                slide.style.width = '';
                slide.style.height = '';
                slide.style.background = '';
            });
            
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
                logging: false,
                width: slide.scrollWidth,
                height: slide.scrollHeight
            });

            const link = document.createElement('a');
            link.download = `ziver-slide-${currentSlideIndex + 1}-${new Date().getTime()}.png`;
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