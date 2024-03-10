const keys = require('../../config.json');
const youtube = require('youtube-api');

module.exports = {
    getTrackInfo: async function(snippet) {
        let title = snippet.title;
            title = this.removeFrequentPhrases(title);
            title = this.splitTitle(title);
            title = this.dropQuotes(title);
            title = this.formatFeature(title);
            title = this.dropBrackets(title);
            title = title.filter(Boolean);

        if (title.length == 1) {
            if (title[0].includes("\"")) {
                title = this.getTitleFromQuotes(title);
            } else {
                title = await this.getTitleFromVideoId(title, snippet.resourceId.videoId);
            }
        }

        title = title.filter(Boolean);

        if (title.length < 2) {
            console.log('Missing meta for ', snippet.resourceId.videoId, ' – currently title reads as ', title);
        }

        return {
            artist: title[0],
            title: title[1]
        }
    },

    removeFrequentPhrases: function(title) {
        let phrasesToRemove = [
            'Official Lyric Video',
            'Official Music Video',
            'Official Video',
            'Official Audio',
            'Official',
            'Single',
            'Visualiser',
            'Visualizer',
            'Lyric Video',
            'Lyrics',
            'Demo',
            'Audio Only',
            'Audio'
        ];

        phrasesToRemove = phrasesToRemove.map(phrase => `\\(${phrase}\\)|\\[${phrase}\\]|${phrase}`)

        const regEx = new RegExp(phrasesToRemove.join('|'), 'gi');

        return title.replace(regEx, '').trim();
    },

    splitTitle: function(title) {
        return title.split(/ - | – | – | — | ~ | \/\/ | \/\/\/ /);
    },

    dropQuotes: function(title) {
        let trackTitle = title[1];
        if (trackTitle) {
            if (trackTitle[0] == "“" && trackTitle[trackTitle.length - 1] == "“") {
                trackTitle = trackTitle.replace(/“/g, '');
            }

            if (trackTitle[0] == "\"" && trackTitle[trackTitle.length - 1] == "\"") {
                trackTitle = trackTitle.replace(/\"/g, '');
            }
        }

        title[1] = trackTitle;

        return title;
    },

    dropBrackets: function(title) {
        if (title[1]) {
            title[1] = title[1].replace(/ \( \)/g, '').trim();
        }

        return title;
    },

    formatFeature: function(title) {
        const trackTitle = title[1];

        if (trackTitle) {
            let altFeatureFormats = [
                'Feat. ',
                'Feat ',
                'Ft. ',
                'Ft ',
            ];

            altFeatureFormats = altFeatureFormats.map(phrase => `\\(${phrase}\\)|\\[${phrase}\\]|${phrase}`);

            const regEx = new RegExp(altFeatureFormats.join('|'), 'gi');

            title[1] = trackTitle.replace(regEx, 'feat. ').trim();
        }

        return title;
    },

    getTitleFromQuotes: function(title) {
        const quotedTitle = title[0].match(/"((?:\\.|[^"\\])*)"/);
 
        if (quotedTitle && quotedTitle.index > 0) {
            return [
                title[0].replace(quotedTitle[0], '').trim(),
                quotedTitle[1]
            ]
        } else {
            return title
        }
    },

    getTitleFromVideoId: async function(title, videoId) {
        youtube.authenticate({
            type: 'key',
            key: keys.youtube
        });

        const { data } = await youtube.videos.list({
            part: 'snippet',
            id: videoId
        });

        if (data.items.length) {
            title = [
                data.items[0].snippet.channelTitle.replace(' - Topic', ''),
                this.removeFrequentPhrases(data.items[0].snippet.title)
            ]
        }

        return title;
    }
}