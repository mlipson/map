// static/account-analytics.js
/**
 * Layout Analytics functionality for the account page
 * Adapts the main analytics functionality for the account view
 * Includes support for fractional advertisements in mixed pages
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get analytics button elements
    const analyticsButtons = document.querySelectorAll('[data-action="show-analytics"]');

    // Add event listeners to all analytics buttons
    analyticsButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const layoutId = button.getAttribute('data-layout-id');
            fetchAndShowAnalytics(layoutId);
        });
    });

    // Close analytics modal when clicking the close button
    document.addEventListener('click', function(e) {
        if (e.target.closest('[data-action="close-analytics-modal"]')) {
            closeAnalyticsModal();
        }

        // Close analytics modal when clicking outside
        if (e.target === document.getElementById('analytics-modal')) {
            closeAnalyticsModal();
        }
    });

    /**
     * Fetches analytics data from the server API and shows the modal
     * @param {string} layoutId - The layout ID
     */
    function fetchAndShowAnalytics(layoutId) {
        // Show loading indicator in modal
        const analyticsModal = document.getElementById('analytics-modal');
        const analyticsContent = document.getElementById('analytics-content');

        if (analyticsContent) {
            analyticsContent.innerHTML = `
                <div class="flex justify-center items-center p-10">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            `;
        }

        // Show the modal with loading indicator
        analyticsModal.classList.remove('hidden');

        // Fetch the analytics data from the API
        fetch(`/api/layout/${layoutId}/analytics`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch analytics data');
                }
                return response.json();
            })
            .then(data => {
                // Show the analytics modal with the fetched data
                updateAnalyticsModalContent(data);
            })
            .catch(error => {
                console.error('Error fetching analytics:', error);

                // Show error in modal
                if (analyticsContent) {
                    analyticsContent.innerHTML = `
                        <div class="text-center py-8">
                            <div class="text-red-600 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p class="text-gray-700 mb-4">Error loading analytics. Please try again.</p>
                            <button data-action="close-analytics-modal" class="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium">
                                Close
                            </button>
                        </div>
                    `;
                }
            });
    }

    /**
     * Closes the analytics modal
     */
    function closeAnalyticsModal() {
        document.getElementById('analytics-modal').classList.add('hidden');
    }

    /**
     * Updates the analytics modal content with the data from the API
     * @param {Object} data - The analytics data from the API
     */
    function updateAnalyticsModalContent(data) {
        // Get the modal content container
        const contentContainer = document.getElementById('analytics-content');
        if (!contentContainer) return;

        // Create the basic modal structure
        contentContainer.innerHTML = `
            <div class="text-center mb-4">
                <h2 id="analytics-publication-name" class="text-xl font-bold text-gray-800">${data.publication_name}</h2>
                <h3 id="analytics-issue-name" class="text-gray-600 text-md">${data.issue_name}</h3>
            </div>

            <div class="bg-gray-50 border rounded-md p-4">
                <p class="font-medium mb-3 text-lg">
                    <span class="text-gray-700">Total Pages:</span>
                    <span id="analytics-total-pages" class="font-bold">${data.total_pages}</span>
                </p>

                <!-- Editorial Pages Section -->
                <div class="mb-4">
                    <p class="font-medium flex justify-between border-b pb-1 mb-2">
                        <span class="text-gray-700">Editorial Pages:</span>
                        <span id="analytics-edit-pages" class="font-bold">${data.total_editorial ?
                            `${data.total_editorial} (${Math.round(data.total_editorial/data.total_pages*100)}%)` :
                            data.page_types.edit.total}
                        </span>
                    </p>
                    <ul id="analytics-edit-sections" class="pl-4 space-y-1 text-sm">
                        ${generateSectionsList(data.page_types.edit.sections, 'No editorial sections')}

                        ${data.page_types.mixed && data.page_types.mixed.total > 0 ?
                            `<li class="flex justify-between font-medium mt-2">
                                <span>Partial pages (mixed):</span>
                                <span>${Math.round((data.total_editorial - data.page_types.edit.total) * 100) / 100}</span>
                            </li>` :
                            ''}
                    </ul>
                </div>

                <!-- Advertisement Pages Section -->
                <div class="mb-4">
                    <p class="font-medium flex justify-between border-b pb-1 mb-2">
                        <span class="text-gray-700">Advertisement Pages:</span>
                        <span id="analytics-ad-pages" class="font-bold">${data.total_ads ?
                            `${data.total_ads} (${Math.round(data.total_ads/data.total_pages*100)}%)` :
                            data.page_types.ad.total}
                        </span>
                    </p>
                    <ul id="analytics-ad-sections" class="pl-4 space-y-1 text-sm">
                        ${generateSectionsList(data.page_types.ad.sections, 'No advertisement sections')}

                        ${data.page_types.mixed && data.page_types.mixed.total > 0 ?
                            `<li class="flex justify-between font-medium mt-2">
                                <span>Partial pages (mixed):</span>
                                <span>${Math.round((data.total_ads - data.page_types.ad.total) * 100) / 100}</span>
                            </li>` :
                            ''}
                    </ul>
                </div>

                ${data.page_types.mixed && data.page_types.mixed.total > 0 ?
                    `<!-- Mixed Pages Section -->
                    <div class="mb-4">
                        <p class="font-medium flex justify-between border-b pb-1 mb-2">
                            <span class="text-gray-700">Mixed Content Pages:</span>
                            <span id="analytics-mixed-pages" class="font-bold">${data.page_types.mixed.total}</span>
                        </p>
                        <ul id="analytics-mixed-sections" class="pl-4 space-y-1 text-sm">
                            <li class="flex justify-between">
                                <span>Editorial content:</span>
                                <span>${Math.round((1 - data.page_types.mixed.adPercentage) * 100)}%</span>
                            </li>
                            <li class="flex justify-between">
                                <span>Advertisement content:</span>
                                <span>${Math.round(data.page_types.mixed.adPercentage * 100)}%</span>
                            </li>
                            ${generateSectionsList(data.page_types.mixed.sections)}
                        </ul>
                    </div>` :
                    ''}

                <!-- Fractional Ad Sizes Section -->
                ${data.fractionalAdSizes ?
                    `<div class="mb-4">
                        <p class="font-medium flex justify-between border-b pb-1 mb-2">
                            <span class="text-gray-700">Fractional Ad Sizes:</span>
                        </p>
                        <ul id="analytics-fractional-sizes" class="pl-4 space-y-1 text-sm">
                            ${generateFractionalAdSizesList(data.fractionalAdSizes)}
                        </ul>
                    </div>` :
                    ''}

                <!-- Placeholder Pages Section -->
                <div>
                    <p class="font-medium flex justify-between border-b pb-1 mb-2">
                        <span class="text-gray-700">Placeholder Pages:</span>
                        <span id="analytics-placeholder-pages" class="font-bold">${data.page_types.placeholder.total}</span>
                    </p>
                    <ul id="analytics-placeholder-sections" class="pl-4 space-y-1 text-sm">
                        ${generateSectionsList(data.page_types.placeholder.sections, 'No placeholder sections')}
                    </ul>
                </div>
            </div>

            <div class="flex justify-end mt-6">
                <button type="button" data-action="close-analytics-modal"
                    class="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium">
                    Close
                </button>
            </div>
        `;
    }

    /**
     * Helper function to generate HTML list items for sections
     * @param {Object} sections - Object mapping section names to counts
     * @param {string} emptyMessage - Message to show if no sections exist
     * @returns {string} HTML string of list items
     */
    function generateSectionsList(sections, emptyMessage = '') {
        if (!sections || Object.keys(sections).length === 0) {
            return emptyMessage ? `<li class="text-gray-500 italic">${emptyMessage}</li>` : '';
        }

        return Object.entries(sections)
            .map(([section, count]) => `
                <li class="flex justify-between">
                    <span>${section}:</span>
                    <span>${count}</span>
                </li>
            `)
            .join('');
    }

    /**
     * Helper function to generate HTML list items for fractional ad sizes
     * @param {Object} fractionalAdSizes - Object mapping sizes to counts
     * @returns {string} HTML string of list items
     */
    function generateFractionalAdSizesList(fractionalAdSizes) {
        if (!fractionalAdSizes) return '<li class="text-gray-500 italic">No fractional ads</li>';

        const hasFractionalAds = Object.values(fractionalAdSizes).some(count => count > 0);

        if (!hasFractionalAds) {
            return '<li class="text-gray-500 italic">No fractional ads</li>';
        }

        return Object.entries(fractionalAdSizes)
            .filter(([_, count]) => count > 0)
            .map(([size, count]) => `
                <li class="flex justify-between">
                    <span>${size} page ads:</span>
                    <span>${count}</span>
                </li>
            `)
            .join('');
    }
});
