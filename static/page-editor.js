/**
 * Page Editor functionality for Flatplan application
 * Handles modals for editing page properties, adding new pages, deleting pages,
 * and editing layout metadata
 */

document.addEventListener('DOMContentLoaded', () => {
    // Select DOM elements
    const pageModal = document.getElementById('page-editor-modal');
    const layoutModal = document.getElementById('edit-layout-modal');
    const editForm = document.getElementById('page-edit-form');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const deletePageBtn = document.getElementById('delete-page-btn');
    const addPageBtn = document.getElementById('add-page-btn');
    const layoutId = document.getElementById('layout-id')?.value;
    const sectionSelect = document.getElementById('edit-page-section');

    if (sectionSelect) {
        sectionSelect.addEventListener('change', function(e) {
            if (this.value === 'add_new_section') {
                // Reset selection to previous value to avoid having "Add New Section" as selected value
                this.value = document.getElementById('temp-section-value')?.value || '';

                // Prompt for new section name
                const newSection = window.prompt('Enter new section name:');

                if (newSection && newSection.trim() !== '') {
                    // Add new option to dropdown
                    const newOption = document.createElement('option');
                    newOption.value = newSection.trim();
                    newOption.textContent = newSection.trim();

                    // Insert before the "Add New Section" option
                    this.insertBefore(newOption, this.lastChild);

                    // Select the new option
                    newOption.selected = true;
                }
            } else {
                // Store current selection in a hidden field for reference
                // in case user clicks "Add New Section" and then cancels
                let tempField = document.getElementById('temp-section-value');
                if (!tempField) {
                    tempField = document.createElement('input');
                    tempField.type = 'hidden';
                    tempField.id = 'temp-section-value';
                    document.getElementById('page-edit-form').appendChild(tempField);
                }
                tempField.value = this.value;
            }
        });
    }

    // ===== Layout Metadata Edit Functions =====

    // Initialize layout edit buttons with direct event listener attachment
    const layoutEditButtons = document.querySelectorAll('[data-action="edit-layout"]');
    console.log('Found layout edit buttons:', layoutEditButtons.length);

    layoutEditButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Edit layout button clicked');

            const layoutId = this.getAttribute('data-layout-id');
            const publicationName = this.getAttribute('data-publication-name');
            const issueName = this.getAttribute('data-issue-name');
            const publicationDate = this.getAttribute('data-publication-date') || '';
            const returnTo = this.getAttribute('data-return-to');

            console.log('Opening modal with data:', {
                layoutId,
                publicationName,
                issueName,
                publicationDate,
                returnTo
            });

            openLayoutEditModal(layoutId, publicationName, issueName, publicationDate, returnTo);
        });
    });

    // Add a global click handler as a fallback for dynamically added elements
    document.addEventListener('click', function(e) {
        if (e.target.closest('[data-action="edit-layout"]')) {
            const button = e.target.closest('[data-action="edit-layout"]');
            e.preventDefault();

            const layoutId = button.getAttribute('data-layout-id');
            const publicationName = button.getAttribute('data-publication-name');
            const issueName = button.getAttribute('data-issue-name');
            const publicationDate = button.getAttribute('data-publication-date') || '';
            const returnTo = button.getAttribute('data-return-to');

            openLayoutEditModal(layoutId, publicationName, issueName, publicationDate, returnTo);
        }

        if (e.target.closest('[data-action="close-layout-modal"]')) {
            closeLayoutEditModal();
        }
    });

    // Make pages clickable to edit
    document.querySelectorAll('.spread-container .box').forEach(box => {
        if (box.id === 'page-0') return; // skip placeholder

        box.addEventListener('click', (e) => {
            // Only open editor when clicking the box itself (not during drag operations)
            if (e.currentTarget === box) {
                openEditModal(box);
            }
        });
    });

    // Close modal handlers
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeModal);

    // Form submission handler
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savePageEdits();
        });
    }

    // Delete page handler
    if (deletePageBtn) {
        deletePageBtn.addEventListener('click', deletePage);
    }

    // Add new page handler
    if (addPageBtn) {
        addPageBtn.addEventListener('click', addNewPage);
    }

    // Close modal if clicking outside of it
    window.addEventListener('click', function(event) {
        if (layoutModal && event.target === layoutModal) {
            closeLayoutEditModal();
        }
        if (pageModal && event.target === pageModal) {
            closeModal();
        }
    });

    /**
     * Opens the layout edit modal with metadata
     * @param {string} layoutId - The layout ID
     * @param {string} publicationName - The publication name
     * @param {string} issueName - The issue name
     * @param {string} publicationDate - The publication date
     * @param {string} returnTo - Where to return after editing ('layout' or 'account')
     */
    window.openLayoutEditModal = function(layoutId, publicationName, issueName, publicationDate, returnTo) {
        console.log('openLayoutEditModal called with:', {
            layoutId, publicationName, issueName, publicationDate, returnTo
        });

        if (!layoutModal) {
            console.error('Layout modal element not found!');
            return;
        }

        // Set form values
        document.getElementById('edit-layout-id').value = layoutId;
        document.getElementById('edit-publication-name').value = publicationName;
        document.getElementById('edit-issue-name').value = issueName;
        document.getElementById('edit-publication-date').value = publicationDate;
        document.getElementById('edit-return-to').value = returnTo;

        // Show modal
        layoutModal.classList.remove('hidden');
        console.log('Modal should now be visible');
    }

    /**
     * Closes the layout edit modal
     */
    window.closeLayoutEditModal = function() {
        if (layoutModal) {
            layoutModal.classList.add('hidden');
        }
    }

  /**
 * Opens the edit modal with page data
 * @param {HTMLElement} pageBox - The page box element
 */
