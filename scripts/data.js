const fs = require('fs-extra');

if (!fs.existsSync('./data.json')) {
    fs.writeFileSync('data.json', '{}');
}

const playlists = require('./data/playlists.js');
const tracks = require('./data/tracks.js');
const corrections = require('./data/corrections.js');
const featured = require('./data/featured.js');

(async () => {
    let data = await playlists.init();
    data = await tracks.init(data);
    data = corrections.init(data);
    data = featured.init(data);

    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

    console.log('Data updated!');
})()
