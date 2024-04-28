const keys = require('../../config.json');
const youtube = require('youtube-api');
const spotify = require('./spotify');

let pageToken = null;
let playlists = new Array();
let isFetching = true;

const getCover = thumbnails => {
    if (thumbnails.maxres) {
        return thumbnails.maxres.url;
    } else if (thumbnails.standard) {
        return thumbnails.standard.url;
    } else if (thumbnails.high) {
        return thumbnails.high.url;
    } else if (thumbnails.default) {
        return thumbnails.default.url;
    } else {
        console.log('no image found');
        console.log(thumbnails);
        return '';
    }
}

module.exports = {
    init: async function() {
        await youtube.authenticate({
            type: 'key',
            key: keys.youtube
        });

        await this.fetchPlaylists();

        playlists.sort((a,b) => {
            return new Date(b.title) - new Date(a.title);
        })

        var playlistsObject = new Object();

        playlists.forEach(playlist => {
            playlistsObject[playlist.title] = playlist;
        });

        // add spotify IDs
        const spotifyIDs = await spotify.getPlaylists();

        playlists.forEach(playlist => {
          playlist.spotify = spotifyIDs[playlist.title];
        });

        return playlistsObject;
    },

    fetchPlaylists: async function() {
        const response = await youtube.playlists.list({
            part: 'snippet, id',
            channelId: 'UC5FQqBXXSxtwgJ4EIT1Ld1w',
            maxResults: 50,
            pageToken: pageToken
        });

        if (response.data) {
            response.data.items.forEach(function(playlist) {
                playlists.push({
                    id: playlist.id,
                    title: playlist.snippet.title,
                    month: playlist.snippet.title.split(' ')[0],
                    year: playlist.snippet.title.split(' ')[1],
                    description: playlist.snippet.description,
                    thumbnail: playlist.snippet.thumbnails.medium.url,
                    cover: getCover(playlist.snippet.thumbnails),
                    etag: playlist.etag
                });
            });

            if (response.data.nextPageToken) {
                pageToken = response.data.nextPageToken;
                await this.fetchPlaylists();
            }
        }
    }
}
