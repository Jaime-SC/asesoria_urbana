function updateBNUPFields() {
    const memoRadio = document.getElementById('memo');
    const correoRadio = document.getElementById('correo');
    const memoFields = document.getElementById('memoFields');
    const correoFields = document.getElementById('correoFields');

    function toggleFields() {
        if (memoRadio.checked) {
            memoFields.style.display = 'block';
            correoFields.style.display = 'none';
        } else if (correoRadio.checked) {
            memoFields.style.display = 'none';
            correoFields.style.display = 'block';
        }
    }

    if (memoRadio && correoRadio) {
        memoRadio.addEventListener('change', toggleFields);
        correoRadio.addEventListener('change', toggleFields);

        // Initialize the correct field visibility on page load
        toggleFields();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('#bnupForm')) {
        updateBNUPFields();
    }
});
