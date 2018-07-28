const request = require('requestretry').defaults({maxAttempts: 2147483647, retryDelay: 1000, timeout: 8000});
const crypto = require('crypto');
const fs = require("fs-extra");
const logger = require('./logger.js');

module.exports = new Deezer();

function Deezer() {
	this.apiUrl = "http://www.deezer.com/ajax/gw-light.php";
	this.apiQueries = {
		api_version: "1.0",
		api_token: "null", // Must be 32 chars long
		input: "3"
	};
	this.httpHeaders = {
		"Accept": "*/*",
		"Accept-Charset": "utf-8,ISO-8859-1;q=0.7,*;q=0.3",
		"Accept-Language": "de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4",
		"Cache-Control": "max-age=0",
		"Content-Language": "en-US",
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0",
		
	}
	this.albumPicturesHost = "https://e-cdns-images.dzcdn.net/images/cover/";
	this.reqStream = {}
	this.delStream = []
}

var userData = null;

Deezer.prototype.init = function(username, password, callback) {
	var self = this;
	request.post({url: "https://www.deezer.com/ajax/gw-light.php?method=deezer.getUserData&input=3&api_version=1.0&api_token=", headers: this.httpHeaders, jar: true}, function(err, res, body) {
		getUserData = JSON.parse(body);
		userData = getUserData;
		self.apiQueries.api_token = getUserData.results.checkForm;
		request.post({url: "https://www.deezer.com/ajax/action.php", headers: this.httpHeaders, form: {type:'login',mail:username,password:password,checkFormLogin:getUserData.results.checkFormLogin}, jar: true}, function(err, res, body) {
			if(err || res.statusCode != 200) {
				callback(new Error("Unable to load deezer.com"));
			}else if(body.indexOf("success") > -1){
				request.get({url: "https://www.deezer.com/", headers: this.httpHeaders, jar: true}, (function(err, res, body) {
					if(!err && res.statusCode == 200) {
						const userRegex = new RegExp(/"type":"user","data":([^}]*})/g);
						const user = JSON.parse(userRegex.exec(body)[1]);
						self.userId = user.USER_ID;
						self.userName = user.BLOG_NAME;
						self.userPicture = `https:\/\/e-cdns-images.dzcdn.net\/images\/user\/${user.USER_PICTURE}\/250x250-000000-80-0-0.jpg`;
						callback(null, null);
					} else {
						callback(new Error("Unable to load deezer.com "+err));
					}
				}).bind(self));
			}else if(userData !== null){
				callback(null, null);
			}
			else{
				console.log();
				console.log(body)
				callback(new Error("Incorrect email or password. To re-login restart the app and then reload this page"));
			}
		});
	})

}



Deezer.prototype.getPlaylist = function(id, callback) {
	getJSON("https://api.deezer.com/playlist/" + id, function(res){
		if (!(res instanceof Error)){
			callback(res);
		} else {
			callback(null, res)
		}
	});
}

Deezer.prototype.getAlbum = function(id, callback) {
	getJSON("https://api.deezer.com/album/" + id, function(res){
		if (!(res instanceof Error)){
			callback(res);
		} else {
			callback(null, res)
		}
	});
}

Deezer.prototype.getATrack = function(id, callback) {
	getJSON("https://api.deezer.com/track/" + id, function(res){
		if (!(res instanceof Error)){
			callback(res);
		} else {
			callback(null, res)
		}
	});
}

Deezer.prototype.getArtist = function(id, callback) {
	getJSON("https://api.deezer.com/artist/" + id, function(res){
		if (!(res instanceof Error)){
			callback(res);
		} else {
			callback(null, res)
		}
	});

}

Deezer.prototype.getPlaylistTracks = function(id, callback) {
	getJSON("https://api.deezer.com/playlist/" + id + "/tracks?limit=-1", function(res){
		if (!(res instanceof Error)){
			callback(res)
		} else {
			callback(null, res)
		}
	});
}

Deezer.prototype.getAlbumSize = function(id, callback) {
	getJSON("https://api.deezer.com/album/" + id + "/tracks?limit=1", function(res){
		if (!(res instanceof Error)){
			callback(res.total);
		} else {
			callback(null, res)
		}
	});

}

Deezer.prototype.getAlbumTracks = function(id, callback) {
	getJSON("https://api.deezer.com/album/" + id + "/tracks?limit=-1", function(res){
		if (!(res instanceof Error)){
			callback(res);
		} else {
			callback(null, res)
		}

	});
}

