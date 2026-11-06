const keys = require('../../config.json');
const youtube = require('youtube-api');

module.exports = {
  getTrackInfo: async function(snippet) {
    let title = snippet.title;
    console.log(title);
      title = this.removeFrequentPhrases(title);
      title = this.splitTitle(title);
      title = this.dropQuotes(title);
      title = title.filter(Boolean);

    if (title.length == 1) {
      if (title[0].includes("\"")) {
        title = this.getTitleFromQuotes(title);
      } else {
        title = await this.getTitleFromVideoId(title, snippet.resourceId.videoId);
      }
    }

    title = title.filter(Boolean);
    title = this.fixCapitalisation(title);
    title = this.removeProducer(title);
    title = this.formatFeature(title);
    title = this.dropBrackets(title);
    title = title.filter(Boolean);

    if (title.length < 2) {
      console.log('Missing meta for ', snippet.resourceId.videoId, ' – currently title reads as ', title);
    }

    console.log(title);

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
      'official visualizer',
      'Single',
      'Visualiser',
      'Visualizer',
      'Music video',
      'Lyric Video',
      'Lyrics',
      'Demo',
      'Audio Only',
      'Audio',
      '2026',
      '2027',
      '2028'
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

      if (trackTitle[0] == "'" && trackTitle[trackTitle.length - 1] == "'") {
        trackTitle = trackTitle.replace(/'/g, '');
      }
    }

    title[1] = trackTitle;

    return title;
  },

  removeProducer: function(title) {
    const match = title[1]?.match(/\(prod ([^)]*)\)/);

    if (match) {
      const producerText = match[1].trim();
      title[1] = title[1].replace(`${producerText}`, "").replace(/\(prod ([^)]*)\)/, "").trim();
    }

    return title;
  },

  dropBrackets: function(title) {
    if (title[1]) {
      title[1] = title[1].replace(/ \( \)/g, '').replace(/ \(  \)/g, '').trim();
    }

    return title;
  },

  fixCapitalisation: function(title) {
    const fillerWords = [
      "a",
      "and",
      "as",
      "at",
      "but",
      "by",
      "for",
      "from",
      "in",
      "into",
      "of",
      "on",
      "or",
      "to"
    ];

    for (const i in title) {
      // split into words
      const words = title[i].split(" ").map((word, i) => {
        // if we're dealing with a filler word, and we're not the first word, just return it
        if (fillerWords.includes(word) && i !== 0) {
          return word.toLowerCase();

        // if not, let's just lowercase it, and capitalise the first letter
        } else {
          // if we have an actual word, do something
          if (word.length > 1) {
            // capitalise the second letter if the word starts with a bracket
            const targetLetter = word[0] == "(" ? 1 : 0;
            return (targetLetter == 1 ? word[0] : "") + word[targetLetter].toUpperCase() + word.slice(targetLetter + 1).toLowerCase();
          } else {
            return word;
          }
        }
      })


      title[i] = words.join(" ");
    }

    return title;
  },

  formatFeature: function(title) {
    let trackTitle = title[1];

    if (trackTitle) {
      let altFeatureFormats = [
        'Feat. ',
        'Feat ',
        'Ft. ',
        'Ft ',
      ];

      altFeatureFormats = altFeatureFormats.map(phrase => `\\(${phrase}\\)|\\[${phrase}\\]|${phrase}`);

      const regEx = new RegExp(altFeatureFormats.join('|'), 'gi');

      trackTitle = trackTitle.replace(regEx, 'feat. ').trim();

      const hasBracketlessFeature = trackTitle.includes(" feat.");

      if (hasBracketlessFeature) {
        trackTitle = trackTitle.replace(" feat. ", " (feat. ");
        trackTitle = `${trackTitle.trim()})`;
      }

      title[1] = trackTitle;
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