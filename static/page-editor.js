/**
 * Page Editor functionality for Flatplan application
 * Handles modals for editing page properties, adding new pages, deleting pages,
 * editing layout metadata, and managing fractional advertisements
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
    const pageTypeSelect = document.getElementById('edit-page-type');
    const fractionalAdsContainer = document.getElementById('fractional-ads-container');
    const addFractionalAdBtn = document.getElementById('add-fractional-ad-btn');

    // Set up section selection handling
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

    // Page type change handler to show/hide fractional ads section
    if (pageTypeSelect) {
        pageTypeSelect.addEventListener('change', function() {
            if (this.value === 'mixed') {
                if (fractionalAdsContainer) {
                    fractionalAdsContainer.classList.remove('hidden');
                    // Add an empty fractional ad form if there are none
                    const adsList = document.getElementById('fractional-ads-list');
                    if (adsList && adsList.children.length === 0) {
                        addFractionalAdForm();
                    }
                }
            } else {
                if (fractionalAdsContainer) {
                    fractionalAdsContainer.classList.add('hidden');
                }
            }
        });
    }

    // Add button for adding new fractional ad forms
    if (addFractionalAdBtn) {
        addFractionalAdBtn.addEventListener('click', function() {
            addFractionalAdForm();
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


// Add this to your existing page-editor.js, near where other event listeners are set up
document.addEventListener('DOMContentLoaded', function() {
    // Set up event delegation for dynamically created forms
    document.addEventListener('change', function(e) {
        // Check if the changed element is a fractional ad size dropdown
        if (e.target.name === 'fractional_ad_size') {
            const sizeValue = e.target.value;
            // Find the position dropdown in the same form
            const form = e.target.closest('.fractional-ad-form');
            const positionDropdown = form.querySelector('[name="fractional_ad_position"]');

            // Update position options based on size
            updatePositionOptions(positionDropdown, sizeValue);
        }
    });
});

/**
 * Updates position dropdown options based on the selected size
 * @param {HTMLElement} positionDropdown - The position dropdown element
 * @param {string} size - The selected size value
 */
