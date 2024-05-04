const fs = require('fs-extra');
const keys = require('../../config.json');

let url = 'https://api.spotify.com/v1/users/nidzumi/playlists?limit=20&offset=0';
let playlists = new Array;
let access_token;

const getAccessToken = async() => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + (new Buffer.from(keys.spotify.client_id + ':' + keys.spotify.client_secret).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials'
        })
    });

    const data = await response.json();

    console.log(`🔐 Received Spotify Access Token`);
    access_token = data.access_token;
}

const fetchABatchOfPlaylists = async() => {
    console.log(`🛜 Fetching playlists from Spotify`);
    const response = await fetch(url, {
        method: 'get',
        headers: {
            Authorization: `Bearer ${access_token}`
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
        await getAccessToken();
        // fetch all playlists
        await fetchABatchOfPlaylists();

        fs.writeJSONSync('./scripts/data/spotify.json', playlists);

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
