const keys = require('../config.json');
const Youtube = require('youtube-api');
const Lein = require('lien');
const opn = require('opn');

const data = require('../data.json');

const generateNewBearerToken = () => {
  let server = new Lein({
    host: 'localhost',
    port: 5000
  });

  let oauth = Youtube.authenticate({
    type: "oauth",
    refresh_token: keys.refresh_token,
    client_id: keys.installed.client_id,
    client_secret: keys.installed.client_secret,
    redirect_url: keys.installed.redirect_uris[0],
  });

  opn(oauth.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube"]
  }));

  server.addPage("/", lien => {
    oauth.getToken(lien.query.code, (err, tokens) => {
      if (err) {
        // lien.lien(err, 400);
        console.log(err);
      } else {

        console.log('token time');
        oauth.setCredentials(tokens);
        console.log(JSON.stringify(tokens, null, 4));
      }
    })
  })
}

const transferPlaylists = () => {
  let oauth = Youtube.authenticate({
    type: "oauth",
    refresh_token: keys.refresh_token,
    client_id: keys.installed.client_id,
    client_secret: keys.installed.client_secret,
    redirect_url: keys.installed.redirect_uris[0],
  });

  oauth.setCredentials(keys.bearer);


  Youtube.playlists.insert({
    resource: {
      snippet: {
        title: 'August 2023',
      }
    },
    part: "snippet, status"
  }, async(err, data) => {
    if (err) {
      console.log(err);
      return;
    }

    // let tracks = playlist.tracks;
    // uploadTrack(tracks, data.id);
  });

  // createPlaylist();
}

const createPlaylist = () => {
  const playlist = playlistsToUpload.shift();

  console.log('creating', playlist.title);

  Youtube.playlists.insert({
    resource: {
      snippet: {
        title: playlist.title,
      }
    },
    part: "snippet, status"
  }, async(err, data) => {
    if (err) {
      console.log(err);
      return;
    }

    let tracks = playlist.tracks;
    uploadTrack(tracks, data.id);
  });
}

const uploadTrack = (tracks, playlistId) => {
  if (tracks.length == 0) {
    if (playlistsToUpload !== 0) {
      createPlaylist();
    } else {
      console.log('done');
    }
    return;
  }

  const track = tracks.shift();
  console.log(track.id);

  Youtube.playlistItems.insert({
    resource: {
      snippet: {
        playlistId: playlistId,
        resourceId: {
          kind: 'youtube#video',
          videoId: track.id
        },
      }
    },
    part: "snippet, status"
  }, (err, data) => {
    if (err) {
      console.log(err);
    }
    uploadTrack(tracks, playlistId);
  })
}

// generateNewBearerToken();

let playlistsToUpload = Object.values(data).filter(playlist => playlist.year == '2023').reverse().splice(4, 12);
console.log(playlistsToUpload.map(playlist => console.log(playlist.title)));
transferPlaylists();
