/**
 * Flatplan - Magazine Layout Planning Tool
 * Mixed Page Renderer Module
 *
 * This module handles rendering mixed-type pages based on selected layout templates.
 * It creates appropriate fractional unit elements within a mixed page box,
 * positioning them according to the selected layout, and initializes them with
 * appropriate default properties.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ===================================================
    // SECTION 1: INITIALIZATION
    // ===================================================

    // Initialize the module
    initialize();

    /**
     * Initialize the module
     */
    function initialize() {
        console.log('Mixed page renderer initializing...');
        
        // Render any mixed pages on initial page load
        renderAllMixedPages();

        // Add mutation observer to detect when new mixed pages are added
        setupMutationObserver();
        
        console.log('Mixed page renderer initialization complete');
    }

    /**
     * Sets up a mutation observer to detect when new mixed pages are added
     */
    function setupMutationObserver() {
        const spreadContainer = document.querySelector('.spread-container');
        if (!spreadContainer) return;

        // Create a mutation observer to detect when new mixed pages are added
        const observer = new MutationObserver((mutations) => {
            let shouldCheckMixedPages = false;

            // Check if any new nodes were added
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if any of the added nodes are mixed pages
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE &&
                            node.classList.contains('box') &&
                            node.classList.contains('mixed')) {
                            shouldCheckMixedPages = true;
                        }
                    });
                }
            });

            // If mixed pages were added, render them
            if (shouldCheckMixedPages) {
                renderAllMixedPages();
            }
        });

        // Start observing
        observer.observe(spreadContainer, { childList: true, subtree: true });
    }

    /**
     * Renders all mixed pages on the page
     */
    function renderAllMixedPages() {
        const mixedPages = document.querySelectorAll('.box.mixed');
        console.log(`Found ${mixedPages.length} mixed pages to render`);
        
        mixedPages.forEach(pageBox => {
            const pageId = pageBox.id;
            const isRendered = pageBox.hasAttribute('data-mixed-page-rendered');
            const layoutId = pageBox.getAttribute('data-mixed-page-layout-id');
            const fractionalData = pageBox.getAttribute('data-fractional-ads');
            
            console.log(`Processing mixed page ${pageId}:`, {
                isRendered,
                layoutId,
                hasFractionalData: !!fractionalData
            });
            
            // Check if this page has already been processed
            if (isRendered) {
                console.log(`Skipping ${pageId} - already rendered`);
                return;
            }

            // Get the layout template ID
            if (layoutId) {
                console.log(`Rendering mixed page ${pageId} with template ${layoutId}`);
                renderMixedPage(pageBox, layoutId);
            } else {
                console.warn(`Mixed page ${pageId} has no template ID`);
            }
        });
    }

    // ===================================================
    // SECTION 2: RENDERING FUNCTIONS
    // ===================================================

    /**
     * Renders a mixed page based on its layout template
     * @param {HTMLElement} pageBox - The page box element
     * @param {string} layoutId - The layout template ID
     */
    function renderMixedPage(pageBox, layoutId) {
        console.log(`renderMixedPage called with layoutId: ${layoutId}, pageBox:`, pageBox);
        
        // Get the layout template definition
        const template = getLayoutTemplate(layoutId);
        if (!template) {
            console.error(`Layout template with ID ${layoutId} not found`);
            return;
        }
        
        console.log(`Found template:`, template);

        // Get or create fractional units data
        let fractionalUnits = [];

        // Check if we already have fractional units data
        const storedData = pageBox.getAttribute('data-fractional-ads');
        if (storedData) {
            try {
                fractionalUnits = JSON.parse(storedData);
            } catch (e) {
                console.error('Error parsing fractional units data:', e);
            }
        }

        // Match up existing fractional units with template units
        const matchedUnits = matchFractionalUnitsToTemplate(fractionalUnits, template);

        // Ensure the page box is set up for absolute positioning of children
        setupMixedPageContainer(pageBox);

        // Clear existing fractional units from the page
        clearExistingFractionalUnits(pageBox);

        // Create and add new fractional units based on template
        console.log('Creating fractional units:', matchedUnits);
        createFractionalUnits(pageBox, matchedUnits);

        // Add edit page button for mixed pages
        addEditPageButton(pageBox);

        // Mark the page as rendered
        pageBox.setAttribute('data-mixed-page-rendered', 'true');
        pageBox.setAttribute('data-mixed-page-layout-id', layoutId);
        
        console.log('Mixed page rendering completed');
    }

    /**
     * Gets a layout template by ID
     * @param {string} layoutId - The layout template ID
     * @returns {Object} The layout template object
     */
    function getLayoutTemplate(layoutId) {
        // In a real implementation, this would fetch from the server or a cached store
        // For this prototype, we'll use the same hardcoded templates from mixed-page-selector.js
        const templates = [
            {
                _id: 101,
                name: "Four Quadrants",
                fractional_units: [
                    { unit_id: "top-left", size: "1/4", position: "top-left", default_type: "edit" },
                    { unit_id: "top-right", size: "1/4", position: "top-right", default_type: "ad" },
                    { unit_id: "bottom-left", size: "1/4", position: "bottom-left", default_type: "edit" },
                    { unit_id: "bottom-right", size: "1/4", position: "bottom-right", default_type: "ad" }
                ]
            },
            {
                _id: 102,
                name: "Vertical Split",
                fractional_units: [
                    { unit_id: "left", size: "1/2", position: "left", default_type: "edit" },
                    { unit_id: "right", size: "1/2", position: "right", default_type: "ad" }
                ]
            },
            {
                _id: 103,
                name: "Horizontal Split",
                fractional_units: [
                    { unit_id: "top", size: "1/2", position: "top", default_type: "edit" },
                    { unit_id: "bottom", size: "1/2", position: "bottom", default_type: "ad" }
                ]
            },
            {
                _id: 104,
                name: "Top Split with Bottom Bar",
                fractional_units: [
                    { unit_id: "top-left", size: "1/4", position: "top-left", default_type: "edit" },
                    { unit_id: "top-right", size: "1/4", position: "top-right", default_type: "ad" },
                    { unit_id: "bottom", size: "1/2", position: "bottom", default_type: "edit" }
                ]
            },
            {
                _id: 105,
                name: "Top Bar with Bottom Split",
                fractional_units: [
                    { unit_id: "top", size: "1/2", position: "top", default_type: "edit" },
                    { unit_id: "bottom-left", size: "1/4", position: "bottom-left", default_type: "ad" },
                    { unit_id: "bottom-right", size: "1/4", position: "bottom-right", default_type: "edit" }
                ]
            },
            {
                _id: 106,
                name: "Left Bar with Right Split",
                fractional_units: [
                    { unit_id: "left", size: "1/2", position: "left", default_type: "edit" },
                    { unit_id: "top-right", size: "1/4", position: "top-right", default_type: "ad" },
                    { unit_id: "bottom-right", size: "1/4", position: "bottom-right", default_type: "edit" }
                ]
            },
            {
                _id: 107,
                name: "Right Bar with Left Split",
                fractional_units: [
                    { unit_id: "right", size: "1/2", position: "right", default_type: "ad" },
                    { unit_id: "top-left", size: "1/4", position: "top-left", default_type: "edit" },
                    { unit_id: "bottom-left", size: "1/4", position: "bottom-left", default_type: "edit" }
                ]
            },
            {
                _id: 108,
                name: "1/3 - 2/3 Vertical Split",
                fractional_units: [
                    { unit_id: "left", size: "1/3", position: "left", default_type: "ad" },
                    { unit_id: "right", size: "2/3", position: "right", default_type: "edit" }
                ]
            },
            {
                _id: 109,
                name: "2/3 - 1/3 Vertical Split",
                fractional_units: [
                    { unit_id: "left", size: "2/3", position: "left", default_type: "edit" },
                    { unit_id: "right", size: "1/3", position: "right", default_type: "ad" }
                ]
            }
        ];

        // Convert layoutId to number for comparison
        const id = parseInt(layoutId, 10);
        return templates.find(template => template._id === id);
    }

    /**
     * Matches existing fractional units to template units
     * @param {Array} existingUnits - Existing fractional units data
     * @param {Object} template - Layout template object
     * @returns {Array} Matched fractional units data
     */
    function matchFractionalUnitsToTemplate(existingUnits, template) {
        console.log('Matching fractional units:', {
            existingUnits,
            templateUnits: template.fractional_units
        });
        
        const result = [];

        // Process each template unit
        template.fractional_units.forEach(templateUnit => {
            // Try to find a matching existing unit by position
            const existingUnit = existingUnits.find(unit =>
                unit.position === templateUnit.position && unit.size === templateUnit.size
            );

            if (existingUnit) {
                // Use existing unit data, but ensure it has all required properties
                result.push({
                    id: existingUnit.id || `frac-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    name: existingUnit.name || `${templateUnit.default_type === 'ad' ? 'Advertisement' : 'Editorial'}`,
                    section: existingUnit.section || (templateUnit.default_type === 'ad' ? 'paid' : 'Feature'),
                    size: templateUnit.size,
                    position: templateUnit.position,
                    type: existingUnit.type || templateUnit.default_type
                });
            } else {
                // Create new unit with default properties
                result.push({
                    id: `frac-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    name: `${templateUnit.default_type === 'ad' ? 'Advertisement' : 'Editorial'}`,
                    section: templateUnit.default_type === 'ad' ? 'paid' : 'Feature',
                    size: templateUnit.size,
                    position: templateUnit.position,
                    type: templateUnit.default_type
                });
            }
        });

        return result;
    }

    /**
     * Sets up the mixed page container for proper positioning
     * @param {HTMLElement} pageBox - The page box element
     */
    function setupMixedPageContainer(pageBox) {
        // Ensure the page box has relative positioning to contain absolute children
        const currentPosition = window.getComputedStyle(pageBox).position;
        if (currentPosition === 'static') {
            pageBox.style.position = 'relative';
        }
        
        // Ensure the page box has proper overflow handling
        pageBox.style.overflow = 'hidden';
        
        console.log(`Mixed page container setup - position: ${pageBox.style.position || currentPosition}`);
    }

    /**
     * Clears existing fractional units from a page
     * @param {HTMLElement} pageBox - The page box element
     */
    function clearExistingFractionalUnits(pageBox) {
        // Remove existing fractional units
        pageBox.querySelectorAll('.fractional-unit, .fractional-ad').forEach(el => {
            el.remove();
        });
    }

    /**
     * Creates and adds fractional units to a page
     * @param {HTMLElement} pageBox - The page box element
     * @param {Array} units - Fractional units data
     */
    function createFractionalUnits(pageBox, units) {
        // Create a fractional unit for each unit in the array
        units.forEach(unit => {
            createFractionalUnit(pageBox, unit);
        });

        // Update the page's data attribute with the units data
        const unitsJson = JSON.stringify(units);
        pageBox.setAttribute('data-fractional-ads', unitsJson);
        
        console.log('Stored fractional units data on page:', unitsJson);
        console.log('Page element after storing data:', pageBox);
    }

    /**
     * Creates a single fractional unit element
     * @param {HTMLElement} pageBox - The page box element
     * @param {Object} unitData - The unit data
     */
    function createFractionalUnit(pageBox, unitData) {
        // Create element
        const unitElement = document.createElement('div');
        unitElement.className = 'fractional-unit';

        // Set data attributes
        unitElement.setAttribute('data-id', unitData.id);
        unitElement.setAttribute('data-name', unitData.name);
        unitElement.setAttribute('data-section', unitData.section);
        unitElement.setAttribute('data-size', unitData.size);
        unitElement.setAttribute('data-position', unitData.position);
        unitElement.setAttribute('data-type', unitData.type);

        // Position the unit based on size and position
        positionFractionalUnit(unitElement, unitData.size, unitData.position);

        // Set the background color and interactive styles
        const baseColor = unitData.type === 'edit' ? '#B1FCFE' : '#F19E9C';
        const hoverColor = unitData.type === 'edit' ? '#9CFAFC' : '#F18B89';
        const borderColor = unitData.type === 'edit' ? '#0891B2' : '#DC2626'; // Darker borders
        
        unitElement.style.backgroundColor = baseColor;
        unitElement.style.cursor = 'pointer';
        unitElement.style.transition = 'all 0.2s ease';
        unitElement.style.border = `2px solid ${borderColor}`;
        unitElement.style.borderRadius = '6px';
        unitElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        
        // Add internal padding for content
        unitElement.style.padding = '8px';
        unitElement.style.boxSizing = 'border-box';
        
        // Add hover effects using event listeners (more reliable than CSS hover on dynamic elements)
        unitElement.addEventListener('mouseenter', () => {
            unitElement.style.backgroundColor = hoverColor;
            unitElement.style.borderColor = '#4F46E5';
            unitElement.style.borderWidth = '3px';
            unitElement.style.transform = 'scale(1.02)';
            unitElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            unitElement.style.zIndex = '5';
        });
        
        unitElement.addEventListener('mouseleave', () => {
            unitElement.style.backgroundColor = baseColor;
            unitElement.style.borderColor = borderColor;
            unitElement.style.borderWidth = '2px';
            unitElement.style.transform = 'scale(1)';
            unitElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            unitElement.style.zIndex = '1';
        });

        // Add content - simple text like full page units
        unitElement.innerHTML = `
            <div class="text-xs font-medium text-center flex items-center justify-center h-full">
                ${unitData.name}
            </div>
        `;

        // Add to page
        pageBox.appendChild(unitElement);
    }

    /**
     * Positions a fractional unit based on size and position
     * @param {HTMLElement} unitElement - The unit element
     * @param {string} size - The unit size
     * @param {string} position - The unit position
     */
    function positionFractionalUnit(unitElement, size, position) {
        // CRITICAL: Set absolute positioning for proper layout
        unitElement.style.position = 'absolute';
        
        console.log(`Positioning unit: size=${size}, position=${position}`);
        
        if (size === '1/4') {
            // Quarter page - handle corner positions with small gaps
            const gap = '2px'; // Small gap between units
            switch (position) {
                case 'top-left':
                    unitElement.style.top = gap;
                    unitElement.style.left = gap;
                    unitElement.style.width = `calc(50% - ${gap})`;
                    unitElement.style.height = `calc(50% - ${gap})`;
                    console.log('Applied top-left positioning');
                    break;
                case 'top-right':
                    unitElement.style.top = gap;
                    unitElement.style.right = gap;
                    unitElement.style.width = `calc(50% - ${gap})`;
                    unitElement.style.height = `calc(50% - ${gap})`;
                    console.log('Applied top-right positioning');
                    break;
                case 'bottom-left':
                    unitElement.style.bottom = gap;
                    unitElement.style.left = gap;
                    unitElement.style.width = `calc(50% - ${gap})`;
                    unitElement.style.height = `calc(50% - ${gap})`;
                    console.log('Applied bottom-left positioning');
                    break;
                case 'bottom-right':
                    unitElement.style.bottom = gap;
                    unitElement.style.right = gap;
                    unitElement.style.width = `calc(50% - ${gap})`;
                    unitElement.style.height = `calc(50% - ${gap})`;
                    console.log('Applied bottom-right positioning');
                    break;
                default:
                    console.warn(`Unknown quarter-page position: ${position}`);
            }
        } else {
            // For other sizes, use the standard edge positions with small gaps
            const gap = '2px';
            switch (position) {
                case 'top':
                    unitElement.style.top = gap;
                    unitElement.style.left = gap;
                    unitElement.style.right = gap;
                    unitElement.style.height = `calc(${getSizePercentage(size)} - ${gap})`;
                    break;
                case 'bottom':
                    unitElement.style.bottom = gap;
                    unitElement.style.left = gap;
                    unitElement.style.right = gap;
                    unitElement.style.height = `calc(${getSizePercentage(size)} - ${gap})`;
                    break;
                case 'left':
                    unitElement.style.top = gap;
                    unitElement.style.left = gap;
                    unitElement.style.bottom = gap;
                    unitElement.style.width = `calc(${getSizePercentage(size)} - ${gap})`;
                    break;
                case 'right':
                    unitElement.style.top = gap;
                    unitElement.style.right = gap;
                    unitElement.style.bottom = gap;
                    unitElement.style.width = `calc(${getSizePercentage(size)} - ${gap})`;
                    break;
                default:
                    console.warn(`Unknown position: ${position}`);
            }
        }
        
        console.log(`Final styles for ${position}:`, {
            position: unitElement.style.position,
            top: unitElement.style.top,
            right: unitElement.style.right,
            bottom: unitElement.style.bottom,
            left: unitElement.style.left,
            width: unitElement.style.width,
            height: unitElement.style.height
        });
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

    /**
     * Adds an "Edit Page" button to mixed pages
     * @param {HTMLElement} pageBox - The page box element
     */
    function addEditPageButton(pageBox) {
        // Remove existing edit page button if it exists
        const existingButton = pageBox.querySelector('.edit-page-button');
        if (existingButton) {
            existingButton.remove();
        }

        // Create the edit page button
        const editButton = document.createElement('button');
        editButton.className = 'edit-page-button';
        editButton.innerHTML = `
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
        `;
        
        // Style the button
        editButton.style.position = 'absolute';
        editButton.style.top = '4px';
        editButton.style.right = '4px';
        editButton.style.width = '24px';
        editButton.style.height = '24px';
        editButton.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        editButton.style.border = '1px solid #D1D5DB';
        editButton.style.borderRadius = '4px';
        editButton.style.display = 'flex';
        editButton.style.alignItems = 'center';
        editButton.style.justifyContent = 'center';
        editButton.style.cursor = 'pointer';
        editButton.style.color = '#6B7280';
        editButton.style.transition = 'all 0.2s ease';
        editButton.style.opacity = '0.7';
        editButton.style.zIndex = '10';
        
        // Add hover effects
        editButton.addEventListener('mouseenter', () => {
            editButton.style.backgroundColor = '#F3F4F6';
            editButton.style.borderColor = '#9CA3AF';
            editButton.style.color = '#374151';
            editButton.style.opacity = '1';
            editButton.style.transform = 'scale(1.1)';
        });
        
        editButton.addEventListener('mouseleave', () => {
            editButton.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            editButton.style.borderColor = '#D1D5DB';
            editButton.style.color = '#6B7280';
            editButton.style.opacity = '0.7';
            editButton.style.transform = 'scale(1)';
        });

        // Add click handler to open page editor modal
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Access the page editor functionality
            // The page-editor.js should expose its openEditModal function or we trigger it manually
            if (typeof window.openEditModal === 'function') {
                window.openEditModal(pageBox);
            } else {
                // Fallback: manually trigger the page editor modal
                // We'll create a custom event that page-editor.js can listen for
                const editPageEvent = new CustomEvent('editPage', {
                    detail: { pageBox: pageBox },
                    bubbles: false
                });
                document.dispatchEvent(editPageEvent);
            }
        });

        // Add tooltip
        editButton.title = 'Edit Page Properties';
        
        // Add to page box
        pageBox.appendChild(editButton);
    }

    // ===================================================
    // SECTION 3: PUBLIC API
    // ===================================================

    /**
     * Public API for other modules to interact with the mixed page renderer
     */
    window.mixedPageRenderer = {
        renderMixedPage,
        getLayoutTemplate,
        renderAllMixedPages
    };
});
