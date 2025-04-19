function updatePageNumbers() {
  const boxes = document.querySelectorAll('.spread-container .box');
  let visibleIndex = 0;

  boxes.forEach((box, i) => {
    if (box.id === 'page-0') return; // skip placeholder
    visibleIndex += 1;

    // Update the data attribute for tracking or export
    box.setAttribute('data-page-number', visibleIndex);

    // Update the page number label
    const pageNumEl = box.querySelector('.page-number');
    if (pageNumEl) {
      pageNumEl.textContent = visibleIndex;
      pageNumEl.classList.remove('even', 'odd');
      pageNumEl.classList.add(visibleIndex % 2 === 0 ? 'even' : 'odd');
    }
  });
}

function getCurrentLayoutAsJSON() {
  const boxes = document.querySelectorAll('.spread-container .box');
  const layout = [];

  boxes.forEach(box => {
    const id = box.id;
    if (id === "page-0") return; // skip placeholder

    layout.push({
      id: id, // e.g., "page-3"
      name: box.querySelector('.name')?.textContent,
      section: box.querySelector('.section')?.textContent,
      page_number: parseInt(box.getAttribute('data-page-number'), 10),
      type: box.classList.contains('edit') ? 'edit' :
            box.classList.contains('ad') ? 'ad' :
            box.classList.contains('placeholder') ? 'placeholder' : 'unknown'
    });
  });

  return layout;
}


/* run after SortableJS & updatePageNumbers() have been defined */
document.addEventListener('DOMContentLoaded', () => {
  const saveBtn  = document.getElementById('save-layout-btn');
  const layoutId = document.getElementById('layout-id').value;   // ← gets the ID

  saveBtn.addEventListener('click', () => {
    const layout = getCurrentLayoutAsJSON();

    fetch(`/layout/${layoutId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(layout)
    })
    .then(res => res.ok ? alert('Layout saved!') : alert('Save failed.'));
  });
});


Sortable.create(document.querySelector('.spread-container'), {
  animation: 150,
  ghostClass: 'drag-ghost',
  filter: "#page-0",
  preventOnFilter: false,
  onEnd: function () {
    updatePageNumbers();
  }
});

updatePageNumbers();
