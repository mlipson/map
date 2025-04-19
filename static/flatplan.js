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