Deezer.prototype.getArtistAlbums = function(id, callback) {
	getJSON("https://api.deezer.com/artist/" + id + "/albums?limit=-1", function(res){
		if (!(res instanceof Error)){
			if(!res.data) {
				res.data = [];
			}
			callback(res);
		} else {
			callback(null, res)
		}
	});
}

/*
**	CHARTS
** 	From user https://api.deezer.com/user/637006841/playlists?limit=-1
*/
Deezer.prototype.getChartsTopCountry = function(callback) {
	getJSON("https://api.deezer.com/user/637006841/playlists?limit=-1", function(res){
		if (!(res instanceof Error)){
			if(!res.data) {
				res.data = [];
			} else {
				//Remove "Loved Tracks"
				res.data.shift();
			}
			callback(res);
		} else {
			callback(null, res)
		}
	});

}

Deezer.prototype.getMePlaylists = function(callback) {
	getJSON("https://api.deezer.com/user/"+this.userId+"/playlists?limit=-1", function(res){
		if (!(res instanceof Error)){
			if(!res.data) {
				res.data = [];
			}
			callback(res);
		} else {
			callback(null, res)
		}
	});
}

Deezer.prototype.getTrack = function(id, maxBitrate, callback) {
	var scopedid = id;
	var self = this;
	request.get({url: "https://www.deezer.com/track/"+id, headers: this.httpHeaders, jar: true}, (function(err, res, body) {
		var regex = new RegExp(/<script>window\.__DZR_APP_STATE__ = (.*)<\/script>/g);
		var rexec = regex.exec(body);
		var _data;
		try{
			_data = rexec[1];
		}catch(e){
			callback(null, new Error("Unable to get Track"));
			return;
		}
		if(!err && res.statusCode == 200 && typeof JSON.parse(_data)["DATA"] != 'undefined') {
			var json = JSON.parse(_data)["DATA"];
			var lyrics = JSON.parse(_data)["LYRICS"];
			if(lyrics){
				json["LYRICS_TEXT"] = lyrics["LYRICS_TEXT"];
				json["LYRICS_SYNC_JSON"] = lyrics["LYRICS_SYNC_JSON"];
				json["LYRICS_COPYRIGHTS"] = lyrics["LYRICS_COPYRIGHTS"];
				json["LYRICS_WRITERS"] = lyrics["LYRICS_WRITERS"];
			}
			if(json["TOKEN"]) {
				callback(null, new Error("Uploaded Files are currently not supported"));
				return;
			}
			var id = json["SNG_ID"];
			var md5Origin = json["MD5_ORIGIN"];
			var format;
			switch(maxBitrate){
				case "9":
					format = 9;
					if (json["FILESIZE_FLAC"]>0) break;
				case "3":
					format = 3;
					if (json["FILESIZE_MP3_320"]>0) break;
				case "5":
					format = 5;
					if (json["FILESIZE_MP3_256"]>0) break;
				case "1":
					format = 1;
					if (json["FILESIZE_MP3_128"]>0) break;
				case "8":
					format = 8;
			}
			json.format = format;
			var mediaVersion = parseInt(json["MEDIA_VERSION"]);
			json.downloadUrl = self.getDownloadUrl(md5Origin, id, format, mediaVersion);

			self.getATrack(id,function(trckjson, err){
				if (err)
					json["BPM"] = 0;
				else
					json["BPM"] = trckjson.bpm;
				callback(json);
			});
		} else {
			callback(null, new Error("Unable to get Track " + id));
		}
	}).bind(self));
}

Deezer.prototype.search = function(text, type, callback) {
	if(typeof type === "function") {
		callback = type;
		type = "";
	} else {
		type += "?";
	}
	request.get({url: "https://api.deezer.com/search/" + type + "q=" + text, headers: this.httpHeaders, jar: true}, function(err, res, body) {
		if(!err && res.statusCode == 200) {
			var json = JSON.parse(body);
			if(json.error) {
				callback(new Error("Wrong search type/text: " + text));
				return;
			}
			callback(json);
		} else {
			callback(new Error("Unable to reach Deezer API"));
		}
	});
}

