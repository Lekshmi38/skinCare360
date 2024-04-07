document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('tip-form');
    const submittedTips = document.getElementById('submitted-tips');

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the form from submitting normally

        // Get the value of the tip from the form
        const tipInput = document.getElementById('tip');
        const tipValue = tipInput.value.trim();

        if (tipValue !== '') {
            // Create a new paragraph element to display the submitted tip
            const tipParagraph = document.createElement('p');
            tipParagraph.textContent = tipValue;

            // Append the new tip paragraph to the submitted tips section
            submittedTips.appendChild(tipParagraph);

            // Clear the input field after submission
            tipInput.value = '';
        } else {
            // Inform the user to input a tip if the field is empty
            alert('Please enter a tip before submitting.');
        }
    });
});
