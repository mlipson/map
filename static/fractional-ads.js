// Modified version for fractional-ads.js
window.addEventListener('load', function() {
  console.log("Fractional ads script loaded and running");

  // Debug: Log all mixed boxes to see if they're found
  const mixedBoxes = document.querySelectorAll('.box.mixed');
  console.log("Found mixed boxes:", mixedBoxes.length);

  // For each mixed box, render its fractional ads
  mixedBoxes.forEach(box => {
    // Debug: Log the box and its data attribute
    console.log("Processing box:", box);
    const dataAttr = box.getAttribute('data-fractional-ads');
    console.log("Fractional ads data:", dataAttr);

    if (dataAttr) {
      try {
        const fractionalAds = JSON.parse(dataAttr);
        console.log("Parsed fractional ads:", fractionalAds);

        // Add each fractional ad to the page
        fractionalAds.forEach(ad => {
          console.log("Adding fractional ad:", ad);
          addFractionalAdToPageFromLoad(box, ad);
        });

        // Now create the editorial area after all ads are added
        createEditorialAreaFromLoad(box);

      } catch (e) {
        console.error('Error parsing fractional ads data:', e);
      }
    }
  });
});

// Use a different function name to avoid conflicts
function addFractionalAdToPageFromLoad(pageBox, adData) {
    // Create the fractional ad element
    const adElement = document.createElement('div');
    adElement.className = 'fractional-ad';
    adElement.setAttribute('data-id', adData.id);
    adElement.setAttribute('data-name', adData.name);
    adElement.setAttribute('data-section', adData.section);
    adElement.setAttribute('data-size', adData.size);
    adElement.setAttribute('data-position', adData.position);

    // Set CSS properties based on size and position
    if (adData.size === '1/4') {
        // Quarter page - handle corner positions
        switch (adData.position) {
            case 'top-left':
                adElement.style.top = '0';
                adElement.style.left = '0';
                adElement.style.width = '50%';
                adElement.style.height = '50%';
                break;
            case 'top-right':
                adElement.style.top = '0';
                adElement.style.right = '0';
                adElement.style.width = '50%';
                adElement.style.height = '50%';
                break;
            case 'bottom-left':
                adElement.style.bottom = '0';
                adElement.style.left = '0';
                adElement.style.width = '50%';
                adElement.style.height = '50%';
                break;
            case 'bottom-right':
                adElement.style.bottom = '0';
                adElement.style.right = '0';
                adElement.style.width = '50%';
                adElement.style.height = '50%';
                break;
            default:
                // Fallback to top-left if position is invalid
                adElement.style.top = '0';
                adElement.style.left = '0';
                adElement.style.width = '50%';
                adElement.style.height = '50%';
        }
    } else {
        // For other sizes, use the standard edge positions
        switch (adData.position) {
            case 'top':
                adElement.style.top = '0';
                adElement.style.left = '0';
                adElement.style.right = '0';
                adElement.style.height = getSizePercentageFromLoad(adData.size);
                break;
            case 'bottom':
                adElement.style.bottom = '0';
                adElement.style.left = '0';
                adElement.style.right = '0';
                adElement.style.height = getSizePercentageFromLoad(adData.size);
                break;
            case 'left':
                adElement.style.top = '0';
                adElement.style.left = '0';
                adElement.style.bottom = '0';
                adElement.style.width = getSizePercentageFromLoad(adData.size);
                break;
            case 'right':
                adElement.style.top = '0';
                adElement.style.right = '0';
                adElement.style.bottom = '0';
                adElement.style.width = getSizePercentageFromLoad(adData.size);
                break;
        }
    }

    // Add content to the fractional ad
    adElement.innerHTML = `
        <div class="text-xs font-medium text-center">${adData.name}</div>
    `;

    // Add the ad element to the page box
    console.log("Appending ad element to page box");
    pageBox.appendChild(adElement);
}

/**
 * Creates an editorial area that occupies the remaining space in a mixed page
 * @param {HTMLElement} pageBox - The page box element
 */
function createEditorialAreaFromLoad(pageBox) {
    // Remove any existing editorial area
    const existingEditArea = pageBox.querySelector('.editorial-area');
    if (existingEditArea) {
        existingEditArea.remove();
    }

    // Get all ads to determine their positions
    const ads = Array.from(pageBox.querySelectorAll('.fractional-ad'));

    // If no ads, don't create an editorial area
    if (ads.length === 0) return;

    // Determine the available space
    const pageName = pageBox.querySelector('.name')?.textContent?.trim() || 'Editorial';
    const editArea = document.createElement('div');
    editArea.className = 'editorial-area';

    // Calculate editorial position based on ad positions
    const positions = calculateEditorialAreaFromLoad(ads);

    // Apply the calculated position
    Object.keys(positions).forEach(prop => {
        editArea.style[prop] = positions[prop];
    });

    // Add content
    editArea.innerHTML = `<div class="font-medium">${pageName}</div>`;

    // Add to page
    pageBox.appendChild(editArea);
}

/**
 * Calculates the position and size of the editorial area
 * @param {Array} ads - Array of ad elements
 * @returns {Object} CSS positioning properties
 */
function calculateEditorialAreaFromLoad(ads) {
    // Default is full page
    const area = {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
    };

    // Check if we have ads in certain positions
    ads.forEach(ad => {
        const position = ad.getAttribute('data-position');
        const size = ad.getAttribute('data-size');

        switch(position) {
            case 'top':
                area.top = getSizePercentageFromLoad(size);
                break;
            case 'bottom':
                area.bottom = getSizePercentageFromLoad(size);
                break;
            case 'left':
                area.left = getSizePercentageFromLoad(size);
                break;
            case 'right':
                area.right = getSizePercentageFromLoad(size);
                break;
            case 'top-left':
                // For quarter-page ads, we need to check if we already have adjustments
                if (area.top === '0') area.top = '50%';
                if (area.left === '0') area.left = '50%';
                break;
            case 'top-right':
                if (area.top === '0') area.top = '50%';
                if (area.right === '0') area.right = '50%';
                break;
            case 'bottom-left':
                if (area.bottom === '0') area.bottom = '50%';
                if (area.left === '0') area.left = '50%';
                break;
            case 'bottom-right':
                if (area.bottom === '0') area.bottom = '50%';
                if (area.right === '0') area.right = '50%';
                break;
        }
    });

    return area;
}

function getSizePercentageFromLoad(size) {
  switch (size) {
    case '1/4': return '25%';
    case '1/3': return '33.33%';
    case '1/2': return '50%';
    case '2/3': return '66.67%';
    default: return '50%';
  }
}
