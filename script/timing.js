define('timing', ['drawing'], function(drawing) {

    var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
    var started;
    var lastDate = Date.now();
    function loop() {
        var now = Date.now();
        var delta = now - lastDate;


        drawing.draw();
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, width, height);

        raf(loop);
        lastDate = now;
    }

    return {
        start: function() {
            if (started) return;
            raf(loop);
        }
    };
});
