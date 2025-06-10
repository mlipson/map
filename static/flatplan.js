/**
 * Flatplan - Magazine Layout Planning Tool
 *
 * This module handles core functionality for the Flatplan application including:
 * - Page management and numbering
 * - Layout data extraction and serialization
 * - Export functionality (JSON, PDF, JPEG)
 * - UI interactions and event handling
 * - Drag-and-drop functionality via Sortable.js
 */

// ===================================================
// SECTION 1: CORE PAGE MANAGEMENT
// ===================================================

/**
 * Updates page numbers based on their current order in the DOM
 * Called after drag operations to maintain sequential numbering
 */
function updatePageNumbers() {
  const boxes = document.querySelectorAll('.spread-container .box');
  let visibleIndex = 0;

  boxes.forEach((box) => {
    if (box.id === 'page-0') return; // skip placeholder
    visibleIndex += 1;

    // Update the data attribute for tracking or export
    box.setAttribute('data-page-number', visibleIndex);

    // Update the page number label
    const pageNumEl = box.querySelector('.page-number');
    if (pageNumEl) {
      pageNumEl.textContent = visibleIndex;
      pageNumEl.classList.remove('even', 'odd');
      pageNumEl.classList.add(visibleIndex % 2 === 0 ? 'even' : 'odd');
    }
  });
}

/**
 * Extracts the current layout as a JSON structure from the DOM
 * Used for saving and exporting
 * @returns {Array} Array of page objects with properties
 */
function getCurrentLayoutAsJSON() {
  console.log('getCurrentLayoutAsJSON() called');
  const boxes = document.querySelectorAll('.spread-container .box');
  const layout = [];
  
  console.log(`Found ${boxes.length} page boxes to process`);

  boxes.forEach(box => {
    const id = box.id;
    if (id === "page-0") return; // skip placeholder

    // Get fractional units data from mixed pages (new template system)
    let fractionalUnits = [];
    if (box.classList.contains('mixed')) {
      const fractionalAdsData = box.getAttribute('data-fractional-ads');
      const templateId = box.getAttribute('data-mixed-page-layout-id');
      
      console.log(`Processing mixed page ${id}:`, {
        hasFractionalData: !!fractionalAdsData,
        hasTemplateId: !!templateId,
        fractionalAdsData: fractionalAdsData,
        templateId: templateId
      });
      
      if (fractionalAdsData) {
        try {
          fractionalUnits = JSON.parse(fractionalAdsData);
          console.log('Parsed fractional units:', fractionalUnits);
        } catch (e) {
          console.error('Error parsing fractional units data:', e);
        }
      } else {
        console.warn('No fractional-ads data found on mixed page element');
      }
    }

    // Determine page type using class presence
    let pageType = 'unknown';
    if (box.classList.contains('edit')) pageType = 'edit';
    else if (box.classList.contains('ad')) pageType = 'ad';
    else if (box.classList.contains('mixed')) pageType = 'mixed';
    else if (box.classList.contains('placeholder')) pageType = 'placeholder';

    // Get page name - for fixed page types, use fixed values
    // For other pages, read from the DOM element
    let name;
    if (pageType === 'mixed') {
      name = 'Fractional';
    } else if (pageType === 'placeholder') {
      name = 'Open';
    } else {
      name = box.querySelector('.name')?.textContent?.trim() || '';
    }

    // Get section - for fixed page types, use fixed values
    // For other pages, read from the DOM element
    let section;
    if (pageType === 'mixed') {
      section = 'Mixed';
    } else if (pageType === 'placeholder') {
      section = 'Placeholder';
    } else {
      section = box.querySelector('.section')?.textContent?.trim() || '';
    }

    // Create the page object
    const pageData = {
      name: name,
      section: section,
      page_number: parseInt(box.getAttribute('data-page-number'), 10) || 0,
      type: pageType,
      form_break: box.hasAttribute('data-form-break'),
      fractional_units: fractionalUnits,
      mixed_page_template_id: box.getAttribute('data-mixed-page-layout-id') || null
    };
    
    // Debug mixed pages
    if (pageType === 'mixed') {
      console.log('Exporting mixed page data:', pageData);
    }
    
    layout.push(pageData);
  });

  return layout;
}

// ===================================================
// SECTION 2: FILE EXPORT UTILITIES
// ===================================================

/**
 * Helper function to download data as a JSON file
 * @param {Object} data - The data to download as JSON
 * @param {String} filename - The name of the file (without extension)
 */