Deezer.prototype.track2ID = function(artist, track, album, callback, trim=false) {
	var self = this;
	artist = artist.replace(/–/g,"-").replace(/’/g, "'");
	track = track.replace(/–/g,"-").replace(/’/g, "'");
	if (album) album = album.replace(/–/g,"-").replace(/’/g, "'");
	if (album){
		request.get({url: 'https://api.deezer.com/search/?q=track:"'+encodeURIComponent(track)+'" artist:"'+encodeURIComponent(artist)+'" album:"'+encodeURIComponent(album)+'"&limit=1&strict=on', headers: this.httpHeaders, jar: true}, function(err, res, body) {
			if(!err && res.statusCode == 200) {
				var json = JSON.parse(body);
				if(json.error) {
					if (json.error.code == 4){
						self.track2ID(artist, track, album, callback, trim);
						return;
					}else{
						callback({id:0, name: track, artist: artist}, new Error(json.error.code+" - "+json.error.message));
						return;
					}
				}
				if (json.data && json.data[0]){
					if (json.data[0].title_version && json.data[0].title.indexOf(json.data[0].title_version) == -1){
						json.data[0].title += " "+json.data[0].title_version
					}
					callback({id:json.data[0].id, name: json.data[0].title, artist: json.data[0].artist.name});
				}else {
					if (!trim){
						if (track.indexOf("(") < track.indexOf(")")){
							self.track2ID(artist, track.split("(")[0], album, callback, true);
							return;
						}else if (track.indexOf(" - ")>0){
							self.track2ID(artist, track.split(" - ")[0], album, callback, true);
							return;
						}else{
							self.track2ID(artist, track, null, callback, true);
						}
					}else{
						self.track2ID(artist, track, null, callback, true);
					}
				}
			} else {
				self.track2ID(artist, track, album, callback, trim);
				return;
			}
		});
	}else{
		request.get({url: 'https://api.deezer.com/search/?q=track:"'+encodeURIComponent(track)+'" artist:"'+encodeURIComponent(artist)+'"&limit=1&strict=on', headers: this.httpHeaders, jar: true}, function(err, res, body) {
			if(!err && res.statusCode == 200) {
				var json = JSON.parse(body);
				if(json.error) {
					if (json.error.code == 4){
						self.track2ID(artist, track, null, callback, trim);
						return;
					}else{
						callback({id:0, name: track, artist: artist}, new Error(json.error.code+" - "+json.error.message));
						return;
					}
				}
				if (json.data && json.data[0]){
					if (json.data[0].title_version && json.data[0].title.indexOf(json.data[0].title_version) == -1){
						json.data[0].title += " "+json.data[0].title_version
					}
					callback({id:json.data[0].id, name: json.data[0].title, artist: json.data[0].artist.name});
				}else {
					if (!trim){
						if (track.indexOf("(") < track.indexOf(")")){
							self.track2ID(artist, track.split("(")[0], null, callback, true);
							return;
						}else if (track.indexOf(" - ")>0){
							self.track2ID(artist, track.split(" - ")[0], null, callback, true);
							return;
						}else{
							callback({id:0, name: track, artist: artist}, new Error("Track not Found"));
							return;
						}
					}else{
						callback({id:0, name: track, artist: artist}, new Error("Track not Found"));
						return;
					}
				}
			} else {
				self.track2ID(artist, track, null, callback, trim);
				return;
			}
		});
	}
}

Deezer.prototype.hasTrackAlternative = function(id, callback) {
	var scopedid = id;
	var self = this;
	request.get({url: "https://www.deezer.com/track/"+id, headers: this.httpHeaders, jar: true}, (function(err, res, body) {
		var regex = new RegExp(/<script>window\.__DZR_APP_STATE__ = (.*)<\/script>/g);
		var rexec = regex.exec(body);
		var _data;
		try{
			_data = rexec[1];
		}catch(e){
			callback(null, new Error("Unable to get Track " + scopedid));
		}
		if(!err && res.statusCode == 200 && typeof JSON.parse(_data)["DATA"] != 'undefined') {
			var json = JSON.parse(_data)["DATA"];
			if(json.FALLBACK){
				callback(json.FALLBACK);
			}else{
				callback(null, new Error("Unable to get Track " + scopedid));
			}
		} else {
			callback(null, new Error("Unable to get Track " + scopedid));
		}
	}).bind(self));
}
//const logger = require('./logger.js');
Deezer.prototype.getDownloadUrl = function(md5Origin, id, format, mediaVersion) {
	var urlPart = md5Origin + "¤" + format + "¤" + id + "¤" + mediaVersion;
	var md5sum = crypto.createHash('md5');
	md5sum.update(new Buffer(urlPart, 'binary'));
	md5val = md5sum.digest('hex');
	urlPart = md5val + "¤" + urlPart + "¤";
	var cipher = crypto.createCipheriv("aes-128-ecb", new Buffer("jo6aey6haid2Teih"), new Buffer(""));
	var buffer = Buffer.concat([cipher.update(urlPart, 'binary'), cipher.final()]);
	return "https://e-cdns-proxy-" + md5Origin.substring(0, 1) + ".dzcdn.net/mobile/1/" + buffer.toString("hex").toLowerCase();
}

