const keys = require('../../config.json');

let url = 'https://api.spotify.com/v1/me/playlists?limit=20&offset=0';
let playlists = new Array;

const fetchABatchOfPlaylists = async() => {
    console.log(`🛜 Fetching playlists from Spotify`);
    const response = await fetch(url, {
        method: 'get',
        headers: {
            Authorization: `Bearer ${keys.spotify}`
        }
    });

    const data = await response.json();

    playlists.push(...data.items);

    if (data.next) {
        url = data.next;
        await fetchABatchOfPlaylists();
    }
}

module.exports = {
    getPlaylists: async function() {
        // fetch all playlists
        await fetchABatchOfPlaylists();

        // filter playlists to ones I've made
        playlists = playlists.filter(playlist => playlist.owner.id == 'nidzumi');
        playlists = playlists.filter(playlist => playlist.name.includes(" 20"));

        // create object with the structure of { "playlist name": "spotify id", ... }
        playlists = playlists.reduce((cleanedPlaylists, playlist) => {
            cleanedPlaylists[playlist.name] = playlist.id;
            return cleanedPlaylists;
        }, {});
    
        return playlists;
    }
}
