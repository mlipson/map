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
    adElement.className = 'fractional-ad absolute bg-yellow-100 border border-yellow-300';
    adElement.style.backgroundColor = '#F19E9C'; // Set the background color directly
    adElement.style.borderColor = '#ccc'; // Set the border color directly
    adElement.setAttribute('data-id', adData.id);
    adElement.setAttribute('data-name', adData.name);
    adElement.setAttribute('data-section', adData.section);
    adElement.setAttribute('data-size', adData.size);
    adElement.setAttribute('data-position', adData.position);

    // Set size and position based on the ad data
    const { size, position } = adData;

    // Set CSS properties based on size and position
    if (size === '1/4') {
        // Quarter page - handle corner positions
        switch (position) {
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
        switch (position) {
            case 'top':
                adElement.style.top = '0';
                adElement.style.left = '0';
                adElement.style.right = '0';
                adElement.style.height = getSizePercentageFromLoad(size);
                break;
            case 'bottom':
                adElement.style.bottom = '0';
                adElement.style.left = '0';
                adElement.style.right = '0';
                adElement.style.height = getSizePercentageFromLoad(size);
                break;
            case 'left':
                adElement.style.top = '0';
                adElement.style.left = '0';
                adElement.style.bottom = '0';
                adElement.style.width = getSizePercentageFromLoad(size);
                break;
            case 'right':
                adElement.style.top = '0';
                adElement.style.right = '0';
                adElement.style.bottom = '0';
                adElement.style.width = getSizePercentageFromLoad(size);
                break;
        }
    }

    // Add content to the fractional ad
    adElement.innerHTML = `
        <div class="text-xs font-medium text-center p-1">${adData.name}</div>
    `;

    // Add the ad element to the page box
    console.log("Appending ad element to page box");
    pageBox.appendChild(adElement);
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
