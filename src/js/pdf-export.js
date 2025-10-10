// js/pdf-export.js - FIXED VERSION
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

        // Close modal when clicking outside
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
                await this.exportToPNG();
                break;
            case 'pptx':
                alert('PowerPoint export coming soon! Using PDF for now.');
                await this.exportToPDF();
                break;
        }
    }

    async exportToPDF() {
        console.log('Starting PDF export...');
        
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

        // Show loading
        const loadingIndicator = this.createLoadingIndicator('Generating PDF...');
        document.body.appendChild(loadingIndicator);

        try {
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Store original states
            const originalStates = this.storeOriginalStates(slides);

            for (let i = 0; i < totalSlides; i++) {
                loadingIndicator.innerHTML = this.createLoadingHTML(`Generating PDF... ${i + 1}/${totalSlides}`);
                
                const slide = slides[i];
                await this.prepareSlideForCapture(slide);
                
                const canvas = await html2canvas(slide, {
                    scale: 1.5,
                    useCORS: true,
                    backgroundColor: '#0a0a0a',
                    logging: false,
                    width: slide.scrollWidth,
                    height: slide.scrollHeight
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.9);

                if (i > 0) pdf.addPage();
                
                const dimensions = this.calculateImageDimensions(canvas, pageWidth, pageHeight);
                pdf.addImage(imgData, 'JPEG', dimensions.x, dimensions.y, dimensions.width, dimensions.height);

                this.restoreSlideState(slide, originalStates[i]);
            }

            pdf.save('ziver-pitch-deck.pdf');
            console.log('PDF export completed successfully');

        } catch (error) {
            console.error('PDF export error:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            this.cleanup(loadingIndicator, slides);
        }
    }

    async exportToPNG() {
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
            alert('Error generating PNG. Please try again.');
        } finally {
            document.body.removeChild(loadingIndicator);
        }
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

    storeOriginalStates(slides) {
        return Array.from(slides).map(slide => ({
            display: slide.style.display,
            position: slide.style.position,
            opacity: slide.style.opacity,
            transform: slide.style.transform
        }));
    }

    async prepareSlideForCapture(slide) {
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
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    calculateImageDimensions(canvas, pageWidth, pageHeight) {
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
        
        return {
            width: imgWidth * ratio,
            height: imgHeight * ratio,
            x: (pageWidth - imgWidth * ratio) / 2,
            y: (pageHeight - imgHeight * ratio) / 2
        };
    }

    restoreSlideState(slide, originalState) {
        Object.keys(originalState).forEach(property => {
            slide.style[property] = originalState[property];
        });
    }

    cleanup(loadingIndicator, slides) {
        if (loadingIndicator && document.body.contains(loadingIndicator)) {
            document.body.removeChild(loadingIndicator);
        }
        
        // Ensure we're back on the current slide
        if (window.goToSlide && window.currentSlide !== undefined) {
            setTimeout(() => window.goToSlide(window.currentSlide), 100);
        }
    }
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PDFExporter());
} else {
    new PDFExporter();
}