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

    /**
     * Cleans up existing event listeners to prevent duplicates
     */
    function cleanupEventListeners() {
        // Store references to avoid memory leaks
        if (window.pageEditorEventListeners) {
            // Previous listeners exist, remove them if possible
            console.log('Cleaning up previous page editor event listeners');
        }
        window.pageEditorEventListeners = true;
    }

    /**
     * Handles form submission
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        savePageEdits();
    }

    /**
     * Handles outside click events for modal closing
     */
    function handleOutsideClick(event) {
        if (layoutModal && event.target === layoutModal) {
            closeLayoutEditModal();
        }
        if (pageModal && event.target === pageModal) {
            closeModal();
        }
    }

    // Cleanup any existing event listeners to prevent duplicates
    cleanupEventListeners();

    // Initialize section selection handling
    if (sectionSelect) {
        sectionSelect.removeEventListener('change', handleSectionChange);
        sectionSelect.addEventListener('change', handleSectionChange);
    }

    // Page type change handler
    if (pageTypeSelect) {
        pageTypeSelect.removeEventListener('change', handlePageTypeChange);
        pageTypeSelect.addEventListener('change', handlePageTypeChange);
    }

    // Initialize layout edit buttons
    initializeLayoutEditButtons();

    // Set global event handler for dynamically added elements (only once)
    if (!document.hasGlobalClickHandler) {
        document.addEventListener('click', handleGlobalClick);
        document.hasGlobalClickHandler = true;
    }

    // Make pages clickable to edit
    initializePageBoxes();

    // Close modal handlers
    if (closeModalBtn) {
        closeModalBtn.removeEventListener('click', closeModal);
        closeModalBtn.addEventListener('click', closeModal);
    }
    if (cancelEditBtn) {
        cancelEditBtn.removeEventListener('click', closeModal);
        cancelEditBtn.addEventListener('click', closeModal);
    }

    // Form submission handler
    if (editForm) {
        editForm.removeEventListener('submit', handleFormSubmit);
        editForm.addEventListener('submit', handleFormSubmit);
    }

    // Delete page handler
    if (deletePageBtn) {
        deletePageBtn.removeEventListener('click', deletePage);
        deletePageBtn.addEventListener('click', deletePage);
    }

    // Add new page handler
    if (addPageBtn) {
        addPageBtn.removeEventListener('click', addNewPage);
        addPageBtn.addEventListener('click', addNewPage);
    }

    // Close modal if clicking outside of it (only once)
    if (!window.hasOutsideClickHandler) {
        window.addEventListener('click', handleOutsideClick);
        window.hasOutsideClickHandler = true;
    }

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
        const pageType = this.value;
        
        // Handle section dropdown visibility and value for mixed pages
        updateSectionDropdownForPageType(pageType);
    }

    /**
     * Updates section dropdown and page name field based on page type
     * @param {string} pageType - The selected page type
     */
    function updateSectionDropdownForPageType(pageType) {
        const sectionSelect = document.getElementById('edit-page-section');
        const sectionContainer = sectionSelect?.closest('div');
        
        if (!sectionSelect || !sectionContainer) return;
        
        // Remove any existing help text
        const existingHelpText = sectionContainer.querySelector('.page-type-help');
        if (existingHelpText) {
            existingHelpText.remove();
        }
        
        // Clear and repopulate dropdown based on page type
        populateContextualSectionDropdown(pageType, sectionSelect, sectionContainer);
        
        // Handle page name field for mixed pages
        updatePageNameForPageType(pageType);
    }

    /**
     * Updates page name field based on page type
     * @param {string} pageType - The selected page type
     */
    function updatePageNameForPageType(pageType) {
        const pageNameInput = document.getElementById('edit-page-name');
        const pageNameContainer = pageNameInput?.closest('div');
        
        if (!pageNameInput || !pageNameContainer) return;
        
        // Remove any existing help text for page name
        const existingHelpText = pageNameContainer.querySelector('.page-name-help');
        if (existingHelpText) {
            existingHelpText.remove();
        }
        
        if (pageType === 'mixed') {
            // For mixed pages, set name to "Fractional" and make it read-only
            pageNameInput.value = 'Fractional';
            pageNameInput.disabled = false; // Keep enabled for form submission
            pageNameInput.readOnly = true;
            pageNameInput.style.backgroundColor = '#f9fafb'; // Visual indication it's readonly
            pageNameInput.style.cursor = 'not-allowed';
            
            // Add explanatory text
            const helpElement = document.createElement('p');
            helpElement.className = 'text-xs text-gray-500 mt-1 page-name-help';
            helpElement.textContent = 'Mixed pages have a fixed name "Fractional" since content is defined at the unit level.';
            pageNameContainer.appendChild(helpElement);
        } else if (pageType === 'placeholder') {
            // For placeholder pages, set name to "Open" and make it read-only
            pageNameInput.value = 'Open';
            pageNameInput.disabled = false; // Keep enabled for form submission
            pageNameInput.readOnly = true;
            pageNameInput.style.backgroundColor = '#f9fafb'; // Visual indication it's readonly
            pageNameInput.style.cursor = 'not-allowed';
            
            // Add explanatory text
            const helpElement = document.createElement('p');
            helpElement.className = 'text-xs text-gray-500 mt-1 page-name-help';
            helpElement.textContent = 'Placeholder pages have a fixed name "Open" indicating available space in the layout.';
            pageNameContainer.appendChild(helpElement);
        } else {
            // For editable pages, enable page name input
            pageNameInput.disabled = false;
            pageNameInput.readOnly = false;
            pageNameInput.style.backgroundColor = '';
            pageNameInput.style.cursor = '';
            
            // If it was previously set to a fixed value, reset to a more appropriate default
            if (pageNameInput.value === 'Fractional' || pageNameInput.value === 'Open') {
                pageNameInput.value = 'New Page';
            }
        }
    }

    /**
     * Populates section dropdown with contextual options based on page type
     * @param {string} pageType - The selected page type
     * @param {HTMLElement} sectionSelect - The section select element
     * @param {HTMLElement} sectionContainer - The container div
     */
    function populateContextualSectionDropdown(pageType, sectionSelect, sectionContainer) {
        // Clear existing options
        sectionSelect.innerHTML = '';
        
        let sections = [];
        let helpText = '';
        let isFixed = false;
        
        switch (pageType) {
            case 'mixed':
                sections = [{ value: 'Mixed', label: 'Mixed Content Page' }];
                helpText = 'Mixed pages have "Mixed" as their page-level section. Individual content areas within the page will have their own sections.';
                isFixed = true;
                break;
                
            case 'placeholder':
                sections = [{ value: 'Placeholder', label: 'Placeholder Page' }];
                helpText = 'Placeholder pages are used for layout planning and have a fixed section type.';
                isFixed = true;
                break;
                
            case 'edit':
                sections = [
                    { value: 'FOB', label: 'Front of Book' },
                    { value: 'Feature', label: 'Feature' },
                    { value: 'BOB', label: 'Back of Book' },
                    { value: 'Cover', label: 'Cover' }
                ];
                helpText = 'Editorial pages can be assigned to different editorial sections.';
                break;
                
            case 'ad':
                sections = [
                    { value: 'paid', label: 'Paid Advertisement' },
                    { value: 'house', label: 'House Advertisement' },
                    { value: 'Bonus', label: 'Bonus Advertisement' },
                    { value: 'Promo', label: 'Promotional Advertisement' }
                ];
                helpText = 'Advertisement pages can be categorized by their commercial type.';
                break;
                
            default:
                // Fallback for unknown page types
                sections = [
                    { value: 'FOB', label: 'Front of Book' },
                    { value: 'Feature', label: 'Feature' },
                    { value: 'BOB', label: 'Back of Book' }
                ];
                break;
        }
        
        // Add sections to dropdown
        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.value;
            option.textContent = section.label;
            sectionSelect.appendChild(option);
        });
        
        // For fixed types, make the dropdown readonly but keep enabled for form submission
        if (isFixed) {
            sectionSelect.disabled = false; // Keep enabled for form submission
            sectionSelect.style.backgroundColor = '#f9fafb'; // Visual indication it's readonly
            sectionSelect.style.cursor = 'not-allowed';
            sectionSelect.style.pointerEvents = 'none'; // Prevent dropdown opening
            sectionSelect.value = sections[0].value;
        } else {
            sectionSelect.disabled = false;
            sectionSelect.style.backgroundColor = '';
            sectionSelect.style.cursor = '';
            sectionSelect.style.pointerEvents = '';
            // Try to preserve current selection if it exists in new options
            const currentValue = sectionSelect.getAttribute('data-current-value');
            if (currentValue && sections.some(s => s.value === currentValue)) {
                sectionSelect.value = currentValue;
            } else {
                sectionSelect.value = sections[0].value; // Default to first option
            }
        }
        
        // Add help text
        if (helpText) {
            const helpElement = document.createElement('p');
            helpElement.className = 'text-xs text-gray-500 mt-1 page-type-help';
            helpElement.textContent = helpText;
            sectionContainer.appendChild(helpElement);
        }
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

        // Handle section dropdown for mixed pages
        updateSectionDropdownForPageType(pageType);

        // Mixed pages are handled by the template system

        // Show the modal
        pageModal.classList.remove('hidden');
    }



    /**
     * Populates the section dropdown with options (legacy function - now uses contextual system)
     * @param {string} currentSection - The current section to select
     */
    function populateSectionDropdown(currentSection) {
        const sectionSelect = document.getElementById('edit-page-section');
        if (!sectionSelect) return;

        // Store the current section for preservation during page type changes
        if (currentSection) {
            sectionSelect.setAttribute('data-current-value', currentSection);
        }

        // The contextual system will be called by updateSectionDropdownForPageType
        // This function is now mainly for preserving the current value
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
     * Opens the page edit modal for creating a new page
     * @param {string} newPageId - The ID for the new page
     * @param {number} newPageNumber - The page number for the new page
     */
    function openNewPageModal(newPageId, newPageNumber) {
        // Fill the form with default values for a new page
        document.getElementById('edit-page-id').value = newPageId;
        document.getElementById('edit-page-name').value = 'New Page';
        document.getElementById('edit-page-type').value = 'placeholder';
        document.getElementById('edit-page-number').value = newPageNumber;
        document.getElementById('modal-title').textContent = `Add New Page ${newPageNumber}`;

        // Set default form break checkbox
        if (document.getElementById('edit-page-form-break')) {
            document.getElementById('edit-page-form-break').checked = false;
        }

        // Build section dropdown with default "New" section
        populateSectionDropdown('New');

        // Handle mixed page section visibility
        updateSectionDropdownForPageType('placeholder');

        // Mark the modal as being in "new page" mode
        pageModal.setAttribute('data-mode', 'new-page');

        // Show the modal
        pageModal.classList.remove('hidden');
    }

    /**
     * Closes the page edit modal
     */
    function closeModal() {
        // Check if we're in "new page" mode and clean up
        if (pageModal.getAttribute('data-mode') === 'new-page') {
            // Reset the mode
            pageModal.removeAttribute('data-mode');
        }
        
        pageModal.classList.add('hidden');
    }

    /**
     * Saves page edits to the UI (changes will be committed to DB on layout save)
     */
    function savePageEdits() {
        console.log('savePageEdits called');
        
        const pageId = document.getElementById('edit-page-id').value;
        let pageName = document.getElementById('edit-page-name').value.trim();
        const pageType = document.getElementById('edit-page-type').value;
        let pageSection = document.getElementById('edit-page-section').value.trim();
        const formBreak = document.getElementById('edit-page-form-break').checked;
        const pageNumber = document.getElementById('edit-page-number').value;

        console.log('Form values:', { pageId, pageName, pageType, pageSection, formBreak, pageNumber });

        let pageBox = document.getElementById(pageId);
        const isNewPage = pageModal.getAttribute('data-mode') === 'new-page';

        // For fixed page types, always set section and name to appropriate fixed values
        if (pageType === 'mixed') {
            pageSection = 'Mixed';
            pageName = 'Fractional'; // Fixed name for mixed pages
            console.log('Fixed values for mixed page:', { pageSection, pageName });
        } else if (pageType === 'placeholder') {
            pageSection = 'Placeholder';
            pageName = 'Open'; // Fixed name for placeholder pages
            console.log('Fixed values for placeholder page:', { pageSection, pageName });
        }

        // Validate that we have all required values
        if (!pageId || !pageName || !pageType || !pageSection || !pageNumber) {
            console.error('Missing required form values:', { pageId, pageName, pageType, pageSection, pageNumber });
            showNotification('Missing required page information', 'error');
            return;
        }

        // If this is a new page, create it now
        if (isNewPage) {
            console.log('Creating new page element...');
            pageBox = createNewPageElement(pageId, pageName, pageSection, pageType, pageNumber, formBreak);
            if (!pageBox) {
                console.error('Failed to create page element');
                showNotification('Error creating page', 'error');
                return;
            }
            console.log('Page element created successfully:', pageBox);
        }

        // Handle mixed page template selection
        if (pageType === 'mixed') {
            console.log('Handling mixed page save...');
            handleMixedPageSave(pageBox);
        }

        // Update the page element (for both new and existing pages)
        console.log('Updating page info...');
        updatePageBasicInfo(pageBox, pageName, pageSection);
        updatePageType(pageBox, pageType, pageSection);
        updateFormBreak(pageBox, formBreak);

        // Close the modal
        console.log('Closing modal and showing notification...');
        closeModal();

        // Show notification
        if (isNewPage) {
            showNotification('New page added', 'success');
        } else {
            showNotification('Page updated', 'success');
        }
        
        console.log('savePageEdits completed successfully');
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

        // Special handling for mixed pages - hide section immediately
        if (pageType === 'mixed') {
            const sectionElement = pageBox.querySelector('.section');
            if (sectionElement) {
                sectionElement.style.display = 'none';
                sectionElement.style.visibility = 'hidden';
                sectionElement.style.opacity = '0';
                sectionElement.classList.add('mixed-page-section-hidden');
            }
        } else {
            // For non-mixed pages, ensure section is visible
            const sectionElement = pageBox.querySelector('.section');
            if (sectionElement) {
                sectionElement.style.display = '';
                sectionElement.style.visibility = '';
                sectionElement.style.opacity = '';
                sectionElement.classList.remove('mixed-page-section-hidden');
            }
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
     * Creates a new page element and adds it to the layout
     * @param {string} pageId - The page ID
     * @param {string} pageName - The page name
     * @param {string} pageSection - The page section
     * @param {string} pageType - The page type
     * @param {number} pageNumber - The page number
     * @param {boolean} formBreak - Whether the page has a form break
     * @returns {HTMLElement|null} The created page element or null if failed
     */
    function createNewPageElement(pageId, pageName, pageSection, pageType, pageNumber, formBreak) {
        const spreadContainer = document.querySelector('.spread-container');
        if (!spreadContainer) {
            console.error('Spread container not found');
            return null;
        }

        // Create a new page element
        const newPage = document.createElement('div');
        newPage.id = pageId;
        newPage.className = `box ${pageType} rounded border relative p-3 aspect-[3/4] w-32 text-center flex flex-col justify-start select-none mr-2.5 shadow-sm`;

        newPage.innerHTML = `
            <div class="section font-semibold text-xs text-gray-700 mb-0.5">${pageSection}</div>
            <div class="name-wrapper flex-1 flex items-center justify-center">
                <div class="name font-medium text-sm max-w-[90%] break-words text-center text-gray-800">${pageName}</div>
            </div>
            <div class="page-number ${pageNumber % 2 === 0 ? 'even' : 'odd'} text-gray-500 text-xs">${pageNumber}</div>
        `;

        // Set initial styling based on page type and section
        updatePageType(newPage, pageType, pageSection);
        updateFormBreak(newPage, formBreak);

        // Add the new page to the end of the spread container
        spreadContainer.appendChild(newPage);

        // Remove the empty state message if it exists
        const emptyStateMessage = document.querySelector('.text-center.py-12.bg-gray-50.rounded-lg');
        if (emptyStateMessage) {
            emptyStateMessage.classList.add('hidden');
        }

        // Update page numbers for all pages
        updatePageNumbers();

        // Make the new page clickable
        newPage.addEventListener('click', (e) => {
            // For mixed pages, only allow editing through the edit button
            if (newPage.classList.contains('mixed')) {
                if (!e.target.closest('.edit-page-button')) {
                    return;
                }
            }
            
            if (e.currentTarget === newPage) {
                openEditModal(newPage);
            }
        });

        return newPage;
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

    // Open the edit modal in "add new page" mode
    openNewPageModal(newPageId, newPageNumber);
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

        // Get page type
        let pageType = 'unknown';
        if (box.classList.contains('edit')) pageType = 'edit';
        else if (box.classList.contains('ad')) pageType = 'ad';
        else if (box.classList.contains('mixed')) pageType = 'mixed';
        else if (box.classList.contains('placeholder')) pageType = 'placeholder';

        // Get page name - for fixed page types, use fixed values
        let name;
        if (pageType === 'mixed') {
            name = 'Fractional';
        } else if (pageType === 'placeholder') {
            name = 'Open';
        } else {
            name = box.querySelector('.name')?.textContent.trim() || '';
        }

        // Get section - for fixed page types, use fixed values
        let section;
        if (pageType === 'mixed') {
            section = 'Mixed';
        } else if (pageType === 'placeholder') {
            section = 'Placeholder';
        } else {
            section = box.querySelector('.section')?.textContent.trim() || '';
        }

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


