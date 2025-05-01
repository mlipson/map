/**
 * Flatplan application JavaScript
 * Handles page management, drag-and-drop, menu interactions, and exports
 */

// ===== Core Page Functions =====

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
  const boxes = document.querySelectorAll('.spread-container .box');
  const layout = [];

  boxes.forEach(box => {
    const id = box.id;
    if (id === "page-0") return; // skip placeholder

    // Get fractional ads data if available
    let fractionalAds = [];
    if (box.classList.contains('mixed')) {
      const fractionalAdsData = box.getAttribute('data-fractional-ads');
      if (fractionalAdsData) {
        try {
          fractionalAds = JSON.parse(fractionalAdsData);
        } catch (e) {
          console.error('Error parsing fractional ads data:', e);
        }
      }
    }

    layout.push({
      name: box.querySelector('.name')?.textContent,
      section: box.querySelector('.section')?.textContent,
      page_number: parseInt(box.getAttribute('data-page-number'), 10),
      type: box.classList.contains('edit') ? 'edit' :
            box.classList.contains('ad') ? 'ad' :
            box.classList.contains('mixed') ? 'mixed' :  // Add mixed type
            box.classList.contains('placeholder') ? 'placeholder' : 'unknown',
      form_break: box.hasAttribute('data-form-break'),
      fractional_ads: fractionalAds  // Add fractional ads data
    });
  });

  return layout;
}

/**
 * Helper function to download JSON data
 * @param {Object} data - The data to download as JSON
 * @param {String} filename - The name of the file
 */
function downloadJSON(data, filename) {
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
}



/**
 * Exports the current layout as a JPEG image
 */
function exportAsJPEG() {
  // Use html2canvas to capture the spread container
  const spreadContainer = document.querySelector('.spread-container');

  if (!spreadContainer) {
    alert('No layout found to export');
    return;
  }

  // Show loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  loadingIndicator.innerHTML = '<div class="bg-white p-4 rounded-md shadow-lg"><p class="text-gray-800">Generating image...</p></div>';
  document.body.appendChild(loadingIndicator);

  // Use html2canvas to capture the content
  html2canvas(spreadContainer, {
    backgroundColor: '#ffffff',
    scale: 2, // Higher quality
    logging: false,
    useCORS: true
  }).then(canvas => {
    // Convert canvas to data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.9);

    // Create download link
    const link = document.createElement('a');
    const publicationName = document.querySelector('.text-xl.font-bold')?.textContent || 'flatplan';
    const issueName = document.querySelector('.text-indigo-100.text-sm')?.textContent || 'export';
    const filename = `${publicationName}-${issueName}.jpg`.replace(/\s+/g, '-').toLowerCase();

    link.download = filename;
    link.href = dataURL;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Remove loading indicator
    document.body.removeChild(loadingIndicator);
  }).catch(error => {
    console.error('Error generating JPEG:', error);
    alert('Error generating JPEG. Please try again.');
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
    alert('No layout found to export');
    return;
  }

  // Show loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  loadingIndicator.innerHTML = '<div class="bg-white p-4 rounded-md shadow-lg"><p class="text-gray-800">Generating PDF...</p></div>';
  document.body.appendChild(loadingIndicator);

  // Use html2canvas to capture the content
  html2canvas(spreadContainer, {
    backgroundColor: '#ffffff',
    scale: 2, // Higher quality
    logging: false,
    useCORS: true
  }).then(canvas => {
    // Initialize PDF document - use landscape orientation which works better for flatplan layouts
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Get publication details for the filename
    const publicationName = document.querySelector('.text-xl.font-bold')?.textContent || 'flatplan';
    const issueName = document.querySelector('.text-indigo-100.text-sm')?.textContent || 'export';
    const filename = `${publicationName}-${issueName}.pdf`.replace(/\s+/g, '-').toLowerCase();

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
      title: `${publicationName} - ${issueName} Layout`,
      subject: 'Magazine Layout',
      author: 'Flatplan App',
      creator: 'Flatplan App',
      creationDate: new Date()
    });

    // Generate the PDF and trigger download
    pdf.save(filename);

    // Remove loading indicator
    document.body.removeChild(loadingIndicator);
  }).catch(error => {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
    document.body.removeChild(loadingIndicator);
  });
}

// ===== Event Listeners =====

// Initialize everything once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("Initializing Flatplan JS...");

  // ----- Layout Save Functionality -----
  const saveBtn = document.getElementById('save-layout-btn');
  const layoutId = document.getElementById('layout-id')?.value;

  if (saveBtn && layoutId) {
    saveBtn.addEventListener('click', () => {
      const layout = getCurrentLayoutAsJSON();

      fetch(`/layout/${layoutId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layout)
      })
      .then(res => res.ok ? alert('Layout saved!') : alert('Save failed.'));
    });
  }

  // ----- Menu Functionality -----
  // Add menu handling code
  console.log("Menu functionality loading...");

  // Elements
  const menuButton = document.getElementById('menu-button');
  const dropdownMenu = document.getElementById('dropdown-menu');

  // Log which elements were found to help debug
  console.log("Menu button found:", !!menuButton);
  console.log("Dropdown menu found:", !!dropdownMenu);

  if (menuButton && dropdownMenu) {
    // Toggle dropdown menu
    menuButton.addEventListener('click', function(e) {
      console.log("Menu button clicked");
      e.stopPropagation();

      // Get the current state
      console.log("Current display style:", dropdownMenu.style.display);

      // Force visibility using direct style manipulation
      if (dropdownMenu.style.display === 'block') {
        console.log("Setting to none");
        dropdownMenu.style.display = 'none';
      } else {
        console.log("Setting to block");
        dropdownMenu.style.display = 'block';

        // Also force these styles to ensure visibility
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

  // ----- Export Options -----

  // JSON Export
  const downloadJsonBtn = document.getElementById('download-json-btn');
  if (downloadJsonBtn) {
    downloadJsonBtn.addEventListener('click', function() {
      const layout = getCurrentLayoutAsJSON();
      downloadJSON(layout, `flatplan-${layoutId || 'export'}`);
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

// Share functionality
const shareBtn = document.getElementById('share-btn');
if (shareBtn) {
    shareBtn.addEventListener('click', function() {
        const layoutId = document.getElementById('layout-id').value;
        if (layoutId) {
            // Redirect to the share layout page with the layout ID
            window.location.href = `/share/${layoutId}`;
        } else {
            alert('Cannot share: Layout ID not found.');
        }
    });
}

});

// ===== Initialize Sortable (OUTSIDE the DOMContentLoaded handler) =====
// This ensures it's available when the DOM is ready and doesn't get
// delayed by other event handlers

// Find the sortable container
const sortableContainer = document.querySelector('.spread-container');

// Only initialize if the container exists
if (sortableContainer) {
  Sortable.create(sortableContainer, {
    animation: 150,
    ghostClass: 'drag-ghost',
    filter: "#page-0",
    preventOnFilter: false,
    onEnd: function() {
      updatePageNumbers();
    }
  });

  // Initial page numbering
  updatePageNumbers();
}
