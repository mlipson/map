/**
 * Page Editor functionality for Flatplan application
 * Handles modals for editing page properties, adding new pages, and deleting pages
 */

document.addEventListener('DOMContentLoaded', () => {
    // Select DOM elements
    const modal = document.getElementById('page-editor-modal');
    const editForm = document.getElementById('page-edit-form');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const deletePageBtn = document.getElementById('delete-page-btn');
    const addPageBtn = document.getElementById('add-page-btn');
    const layoutId = document.getElementById('layout-id').value;

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

    /**
     * Opens the edit modal with page data
     * @param {HTMLElement} pageBox - The page box element
     */
    function openEditModal(pageBox) {
        // Get page data
        const pageId = pageBox.id;
        const pageName = pageBox.querySelector('.name')?.textContent || '';
        const pageSection = pageBox.querySelector('.section')?.textContent || '';
        const pageNumber = pageBox.getAttribute('data-page-number');
        const pageType = pageBox.classList.contains('edit') ? 'edit' :
                         pageBox.classList.contains('ad') ? 'ad' :
                         pageBox.classList.contains('placeholder') ? 'placeholder' : 'unknown';

        // Fill the form
        document.getElementById('edit-page-id').value = pageId;
        document.getElementById('edit-page-name').value = pageName;
        document.getElementById('edit-page-type').value = pageType;
        document.getElementById('edit-page-section').value = pageSection;
        document.getElementById('edit-page-number').value = pageNumber;
        document.getElementById('modal-title').textContent = `Edit Page ${pageNumber}`;

        // Show the modal
        modal.classList.remove('hidden');
    }

    /**
     * Closes the modal
     */
    function closeModal() {
        modal.classList.add('hidden');
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
        pageBox.classList.remove('edit', 'ad', 'placeholder', 'unknown');
        pageBox.classList.add(pageType);

        // Update the background color
        const bgColors = {
            'edit': '#B1FCFE',
            'ad': '#FFFFA6',
            'placeholder': '#F3F4F6',
            'unknown': '#EEEEEE'
        };
        pageBox.style.backgroundColor = bgColors[pageType];

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
