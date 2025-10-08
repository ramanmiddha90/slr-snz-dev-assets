
    var intervalHandle = setInterval(
        function () {
            if (document.readyState) {
                if (bootstrap !=undefined && bootstrap!=null) {
                    clearInterval(intervalHandle);
                    const modal = new bootstrap.Modal(document.getElementById('successModal'));
                    modal.show();
                }
            }
        }, 50);
window.onload = function () {
    //your code
    const modal = new bootstrap.Modal(document.getElementById('successModal'), {
        backdrop: 'static',
        keyboard: false
    });
    modal.show();
};

const observer = new MutationObserver(function (mutations, obs) {
    const form = document.querySelector('form');
    if (form) {
        obs.disconnect();
        // Auto-show the modal on page load
        
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});