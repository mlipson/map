function updatePageNumbers() {
  const boxes = document.querySelectorAll('.spread-container .box');
  let visibleIndex = 0;

  boxes.forEach((box, i) => {
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

function getCurrentLayoutAsJSON() {
  const boxes = document.querySelectorAll('.spread-container .box');
  const layout = [];

  boxes.forEach(box => {
    const id = box.id;
    if (id === "page-0") return; // skip placeholder

    layout.push({
      id: id, // e.g., "page-3"
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


/* run after SortableJS & updatePageNumbers() have been defined */
document.addEventListener('DOMContentLoaded', () => {
  const saveBtn  = document.getElementById('save-layout-btn');
  const layoutId = document.getElementById('layout-id').value;   // ← gets the ID

  saveBtn.addEventListener('click', () => {
    const layout = getCurrentLayoutAsJSON();

    fetch(`/layout/${layoutId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(layout)
    })
    .then(res => res.ok ? alert('Layout saved!') : alert('Save failed.'));
  });
});


Sortable.create(document.querySelector('.spread-container'), {
  animation: 150,
  ghostClass: 'drag-ghost',
  filter: "#page-0",
  preventOnFilter: false,
  onEnd: function () {
    updatePageNumbers();
  }
});

updatePageNumbers();

/**
 * Menu functionality for the Flatplan application
 * Handles dropdown menu interactions and export options
 */

document.addEventListener('DOMContentLoaded', function () {

    console.log("Menu functionality loading...");
    // Elements
    const menuButton = document.getElementById('menu-button');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const downloadJsonBtn = document.getElementById('download-json-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const downloadJpegBtn = document.getElementById('download-jpeg-btn');
    const shareBtn = document.getElementById('share-btn');

        // Log which elements were found to help debug
    console.log("Menu button found:", !!menuButton);
    console.log("Dropdown menu found:", !!dropdownMenu);

    menuButton.addEventListener('click', function(e) {
    e.stopPropagation();

    // Toggle class for styling
    dropdownMenu.classList.toggle('show');

    // Also set inline style directly as a fallback
    if (dropdownMenu.classList.contains('show')) {
        dropdownMenu.style.display = 'block';
    } else {
        dropdownMenu.style.display = '';  // Reset to default
    }
});

    // Get the current state
    console.log("Current display style:", dropdownMenu.style.display);

    // Force visibility
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
            if (!event.target.matches('#menu-button') && !menuButton.contains(event.target) &&
                !dropdownMenu.contains(event.target)) {
                if (dropdownMenu.classList.contains('show')) {
                    dropdownMenu.classList.remove('show');
                }
            }
        });
    } else {
        console.error("Menu elements not found in DOM");
    }

    // JSON Download functionality
    if (downloadJsonBtn) {
        downloadJsonBtn.addEventListener('click', function() {
            const layout = getCurrentLayoutAsJSON();
            downloadJSON(layout, `flatplan-${document.getElementById('layout-id').value}`);
        });
    }

    // PDF Export functionality (placeholder)
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', function() {
            alert('PDF export functionality coming soon!');
            // Future implementation with html2pdf.js or similar
            // generatePDF();
        });
    }

    // JPEG Export functionality (placeholder)
    if (downloadJpegBtn) {
        downloadJpegBtn.addEventListener('click', function() {
            alert('JPEG export functionality coming soon!');
            // Future implementation with html2canvas or similar
            // generateJPEG();
        });
    }

    // Share functionality (placeholder)
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            alert('Sharing functionality coming soon!');
            // Future implementation for sharing
            // shareLayout();
        });
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
     * Future function to generate PDF
     * This would be implemented with a library like html2pdf.js or jsPDF
     */
    function generatePDF() {
        // PDF generation code would go here
        console.log("PDF generation not yet implemented");
    }

    /**
     * Future function to generate JPEG
     * This would be implemented with html2canvas or similar
     */
    function generateJPEG() {
        // JPEG generation code would go here
        console.log("JPEG generation not yet implemented");
    }

    /**
     * Future function to share the layout
     * This could include email sharing, link generation, etc.
     */
    function shareLayout() {
        // Sharing implementation would go here
        console.log("Sharing functionality not yet implemented");
    }
});
