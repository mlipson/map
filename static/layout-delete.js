/**
 * Layout Delete functionality for Flatplan application
 * Handles the confirmation and submission of layout deletion requests
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get all delete buttons
    const deleteButtons = document.querySelectorAll('[data-action="delete-layout"]');

    // Add event listeners to all delete buttons
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            const layoutId = this.getAttribute('data-layout-id');
            const layoutName = this.getAttribute('data-layout-name');

            // Show confirmation dialog
            if (confirm(`Are you sure you want to delete the layout "${layoutName}"? This action cannot be undone.`)) {
                // Create and submit a form for the DELETE request
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = `/delete_layout/${layoutId}`;
                document.body.appendChild(form);
                form.submit();
            }
        });
    });
});