function openEditModal(pageBox) {
    // Get page data (existing code)
    const pageId = pageBox.id;
    const pageName = pageBox.querySelector('.name')?.textContent || '';
    const pageSection = pageBox.querySelector('.section')?.textContent || '';
    const pageNumber = pageBox.getAttribute('data-page-number');
    const pageType = pageBox.classList.contains('edit') ? 'edit' :
                     pageBox.classList.contains('ad') ? 'ad' :
                     pageBox.classList.contains('placeholder') ? 'placeholder' : 'unknown';

    // Fill the form (existing code)
    document.getElementById('edit-page-id').value = pageId;
    document.getElementById('edit-page-name').value = pageName;
    document.getElementById('edit-page-type').value = pageType;
    document.getElementById('edit-page-number').value = pageNumber;
    document.getElementById('modal-title').textContent = `Edit Page ${pageNumber}`;

    // Build section dropdown options dynamically
    const sectionSelect = document.getElementById('edit-page-section');
    sectionSelect.innerHTML = ''; // Clear existing options

    // Standard sections that always appear (common in magazine layouts)
    const defaultSections = [
        { value: 'FOB', label: 'Front of Book' },
        { value: 'Feature', label: 'Feature' },
        { value: 'BOB', label: 'Back of Book' },
        { value: 'Cover', label: 'Cover' },
        { value: 'paid', label: 'Paid Advertisement' },
        { value: 'house', label: 'House Advertisement' }
    ];

    // Get unique sections from current layout
    const existingSections = new Set();
    document.querySelectorAll('.spread-container .box').forEach(box => {
        const section = box.querySelector('.section')?.textContent;
        if (section && !defaultSections.some(s => s.value === section)) {
            existingSections.add(section);
        }
    });

    // Add default sections first
    defaultSections.forEach(section => {
        const option = document.createElement('option');
        option.value = section.value;
        option.textContent = section.label;
        sectionSelect.appendChild(option);
    });

    // Add section divider if we have custom sections
    if (existingSections.size > 0) {
        const divider = document.createElement('option');
        divider.disabled = true;
        divider.textContent = '──────────────';
        sectionSelect.appendChild(divider);

        // Add existing custom sections
        Array.from(existingSections).sort().forEach(section => {
            const option = document.createElement('option');
            option.value = section;
            option.textContent = section;
            sectionSelect.appendChild(option);
        });
    }

    // Add "Add New Section" option
    const addNewOption = document.createElement('option');
    addNewOption.value = 'add_new_section';
    addNewOption.textContent = '+ Add New Section';
    sectionSelect.appendChild(addNewOption);

    // Set the current section
    if (pageSection) {
        // Try to find and select the current section
        for (let i = 0; i < sectionSelect.options.length; i++) {
            if (sectionSelect.options[i].value === pageSection) {
                sectionSelect.selectedIndex = i;
                break;
            }
        }
    }

    // Show the modal
    pageModal.classList.remove('hidden');
}

    /**
     * Closes the modal
     */
    function closeModal() {
        pageModal.classList.add('hidden');
    }

   /**
 * Saves page edits to the UI (changes will be committed to DB on layout save)
 */
