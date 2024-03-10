const keys = require('../../config.json');
const oldData = require('../../data.json');
const meta = require('./meta.js');
const image = require('./image.js');
const youtube = require('youtube-api');

module.exports = {
    init: async function(data) {
        await youtube.authenticate({
            type: 'key',
            key: keys.youtube
        });

        for (const playlist of Object.keys(data)) {
            // Etag comparison only looks at changes to id, title and description
            if (!oldData[playlist] || data[playlist].etag !== oldData[playlist].etag) {
                await image.generateFor(data[playlist]);
                data[playlist].tracks = await this.fetchTracksFromPlaylist(data[playlist]);

            } else {
                data[playlist].tracks = oldData[playlist].tracks;
            }
        }

        return data;
    },

    fetchTracksFromPlaylist: async function(playlist) {
        let tracks = [];

        const response = await youtube.playlistItems.list({
            part: 'snippet',
            maxResults: 50,
            playlistId: playlist.id
        });

        if (response.data) {
            for (const item of response.data.items) {
                let track = await meta.getTrackInfo(item.snippet);
                    track.id = item.snippet.resourceId.videoId;

                tracks.push(track);
            }

            return tracks;
        } else {
            return null;
        }
    }
}