Deezer.prototype.decryptTrack = function(writePath, track, queueId, callback) {
	var self = this;
	var chunkLength = 0;
	if (self.delStream.indexOf(queueId) == -1){
		if (typeof self.reqStream[queueId] != "object") self.reqStream[queueId] = [];
		self.reqStream[queueId].push(
			request.get({url: track.downloadUrl, headers: self.httpHeaders, encoding: null}, function(err, res, body) {
				if(!err && res.statusCode == 200) {
					var decryptedSource = decryptDownload(new Buffer(body, 'binary'), track);
					fs.outputFile(writePath,decryptedSource,function(err){
						if(err){callback(err);return;}
						callback();
					});
					if (self.reqStream[queueId]) self.reqStream[queueId].splice(self.reqStream[queueId].indexOf(this),1);
				} else {
					logger.error("Decryption error"+(err ? " | "+err : "")+ (res ? ": "+res.statusCode : ""));
					if (self.reqStream[queueId]) self.reqStream[queueId].splice(self.reqStream[queueId].indexOf(this),1);
					callback(err || new Error("Can't download the track"));
				}
			}).on("data", function(data) {
				chunkLength += data.length;
				self.onDownloadProgress(track, chunkLength);
			}).on("abort", function() {
				logger.error("Decryption aborted");
				if (self.reqStream[queueId]) self.reqStream[queueId].splice(self.reqStream[queueId].indexOf(this),1);
				callback(new Error("aborted"));
			})
		);
	}else{
		logger.error("Decryption aborted");
		callback(new Error("aborted"));
	}
}

function decryptDownload(source, track) {
	var chunk_size = 2048;
	var part_size = 0x1800;
	var blowFishKey = getBlowfishKey(track["SNG_ID"]);
	var i = 0;
	var position = 0;

	var destBuffer = new Buffer(source.length);
	destBuffer.fill(0);

	while(position < source.length) {
		var chunk;
		if ((source.length - position) >= 2048) {
			chunk_size = 2048;
		} else {
			chunk_size = source.length - position;
		}
		chunk = new Buffer(chunk_size);
		let chunkString
		chunk.fill(0);
		source.copy(chunk, 0, position, position + chunk_size);
		if(i % 3 > 0 || chunk_size < 2048){
				chunkString = chunk.toString('binary')
		}else{
			var cipher = crypto.createDecipheriv('bf-cbc', blowFishKey, new Buffer([0, 1, 2, 3, 4, 5, 6, 7]));
			cipher.setAutoPadding(false);
			chunkString = cipher.update(chunk, 'binary', 'binary') + cipher.final();
		}
		destBuffer.write(chunkString, position, chunkString.length, 'binary');
		position += chunk_size
		i++;
	}
	return destBuffer;
}


function getBlowfishKey(trackInfos) {
	const SECRET = 'g4el58wc0zvf9na1';

	const idMd5 = crypto.createHash('md5').update(trackInfos.toString(), 'ascii').digest('hex');
	let bfKey = '';

	for (let i = 0; i < 16; i++) {
		bfKey += String.fromCharCode(idMd5.charCodeAt(i) ^ idMd5.charCodeAt(i + 16) ^ SECRET.charCodeAt(i));
	}

	return bfKey;
}

Deezer.prototype.cancelDecryptTrack = function(queueId) {
	if(Object.keys(this.reqStream).length != 0) {
		if (this.reqStream[queueId]){
			while (this.reqStream[queueId][0]){
				this.reqStream[queueId][0].abort();
			}
			delete this.reqStream[queueId];
			this.delStream.push(queueId);
			return true;
		}
		return true;
	} else {
		false;
	}
}

Deezer.prototype.onDownloadProgress = function(track, progress) {
	return;
}

function getJSON(url, callback){
	request.get({url: url, headers: this.httpHeaders, jar: true}, function(err, res, body) {
		if(err || res.statusCode != 200 || !body) {
			logger.error("Unable to initialize Deezer API");
			callback(new Error("Unable to initialize Deezer API"));
		} else {
			var json = JSON.parse(body);
			if (json.error) {
				if (json.error.message == "Quota limit exceeded"){
					logger.warn("Quota limit exceeded, retrying in 500ms");
					setTimeout(function(){ getJSON(url, callback); }, 500);
					return;
				}
				logger.error(json.error.message);
				return;
			}
			callback(json);
		}
	});
}
