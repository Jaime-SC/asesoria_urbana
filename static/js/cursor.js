// cursor.js
(function() {
    var cursor = document.createElement("div");
    cursor.classList.add("cursor");
    document.body.appendChild(cursor);

    document.addEventListener("mousedown", function(event) {
        var clickCursor = document.createElement("div");
        clickCursor.classList.add("click-cursor");
        clickCursor.style.left = event.pageX + "px";
        clickCursor.style.top = event.pageY + "px";
        document.body.appendChild(clickCursor);

        setTimeout(function() {
            clickCursor.remove();
        }, 500); // Duración del efecto de halo en milisegundos
    });

    document.addEventListener("mousemove", function(e) {
        cursor.style.left = e.pageX + "px";
        cursor.style.top = e.pageY + "px";
    });
})();