function downloadJSON(data, filename) {
  try {
    // Convert the data to a JSON string with pretty formatting
    const jsonStr = JSON.stringify(data, null, 2);

    // Create a data URI
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(jsonStr)}`;

    // Create a temporary anchor element
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `${filename}.json`);

    // Append to the document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading JSON:', error);
    showNotification('Error generating JSON file. Please try again.', 'error', true);
  }
}

/**
 * Shows a notification message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 * @param {boolean} requireConfirmation - Whether to show a modal dialog that requires user confirmation
 */
function showNotification(message, type = 'info', requireConfirmation = false) {
  if (requireConfirmation) {
    // Use the traditional alert for confirmation-required notifications
    alert(message);
    return;
  }

  // For non-blocking notifications, create a toast-style message
  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 left-4 px-4 py-2 rounded-md shadow-lg text-white ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    'bg-indigo-500'
  }`;
  notification.textContent = message;

  // Add to document
  document.body.appendChild(notification);

  // Remove after timeout
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Gets a filename for exports based on publication and issue name
 * @param {string} extension - The file extension (without dot)
 * @returns {string} Formatted filename
 */
function getExportFilename(extension) {
  const publicationName = document.querySelector('.text-xl.font-bold')?.textContent || 'flatplan';
  const issueName = document.querySelector('.text-indigo-100.text-sm')?.textContent || 'export';
  return `${publicationName}-${issueName}.${extension}`.replace(/\s+/g, '-').toLowerCase();
}

/**
 * Creates and shows a loading indicator during export operations
 * @param {string} message - Message to display in the loading indicator
 * @returns {HTMLElement} The created loading indicator element
 */
function showLoadingIndicator(message) {
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  loadingIndicator.innerHTML = `<div class="bg-white p-4 rounded-md shadow-lg"><p class="text-gray-800">${message}</p></div>`;
  document.body.appendChild(loadingIndicator);
  return loadingIndicator;
}

/**
 * Exports the current layout as a JPEG image
 */
function exportAsJPEG() {
  // Use html2canvas to capture the spread container
  const spreadContainer = document.querySelector('.spread-container');

  if (!spreadContainer) {
    showNotification('No layout found to export', 'error', true);
    return;
  }

  // Show loading indicator
  const loadingIndicator = showLoadingIndicator('Generating image...');

  // Use html2canvas to capture the content
  html2canvas(spreadContainer, {
    backgroundColor: '#ffffff',
    scale: 2, // Higher quality
    logging: false,
    useCORS: true
  }).then(canvas => {
    try {
      // Convert canvas to data URL
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);

      // Create download link
      const link = document.createElement('a');
      link.download = getExportFilename('jpg');
      link.href = dataURL;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification('JPEG exported successfully', 'success');
    } catch (error) {
      console.error('Error in JPEG export process:', error);
      showNotification('Error generating JPEG', 'error', true);
    } finally {
      // Remove loading indicator
      document.body.removeChild(loadingIndicator);
    }
  }).catch(error => {
    console.error('Error generating JPEG:', error);
    showNotification('Error generating JPEG. Please try again.', 'error', true);
    document.body.removeChild(loadingIndicator);
  });
}

/**
 * Exports the current layout as a PDF document
 */
function exportAsPDF() {
  // Use html2canvas and jsPDF
  const spreadContainer = document.querySelector('.spread-container');

  if (!spreadContainer) {
    showNotification('No layout found to export', 'error');
    return;
  }

  // Show loading indicator
  const loadingIndicator = showLoadingIndicator('Generating PDF...');

  // Use html2canvas to capture the content
  html2canvas(spreadContainer, {
    backgroundColor: '#ffffff',
    scale: 2, // Higher quality
    logging: false,
    useCORS: true
  }).then(canvas => {
    try {
      // Initialize PDF document - use landscape orientation which works better for flatplan layouts
      const { jsPDF } = window.jspdf;
      if (!jsPDF) {
        throw new Error('jsPDF library not found');
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Get the filename
      const filename = getExportFilename('pdf');

      // Add the canvas as an image to the PDF
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasRatio = canvas.height / canvas.width;

      // Calculate dimensions to fit within the PDF
      let imgWidth = pdfWidth;
      let imgHeight = imgWidth * canvasRatio;

      // If image height exceeds page height, scale down
      if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = imgHeight / canvasRatio;
      }

      // Center the image on the page
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      // Add the image to the PDF
      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);

      // Add metadata to the PDF
      pdf.setProperties({
        title: `${document.querySelector('.text-xl.font-bold')?.textContent || 'Flatplan'} - ${document.querySelector('.text-indigo-100.text-sm')?.textContent || 'Export'} Layout`,
        subject: 'Magazine Layout',
        author: 'Flatplan App',
        creator: 'Flatplan App',
        creationDate: new Date()
      });

      // Generate the PDF and trigger download
      pdf.save(filename);

      showNotification('PDF exported successfully', 'success');
    } catch (error) {
      console.error('Error in PDF export process:', error);
      showNotification('Error generating PDF', 'error', true);
    } finally {
      // Remove loading indicator
      document.body.removeChild(loadingIndicator);
    }
  }).catch(error => {
    console.error('Error generating PDF:', error);
    showNotification('Error generating PDF. Please try again.', 'error', true);
    document.body.removeChild(loadingIndicator);
  });
}