function savePageEdits() {
    const pageId = document.getElementById('edit-page-id').value;
    const pageName = document.getElementById('edit-page-name').value;
    const pageType = document.getElementById('edit-page-type').value;
    const pageSection = document.getElementById('edit-page-section').value;

    // Get the page element
    const pageBox = document.getElementById(pageId);
    if (!pageBox) return;

    // Update the page element
    pageBox.querySelector('.name').textContent = pageName;
    pageBox.querySelector('.section').textContent = pageSection;

    // Update the page type (class)
    pageBox.classList.remove('edit', 'ad', 'placeholder', 'unknown', 'bonus', 'promo');
    pageBox.classList.add(pageType);

    // Determine background color based on type and special sections
    let bgColor;

    if (pageType === 'ad' && pageSection === 'Bonus') {
        bgColor = '#9999f8';
        pageBox.classList.add('bonus');
    }
    else if (pageType === 'ad' && pageSection === 'Promo') {
        bgColor = '#b1fca3';
        pageBox.classList.add('promo');
    }
    else {
        // Standard background colors
        const bgColors = {
            'edit': '#B1FCFE',
            'ad': '#FFFFA6',
            'placeholder': '#F3F4F6',
            'unknown': '#EEEEEE'
        };
        bgColor = bgColors[pageType];
    }

    // Apply the background color
    pageBox.style.backgroundColor = bgColor;

    // Close the modal
    closeModal();

    // Show notification
    showNotification('Page updated', 'success');
}

    /**
     * Deletes a page
     */
    function deletePage() {
        if (confirm('Are you sure you want to delete this page?')) {
            const pageId = document.getElementById('edit-page-id').value;
            const pageBox = document.getElementById(pageId);

            if (pageBox) {
                pageBox.remove();
                updatePageNumbers();
                closeModal();
                showNotification('Page deleted', 'success');
            }
        }
    }

    /**
     * Adds a new page
     */
    function addNewPage() {
        // Get the spread container
        const spreadContainer = document.querySelector('.spread-container');

        // Create a new page element
        const boxes = document.querySelectorAll('.spread-container .box');
        const newPageNumber = boxes.length; // Next number after existing boxes
        const newPageId = `page-${Date.now()}`; // Unique ID using timestamp

        const newPage = document.createElement('div');
        newPage.id = newPageId;
        newPage.className = 'box placeholder rounded border relative p-3 aspect-[3/4] w-36 text-center flex flex-col justify-start select-none mr-2.5 shadow-sm';
        newPage.style.backgroundColor = '#F3F4F6';

        newPage.innerHTML = `
            <div class="section font-semibold text-xs text-gray-700 mb-0.5">New</div>
            <div class="name-wrapper flex-1 flex items-center justify-center">
                <div class="name font-medium max-w-[80%] break-words text-center text-gray-800">New Page</div>
            </div>
            <div class="page-number odd text-gray-500 text-xs">${newPageNumber}</div>
        `;

        // Add the new page to the end of the spread container
        spreadContainer.appendChild(newPage);

        // Update page numbers
        updatePageNumbers();

        // Make the new page clickable
        newPage.addEventListener('click', (e) => {
            if (e.currentTarget === newPage) {
                openEditModal(newPage);
            }
        });

        // Open the edit modal for the new page
        openEditModal(newPage);

        // Show notification
        showNotification('New page added', 'success');
    }

    /**
     * Updates page numbers for all pages
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
     * Shows a notification
     * @param {string} message - The message to display
     * @param {string} type - The type of notification (success, error, info)
     */
    function showNotification(message, type = 'info') {
        // Create notification element
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
});
