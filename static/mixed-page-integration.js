/**
 * Flatplan - Magazine Layout Planning Tool
 * Mixed Page Integration Module
 *
 * This module integrates the template-based mixed page system with the main page editor.
 * It handles the coordination between template selection, page editing, and data persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ===================================================
    // SECTION 1: INITIALIZATION AND INTEGRATION
    // ===================================================

    // Wait for other modules to load, then integrate
    setTimeout(initializeIntegration, 100);

    function initializeIntegration() {
        // Override page editor functions to support template system
        integrateMixedPageHandling();
        
        // Set up event listeners for mixed page workflow
        setupMixedPageEventListeners();
        
        // Initialize any existing mixed pages on load
        initializeExistingMixedPages();
    }

    // ===================================================
    // SECTION 2: PAGE EDITOR INTEGRATION
    // ===================================================

    /**
     * Integrates mixed page handling with the existing page editor
     */
    function integrateMixedPageHandling() {
        // The page editor now handles mixed page saving directly
        // This function just sets up additional support functionality
        console.log('Mixed page integration loaded');
    }

    /**
     * Handles saving mixed pages with template data
     * @param {string} pageId - The page ID being saved
     */
    function handleMixedPageSave(pageId) {
        const templateIdInput = document.getElementById('mixed-page-template-id');
        
        if (templateIdInput && templateIdInput.value) {
            const templateId = templateIdInput.value;
            const pageBox = document.getElementById(pageId);
            
            if (pageBox) {
                // Store the template ID on the page element
                pageBox.setAttribute('data-mixed-page-layout-id', templateId);
                
                // Clear any old fractional ads data
                pageBox.removeAttribute('data-fractional-ads');
                pageBox.removeAttribute('data-mixed-page-rendered');
                
                // Remove any existing fractional elements (they'll be re-rendered)
                pageBox.querySelectorAll('.fractional-unit, .fractional-ad, .editorial-area').forEach(el => {
                    el.remove();
                });
                
                // The mixed-page-renderer will pick this up and render the template
                console.log(`Mixed page ${pageId} saved with template ${templateId}`);
            }
        }
    }

    /**
     * Handles opening the edit modal for mixed pages
     * @param {HTMLElement} pageBox - The page box element
     */
    function handleMixedPageModalOpen(pageBox) {
        // Check if this is a mixed page with a template
        if (pageBox.classList.contains('mixed')) {
            const templateId = pageBox.getAttribute('data-mixed-page-layout-id');
            
            if (templateId) {
                // Pre-select the template in the mixed-page-selector
                setTimeout(() => {
                    const templateElement = document.querySelector(`.layout-template[data-template-id="${templateId}"]`);
                    if (templateElement) {
                        // Trigger template selection
                        templateElement.click();
                    }
                }, 200); // Small delay to ensure templates are loaded
            }
        }
    }

    /**
     * Basic page save implementation (fallback)
     */
    function handleBasicPageSave() {
        const pageId = document.getElementById('edit-page-id').value;
        const pageName = document.getElementById('edit-page-name').value.trim();
        const pageType = document.getElementById('edit-page-type').value;
        const pageSection = document.getElementById('edit-page-section').value.trim();
        
        const pageBox = document.getElementById(pageId);
        if (!pageBox) return;

        // Update basic page info
        updatePageBasicInfo(pageBox, pageName, pageSection);
        updatePageType(pageBox, pageType, pageSection);
        
        // Close modal (assuming it exists)
        const modal = document.getElementById('page-editor-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        showNotification('Page updated', 'success');
    }

    // ===================================================
    // SECTION 3: EVENT LISTENERS
    // ===================================================

    /**
     * Sets up event listeners for mixed page workflow
     */
    function setupMixedPageEventListeners() {
        // Listen for page type changes to handle mixed page UI
        document.addEventListener('change', (e) => {
            if (e.target.id === 'edit-page-type') {
                handlePageTypeChange(e.target.value);
            }
        });

        // Listen for template selections
        document.addEventListener('click', (e) => {
            if (e.target.closest('.layout-template')) {
                const templateElement = e.target.closest('.layout-template');
                handleTemplateSelection(templateElement);
            }
        });
    }

    /**
     * Handles page type changes in the editor
     * @param {string} pageType - The selected page type
     */
    function handlePageTypeChange(pageType) {
        const fractionalAdsContainer = document.getElementById('fractional-ads-container');
        
        if (fractionalAdsContainer) {
            if (pageType === 'mixed') {
                fractionalAdsContainer.classList.add('hidden');
                // The mixed-page-selector will show the template grid
            } else {
                fractionalAdsContainer.classList.add('hidden');
            }
        }
    }

    /**
     * Handles template selection
     * @param {HTMLElement} templateElement - The selected template element
     */
    function handleTemplateSelection(templateElement) {
        const templateId = templateElement.getAttribute('data-template-id');
        const templateName = templateElement.getAttribute('data-template-name');
        
        // Store template selection
        let templateIdInput = document.getElementById('mixed-page-template-id');
        if (!templateIdInput) {
            templateIdInput = document.createElement('input');
            templateIdInput.type = 'hidden';
            templateIdInput.id = 'mixed-page-template-id';
            templateIdInput.name = 'mixed_page_template_id';
            
            // Add to the form
            const form = document.getElementById('page-edit-form');
            if (form) {
                form.appendChild(templateIdInput);
            }
        }
        templateIdInput.value = templateId;
        
        console.log(`Template selected: ${templateName} (ID: ${templateId})`);
    }

    // ===================================================
    // SECTION 4: INITIALIZATION OF EXISTING MIXED PAGES
    // ===================================================

    /**
     * Initializes any existing mixed pages on page load
     */
    function initializeExistingMixedPages() {
        // Find all mixed pages and ensure they have proper template rendering
        document.querySelectorAll('.box.mixed').forEach(pageBox => {
            const templateId = pageBox.getAttribute('data-mixed-page-layout-id');
            
            if (templateId && !pageBox.hasAttribute('data-mixed-page-rendered')) {
                // Let the mixed-page-renderer handle this
                console.log(`Initializing existing mixed page with template ${templateId}`);
            }
        });
    }

    // ===================================================
    // SECTION 5: UTILITY FUNCTIONS
    // ===================================================

    /**
     * Updates basic page information
     * @param {HTMLElement} pageBox - The page box element
     * @param {string} pageName - The page name
     * @param {string} pageSection - The page section
     */
    function updatePageBasicInfo(pageBox, pageName, pageSection) {
        // Update section
        let sectionEl = pageBox.querySelector('.section');
        if (!sectionEl) {
            sectionEl = document.createElement('div');
            sectionEl.className = 'section font-semibold text-xs text-gray-700 mb-0.5';
            pageBox.prepend(sectionEl);
        }
        sectionEl.textContent = pageSection;

        // Update name
        let nameEl = pageBox.querySelector('.name');
        if (!nameEl) {
            const nameWrapper = document.createElement('div');
            nameWrapper.className = 'name-wrapper flex-1 flex items-center justify-center';
            nameEl = document.createElement('div');
            nameEl.className = 'name font-medium text-sm max-w-[90%] break-words text-center text-gray-800';
            nameWrapper.appendChild(nameEl);
            
            if (sectionEl.nextSibling) {
                pageBox.insertBefore(nameWrapper, sectionEl.nextSibling);
            } else {
                pageBox.appendChild(nameWrapper);
            }
        }
        nameEl.textContent = pageName;
    }

    /**
     * Updates page type and styling
     * @param {HTMLElement} pageBox - The page box element
     * @param {string} pageType - The page type
     * @param {string} pageSection - The page section
     */
    function updatePageType(pageBox, pageType, pageSection) {
        // Remove existing type classes
        pageBox.classList.remove('edit', 'ad', 'mixed', 'placeholder', 'unknown');
        pageBox.classList.add(pageType);

        // Set background color
        const bgColors = {
            'edit': '#B1FCFE',
            'ad': '#FFFFA6', 
            'mixed': '#B1FCFE',
            'placeholder': '#F3F4F6',
            'unknown': '#EEEEEE'
        };
        
        pageBox.style.backgroundColor = bgColors[pageType] || bgColors.unknown;
    }

    /**
     * Shows a notification message
     * @param {string} message - The message to display
     * @param {string} type - The type of notification
     */
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 left-4 px-4 py-2 rounded-md shadow-lg text-white ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            'bg-indigo-500'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // ===================================================
    // SECTION 6: PUBLIC API
    // ===================================================

    // Export functions that other modules might need
    window.mixedPageIntegration = {
        handleTemplateSelection,
        initializeExistingMixedPages,
        updatePageBasicInfo,
        updatePageType
    };
});