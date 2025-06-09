/**
 * Flatplan - Magazine Layout Planning Tool
 * Page Editor Module
 *
 * This module handles all functionality related to editing pages in the magazine layout,
 * including modal management, page properties, and layout metadata.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ===================================================
    // SECTION 1: DOM ELEMENT SELECTION AND INITIALIZATION
    // ===================================================

    // Modal elements
    const pageModal = document.getElementById('page-editor-modal');
    const layoutModal = document.getElementById('edit-layout-modal');

    // Page editor form elements
    const editForm = document.getElementById('page-edit-form');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const deletePageBtn = document.getElementById('delete-page-btn');
    const addPageBtn = document.getElementById('add-page-btn');
    const layoutId = document.getElementById('layout-id')?.value;

    // Section and page type selectors
    const sectionSelect = document.getElementById('edit-page-section');
    const pageTypeSelect = document.getElementById('edit-page-type');


    // ===================================================
    // SECTION 2: EVENT LISTENERS AND INITIALIZATION
    // ===================================================

    // Initialize section selection handling
    if (sectionSelect) {
        sectionSelect.addEventListener('change', handleSectionChange);
    }

    // Page type change handler
    if (pageTypeSelect) {
        pageTypeSelect.addEventListener('change', handlePageTypeChange);
    }


    // Initialize layout edit buttons
    initializeLayoutEditButtons();

    // Set global event handler for dynamically added elements
    document.addEventListener('click', handleGlobalClick);


    // Make pages clickable to edit
    initializePageBoxes();

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
    window.addEventListener('click', (event) => {
        if (layoutModal && event.target === layoutModal) {
            closeLayoutEditModal();
        }
        if (pageModal && event.target === pageModal) {
            closeModal();
        }
    });

    // ===================================================
    // SECTION 3: SECTION AND PAGE TYPE HANDLING FUNCTIONS
    // ===================================================

    /**
     * Handles changes to the section dropdown
     * Allows adding new sections dynamically
     */
    function handleSectionChange() {
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
            let tempField = document.getElementById('temp-section-value');
            if (!tempField) {
                tempField = document.createElement('input');
                tempField.type = 'hidden';
                tempField.id = 'temp-section-value';
                document.getElementById('page-edit-form').appendChild(tempField);
            }
            tempField.value = this.value;
        }
    }

    /**
     * Handles changes to the page type dropdown
     * Mixed pages are now handled by the template system
     */
    function handlePageTypeChange() {
        // Mixed pages are now handled by the template system
        // No additional logic needed here
    }

    // ===================================================
    // SECTION 4: LAYOUT MODAL FUNCTIONS
    // ===================================================

    /**
     * Initializes layout edit buttons with event listeners
     */
    function initializeLayoutEditButtons() {
        const layoutEditButtons = document.querySelectorAll('[data-action="edit-layout"]');

        layoutEditButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();

                const layoutId = this.getAttribute('data-layout-id');
                const publicationName = this.getAttribute('data-publication-name');
                const issueName = this.getAttribute('data-issue-name');
                const publicationDate = this.getAttribute('data-publication-date') || '';
                const returnTo = this.getAttribute('data-return-to');

                openLayoutEditModal(layoutId, publicationName, issueName, publicationDate, returnTo);
            });
        });
    }

    /**
     * Handles global click events for dynamically added elements
     * @param {Event} e - Click event
     */
    function handleGlobalClick(e) {
        // Handle layout edit button clicks
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

        // Handle layout modal close button clicks
        if (e.target.closest('[data-action="close-layout-modal"]')) {
            closeLayoutEditModal();
        }
    }

    /**
     * Opens the layout edit modal with metadata
     * @param {string} layoutId - The layout ID
     * @param {string} publicationName - The publication name
     * @param {string} issueName - The issue name
     * @param {string} publicationDate - The publication date
     * @param {string} returnTo - Where to return after editing ('layout' or 'account')
     */
    window.openLayoutEditModal = function(layoutId, publicationName, issueName, publicationDate, returnTo) {
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
    };

    /**
     * Closes the layout edit modal
     */
    window.closeLayoutEditModal = function() {
        if (layoutModal) {
            layoutModal.classList.add('hidden');
        }
    };

    // ===================================================
    // SECTION 5: PAGE EDITING FUNCTIONS
    // ===================================================

    /**
     * Initializes page boxes to be clickable for editing
     */
    function initializePageBoxes() {
        document.querySelectorAll('.spread-container .box').forEach(box => {
            if (box.id === 'page-0') return; // skip placeholder

            box.addEventListener('click', (e) => {
                // For mixed pages, only allow editing through the edit button
                // to avoid conflicts with fractional unit editing
                if (box.classList.contains('mixed')) {
                    // Check if the click came from the edit button
                    if (!e.target.closest('.edit-page-button')) {
                        return; // Don't open page editor for mixed pages unless edit button is clicked
                    }
                }
                
                // Only open editor when clicking the box itself (not during drag operations)
                if (e.currentTarget === box) {
                    openEditModal(box);
                }
            });
        });
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
        const formBreak = pageBox.hasAttribute('data-form-break');

        // Determine page type
        let pageType = 'unknown';
        if (pageBox.classList.contains('edit')) pageType = 'edit';
        else if (pageBox.classList.contains('ad')) pageType = 'ad';
        else if (pageBox.classList.contains('mixed')) pageType = 'mixed';
        else if (pageBox.classList.contains('placeholder')) pageType = 'placeholder';

        // Mixed pages are now handled by the template system
        // No need to load old fractional ads data

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

        // Build section dropdown options
        populateSectionDropdown(pageSection);

        // Mixed pages are handled by the template system

        // Show the modal
        pageModal.classList.remove('hidden');
    }



    /**
     * Populates the section dropdown with options
     * @param {string} currentSection - The current section to select
     */
    function populateSectionDropdown(currentSection) {
        const sectionSelect = document.getElementById('edit-page-section');
        if (!sectionSelect) return;

        sectionSelect.innerHTML = ''; // Clear existing options

        // Standard sections that always appear
        const defaultSections = [
            { value: 'FOB', label: 'Front of Book' },
            { value: 'Feature', label: 'Feature' },
            { value: 'BOB', label: 'Back of Book' },
            { value: 'Cover', label: 'Cover' },
            { value: 'paid', label: 'Paid Advertisement' },
            { value: 'house', label: 'House Advertisement' }
        ];

        // Get unique sections from current layout
        const existingSections = getExistingSections(defaultSections);

        // Add default sections first
        defaultSections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.value;
            option.textContent = section.label;
            sectionSelect.appendChild(option);
        });

        // Add section divider if we have custom sections
        if (existingSections.size > 0) {
            addSectionDivider(sectionSelect, existingSections);
        }

        // Add "Add New Section" option
        const addNewOption = document.createElement('option');
        addNewOption.value = 'add_new_section';
        addNewOption.textContent = '+ Add New Section';
        sectionSelect.appendChild(addNewOption);

        // Set the current section
        if (currentSection) {
            selectSection(sectionSelect, currentSection);
        }
    }

    /**
     * Gets existing sections from the layout
     * @param {Array} defaultSections - Array of default section objects
     * @returns {Set} Set of existing section names
     */
    function getExistingSections(defaultSections) {
        const existingSections = new Set();
        document.querySelectorAll('.spread-container .box').forEach(box => {
            const section = box.querySelector('.section')?.textContent;
            if (section && !defaultSections.some(s => s.value === section)) {
                existingSections.add(section);
            }
        });
        return existingSections;
    }

    /**
     * Adds a divider and custom sections to the section dropdown
     * @param {HTMLElement} sectionSelect - The section select element
     * @param {Set} existingSections - Set of existing section names
     */
    function addSectionDivider(sectionSelect, existingSections) {
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

    /**
     * Selects a section in the dropdown
     * @param {HTMLElement} sectionSelect - The section select element
     * @param {string} sectionValue - The section value to select
     */
    function selectSection(sectionSelect, sectionValue) {
        for (let i = 0; i < sectionSelect.options.length; i++) {
            if (sectionSelect.options[i].value === sectionValue) {
                sectionSelect.selectedIndex = i;
                break;
            }
        }
    }

    /**
     * Closes the page edit modal
     */
    function closeModal() {
        pageModal.classList.add('hidden');
    }

    /**
     * Saves page edits to the UI (changes will be committed to DB on layout save)
     */
    function savePageEdits() {
        const pageId = document.getElementById('edit-page-id').value;
        const pageName = document.getElementById('edit-page-name').value.trim();
        const pageType = document.getElementById('edit-page-type').value;
        const pageSection = document.getElementById('edit-page-section').value.trim();
        const formBreak = document.getElementById('edit-page-form-break').checked;

        // Get the page element
        const pageBox = document.getElementById(pageId);
        if (!pageBox) return;

        // Handle mixed page template selection
        if (pageType === 'mixed') {
            handleMixedPageSave(pageBox);
        }

        // Update the page element
        updatePageBasicInfo(pageBox, pageName, pageSection);
        updatePageType(pageBox, pageType, pageSection);
        updateFormBreak(pageBox, formBreak);

        // Close the modal
        closeModal();

        // Show notification
        showNotification('Page updated', 'success');
    }

    /**
     * Handles saving mixed pages with template data
     * @param {HTMLElement} pageBox - The page box element
     */
    function handleMixedPageSave(pageBox) {
        const templateIdInput = document.getElementById('mixed-page-template-id');
        
        if (templateIdInput && templateIdInput.value) {
            const templateId = templateIdInput.value;
            
            // Store the template ID on the page element
            pageBox.setAttribute('data-mixed-page-layout-id', templateId);
            
            // Clear any old fractional data that might exist
            pageBox.removeAttribute('data-fractional-ads');
            pageBox.removeAttribute('data-mixed-page-rendered');
            
            // Remove any existing fractional elements (they'll be re-rendered)
            pageBox.querySelectorAll('.fractional-unit, .fractional-ad, .editorial-area').forEach(el => {
                el.remove();
            });
            
            console.log(`Mixed page saved with template ID: ${templateId}`);
            
            // Trigger the renderer to create the fractional units
            // Use a small timeout to ensure the page type is updated first
            setTimeout(() => {
                if (window.mixedPageRenderer && window.mixedPageRenderer.renderMixedPage) {
                    console.log('Calling mixed page renderer...');
                    window.mixedPageRenderer.renderMixedPage(pageBox, templateId);
                    
                    // Also retry rendering for any other mixed pages that may have been skipped
                    // This fixes the issue where multiple mixed pages are added in sequence
                    console.log('Retrying rendering for all mixed pages...');
                    window.mixedPageRenderer.retryMixedPageRendering();
                } else {
                    console.error('Mixed page renderer not available:', {
                        mixedPageRenderer: !!window.mixedPageRenderer,
                        renderMixedPage: !!(window.mixedPageRenderer && window.mixedPageRenderer.renderMixedPage)
                    });
                }
            }, 100);
        } else {
            console.warn('No template selected for mixed page');
        }
    }

    /**
     * Updates basic page information in the UI
     * @param {HTMLElement} pageBox - The page box element
     * @param {string} pageName - The page name
     * @param {string} pageSection - The page section
     */
    function updatePageBasicInfo(pageBox, pageName, pageSection) {
        // Get or create section element
        let sectionEl = pageBox.querySelector('.section');
        if (!sectionEl) {
            sectionEl = document.createElement('div');
            sectionEl.className = 'section';
            pageBox.prepend(sectionEl); // Add at the beginning of the page box
        }

        // Update section text
        sectionEl.textContent = pageSection;

        // Get or create name element
        let nameEl = pageBox.querySelector('.name');
        if (!nameEl) {
            const nameWrapper = document.createElement('div');
            nameWrapper.className = 'name-wrapper';
            nameEl = document.createElement('div');
            nameEl.className = 'name';
            nameWrapper.appendChild(nameEl);

            // Insert after section if it exists, otherwise at the beginning
            if (sectionEl.nextSibling) {
                pageBox.insertBefore(nameWrapper, sectionEl.nextSibling);
            } else {
                pageBox.appendChild(nameWrapper);
            }
        }

        // Update name text
        nameEl.textContent = pageName;
    }

    /**
     * Updates the page type and styling
     * @param {HTMLElement} pageBox - The page box element
     * @param {string} pageType - The page type
     * @param {string} pageSection - The page section
     */
    function updatePageType(pageBox, pageType, pageSection) {
        // Update the page type (class)
        pageBox.classList.remove('edit', 'ad', 'mixed', 'placeholder', 'unknown', 'bonus', 'promo');
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
                'mixed': '#B1FCFE',
                'placeholder': '#F3F4F6',
                'unknown': '#EEEEEE'
            };
            bgColor = bgColors[pageType];
        }

        // Apply the background color
        pageBox.style.backgroundColor = bgColor;
    }

    /**
     * Updates form break status for the page
     * @param {HTMLElement} pageBox - The page box element
     * @param {boolean} formBreak - Whether the page has a form break
     */
    function updateFormBreak(pageBox, formBreak) {
        if (formBreak) {
            pageBox.setAttribute('data-form-break', 'true');
            pageBox.classList.add('form-break');
        } else {
            pageBox.removeAttribute('data-form-break');
            pageBox.classList.remove('form-break');
        }
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
 * Adds a new page to an empty or populated layout
 */
function addNewPage() {
    // Get the spread container
    let spreadContainer = document.querySelector('.spread-container');

    if (!spreadContainer) {
        console.error('Spread container not found');
        return;
    }

    // Get existing boxes (if any)
    const boxes = document.querySelectorAll('.spread-container .box');

    // Set the appropriate page number based on existing pages
    const newPageNumber = boxes.length > 0 ? boxes.length : 1; // Start at 1 if no pages exist
    const newPageId = `page-${Date.now()}`; // Unique ID using timestamp

    // Create a new page element
    const newPage = document.createElement('div');
    newPage.id = newPageId;
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

    // Remove the empty state message if it exists
    const emptyStateMessage = document.querySelector('.text-center.py-12.bg-gray-50.rounded-lg');
    if (emptyStateMessage) {
        emptyStateMessage.classList.add('hidden');
    }

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

/**
 * Gets the current layout as a JSON object
 * This function is used by the save layout functionality
 * @returns {Array} Array of page objects with properties
 */
window.getCurrentLayoutAsJSON = function() {
    const boxes = document.querySelectorAll('.spread-container .box');
    const layout = [];

    boxes.forEach(box => {
        const id = box.id;
        if (id === "page-0") return; // skip placeholder

        const name = box.querySelector('.name')?.textContent.trim() || '';
        const section = box.querySelector('.section')?.textContent.trim() || '';

        // Get page type
        let pageType = 'unknown';
        if (box.classList.contains('edit')) pageType = 'edit';
        else if (box.classList.contains('ad')) pageType = 'ad';
        else if (box.classList.contains('mixed')) pageType = 'mixed';
        else if (box.classList.contains('placeholder')) pageType = 'placeholder';

        // Get fractional units data for mixed pages
        let fractionalUnits = [];
        let mixedPageTemplateId = null;
        
        if (pageType === 'mixed') {
            const fractionalAdsData = box.getAttribute('data-fractional-ads');
            mixedPageTemplateId = box.getAttribute('data-mixed-page-layout-id');
            
            if (fractionalAdsData) {
                try {
                    fractionalUnits = JSON.parse(fractionalAdsData);
                } catch (e) {
                    console.error('Error parsing fractional units data:', e);
                }
            }
        }

        const pageData = {
            name: name,
            section: section,
            page_number: parseInt(box.getAttribute('data-page-number'), 10),
            type: pageType,
            form_break: box.hasAttribute('data-form-break'),
            fractional_units: fractionalUnits,
            mixed_page_template_id: mixedPageTemplateId
        };

        // Debug mixed pages
        if (pageType === 'mixed') {
            console.log('Exporting mixed page data:', pageData);
        }

        layout.push(pageData);
    });

    return layout;
};

// Expose openEditModal globally for other modules to use
window.openEditModal = function(pageBox) {
    // Find the openEditModal function in the local scope
    // Since it's defined inside the DOMContentLoaded, we need to find it
    const pageModal = document.getElementById('page-editor-modal');
    if (!pageModal) return;
    
    // Get page data
    const pageId = pageBox.id;
    const pageName = pageBox.querySelector('.name')?.textContent || '';
    const pageSection = pageBox.querySelector('.section')?.textContent || '';
    const pageNumber = pageBox.getAttribute('data-page-number');
    const formBreak = pageBox.hasAttribute('data-form-break');

    // Determine page type
    let pageType = 'unknown';
    if (pageBox.classList.contains('edit')) pageType = 'edit';
    else if (pageBox.classList.contains('ad')) pageType = 'ad';
    else if (pageBox.classList.contains('mixed')) pageType = 'mixed';
    else if (pageBox.classList.contains('placeholder')) pageType = 'placeholder';

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

    // Build section dropdown (simplified version)
    const sectionSelect = document.getElementById('edit-page-section');
    if (sectionSelect) {
        // Try to set the current section
        sectionSelect.value = pageSection;
    }

    // Mixed pages are handled by the template system - always hide the old container
    const fractionalAdsContainer = document.getElementById('fractional-ads-container');
    if (fractionalAdsContainer) {
        fractionalAdsContainer.classList.add('hidden');
    }

    // Show the modal
    pageModal.classList.remove('hidden');
};

// Listen for custom edit page events
document.addEventListener('editPage', (e) => {
    if (e.detail && e.detail.pageBox) {
        window.openEditModal(e.detail.pageBox);
    }
});


