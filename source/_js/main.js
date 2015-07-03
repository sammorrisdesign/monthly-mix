requirejs.config({
    paths: {
        'sc': 'http://connect.soundcloud.com/sdk'
    }
});

require([
    'modules/fonts'
], function (
    fonts
) {
    fonts.init();

    var bootstrap = document.body.getAttribute('data-bootstrap');

    if (bootstrap === "home") {
        require(['home'], function(Home) {
            Home.init();
        });
    } else if (bootstrap == "playlist") {
        require(['playlist'], function(Playlist) {
            Playlist.init();
        });
    }
});