function updatePositionOptions(positionDropdown, size) {
    // Save current selection if possible
    const currentPosition = positionDropdown.value;

    // Clear existing options
    positionDropdown.innerHTML = '';

    // Add appropriate options based on size
    if (size === '1/4') {
        // For 1/4 page, we need corner positions
        const cornerOptions = [
            { value: 'top-left', label: 'Top Left' },
            { value: 'top-right', label: 'Top Right' },
            { value: 'bottom-left', label: 'Bottom Left' },
            { value: 'bottom-right', label: 'Bottom Right' }
        ];

        cornerOptions.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            positionDropdown.appendChild(optionEl);
        });
    } else {
        // For other sizes, use the standard edge positions
        const edgeOptions = [
            { value: 'top', label: 'Top' },
            { value: 'bottom', label: 'Bottom' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' }
        ];

        edgeOptions.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            positionDropdown.appendChild(optionEl);
        });
    }

    // Try to restore previous selection if it exists in new options
    const matchingOption = positionDropdown.querySelector(`option[value="${currentPosition}"]`);
    if (matchingOption) {
        matchingOption.selected = true;
    }
}




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
    };

    /**
     * Closes the layout edit modal
     */
    window.closeLayoutEditModal = function() {
        if (layoutModal) {
            layoutModal.classList.add('hidden');
        }
    };

    /**
     * Opens the edit modal with page data, including support for fractional ads
     * @param {HTMLElement} pageBox - The page box element
     */
    function openEditModal(pageBox) {
        // Get page data
        const pageId = pageBox.id;
        const pageName = pageBox.querySelector('.name')?.textContent || '';
        const pageSection = pageBox.querySelector('.section')?.textContent || '';
        const pageNumber = pageBox.getAttribute('data-page-number');
        const formBreak = pageBox.hasAttribute('data-form-break');

        // Determine page type, now including "mixed" type
        let pageType = 'unknown';
        if (pageBox.classList.contains('edit')) pageType = 'edit';
        else if (pageBox.classList.contains('ad')) pageType = 'ad';
        else if (pageBox.classList.contains('mixed')) pageType = 'mixed';
        else if (pageBox.classList.contains('placeholder')) pageType = 'placeholder';

        // Get fractional ads data if present
        let fractionalAds = [];
        if (pageType === 'mixed') {
            // Try to get fractional ads from data attribute first
            const fractionalAdsData = pageBox.getAttribute('data-fractional-ads');
            if (fractionalAdsData) {
                try {
                    fractionalAds = JSON.parse(fractionalAdsData);
                } catch (e) {
                    console.error('Error parsing fractional ads data:', e);
                }
            }

            // If no data attribute or parsing failed, try to get from DOM elements
            if (fractionalAds.length === 0) {
                const fractionalElements = pageBox.querySelectorAll('.fractional-ad');
                fractionalElements.forEach(el => {
                    fractionalAds.push({
                        id: el.getAttribute('data-id'),
                        name: el.getAttribute('data-name'),
                        section: el.getAttribute('data-section'),
                        size: el.getAttribute('data-size'),
                        position: el.getAttribute('data-position')
                    });
                });
            }

            // Handle fractional ads container visibility and population
            if (fractionalAdsContainer) {
                if (pageType === 'mixed') {
                    fractionalAdsContainer.classList.remove('hidden');
                    populateFractionalAds(fractionalAds);

                    // After populating fractional ads, check each form and update position options if needed
                    document.querySelectorAll('#fractional-ads-list .fractional-ad-form').forEach(form => {
                        const sizeDropdown = form.querySelector('[name="fractional_ad_size"]');
                        const positionDropdown = form.querySelector('[name="fractional_ad_position"]');

                        if (sizeDropdown && positionDropdown) {
                            // Make sure the position dropdown matches the size dropdown
                            updatePositionOptions(positionDropdown, sizeDropdown.value);
                        }
                    });
                } else {
                    fractionalAdsContainer.classList.add('hidden');
                    clearFractionalAds();
                }
            }
        }

        // Fill the form
        document.getElementById('edit-page-id').value = pageId;
        document.getElementById('edit-page-name').value = pageName;
        document.getElementById('edit-page-type').value = pageType;
        document.getElementById('edit-page-number').value = pageNumber;
        document.getElementById('modal-title').textContent = `Edit Page ${pageNumber}`;

        // Set form break checkbox
        if (document.getElementById('edit-page-form-break')) {
            document.getElementById('edit-page-form-break').checked = formBreak;
        }

        // Build section dropdown options dynamically
        const sectionSelect = document.getElementById('edit-page-section');
        if (sectionSelect) {
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
        }

        // Handle fractional ads container visibility and population
        if (fractionalAdsContainer) {
            if (pageType === 'mixed') {
                fractionalAdsContainer.classList.remove('hidden');
                populateFractionalAds(fractionalAds);
            } else {
                fractionalAdsContainer.classList.add('hidden');
                clearFractionalAds();
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
        const pageName = document.getElementById('edit-page-name').value.trim(); // Add trim() here
        const pageType = document.getElementById('edit-page-type').value;
        const pageSection = document.getElementById('edit-page-section').value.trim(); // Also trim section
        const formBreak = document.getElementById('edit-page-form-break').checked;

        // Collect fractional ads data if page type is "mixed"
        const fractionalAds = pageType === 'mixed' ? collectFractionalAdsData() : [];

        // Get the page element
        const pageBox = document.getElementById(pageId);
        if (!pageBox) return;

        // Update the page element
        pageBox.querySelector('.name').textContent = pageName;
        pageBox.querySelector('.section').textContent = pageSection;

        // Update the page type (class)
        pageBox.classList.remove('edit', 'ad', 'mixed', 'placeholder', 'unknown', 'bonus', 'promo');
        pageBox.classList.add(pageType);

        // Handle form break (add or remove as needed)
        if (formBreak) {
            pageBox.setAttribute('data-form-break', 'true');
            pageBox.classList.add('form-break');
        } else {
            pageBox.removeAttribute('data-form-break');
            pageBox.classList.remove('form-break');
        }

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
                'mixed': '#B1FCFE', // White background for mixed content?
                'placeholder': '#F3F4F6',
                'unknown': '#EEEEEE'
            };
            bgColor = bgColors[pageType];
        }

        // Apply the background color
        pageBox.style.backgroundColor = bgColor;

        // Handle fractional ads for mixed content pages
        if (pageType === 'mixed') {
            // Clear existing fractional ads
            const existingFractionalAds = pageBox.querySelectorAll('.fractional-ad');
            existingFractionalAds.forEach(el => el.remove());

            // Add the new fractional ads
            fractionalAds.forEach(ad => {
                addFractionalAdToPage(pageBox, ad);
            });

            // Store fractional ads data in a data attribute for later retrieval
            pageBox.setAttribute('data-fractional-ads', JSON.stringify(fractionalAds));
        } else {
            // Remove any existing fractional ads
            const existingFractionalAds = pageBox.querySelectorAll('.fractional-ad');
            existingFractionalAds.forEach(el => el.remove());

            // Remove the data attribute
            pageBox.removeAttribute('data-fractional-ads');
        }

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
        // Updated class with w-32 instead of w-36 to match new sizing
        newPage.className = 'box placeholder rounded border relative p-3 aspect-[3/4] w-32 text-center flex flex-col justify-start select-none mr-2.5 shadow-sm';

        newPage.innerHTML = `
            <div class="section font-semibold text-xs text-gray-700 mb-0.5">New</div>
            <div class="name-wrapper flex-1 flex items-center justify-center">
                <div class="name font-medium text-sm max-w-[90%] break-words text-center text-gray-800">New Page</div>
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

    /**
     * Fractional Ads Functions
     * These functions manage the creation, editing, and display of fractional advertisements
     */

    /**
     * Populates the fractional ads UI with existing fractional ads
     * @param {Array} fractionalAds - Array of fractional ad objects
     */
    function populateFractionalAds(fractionalAds) {
        const container = document.getElementById('fractional-ads-list');
        if (!container) return;

        container.innerHTML = '';

        if (fractionalAds.length === 0) {
            // Add one empty form by default
            addFractionalAdForm();
            return;
        }

        // Add a form for each existing fractional ad
        fractionalAds.forEach(ad => {
            addFractionalAdForm(ad);
        });
    }

    /**
     * Adds a new fractional ad form to the UI
     * @param {Object} adData - Optional existing ad data to populate the form
     */
function addFractionalAdForm(adData = null) {
    const container = document.getElementById('fractional-ads-list');
    if (!container) return;

    const formId = `fractional-ad-${Date.now()}`;

    // Determine size - if no adData, default to '1/4'
    const size = adData?.size || '1/4';

    // Determine if we need corner positions based on size
    const isQuarterPage = size === '1/4';

    // Prepare position options based on size
    let positionOptions = '';

    if (isQuarterPage) {
        // Corner positions for quarter page
        positionOptions = `
            <option value="top-left" ${adData?.position === 'top-left' ? 'selected' : ''}>Top Left</option>
            <option value="top-right" ${adData?.position === 'top-right' ? 'selected' : ''}>Top Right</option>
            <option value="bottom-left" ${adData?.position === 'bottom-left' ? 'selected' : ''}>Bottom Left</option>
            <option value="bottom-right" ${adData?.position === 'bottom-right' ? 'selected' : ''}>Bottom Right</option>
        `;
    } else {
        // Edge positions for other sizes
        positionOptions = `
            <option value="top" ${adData?.position === 'top' ? 'selected' : ''}>Top</option>
            <option value="bottom" ${adData?.position === 'bottom' ? 'selected' : ''}>Bottom</option>
            <option value="left" ${adData?.position === 'left' ? 'selected' : ''}>Left</option>
            <option value="right" ${adData?.position === 'right' ? 'selected' : ''}>Right</option>
        `;
    }

    const formHtml = `
        <div class="fractional-ad-form p-3 bg-gray-50 rounded-md mb-3" id="${formId}">
            <input type="hidden" name="fractional_ad_id" value="${adData?.id || ''}">
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-gray-700 text-xs font-medium mb-1">Ad Name</label>
                    <input type="text" name="fractional_ad_name" value="${adData?.name || ''}"
                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
                </div>
                <div>
                    <label class="block text-gray-700 text-xs font-medium mb-1">Section</label>
                    <input type="text" name="fractional_ad_section" value="${adData?.section || 'paid'}"
                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
                </div>
                <div>
                    <label class="block text-gray-700 text-xs font-medium mb-1">Size</label>
                    <select name="fractional_ad_size"
                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
                        <option value="1/4" ${size === '1/4' ? 'selected' : ''}>1/4 page</option>
                        <option value="1/3" ${size === '1/3' ? 'selected' : ''}>1/3 page</option>
                        <option value="1/2" ${size === '1/2' ? 'selected' : ''}>1/2 page</option>
                        <option value="2/3" ${size === '2/3' ? 'selected' : ''}>2/3 page</option>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 text-xs font-medium mb-1">Position</label>
                    <select name="fractional_ad_position"
                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
                        ${positionOptions}
                    </select>
                </div>
            </div>
            <div class="flex justify-end mt-2">
                <button type="button" onclick="removeFractionalAdForm('${formId}')"
                    class="text-red-600 hover:text-red-800 text-xs">
                    Remove
                </button>
            </div>
        </div>
    `;

    // Insert the new form
    container.insertAdjacentHTML('beforeend', formHtml);

    // Add change event listener to the size dropdown
    const sizeDropdown = document.querySelector(`#${formId} [name="fractional_ad_size"]`);
    const positionDropdown = document.querySelector(`#${formId} [name="fractional_ad_position"]`);

    if (sizeDropdown && positionDropdown) {
        sizeDropdown.addEventListener('change', function() {
            updatePositionOptions(positionDropdown, this.value);
        });

        // Set default position if this is a new form (not loading existing data)
        if (!adData) {
            // Default position for 1/4 page is top-left
            positionDropdown.value = isQuarterPage ? 'top-left' : 'top';
        }
    }
}

    /**
     * Removes a fractional ad form from the UI
     * @param {string} formId - The ID of the form to remove
     */
    window.removeFractionalAdForm = function(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.remove();

            // If no forms left, add an empty one
            const container = document.getElementById('fractional-ads-list');
            if (container && container.children.length === 0) {
                addFractionalAdForm();
            }
        }
    };

    /**
     * Clears all fractional ad forms
     */
    function clearFractionalAds() {
        const container = document.getElementById('fractional-ads-list');
        if (container) {
            container.innerHTML = '';
        }
    }

    /**
     * Collects fractional ad data from the form
     * @returns {Array} Array of fractional ad objects
     */
    function collectFractionalAdsData() {
        const forms = document.querySelectorAll('.fractional-ad-form');
        const fractionalAds = [];

        forms.forEach(form => {
            const id = form.querySelector('input[name="fractional_ad_id"]').value || `frac-${Date.now()}-${fractionalAds.length}`;
            const name = form.querySelector('input[name="fractional_ad_name"]').value;
            const section = form.querySelector('input[name="fractional_ad_section"]').value;
            const size = form.querySelector('select[name="fractional_ad_size"]').value;
            const position = form.querySelector('select[name="fractional_ad_position"]').value;

            // Only add if it has a name
            if (name.trim()) {
                fractionalAds.push({ id, name, section, size, position });
            }
        });

        return fractionalAds;
    }

    /**
     * Adds a fractional ad to the page box
     * @param {HTMLElement} pageBox - The page box element
     * @param {Object} adData - The fractional ad data
     */