// ===================================================
// SECTION 3: EVENT LISTENERS AND INITIALIZATION
// ===================================================

/**
 * Initializes the menu functionality
 */
function initializeMenu() {
  console.log("Menu functionality loading...");

  // Elements
  const menuButton = document.getElementById('menu-button');
  const dropdownMenu = document.getElementById('dropdown-menu');

  if (!menuButton || !dropdownMenu) {
    console.warn("Menu elements not found", {
      menuButton: !!menuButton,
      dropdownMenu: !!dropdownMenu
    });
    return;
  }

  // Toggle dropdown menu
  menuButton.addEventListener('click', function(e) {
    console.log("Menu button clicked");
    e.stopPropagation();

    // Toggle visibility
    if (dropdownMenu.style.display === 'block') {
      dropdownMenu.style.display = 'none';
    } else {
      // Set dropdown position and styling
      dropdownMenu.style.display = 'block';
      dropdownMenu.style.position = 'absolute';
      dropdownMenu.style.zIndex = '1000';
      dropdownMenu.style.right = '0';
      dropdownMenu.style.top = '100%';
      dropdownMenu.style.backgroundColor = 'white';
    }
  });

  // Close dropdown when clicking outside
  window.addEventListener('click', function(event) {
    if (!event.target.matches('#menu-button') &&
        !menuButton.contains(event.target) &&
        !dropdownMenu.contains(event.target)) {
      dropdownMenu.style.display = 'none';
    }
  });
}

/**
 * Initializes the export functionality
 */
function initializeExportOptions() {
  // JSON Export
  const downloadJsonBtn = document.getElementById('download-json-btn');
  if (downloadJsonBtn) {
    downloadJsonBtn.addEventListener('click', function() {
      const layout = getCurrentLayoutAsJSON();
      const layoutId = document.getElementById('layout-id')?.value || 'export';
      downloadJSON(layout, `flatplan-${layoutId}`);
    });
  }

  // PDF Export
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', exportAsPDF);
  }

  // JPEG Export
  const downloadJpegBtn = document.getElementById('download-jpeg-btn');
  if (downloadJpegBtn) {
    downloadJpegBtn.addEventListener('click', exportAsJPEG);
  }
}

/**
 * Initializes the layout saving functionality
 */
function initializeSaveFunction() {
  const saveBtn = document.getElementById('save-layout-btn');
  const layoutId = document.getElementById('layout-id')?.value;

  if (saveBtn && layoutId) {
    saveBtn.addEventListener('click', () => {
      const layout = getCurrentLayoutAsJSON();

      // Show loading indicator
      const loadingIndicator = showLoadingIndicator('Saving layout...');

      fetch(`/layout/${layoutId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify(layout)
      })
      .then(res => {
        // Remove loading indicator
        document.body.removeChild(loadingIndicator);

        if (res.ok) {
          showNotification('Layout saved successfully!', 'success', true);
        } else {
          showNotification('Failed to save layout.', 'error', true);
          console.error('Save failed with status:', res.status);
        }
      })
      .catch(error => {
        document.body.removeChild(loadingIndicator);
        showNotification('Error saving layout.', 'error', true);
        console.error('Save error:', error);
      });
    });
  }
}

/**
 * Initializes the share functionality
 */
function initializeShareFunction() {
  const shareBtn = document.getElementById('share-btn');

  if (shareBtn) {
    shareBtn.addEventListener('click', function() {
      const layoutId = document.getElementById('layout-id')?.value;

      if (layoutId) {
        // Redirect to the share layout page with the layout ID
        window.location.href = `/share/${layoutId}`;
      } else {
        showNotification('Cannot share: Layout ID not found.', 'error', true);
      }
    });
  }
}

/**
 * Initializes Sortable.js for drag-and-drop functionality
 * Also ensures the spread-container is ready for interactions
 */
function initializeSortable() {
  // Find the sortable container
  const sortableContainer = document.querySelector('.spread-container');

  // Only initialize if the container exists
  if (sortableContainer) {
    if (typeof Sortable === 'undefined') {
      console.error('Sortable library not loaded');
      return;
    }

    Sortable.create(sortableContainer, {
      animation: 150,
      ghostClass: 'drag-ghost',
      filter: "#page-0",  // Prevent interaction with placeholder
      preventOnFilter: false,
      onEnd: function() {
        updatePageNumbers();
      }
    });

    // Initial page numbering
    updatePageNumbers();
  } else {
    console.error('Spread container not found - layout may not function properly');
  }
}

// Initialize everything once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("Initializing Flatplan JS...");

  // Initialize core functionality
  initializeSaveFunction();
  initializeMenu();
  initializeExportOptions();
  initializeShareFunction();

  // Initialize Sortable here to ensure the DOM is fully loaded
  initializeSortable();
});

// Remove the duplicate initialization outside DOMContentLoaded
// since we're now properly initializing it inside the event handler
