/**
 * Flatplan - Magazine Layout Planning Tool
 * Fractional Unit Editor Module
 *
 * This module handles editing individual fractional units within a mixed page.
 * It is responsible for showing a modal dialog when a user clicks on a fractional area
 * and allowing them to edit the properties of that specific unit.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ===================================================
    // SECTION 1: DOM ELEMENT SELECTION AND INITIALIZATION
    // ===================================================

    // Fractional unit editor modal elements
    let fractionalUnitModal = null;
    let editingFractionalUnit = null; // Currently editing fractional unit

    // Initialize the module
    initialize();

    /**
     * Initialize the module
     */
    function initialize() {
        // Create the fractional unit editor modal if it doesn't exist
        createFractionalUnitModal();

        // Add event listener for clicks on fractional units
        document.addEventListener('click', handleFractionalUnitClick);

        // Handle clicks on close and save buttons in the modal
        document.addEventListener('click', handleModalButtonClicks);
        
        // Add content type change handler for contextual section dropdown
        document.addEventListener('change', handleContentTypeChange);
    }

    /**
     * Create the fractional unit editor modal if it doesn't exist
     */
    function createFractionalUnitModal() {
        // Check if the modal already exists
        if (document.getElementById('fractional-unit-modal')) {
            fractionalUnitModal = document.getElementById('fractional-unit-modal');
            return;
        }

        // Create the modal element
        fractionalUnitModal = document.createElement('div');
        fractionalUnitModal.id = 'fractional-unit-modal';
        fractionalUnitModal.className = 'fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center hidden z-50';

        // Set the modal content
        fractionalUnitModal.innerHTML = `
            <div class="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-lg w-full">
                <div class="bg-indigo-600 py-4 px-6 flex justify-between items-center">
                    <h3 class="text-white text-lg font-bold" id="fractional-unit-modal-title">Edit Fractional Unit</h3>
                    <button type="button" id="close-fractional-unit-modal-btn" class="text-white hover:text-gray-200">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form id="fractional-unit-edit-form" class="p-6">
                    <input type="hidden" id="edit-fractional-unit-id" name="unit_id">
                    <input type="hidden" id="edit-fractional-unit-position" name="unit_position">
                    <input type="hidden" id="edit-fractional-unit-size" name="unit_size">

                    <div class="space-y-4">
                        <div>
                            <label for="edit-fractional-unit-name" class="block text-gray-700 text-sm font-medium mb-2">Name</label>
                            <input type="text" id="edit-fractional-unit-name" name="unit_name"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        </div>

                        <div>
                            <label for="edit-fractional-unit-type" class="block text-gray-700 text-sm font-medium mb-2">Content Type</label>
                            <select id="edit-fractional-unit-type" name="unit_type"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="edit">Editorial</option>
                                <option value="ad">Advertisement</option>
                            </select>
                        </div>

                        <div>
                            <label for="edit-fractional-unit-section" class="block text-gray-700 text-sm font-medium mb-2">Section</label>
                            <select id="edit-fractional-unit-section" name="unit_section"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <!-- Options will be populated dynamically based on content type -->
                            </select>
                        </div>

                        <div class="flex items-center justify-end pt-4">
                            <div class="space-x-2">
                                <button type="button" id="cancel-fractional-unit-edit-btn"
                                    class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Cancel
                                </button>
                                <button type="submit" id="save-fractional-unit-edit-btn"
                                    class="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;

        // Add the modal to the body
        document.body.appendChild(fractionalUnitModal);
    }

    // ===================================================
    // SECTION 2: EVENT HANDLERS
    // ===================================================

    /**
     * Handle clicks on fractional units
     * @param {Event} e - Click event
     */
    function handleFractionalUnitClick(e) {
        // Check if the click was on a fractional unit
        const fractionalUnit = e.target.closest('.fractional-unit');
        if (!fractionalUnit) return;

        // Stop the event from bubbling up to the page box
        e.stopPropagation();
        e.preventDefault();

        // Don't process if we're in drag mode
        if (document.querySelector('.drag-ghost')) return;

        // Open the editor modal for this fractional unit
        openFractionalUnitEditor(fractionalUnit);
    }

    /**
     * Handle content type changes to update section dropdown contextually
     * @param {Event} e - Change event
     */
    function handleContentTypeChange(e) {
        // Only handle changes to the fractional unit content type dropdown
        if (e.target.id === 'edit-fractional-unit-type') {
            const contentType = e.target.value;
            updateFractionalUnitSectionDropdown(contentType);
        }
    }

    /**
     * Handle clicks on buttons in the modal
     * @param {Event} e - Click event
     */
    function handleModalButtonClicks(e) {
        // Close button
        if (e.target.closest('#close-fractional-unit-modal-btn') ||
            e.target.closest('#cancel-fractional-unit-edit-btn')) {
            closeFractionalUnitModal();
        }

        // Save button (handled via form submit)
        const form = e.target.closest('#fractional-unit-edit-form');
        if (form) {
            form.addEventListener('submit', handleFractionalUnitFormSubmit);
        }

        // Click outside modal to close
        if (e.target === fractionalUnitModal) {
            closeFractionalUnitModal();
        }
    }

    /**
     * Handle form submission for fractional unit editing
     * @param {Event} e - Submit event
     */
    function handleFractionalUnitFormSubmit(e) {
        e.preventDefault();

        // Get form data
        const unitId = document.getElementById('edit-fractional-unit-id').value;
        const unitName = document.getElementById('edit-fractional-unit-name').value;
        const unitType = document.getElementById('edit-fractional-unit-type').value;
        const unitSection = document.getElementById('edit-fractional-unit-section').value;
        const unitPosition = document.getElementById('edit-fractional-unit-position').value;
        const unitSize = document.getElementById('edit-fractional-unit-size').value;

        // Handle "Add New Section" option
        if (unitSection === 'add_new_section') {
            const newSection = window.prompt('Enter new section name:');
            if (!newSection || newSection.trim() === '') {
                return; // Cancel if empty
            }

            // Add the new section option
            const sectionSelect = document.getElementById('edit-fractional-unit-section');
            const newOption = document.createElement('option');
            newOption.value = newSection.trim();
            newOption.textContent = newSection.trim();

            // Insert before the "Add New Section" option
            sectionSelect.insertBefore(newOption, sectionSelect.lastChild);

            // Select the new option
            sectionSelect.value = newSection.trim();
            return; // Don't close the modal, let the user continue
        }

        // Validate required fields
        if (!unitName.trim() || !unitType || !unitSection) {
            alert('Please fill in all required fields.');
            return;
        }

        // Update the fractional unit element
        if (editingFractionalUnit) {
            updateFractionalUnit(
                editingFractionalUnit,
                unitId,
                unitName,
                unitType,
                unitSection,
                unitPosition,
                unitSize
            );
        }

        // Close the modal
        closeFractionalUnitModal();

        // Show notification
        showNotification('Fractional unit updated', 'success');
    }

    /**
     * Updates the section dropdown based on content type (contextual sections)
     * @param {string} contentType - The selected content type ('edit' or 'ad')
     */
    function updateFractionalUnitSectionDropdown(contentType) {
        const sectionSelect = document.getElementById('edit-fractional-unit-section');
        const sectionContainer = sectionSelect?.closest('div');
        
        if (!sectionSelect || !sectionContainer) return;
        
        // Store current value to try to preserve it if it exists in new options
        const currentValue = sectionSelect.value;
        
        // Remove any existing help text
        const existingHelpText = sectionContainer.querySelector('.content-type-help');
        if (existingHelpText) {
            existingHelpText.remove();
        }
        
        // Clear and repopulate dropdown based on content type
        populateContextualFractionalSectionDropdown(contentType, sectionSelect, sectionContainer, currentValue);
    }

    /**
     * Populates section dropdown with contextual options based on content type
     * @param {string} contentType - The selected content type ('edit' or 'ad')
     * @param {HTMLElement} sectionSelect - The section select element
     * @param {HTMLElement} sectionContainer - The container div
     * @param {string} currentValue - The current section value to preserve if possible
     */
    function populateContextualFractionalSectionDropdown(contentType, sectionSelect, sectionContainer, currentValue) {
        // Clear existing options
        sectionSelect.innerHTML = '';
        
        let sections = [];
        let helpText = '';
        
        if (contentType === 'edit') {
            // Editorial content types get editorial sections
            sections = [
                { value: 'FOB', label: 'Front of Book' },
                { value: 'Feature', label: 'Feature' },
                { value: 'BOB', label: 'Back of Book' },
                { value: 'Cover', label: 'Cover' }
            ];
            helpText = 'Editorial content can be assigned to different editorial sections.';
        } else if (contentType === 'ad') {
            // Advertisement content types get advertising sections
            sections = [
                { value: 'paid', label: 'Paid Advertisement' },
                { value: 'house', label: 'House Advertisement' },
                { value: 'Bonus', label: 'Bonus Advertisement' },
                { value: 'Promo', label: 'Promotional Advertisement' }
            ];
            helpText = 'Advertisement content can be categorized by commercial type.';
        }
        
        // Add sections to dropdown
        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.value;
            option.textContent = section.label;
            sectionSelect.appendChild(option);
        });
        
        // Try to preserve current selection if it exists in new options
        if (currentValue && sections.some(s => s.value === currentValue)) {
            sectionSelect.value = currentValue;
        } else {
            sectionSelect.value = sections[0].value; // Default to first option
        }
        
        // Add help text
        if (helpText) {
            const helpElement = document.createElement('p');
            helpElement.className = 'text-xs text-gray-500 mt-1 content-type-help';
            helpElement.textContent = helpText;
            sectionContainer.appendChild(helpElement);
        }
    }

    // ===================================================
    // SECTION 3: FRACTIONAL UNIT EDITING FUNCTIONS
    // ===================================================

    /**
     * Opens the fractional unit editor modal
     * @param {HTMLElement} fractionalUnit - The fractional unit element
     */
    function openFractionalUnitEditor(fractionalUnit) {
        // Store reference to the current unit
        editingFractionalUnit = fractionalUnit;

        // Get unit data
        const unitId = fractionalUnit.getAttribute('data-id');
        const unitName = fractionalUnit.getAttribute('data-name');
        const unitType = fractionalUnit.getAttribute('data-type') || 'ad'; // Default to ad
        const unitSection = fractionalUnit.getAttribute('data-section');
        const unitPosition = fractionalUnit.getAttribute('data-position');
        const unitSize = fractionalUnit.getAttribute('data-size');

        // Populate the modal form
        document.getElementById('edit-fractional-unit-id').value = unitId;
        document.getElementById('edit-fractional-unit-name').value = unitName;
        document.getElementById('edit-fractional-unit-position').value = unitPosition;
        document.getElementById('edit-fractional-unit-size').value = unitSize;

        // Set content type first
        const typeSelect = document.getElementById('edit-fractional-unit-type');
        if (typeSelect) {
            typeSelect.value = unitType;
        }

        // Update section dropdown based on content type (this will populate contextual options)
        updateFractionalUnitSectionDropdown(unitType);
        
        // After contextual sections are populated, try to set the current section
        const sectionSelect = document.getElementById('edit-fractional-unit-section');
        if (sectionSelect && unitSection) {
            // Try to find the section in the current options
            let sectionExists = false;
            for (let i = 0; i < sectionSelect.options.length; i++) {
                if (sectionSelect.options[i].value === unitSection) {
                    sectionSelect.selectedIndex = i;
                    sectionExists = true;
                    break;
                }
            }

            // If section doesn't exist in contextual options, it might be a legacy value
            // In this case, add it as a custom option (for backward compatibility)
            if (!sectionExists && unitSection.trim() !== '') {
                const newOption = document.createElement('option');
                newOption.value = unitSection;
                newOption.textContent = `${unitSection} (Custom)`;
                sectionSelect.appendChild(newOption);
                sectionSelect.value = unitSection;
            }
        }

        // Update modal title
        document.getElementById('fractional-unit-modal-title').textContent =
            `Edit ${getPositionLabel(unitPosition)} ${getSizeLabel(unitSize)} Unit`;

        // Show the modal
        fractionalUnitModal.classList.remove('hidden');
    }

    /**
     * Closes the fractional unit editor modal
     */
    function closeFractionalUnitModal() {
        if (fractionalUnitModal) {
            fractionalUnitModal.classList.add('hidden');
            editingFractionalUnit = null;
        }
    }

    /**
     * Updates a fractional unit with new data
     * @param {HTMLElement} unitElement - The fractional unit element
     * @param {string} unitId - The unit ID
     * @param {string} unitName - The unit name
     * @param {string} unitType - The unit type (edit, ad)
     * @param {string} unitSection - The unit section
     * @param {string} unitPosition - The unit position
     * @param {string} unitSize - The unit size
     */
    function updateFractionalUnit(unitElement, unitId, unitName, unitType, unitSection, unitPosition, unitSize) {
        // Update data attributes
        unitElement.setAttribute('data-id', unitId);
        unitElement.setAttribute('data-name', unitName);
        unitElement.setAttribute('data-type', unitType);
        unitElement.setAttribute('data-section', unitSection);
        unitElement.setAttribute('data-position', unitPosition);
        unitElement.setAttribute('data-size', unitSize);

        // Update content
        const nameDiv = unitElement.querySelector('div');
        if (nameDiv) {
            nameDiv.textContent = unitName;
        }

        // Update the appearance based on type (comprehensive styling update)
        const updatedElement = updateFractionalUnitStyling(unitElement, unitType);

        // Update the mixed page data attribute to reflect changes
        updateMixedPageDataAttribute(updatedElement);
    }

    /**
     * Updates the visual styling of a fractional unit based on its content type
     * @param {HTMLElement} unitElement - The fractional unit element
     * @param {string} unitType - The content type ('edit' or 'ad')
     */
    function updateFractionalUnitStyling(unitElement, unitType) {
        // Clear any existing event listeners by cloning the element
        const newElement = unitElement.cloneNode(true);
        unitElement.parentNode.replaceChild(newElement, unitElement);
        
        // Set the background color and interactive styles based on type
        const baseColor = unitType === 'edit' ? '#B1FCFE' : '#F19E9C';
        const hoverColor = unitType === 'edit' ? '#9CFAFC' : '#F18B89';
        const borderColor = unitType === 'edit' ? '#0891B2' : '#DC2626'; // Darker borders
        
        newElement.style.backgroundColor = baseColor;
        newElement.style.cursor = 'pointer';
        newElement.style.transition = 'all 0.2s ease';
        newElement.style.border = `2px solid ${borderColor}`;
        newElement.style.borderRadius = '6px';
        newElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        newElement.style.padding = '4px';
        newElement.style.boxSizing = 'border-box';
        
        // Re-add hover effects with new colors
        newElement.addEventListener('mouseenter', () => {
            newElement.style.backgroundColor = hoverColor;
            newElement.style.borderColor = '#4F46E5';
            newElement.style.borderWidth = '3px';
            newElement.style.transform = 'scale(1.02)';
            newElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            newElement.style.zIndex = '5';
        });
        
        newElement.addEventListener('mouseleave', () => {
            newElement.style.backgroundColor = baseColor;
            newElement.style.borderColor = borderColor;
            newElement.style.borderWidth = '2px';
            newElement.style.transform = 'scale(1)';
            newElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            newElement.style.zIndex = '2';
        });
        
        // Update the editingFractionalUnit reference if this was the element being edited
        if (editingFractionalUnit === unitElement) {
            editingFractionalUnit = newElement;
        }
        
        return newElement;
    }

    /**
     * Updates the mixed page data attribute with the current fractional units
     * @param {HTMLElement} changedUnit - The fractional unit that was changed
     */
    function updateMixedPageDataAttribute(changedUnit) {
        // Get the parent page box
        const pageBox = changedUnit.closest('.box.mixed');
        if (!pageBox) return;

        // Get all fractional units in this page
        const fractionalUnits = Array.from(pageBox.querySelectorAll('.fractional-ad, .fractional-unit'));

        // Create an array of unit data
        const unitsData = fractionalUnits.map(unit => ({
            id: unit.getAttribute('data-id'),
            name: unit.getAttribute('data-name'),
            section: unit.getAttribute('data-section'),
            size: unit.getAttribute('data-size'),
            position: unit.getAttribute('data-position'),
            type: unit.getAttribute('data-type') || 'ad' // Default to ad for compatibility
        }));

        // Update the data attribute
        pageBox.setAttribute('data-fractional-ads', JSON.stringify(unitsData));

        // Also store the layout ID if it exists
        const layoutId = pageBox.getAttribute('data-layout-id');
        if (layoutId) {
            pageBox.setAttribute('data-mixed-page-layout-id', layoutId);
        }
    }

    // ===================================================
    // SECTION 4: HELPER FUNCTIONS
    // ===================================================

    /**
     * Gets a human-readable label for a position
     * @param {string} position - The position value
     * @returns {string} A human-readable position label
     */
    function getPositionLabel(position) {
        const positions = {
            'top-left': 'Top Left',
            'top-right': 'Top Right',
            'bottom-left': 'Bottom Left',
            'bottom-right': 'Bottom Right',
            'top': 'Top',
            'bottom': 'Bottom',
            'left': 'Left',
            'right': 'Right'
        };
        return positions[position] || position;
    }

    /**
     * Gets a human-readable label for a size
     * @param {string} size - The size value
     * @returns {string} A human-readable size label
     */
    function getSizeLabel(size) {
        const sizes = {
            '1/4': 'Quarter-Page',
            '1/3': 'Third-Page',
            '1/2': 'Half-Page',
            '2/3': 'Two-Thirds'
        };
        return sizes[size] || size;
    }

    /**
     * Shows a notification message
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
