/**
 * Flatplan - Magazine Layout Planning Tool
 * Mixed Page Selector Module
 *
 * This module handles the layout template selection for mixed-type pages (editorial + ads)
 * Presents a grid of layout thumbnails when the user selects "Mixed" as the page type
 * in the page editor modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ===================================================
    // SECTION 1: INITIALIZATION AND EVENT LISTENERS
    // ===================================================

    // Reference the page type select element
    const pageTypeSelect = document.getElementById('edit-page-type');

    // Layout templates container reference (will be added dynamically)
    let layoutTemplatesContainer = null;

    // Initialize event listeners
    initializeEventListeners();

    /**
     * Initialize all event listeners for the mixed page selector
     */
    function initializeEventListeners() {
        // Listen for changes to the page type dropdown
        if (pageTypeSelect) {
            pageTypeSelect.addEventListener('change', handlePageTypeChange);
        }

        // Delegate click events for layout template selection
        document.addEventListener('click', (e) => {
            const layoutTemplate = e.target.closest('.layout-template');
            if (layoutTemplate) {
                selectLayoutTemplate(layoutTemplate);
            }
        });
    }

    /**
     * Handle changes to the page type dropdown
     */
    function handlePageTypeChange() {
        if (this.value === 'mixed') {
            // Show the mixed layout selector instead of fractional ads
            showLayoutTemplatesGrid();
        } else {
            // Hide the layout templates grid if it exists
            hideLayoutTemplatesGrid();
        }
    }

    // ===================================================
    // SECTION 2: LAYOUT TEMPLATES GRID
    // ===================================================

    /**
     * Shows the layout templates grid for selection
     * This replaces the fractional ads container
     */
    function showLayoutTemplatesGrid() {
        // Get the fractional ads container (to replace or hide)
        const fractionalAdsContainer = document.getElementById('fractional-ads-container');

        if (!fractionalAdsContainer) return;

        // Hide the fractional ads container
        fractionalAdsContainer.classList.add('hidden');

        // Check if layout templates container already exists
        if (!layoutTemplatesContainer) {
            createLayoutTemplatesContainer();
        }

        // Show layout templates container
        layoutTemplatesContainer.classList.remove('hidden');

        // Fetch layout templates and populate the grid
        fetchAndPopulateLayoutTemplates();
    }

    /**
     * Hides the layout templates grid
     */
    function hideLayoutTemplatesGrid() {
        if (layoutTemplatesContainer) {
            layoutTemplatesContainer.classList.add('hidden');
        }
    }

    /**
     * Creates the container for layout templates grid
     */
    function createLayoutTemplatesContainer() {
        // Create container
        layoutTemplatesContainer = document.createElement('div');
        layoutTemplatesContainer.id = 'layout-templates-container';
        layoutTemplatesContainer.className = 'mt-4 border-t pt-4';

        // Add heading and description
        layoutTemplatesContainer.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h4 class="text-gray-700 text-sm font-medium">Select Page Layout</h4>
            </div>
            <div class="text-xs text-gray-500 mb-3">
                Choose a layout template for this mixed content page. You will be able to define content for each section after selection.
            </div>
            <div id="layout-templates-grid" class="grid grid-cols-3 gap-3">
                <!-- Layout templates will be inserted here -->
                <div class="flex justify-center items-center p-4 h-24 bg-gray-100 rounded-md">
                    <span class="text-gray-400 text-sm">Loading templates...</span>
                </div>
            </div>
            <div id="layout-templates-info" class="mt-3 text-xs text-gray-500 hidden">
                Selected layout: <span id="selected-layout-name" class="font-medium"></span>
            </div>
            <input type="hidden" id="selected-layout-id" name="layout_template_id" value="">
        `;

        // Insert after the fractional-ads-container
        const fractionalAdsContainer = document.getElementById('fractional-ads-container');
        if (fractionalAdsContainer && fractionalAdsContainer.parentNode) {
            fractionalAdsContainer.parentNode.insertBefore(
                layoutTemplatesContainer,
                fractionalAdsContainer.nextSibling
            );
        }
    }

    /**
     * Fetches layout templates from the server and populates the grid
     * In a real implementation, this would make an AJAX call to fetch
     * templates from the server. For this prototype, we'll use hardcoded data.
     */
    function fetchAndPopulateLayoutTemplates() {
        // In a real implementation, this would be an AJAX call
        // For now, we'll use a hardcoded array of layout templates
        const layoutTemplates = getLayoutTemplates();

        // Populate the grid with the templates
        populateLayoutTemplatesGrid(layoutTemplates);
    }

    /**
     * Returns an array of layout templates
     * This is a placeholder for the actual server data
     * @returns {Array} Array of layout template objects
     */
    function getLayoutTemplates() {
        return [
            {
                _id: 101,
                name: "Four Quadrants",
                description: "Page divided into four equal quadrants",
                svg_thumbnail: `<svg viewBox="0 0 3 4" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <rect x="0" y="0" width="3" height="4" fill="#f3f4f6" stroke="#aaa" stroke-width="0.05"/>
                  <line x1="1.5" y1="0" x2="1.5" y2="4" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                  <line x1="0" y1="2" x2="3" y2="2" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                </svg>`
            },
            {
                _id: 102,
                name: "Vertical Split",
                description: "Page split into left and right halves",
                svg_thumbnail: `<svg viewBox="0 0 3 4" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <rect x="0" y="0" width="3" height="4" fill="#f3f4f6" stroke="#aaa" stroke-width="0.05"/>
                  <line x1="1.5" y1="0" x2="1.5" y2="4" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                </svg>`
            },
            {
                _id: 103,
                name: "Horizontal Split",
                description: "Page split into top and bottom halves",
                svg_thumbnail: `<svg viewBox="0 0 3 4" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <rect x="0" y="0" width="3" height="4" fill="#f3f4f6" stroke="#aaa" stroke-width="0.05"/>
                  <line x1="0" y1="2" x2="3" y2="2" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                </svg>`
            },
            {
                _id: 104,
                name: "Top Split with Bottom Bar",
                description: "Top half split vertically, bottom half as one unit",
                svg_thumbnail: `<svg viewBox="0 0 3 4" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <rect x="0" y="0" width="3" height="4" fill="#f3f4f6" stroke="#aaa" stroke-width="0.05"/>
                  <line x1="1.5" y1="0" x2="1.5" y2="2" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                  <line x1="0" y1="2" x2="3" y2="2" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                </svg>`
            },
            {
                _id: 105,
                name: "Top Bar with Bottom Split",
                description: "Top half as one unit, bottom half split vertically",
                svg_thumbnail: `<svg viewBox="0 0 3 4" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <rect x="0" y="0" width="3" height="4" fill="#f3f4f6" stroke="#aaa" stroke-width="0.05"/>
                  <line x1="1.5" y1="2" x2="1.5" y2="4" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                  <line x1="0" y1="2" x2="3" y2="2" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                </svg>`
            },
            {
                _id: 106,
                name: "Left Bar with Right Split",
                description: "Left half as one unit, right half split horizontally",
                svg_thumbnail: `<svg viewBox="0 0 3 4" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <rect x="0" y="0" width="3" height="4" fill="#f3f4f6" stroke="#aaa" stroke-width="0.05"/>
                  <line x1="1.5" y1="0" x2="1.5" y2="4" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                  <line x1="1.5" y1="2" x2="3" y2="2" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                </svg>`
            },
            {
                _id: 107,
                name: "Right Bar with Left Split",
                description: "Right half as one unit, left half split horizontally",
                svg_thumbnail: `<svg viewBox="0 0 3 4" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <rect x="0" y="0" width="3" height="4" fill="#f3f4f6" stroke="#aaa" stroke-width="0.05"/>
                  <line x1="1.5" y1="0" x2="1.5" y2="4" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                  <line x1="0" y1="2" x2="1.5" y2="2" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                </svg>`
            },
            {
                _id: 108,
                name: "1/3 - 2/3 Vertical Split",
                description: "Page split vertically with 1/3 left and 2/3 right",
                svg_thumbnail: `<svg viewBox="0 0 3 4" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <rect x="0" y="0" width="3" height="4" fill="#f3f4f6" stroke="#aaa" stroke-width="0.05"/>
                  <line x1="1" y1="0" x2="1" y2="4" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                </svg>`
            },
            {
                _id: 109,
                name: "2/3 - 1/3 Vertical Split",
                description: "Page split vertically with 2/3 left and 1/3 right",
                svg_thumbnail: `<svg viewBox="0 0 3 4" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <rect x="0" y="0" width="3" height="4" fill="#f3f4f6" stroke="#aaa" stroke-width="0.05"/>
                  <line x1="2" y1="0" x2="2" y2="4" stroke="black" stroke-width="0.02" stroke-dasharray="0.1,0.1"/>
                </svg>`
            }
        ];
    }

    /**
     * Populates the layout templates grid with templates
     * @param {Array} templates - Array of layout template objects
     */
    function populateLayoutTemplatesGrid(templates) {
        const grid = document.getElementById('layout-templates-grid');
        if (!grid) return;

        // Clear the grid
        grid.innerHTML = '';

        // Add each template to the grid
        templates.forEach(template => {
            const templateElement = document.createElement('div');
            templateElement.className = 'layout-template cursor-pointer border rounded-md hover:border-indigo-500 transition-colors p-2 flex flex-col items-center';
            templateElement.setAttribute('data-template-id', template._id);
            templateElement.setAttribute('data-template-name', template.name);

            // Set inner HTML with SVG and title
            templateElement.innerHTML = `
                <div class="mb-1 w-full aspect-[3/4] flex items-center justify-center">
                    ${template.svg_thumbnail}
                </div>
                <span class="text-xs text-center font-medium truncate w-full">${template.name}</span>
            `;

            // Add to grid
            grid.appendChild(templateElement);
        });
    }

    /**
     * Handles the selection of a layout template
     * @param {HTMLElement} templateElement - The selected template element
     */
    function selectLayoutTemplate(templateElement) {
        // Get the template ID and name
        const templateId = templateElement.getAttribute('data-template-id');
        const templateName = templateElement.getAttribute('data-template-name');

        // Update the hidden input with the selected template ID
        const selectedLayoutIdInput = document.getElementById('selected-layout-id');
        if (selectedLayoutIdInput) {
            selectedLayoutIdInput.value = templateId;
        }

        // Update the info text
        const layoutTemplatesInfo = document.getElementById('layout-templates-info');
        const selectedLayoutName = document.getElementById('selected-layout-name');
        if (layoutTemplatesInfo && selectedLayoutName) {
            layoutTemplatesInfo.classList.remove('hidden');
            selectedLayoutName.textContent = templateName;
        }

        // Highlight the selected template and remove highlight from others
        const allTemplates = document.querySelectorAll('.layout-template');
        allTemplates.forEach(template => {
            template.classList.remove('border-indigo-500', 'border-2', 'bg-indigo-50');
            template.classList.add('border');
        });

        templateElement.classList.remove('border');
        templateElement.classList.add('border-indigo-500', 'border-2', 'bg-indigo-50');

        // Replace the fractional ads container with a message
        showSelectedTemplateMessage(templateId, templateName);
    }

    /**
     * Shows a message indicating the selected template
     * @param {string} templateId - The ID of the selected template
     * @param {string} templateName - The name of the selected template
     */
    function showSelectedTemplateMessage(templateId, templateName) {
        // Get the fractional ads container
        const fractionalAdsContainer = document.getElementById('fractional-ads-container');
        if (!fractionalAdsContainer) return;

        // Create a hidden input to store the template ID
        let templateIdInput = document.getElementById('mixed-page-template-id');
        if (!templateIdInput) {
            templateIdInput = document.createElement('input');
            templateIdInput.type = 'hidden';
            templateIdInput.id = 'mixed-page-template-id';
            templateIdInput.name = 'mixed_page_template_id';
            fractionalAdsContainer.appendChild(templateIdInput);
        }
        templateIdInput.value = templateId;

        // Update the innerHTML of the fractional ads container
        const fractionalAdsList = document.getElementById('fractional-ads-list');
        if (fractionalAdsList) {
            fractionalAdsList.innerHTML = `
                <div class="p-3 bg-indigo-50 rounded-md text-sm">
                    <div class="font-medium text-indigo-700">Layout "${templateName}" selected</div>
                    <p class="text-gray-700 mt-1">After saving, you'll be able to click on each section to define its content.</p>
                </div>
            `;
        }

        // Show the fractional ads container
        fractionalAdsContainer.classList.remove('hidden');
    }

    // ===================================================
    // SECTION 3: INITIALIZATION ON PAGE LOAD
    // ===================================================

    /**
     * Check if we should show the layout selector on page load
     * (in case the page is already set to mixed type)
     */
    function initializeOnPageLoad() {
        if (pageTypeSelect && pageTypeSelect.value === 'mixed') {
            // Show the layout templates grid
            showLayoutTemplatesGrid();

            // Check if a template ID is already selected
            const templateIdInput = document.getElementById('mixed-page-template-id');
            if (templateIdInput && templateIdInput.value) {
                // Find and select the template
                const templateId = templateIdInput.value;
                setTimeout(() => {
                    const templateElement = document.querySelector(`.layout-template[data-template-id="${templateId}"]`);
                    if (templateElement) {
                        selectLayoutTemplate(templateElement);
                    }
                }, 100); // Small delay to ensure templates are loaded
            }
        }
    }

    // Initialize on page load
    initializeOnPageLoad();
});
