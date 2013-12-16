var file_utils = require('../../lib/utils/file-utils'),
	config = require('../../lib/handlers/configuration-handler').getConfiguration();

var SUPPORTED_FILETYPES = new RegExp("\.(mp3)","g");

exports.loadItems = function(req, res){
	file_utils.getLocalFiles(config.musicpath, SUPPORTED_FILETYPES, function(err, files) {
        var unique = {}, 
        albums = [];
        for(var i = 0, l = files.length; i < l; ++i){
            var albumDir = files[i].dir;
            var albumTitles = albumDir.substring(albumDir.lastIndexOf("\\")).replace(/^\\|\\$/g, '');

            // filter albums on unique title
            if(unique.hasOwnProperty(albumTitles)) {
                continue;
            }
            
            //single
            if(albumTitles === '' && files[i].file !== undefined){
                albumTitles = files[i].file;
            }
            
            albums.push(albumTitles.split("/").pop());
            unique[albumTitles] = 1;
        };
        
        res.json(albums);
	});
};

exports.getInfo = function(req, res, infoRequest) {
	var metadata_fetcher = require('./metadata-fetcher');
	var dblite = require('dblite');

    // Init Database
    var dblite = require('dblite')
    if(config.binaries === 'packaged'){
        if(config.platform === 'OSX'){
            dblite.bin = "./bin/sqlite3/osx/sqlite3";
        }else {
            dblite.bin = "./bin/sqlite3/sqlite3";
        }
    }
    var db = dblite('./lib/database/mcjs.sqlite');
    db.on('info', function (text) { console.log(text) });
    db.on('error', function (err) {
        if(config.binaries !== 'packaged'){
            console.log('You choose to use locally installed binaries instead of the binaries included. /n Please install them. Eg type "apt-get install sqlite3"');
        }
        console.error('Database error: ' + err)
    });
    
	db.query("CREATE TABLE IF NOT EXISTS music (filename TEXT PRIMARY KEY,title VARCHAR, cover VARCHAR, year VARCHAR, genre VARCHAR , tracks VARCHAR)");

	metadata_fetcher.fetchMetadataForAlbum(infoRequest, function(result) {
		res.json(result);
	});
};

exports.playTrack = function(req, res, albumTitle, trackName){
	var music_playback_handler = require('./music-playback-handler');

	music_playback_handler.startTrackPlayback(res, albumTitle, trackName);
};
