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

    layout.push({
      name: box.querySelector('.name')?.textContent,
      section: box.querySelector('.section')?.textContent,
      page_number: parseInt(box.getAttribute('data-page-number'), 10),
      type: box.classList.contains('edit') ? 'edit' :
            box.classList.contains('ad') ? 'ad' :
            box.classList.contains('placeholder') ? 'placeholder' : 'unknown'
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

  // PDF Export (placeholder)
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', function() {
      alert('PDF export functionality coming soon!');
      // Future implementation
    });
  }

  // JPEG Export (placeholder)
  const downloadJpegBtn = document.getElementById('download-jpeg-btn');
  if (downloadJpegBtn) {
    downloadJpegBtn.addEventListener('click', function() {
      alert('JPEG export functionality coming soon!');
      // Future implementation
    });
  }

  // Share functionality (placeholder)
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function() {
      alert('Sharing functionality coming soon!');
      // Future implementation
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
