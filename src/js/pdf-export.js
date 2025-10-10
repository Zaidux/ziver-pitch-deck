// js/pdf-export.js - COMPLETELY REWORKED VERSION
class PDFExporter {
    constructor() {
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
                await this.exportToPPTX();
                break;
        }
    }

    async exportToPDF() {
        console.log('Starting PDF export...');
        
        if (typeof html2canvas === 'undefined') {
            alert('Export libraries not loaded. Please refresh the page.');
            return;
        }

        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;

        if (totalSlides === 0) {
            alert('No slides found to export.');
            return;
        }

        const loadingIndicator = this.createLoadingIndicator('Preparing PDF export...');
        document.body.appendChild(loadingIndicator);

        try {
            // Load jsPDF if not available
            if (typeof jsPDF === 'undefined') {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Store current slide and show all slides temporarily
            const currentSlide = window.currentSlide || 0;
            const originalStates = this.storeOriginalStates(slides);

            // Show all slides for capture
            slides.forEach(slide => {
                slide.style.display = 'block';
                slide.style.position = 'fixed';
                slide.style.left = '0';
                slide.style.top = '0';
                slide.style.width = '100vw';
                slide.style.height = '100vh';
                slide.style.zIndex = '-9999';
                slide.style.opacity = '0';
                slide.style.pointerEvents = 'none';
            });

            for (let i = 0; i < totalSlides; i++) {
                loadingIndicator.innerHTML = this.createLoadingHTML(`Capturing slide ${i + 1}/${totalSlides}`);
                
                const slide = slides[i];
                
                // Make current slide visible for capture
                slide.style.zIndex = '9999';
                slide.style.opacity = '1';
                
                // Wait for slide to render
                await new Promise(resolve => setTimeout(resolve, 300));

                const canvas = await html2canvas(slide, {
                    scale: 2, // Higher quality
                    useCORS: true,
                    backgroundColor: '#0a0a0a',
                    logging: true,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    windowWidth: window.innerWidth,
                    windowHeight: window.innerHeight,
                    scrollX: 0,
                    scrollY: 0,
                    onclone: (clonedDoc, element) => {
                        // Ensure all styles are applied in the clone
                        const clonedSlide = clonedDoc.querySelector('.slide[data-slide="' + i + '"]');
                        if (clonedSlide) {
                            clonedSlide.style.width = '100%';
                            clonedSlide.style.height = '100%';
                            clonedSlide.style.background = '#0a0a0a';
                        }
                    }
                });

                // Hide slide after capture
                slide.style.zIndex = '-9999';
                slide.style.opacity = '0';

                const imgData = canvas.toDataURL('image/jpeg', 0.95);

                // Add new page for every slide after the first
                if (i > 0) {
                    pdf.addPage();
                }

                // Calculate dimensions to fit the page perfectly
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const pageRatio = pageWidth / pageHeight;
                const imgRatio = imgWidth / imgHeight;

                let finalWidth, finalHeight, x, y;

                if (imgRatio > pageRatio) {
                    // Image is wider than page
                    finalWidth = pageWidth;
                    finalHeight = pageWidth / imgRatio;
                    x = 0;
                    y = (pageHeight - finalHeight) / 2;
                } else {
                    // Image is taller than page
                    finalHeight = pageHeight;
                    finalWidth = pageHeight * imgRatio;
                    x = (pageWidth - finalWidth) / 2;
                    y = 0;
                }

                // Add image to PDF with proper coordinates
                pdf.addImage({
                    imageData: imgData,
                    format: 'JPEG',
                    x: x,
                    y: y,
                    width: finalWidth,
                    height: finalHeight
                });

                console.log(`Slide ${i + 1} added to PDF`);
            }

            // Save PDF
            pdf.save('ziver-pitch-deck.pdf');
            console.log('PDF export completed successfully');

        } catch (error) {
            console.error('PDF export error:', error);
            alert('Error generating PDF: ' + error.message);
        } finally {
            // Cleanup
            this.restoreOriginalStates(slides);
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
            // Store original state
            const originalDisplay = slide.style.display;
            const originalPosition = slide.style.position;
            
            // Make slide visible for capture
            slide.style.display = 'block';
            slide.style.position = 'fixed';
            slide.style.left = '0';
            slide.style.top = '0';
            slide.style.width = '100vw';
            slide.style.height = '100vh';
            slide.style.zIndex = '9999';
            
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(slide, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0a0a0a',
                logging: false,
                width: window.innerWidth,
                height: window.innerHeight
            });

            const link = document.createElement('a');
            link.download = `ziver-slide-${currentSlideIndex + 1}-${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Restore state
            slide.style.display = originalDisplay;
            slide.style.position = originalPosition;
            slide.style.zIndex = '';

        } catch (error) {
            console.error('PNG export error:', error);
            alert('Error generating PNG: ' + error.message);
        } finally {
            if (loadingIndicator && document.body.contains(loadingIndicator)) {
                document.body.removeChild(loadingIndicator);
            }
        }
    }

    async exportToPPTX() {
        alert('PowerPoint export will be available soon. For now, please use the PDF export which works great for presentations!');
    }

    async loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    storeOriginalStates(slides) {
        return Array.from(slides).map(slide => ({
            display: slide.style.display,
            position: slide.style.position,
            opacity: slide.style.opacity,
            transform: slide.style.transform,
            zIndex: slide.style.zIndex,
            left: slide.style.left,
            top: slide.style.top,
            width: slide.style.width,
            height: slide.style.height,
            pointerEvents: slide.style.pointerEvents
        }));
    }

    restoreOriginalStates(slides) {
        slides.forEach((slide, index) => {
            slide.style.display = '';
            slide.style.position = '';
            slide.style.opacity = '';
            slide.style.transform = '';
            slide.style.zIndex = '';
            slide.style.left = '';
            slide.style.top = '';
            slide.style.width = '';
            slide.style.height = '';
            slide.style.pointerEvents = '';
        });
    }

    createLoadingIndicator(text) {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(10, 10, 10, 0.95); color: var(--primary); padding: 20px 30px;
            border-radius: 12px; z-index: 10000; border: 1px solid var(--primary);
            font-family: Inter, sans-serif; font-weight: 600; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex; align-items: center; gap: 12px;
        `;
        indicator.innerHTML = this.createLoadingHTML(text);
        return indicator;
    }

    createLoadingHTML(text) {
        return `
            <div class="spinner-large"></div>
            <span>${text}</span>
        `;
    }
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PDFExporter());
} else {
    new PDFExporter();
}