// static/account-analytics.js
/**
 * Layout Analytics functionality for the account page
 * Adapts the main analytics functionality for the account view
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
                document.getElementById('analytics-modal').classList.remove('hidden');
            })
            .catch(error => {
                console.error('Error fetching analytics:', error);
                alert('Error loading analytics. Please try again.');
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

    // Update publication info
    document.getElementById('analytics-publication-name').textContent = data.publication_name;
    document.getElementById('analytics-issue-name').textContent = data.issue_name;

    // Update total page count
    document.getElementById('analytics-total-pages').textContent = data.total_pages;

    // Update editorial pages
    const editPagesCount = document.getElementById('analytics-edit-pages');
    const editSectionsList = document.getElementById('analytics-edit-sections');

    if (editPagesCount && editSectionsList) {
        editPagesCount.textContent = data.page_types.edit.total;
        editSectionsList.innerHTML = '';

        // Add sections
        Object.entries(data.page_types.edit.sections).forEach(([section, count]) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between';
            li.innerHTML = `<span>${section}:</span> <span>${count}</span>`;
            editSectionsList.appendChild(li);
        });

        // If no sections, show a message
        if (Object.keys(data.page_types.edit.sections).length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No editorial sections';
            li.className = 'text-gray-500 italic';
            editSectionsList.appendChild(li);
        }
    }

    // Update advertisement pages
    const adPagesCount = document.getElementById('analytics-ad-pages');
    const adSectionsList = document.getElementById('analytics-ad-sections');

    if (adPagesCount && adSectionsList) {
        adPagesCount.textContent = data.page_types.ad.total;
        adSectionsList.innerHTML = '';

        // Add sections
        Object.entries(data.page_types.ad.sections).forEach(([section, count]) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between';
            li.innerHTML = `<span>${section}:</span> <span>${count}</span>`;
            adSectionsList.appendChild(li);
        });

        // If no sections, show a message
        if (Object.keys(data.page_types.ad.sections).length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No advertisement sections';
            li.className = 'text-gray-500 italic';
            adSectionsList.appendChild(li);
        }
    }

    // Update placeholder pages
    const placeholderPagesCount = document.getElementById('analytics-placeholder-pages');
    const placeholderSectionsList = document.getElementById('analytics-placeholder-sections');

    if (placeholderPagesCount && placeholderSectionsList) {
        placeholderPagesCount.textContent = data.page_types.placeholder.total;
        placeholderSectionsList.innerHTML = '';

        // Add sections
        Object.entries(data.page_types.placeholder.sections).forEach(([section, count]) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between';
            li.innerHTML = `<span>${section}:</span> <span>${count}</span>`;
            placeholderSectionsList.appendChild(li);
        });

        // If no sections, show a message
        if (Object.keys(data.page_types.placeholder.sections).length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No placeholder sections';
            li.className = 'text-gray-500 italic';
            placeholderSectionsList.appendChild(li);
        }
    }
}
});
