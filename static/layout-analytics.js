// static/layout-analytics.js
/**
 * Layout Analytics functionality for Flatplan application
 * Provides statistics on page counts by type and section
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get analytics button elements
    const analyticsButtons = document.querySelectorAll('[data-action="show-analytics"]');

    // Add event listeners to all analytics buttons
    analyticsButtons.forEach(button => {
        button.addEventListener('click', () => {
            const layoutId = button.getAttribute('data-layout-id');
            showAnalyticsModal(layoutId);
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
     * Shows the analytics modal with data for the specified layout
     * @param {string} layoutId - The layout ID
     */
    function showAnalyticsModal(layoutId) {
        // Get the layout data from the DOM
        const analytics = aggregateLayoutAnalytics();

        // Get the publication info
        const publicationName = document.querySelector('.text-xl.font-bold')?.textContent || 'Publication';
        const issueName = document.querySelector('.text-indigo-100.text-sm')?.textContent || 'Issue';

        // Update the modal content
        updateAnalyticsModalContent(publicationName, issueName, analytics);

        // Show the modal
        document.getElementById('analytics-modal').classList.remove('hidden');
    }

    /**
     * Closes the analytics modal
     */
    function closeAnalyticsModal() {
        document.getElementById('analytics-modal').classList.add('hidden');
    }

    /**
     * Aggregates layout items into analytics data
     * @returns {Object} Aggregated analytics data
     */
    function aggregateLayoutAnalytics() {
        // Initialize results object
        const analytics = {
            totalPages: 0,
            pageTypes: {
                edit: {
                    total: 0,
                    sections: {}
                },
                ad: {
                    total: 0,
                    sections: {}
                },
                placeholder: {
                    total: 0,
                    sections: {}
                },
                unknown: {
                    total: 0,
                    sections: {}
                }
            }
        };

        // Get all page boxes excluding the placeholder page 0
        const pageBoxes = Array.from(document.querySelectorAll('.spread-container .box')).filter(box => box.id !== 'page-0');

        // Total page count
        analytics.totalPages = pageBoxes.length;

        // Process each page box
        pageBoxes.forEach(box => {
            // Determine page type
            let pageType = 'unknown';
            if (box.classList.contains('edit')) pageType = 'edit';
            else if (box.classList.contains('ad')) pageType = 'ad';
            else if (box.classList.contains('placeholder')) pageType = 'placeholder';

            // Get section
            const section = box.querySelector('.section')?.textContent || 'Uncategorized';

            // Increment total for page type
            analytics.pageTypes[pageType].total += 1;

            // Initialize section counter if it doesn't exist
            if (!analytics.pageTypes[pageType].sections[section]) {
                analytics.pageTypes[pageType].sections[section] = 0;
            }

            // Increment section counter
            analytics.pageTypes[pageType].sections[section] += 1;
        });

        return analytics;
    }

    /**
     * Updates the analytics modal content with the aggregated data
     * @param {string} publicationName - The publication name
     * @param {string} issueName - The issue name
     * @param {Object} analytics - The aggregated analytics data
     */
    function updateAnalyticsModalContent(publicationName, issueName, analytics) {
        // Get the modal content container
        const contentContainer = document.getElementById('analytics-content');
        if (!contentContainer) return;

        // Update publication info
        document.getElementById('analytics-publication-name').textContent = publicationName;
        document.getElementById('analytics-issue-name').textContent = issueName;

        // Update total page count
        document.getElementById('analytics-total-pages').textContent = analytics.totalPages;

        // Update editorial pages
        const editPagesCount = document.getElementById('analytics-edit-pages');
        const editSectionsList = document.getElementById('analytics-edit-sections');

        if (editPagesCount && editSectionsList) {
            editPagesCount.textContent = analytics.pageTypes.edit.total;
            editSectionsList.innerHTML = '';

            // Add sections
            Object.entries(analytics.pageTypes.edit.sections).forEach(([section, count]) => {
                const li = document.createElement('li');
                li.className = 'flex justify-between';
                li.innerHTML = `<span>${section}:</span> <span>${count}</span>`;
                editSectionsList.appendChild(li);
            });
        }

        // Update advertisement pages
        const adPagesCount = document.getElementById('analytics-ad-pages');
        const adSectionsList = document.getElementById('analytics-ad-sections');

        if (adPagesCount && adSectionsList) {
            adPagesCount.textContent = analytics.pageTypes.ad.total;
            adSectionsList.innerHTML = '';

            // Add sections
            Object.entries(analytics.pageTypes.ad.sections).forEach(([section, count]) => {
                const li = document.createElement('li');
                li.className = 'flex justify-between';
                li.innerHTML = `<span>${section}:</span> <span>${count}</span>`;
                adSectionsList.appendChild(li);
            });
        }
    }
});
