// static/layout-analytics.js
/**
 * Layout Analytics functionality for Flatplan application
 * Provides statistics on page counts by type and section, including fractional ads
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
     * Converts a fractional ad size string to a decimal value
     * @param {string} sizeStr - The size string (e.g., "1/4", "1/3", "1/2", "2/3")
     * @returns {number} The decimal value of the fraction
     */
    function fractionalSizeToDecimal(sizeStr) {
        switch (sizeStr) {
            case '1/4': return 0.25;
            case '1/3': return 0.333;
            case '1/2': return 0.5;
            case '2/3': return 0.667;
            default: return 0; // Default fallback
        }
    }

    /**
     * Aggregates layout items into analytics data
     * @returns {Object} Aggregated analytics data
     */
    function aggregateLayoutAnalytics() {
        // Initialize results object
        const analytics = {
            totalPages: 0,
            totalEditorial: 0,    // Total editorial pages (including partial)
            totalAds: 0,          // Total ad pages (including partial)
            pageTypes: {
                edit: {
                    total: 0,
                    sections: {}
                },
                ad: {
                    total: 0,
                    sections: {}
                },
                mixed: {          // New type for mixed content pages
                    total: 0,
                    sections: {},
                    editorialPercentage: 0,
                    adPercentage: 0
                },
                placeholder: {
                    total: 0,
                    sections: {}
                },
                unknown: {
                    total: 0,
                    sections: {}
                }
            },
            fractionalAdSizes: {  // Track fractional ad sizes
                '1/4': 0,
                '1/3': 0,
                '1/2': 0,
                '2/3': 0
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
            else if (box.classList.contains('mixed')) pageType = 'mixed';
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

            // Handle page type-specific calculations
            if (pageType === 'edit') {
                // Full editorial page
                analytics.totalEditorial += 1;
            } else if (pageType === 'ad') {
                // Full ad page
                analytics.totalAds += 1;
            } else if (pageType === 'mixed') {
                // Mixed content page - calculate fractional amounts
                let fractionalAdsData = box.getAttribute('data-fractional-ads');
                let totalAdSpace = 0;

                if (fractionalAdsData) {
                    try {
                        const fractionalAds = JSON.parse(fractionalAdsData);

                        // Calculate total ad space on this mixed page
                        fractionalAds.forEach(ad => {
                            const adSize = fractionalSizeToDecimal(ad.size);
                            totalAdSpace += adSize;

                            // Track fractional ad sizes for analytics
                            if (analytics.fractionalAdSizes[ad.size] !== undefined) {
                                analytics.fractionalAdSizes[ad.size] += 1;
                            }

                            // Add to section-specific ad tracking if needed
                            // Uncomment if you want to track which sections have fractional ads
                            /*
                            const adSection = ad.section || 'Uncategorized';
                            if (!analytics.pageTypes.ad.sections[adSection]) {
                                analytics.pageTypes.ad.sections[adSection] = 0;
                            }
                            analytics.pageTypes.ad.sections[adSection] += adSize;
                            */
                        });
                    } catch (e) {
                        console.error('Error parsing fractional ads data:', e);
                        totalAdSpace = 0;
                    }
                }

                // Calculate editorial space (remaining space on the page)
                const editorialSpace = Math.max(0, 1 - totalAdSpace);

                // Add to totals
                analytics.totalAds += totalAdSpace;
                analytics.totalEditorial += editorialSpace;

                // Store percentages for this page type
                analytics.pageTypes.mixed.adPercentage = totalAdSpace / analytics.pageTypes.mixed.total;
                analytics.pageTypes.mixed.editorialPercentage = editorialSpace / analytics.pageTypes.mixed.total;
            }
        });

        // Round the totals to 2 decimal places for display
        analytics.totalEditorial = Math.round(analytics.totalEditorial * 100) / 100;
        analytics.totalAds = Math.round(analytics.totalAds * 100) / 100;

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
            // Show total editorial pages (full pages plus fractional)
            editPagesCount.textContent = `${analytics.totalEditorial} (${Math.round(analytics.totalEditorial/analytics.totalPages*100)}%)`;
            editSectionsList.innerHTML = '';

            // Add sections for full editorial pages
            Object.entries(analytics.pageTypes.edit.sections).forEach(([section, count]) => {
                const li = document.createElement('li');
                li.className = 'flex justify-between';
                li.innerHTML = `<span>${section}:</span> <span>${count}</span>`;
                editSectionsList.appendChild(li);
            });

            // Add mixed pages info if any exist
            if (analytics.pageTypes.mixed.total > 0) {
                const mixedLi = document.createElement('li');
                mixedLi.className = 'flex justify-between font-medium mt-2';
                mixedLi.innerHTML = `<span>Partial pages (mixed):</span> <span>${Math.round((analytics.totalEditorial - analytics.pageTypes.edit.total) * 100) / 100}</span>`;
                editSectionsList.appendChild(mixedLi);
            }

            // If no sections, show a message
            if (Object.keys(analytics.pageTypes.edit.sections).length === 0 && analytics.pageTypes.mixed.total === 0) {
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
            // Show total ad pages (full pages plus fractional)
            adPagesCount.textContent = `${analytics.totalAds} (${Math.round(analytics.totalAds/analytics.totalPages*100)}%)`;
            adSectionsList.innerHTML = '';

            // Add sections for full ad pages
            Object.entries(analytics.pageTypes.ad.sections).forEach(([section, count]) => {
                const li = document.createElement('li');
                li.className = 'flex justify-between';
                li.innerHTML = `<span>${section}:</span> <span>${count}</span>`;
                adSectionsList.appendChild(li);
            });

            // Add mixed pages info if any exist
            if (analytics.pageTypes.mixed.total > 0) {
                const mixedLi = document.createElement('li');
                mixedLi.className = 'flex justify-between font-medium mt-2';
                mixedLi.innerHTML = `<span>Partial pages (mixed):</span> <span>${Math.round((analytics.totalAds - analytics.pageTypes.ad.total) * 100) / 100}</span>`;
                adSectionsList.appendChild(mixedLi);
            }

            // If no sections, show a message
            if (Object.keys(analytics.pageTypes.ad.sections).length === 0 && analytics.pageTypes.mixed.total === 0) {
                const li = document.createElement('li');
                li.textContent = 'No advertisement sections';
                li.className = 'text-gray-500 italic';
                adSectionsList.appendChild(li);
            }
        }

        // Update fractional ad sizes section
        const fractionalSizesList = document.getElementById('analytics-fractional-sizes');
        if (fractionalSizesList) {
            fractionalSizesList.innerHTML = '';

            let hasFractionalAds = false;
            Object.entries(analytics.fractionalAdSizes).forEach(([size, count]) => {
                if (count > 0) {
                    hasFractionalAds = true;
                    const li = document.createElement('li');
                    li.className = 'flex justify-between';
                    li.innerHTML = `<span>${size} page ads:</span> <span>${count}</span>`;
                    fractionalSizesList.appendChild(li);
                }
            });

            if (!hasFractionalAds) {
                const li = document.createElement('li');
                li.textContent = 'No fractional ads';
                li.className = 'text-gray-500 italic';
                fractionalSizesList.appendChild(li);
            }
        }

        // Update placeholder pages
        const placeholderPagesCount = document.getElementById('analytics-placeholder-pages');
        const placeholderSectionsList = document.getElementById('analytics-placeholder-sections');

        if (placeholderPagesCount && placeholderSectionsList) {
            placeholderPagesCount.textContent = analytics.pageTypes.placeholder.total;
            placeholderSectionsList.innerHTML = '';

            // Add sections
            Object.entries(analytics.pageTypes.placeholder.sections).forEach(([section, count]) => {
                const li = document.createElement('li');
                li.className = 'flex justify-between';
                li.innerHTML = `<span>${section}:</span> <span>${count}</span>`;
                placeholderSectionsList.appendChild(li);
            });

            // If no sections, show a message
            if (Object.keys(analytics.pageTypes.placeholder.sections).length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No placeholder sections';
                li.className = 'text-gray-500 italic';
                placeholderSectionsList.appendChild(li);
            }
        }

        // Add mixed pages summary section if any exist
        if (analytics.pageTypes.mixed.total > 0) {
            // Check if the mixed section already exists
            let mixedSection = document.getElementById('mixed-pages-section');

            // If it doesn't exist, create it
            if (!mixedSection) {
                mixedSection = document.createElement('div');
                mixedSection.id = 'mixed-pages-section';
                mixedSection.className = 'mb-4';

                // Create the title
                const titleP = document.createElement('p');
                titleP.className = 'font-medium flex justify-between border-b pb-1 mb-2';
                titleP.innerHTML = '<span class="text-gray-700">Mixed Content Pages:</span>' +
                                  `<span id="analytics-mixed-pages" class="font-bold">${analytics.pageTypes.mixed.total}</span>`;

                mixedSection.appendChild(titleP);

                // Create the list container
                const mixedList = document.createElement('ul');
                mixedList.id = 'analytics-mixed-sections';
                mixedList.className = 'pl-4 space-y-1 text-sm';

                // Add the info about mixed pages
                const editorialLi = document.createElement('li');
                editorialLi.className = 'flex justify-between';
                editorialLi.innerHTML = `<span>Editorial content:</span> <span>${Math.round((1 - analytics.pageTypes.mixed.adPercentage) * 100)}%</span>`;
                mixedList.appendChild(editorialLi);

                const adLi = document.createElement('li');
                adLi.className = 'flex justify-between';
                adLi.innerHTML = `<span>Advertisement content:</span> <span>${Math.round(analytics.pageTypes.mixed.adPercentage * 100)}%</span>`;
                mixedList.appendChild(adLi);

                // Add sections if needed
                Object.entries(analytics.pageTypes.mixed.sections).forEach(([section, count]) => {
                    const li = document.createElement('li');
                    li.className = 'flex justify-between';
                    li.innerHTML = `<span>${section}:</span> <span>${count}</span>`;
                    mixedList.appendChild(li);
                });

                mixedSection.appendChild(mixedList);

                // Insert after the ad section
                const adSection = document.getElementById('analytics-ad-pages').closest('.mb-4');
                if (adSection && adSection.nextElementSibling) {
                    adSection.parentNode.insertBefore(mixedSection, adSection.nextElementSibling);
                } else {
                    // Fallback - append to content container
                    contentContainer.querySelector('.bg-gray-50').appendChild(mixedSection);
                }
            }
        }
    }
});