function addFractionalAdToPage(pageBox, adData) {
    // Create the fractional ad element
    const adElement = document.createElement('div');
    adElement.className = 'fractional-ad absolute bg-yellow-100 border border-yellow-300';
    adElement.style.backgroundColor = '#F19E9C'; // Set the background color directly
    adElement.style.borderColor = '#ccc'; // Set the border color directly
    adElement.setAttribute('data-id', adData.id);
    adElement.setAttribute('data-name', adData.name);
    adElement.setAttribute('data-section', adData.section);
    adElement.setAttribute('data-size', adData.size);
    adElement.setAttribute('data-position', adData.position);

    // Set size and position based on the ad data
    const { size, position } = adData;

    // Set CSS properties based on size and position
    if (size === '1/4') {
        // Quarter page - handle corner positions
        switch (position) {
            case 'top-left':
                adElement.style.top = '0';
                adElement.style.left = '0';
                adElement.style.width = '50%';
                adElement.style.height = '50%';
                break;
            case 'top-right':
                adElement.style.top = '0';
                adElement.style.right = '0';
                adElement.style.width = '50%';
                adElement.style.height = '50%';
                break;
            case 'bottom-left':
                adElement.style.bottom = '0';
                adElement.style.left = '0';
                adElement.style.width = '50%';
                adElement.style.height = '50%';
                break;
            case 'bottom-right':
                adElement.style.bottom = '0';
                adElement.style.right = '0';
                adElement.style.width = '50%';
                adElement.style.height = '50%';
                break;
            default:
                // Fallback to top-left if position is invalid
                adElement.style.top = '0';
                adElement.style.left = '0';
                adElement.style.width = '50%';
                adElement.style.height = '50%';
        }
    } else {
        // For other sizes, use the standard edge positions
        switch (position) {
            case 'top':
                adElement.style.top = '0';
                adElement.style.left = '0';
                adElement.style.right = '0';
                adElement.style.height = getSizePercentage(size);
                break;
            case 'bottom':
                adElement.style.bottom = '0';
                adElement.style.left = '0';
                adElement.style.right = '0';
                adElement.style.height = getSizePercentage(size);
                break;
            case 'left':
                adElement.style.top = '0';
                adElement.style.left = '0';
                adElement.style.bottom = '0';
                adElement.style.width = getSizePercentage(size);
                break;
            case 'right':
                adElement.style.top = '0';
                adElement.style.right = '0';
                adElement.style.bottom = '0';
                adElement.style.width = getSizePercentage(size);
                break;
        }
    }

    // Add content to the fractional ad
    adElement.innerHTML = `
        <div class="text-xs font-medium text-center p-1">${adData.name}</div>
    `;

    // Add the ad element to the page box
    pageBox.appendChild(adElement);
}

    /**
     * Gets the CSS percentage value for a fractional size
     * @param {string} size - The fractional size (1/4, 1/3, 1/2, 2/3)
     * @returns {string} CSS percentage value
     */
    function getSizePercentage(size) {
        switch (size) {
            case '1/4': return '25%';
            case '1/3': return '33.33%';
            case '1/2': return '50%';
            case '2/3': return '66.67%';
            default: return '50%';
        }
    }
});

/**
 * Updates the getCurrentLayoutAsJSON function in flatplan.js to include fractional ads
 * This function should be added to or replace the existing one in flatplan.js
 * @returns {Array} Array of page objects with properties
 */
function getCurrentLayoutAsJSON() {
    const boxes = document.querySelectorAll('.spread-container .box');
    const layout = [];

    boxes.forEach(box => {
        const id = box.id;
        if (id === "page-0") return; // skip placeholder

        const name = box.querySelector('.name')?.textContent.trim() || '';
        const section = box.querySelector('.section')?.textContent.trim() || '';

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
            name: name,
            section: section,
            page_number: parseInt(box.getAttribute('data-page-number'), 10),
            type: box.classList.contains('edit') ? 'edit' :
                  box.classList.contains('ad') ? 'ad' :
                  box.classList.contains('mixed') ? 'mixed' :
                  box.classList.contains('placeholder') ? 'placeholder' : 'unknown',
            form_break: box.hasAttribute('data-form-break'),
            fractional_ads: fractionalAds
        });
    });

    return layout;
}
