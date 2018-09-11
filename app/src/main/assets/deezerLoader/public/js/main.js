// Starting area, boot up the API and proceed to eat memory

// Variables & constants
const socket = io.connect(window.location.href);
if(typeof mainApp !== "undefined"){
	var defaultUserSettings = mainApp.defaultSettings;
	var defaultDownloadLocation = mainApp.defaultDownloadDir;
}

homedata = "/storage/emulated/0";
userdata = homedata + "/Deezloader/";
const autologinLocation = userdata+"autologin";
const configFileLocation = userdata+"config.json";

let userSettings = [];
socket.emit("wipeuser");

let preview_track = document.getElementById('preview-track');
let preview_stopped = true;

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

socket.emit("autologin");

socket.on("wipeuser", function() {
    username = "";
    password = "";
    Username = "";
});

socket.on("fixloginbutt", function() {
    $('#modal_login_btn_login').attr("disabled",false);
    $('#modal_login_btn_login').html("Login");
});

socket.on("message", function(title, msg){
	message(title, msg);
});

//Login button
$('#modal_login_btn_login').click(function () {
	$('#modal_login_btn_login').attr("disabled",true);
	$('#modal_login_btn_login').html("Logging in...");
	var username = $('#modal_login_input_username').val();
	var password = $('#modal_login_input_password').val();
	//Send to the software
	Username = username;
	socket.emit("login",username,password,true);
});

socket.on("autologin",function(username,password){
	$('#modal_login_input_autologin').prop('checked',true);
	$('#modal_login_btn_login').attr("disabled",true);
	$('#modal_login_btn_login').html("Logging in...");
	$('#modal_login_input_username').val(username);
	Username = username;
	$('#modal_login_input_password').val(password);
	M.updateTextFields();
	socket.emit('login',username,password,false);
});

socket.on("login", function (errmsg) {
	if (errmsg == "none") {
		$("#modal_settings_username").html(Username);
		$('#initializing').addClass('animated fadeOut').on('webkitAnimationEnd', function () {
			$(this).css('display', 'none');
			$(this).removeClass('animated fadeOut');
			socket.emit("fixloginbutt");
			socket.emit("wipeuser");
		});

	    // Load top charts list for countries
	    socket.emit("getChartsCountryList", {selected: userSettings.chartsCountry});
	    socket.emit("getChartsTrackListByCountry", {country: userSettings.chartsCountry});
	    socket.emit("getMePlaylistList", {});
	}else{
	    socket.emit("fixloginbutt");
	    socket.emit("wipeuser");
	    fs.unlink(autologinLocation,function(){});
	    $('#login-res-text').text(errmsg);
		setTimeout(function(){$('#login-res-text').text("");},10000);
	}
});

// Do misc stuff on page load
$(document).ready(function () {
	M.AutoInit();
	preview_track.volume = 0;

	$(window).scroll(function () {
		if ($(this).scrollTop() > 100) {
			$('#btn_scrollToTop a').removeClass('scale-out').addClass('scale-in');
		} else {
			$('#btn_scrollToTop a').removeClass('scale-in').addClass('scale-out');
		}
	});

	$('#btn_scrollToTop').click(function () {
		$('html, body').animate({scrollTop: 0}, 800);
		return false;
	});

	$("#button_refresh_playlist_tab").click(function(){
		$("#table_personal_playlists").html("");
		$("#table_personal_playlists").css("visibility", "collapse");
		$("#table_personal_playlists_loadingIndicator").css("visibility", "visible");
		socket.emit("getMePlaylistList", {});
	})

	$(preview_track).on('canplay', ()=>{
		preview_track.play();
		preview_stopped = false;
		$(preview_track).animate({volume: 1}, 500);
	});

	$(preview_track).on('timeupdate', ()=>{
		if (preview_track.currentTime > preview_track.duration-1){
			$(preview_track).animate({volume: 0}, 800);
			preview_stopped = true;
			$("*").removeProp("playing");
			$('.preview_controls').text("play_arrow");
		}
	});
	$('.modal').modal();
});

// Load settings
socket.emit("getUserSettings");
socket.on('getUserSettings', function (data) {
	userSettings = data.settings;
	console.log('Settings refreshed');
});

/**
 *	Modal Area START
 */

// Prevent default behavior of closing button
$('.modal-close').click(function (e) {
	e.preventDefault();
});

// Settings Modal START
const $settingsAreaParent = $('#modal_settings');

// Open settings panel
$('#nav_btn_openSettingsModal').click(function () {
	fillSettingsModal(userSettings);
});

// Save settings button
$('#modal_settings_btn_saveSettings').click(function () {
	let settings = {};

	// Save
	settings.userDefined = {
		trackNameTemplate: $('#modal_settings_input_trackNameTemplate').val(),
		playlistTrackNameTemplate: $('#modal_settings_input_playlistTrackNameTemplate').val(),
		albumTrackNameTemplate: $('#modal_settings_input_albumTrackNameTemplate').val(),
		albumNameTemplate: $('#modal_settings_input_albumNameTemplate').val(),
		createM3UFile: $('#modal_settings_cbox_createM3UFile').is(':checked'),
		createArtistFolder: $('#modal_settings_cbox_createArtistFolder').is(':checked'),
		createAlbumFolder: $('#modal_settings_cbox_createAlbumFolder').is(':checked'),
		downloadLocation: $('#modal_settings_input_downloadTracksLocation').val(),
		artworkSize: $('#modal_settings_select_artworkSize').val(),
		audioQuality: $('#modal_settings_select_audioQuality').val(),
		padtrck: $('#modal_settings_cbox_padtrck').is(':checked'),
		syncedlyrics: $('#modal_settings_cbox_syncedlyrics').is(':checked'),
		numplaylistbyalbum: $('#modal_settings_cbox_numplaylistbyalbum').is(':checked'),
		extendedTags: $('#modal_settings_cbox_extendedTags').is(':checked'),
		partOfSet: $('#modal_settings_cbox_partOfSet').is(':checked'),
		chartsCountry: $('#modal_settings_select_chartsCounrty').val(),
		spotifyUser: $('#modal_settings_input_spotifyUser').val()
	};

	// Send updated settings to be saved into config file
	socket.emit('saveSettings', settings);
	socket.emit("getUserSettings");
});

// Reset defaults button
$('#modal_settings_btn_defaultSettings').click(function () {
	if(typeof defaultDownloadLocation !== "undefined"){
		defaultUserSettings.downloadLocation = defaultDownloadLocation;
		fillSettingsModal(defaultUserSettings);
	}
});

$('#modal_login_btn_signup').click(function(){
	socket.emit("openLink", "https://www.deezer.com/register");
});

$('#modal_settings_btn_logout').click(function () {
		$('#initializing').css('display', '');
		$('#initializing').addClass('animated fadeIn').on('webkitAnimationEnd', function () {
			$(this).removeClass('animated fadeIn');
			$(this).css('display', '');
		});
		socket.emit('logout');
		socket.emit("wipeuser");
		$('#modal_login_input_username').val("");
		$('#modal_login_input_password').val("");
		$('#modal_login_input_autologin').prop("checked",false);
});

// Populate settings fields
function fillSettingsModal(settings) {
	$('#modal_settings_input_trackNameTemplate').val(settings.trackNameTemplate);
	$('#modal_settings_input_playlistTrackNameTemplate').val(settings.playlistTrackNameTemplate);
	$('#modal_settings_input_albumTrackNameTemplate').val(settings.albumTrackNameTemplate);
	$('#modal_settings_input_albumNameTemplate').val(settings.albumNameTemplate);
	$('#modal_settings_cbox_createM3UFile').prop('checked', settings.createM3UFile);
	$('#modal_settings_cbox_createArtistFolder').prop('checked', settings.createArtistFolder);
	$('#modal_settings_cbox_createAlbumFolder').prop('checked', settings.createAlbumFolder);
	$('#modal_settings_select_audioQuality').val(settings.audioQuality);
	$('#modal_settings_cbox_padtrck').prop('checked', settings.padtrck);
	$('#modal_settings_cbox_syncedlyrics').prop('checked', settings.syncedlyrics);
	$('#modal_settings_cbox_numplaylistbyalbum').prop('checked', settings.numplaylistbyalbum);
	$('#modal_settings_input_downloadTracksLocation').val(settings.downloadLocation);
	$('#modal_settings_select_artworkSize').val(settings.artworkSize).formSelect();
	$('#modal_settings_cbox_extendedTags').prop('checked', settings.extendedTags);
	$('#modal_settings_cbox_partOfSet').prop('checked', settings.partOfSet);
	$('#modal_settings_select_chartsCounrty').val(settings.chartsCountry).formSelect();
	$('#modal_settings_input_spotifyUser').val(settings.spotifyUser);

	M.updateTextFields()
}

//#############################################MODAL_MSG##############################################\\
function message(title, message) {

	$('#modal_msg_title').html(title);

	$('#modal_msg_message').html(message);

	$('#modal_msg').modal('open');
}

//###############################################TAB_URL##############################################\\
$('#tab_url_form_url').submit(function (ev) {

	ev.preventDefault();

	var urls = $("#song_url").val().split(";");
	console.log(urls);
	for(var i = 0; i < urls.length; i++){
		var url = urls[i];
		console.log(url);

		if (url.length == 0) {
			message('Blank URL Field', 'You need to insert an URL to download it!');
			return false;
		}

		//Validate URL
		if (url.indexOf('deezer.com/') < 0 && url.indexOf('open.spotify.com/') < 0 && url.indexOf('spotify:') < 0) {
			message('Wrong URL', 'The URL seems to be wrong. Please check it and try it again.');
			return false;
		}

		if (url.indexOf('?') > -1) {
			url = url.substring(0, url.indexOf("?"));
		}

		if (url.indexOf('open.spotify.com/') >= 0 ||  url.indexOf('spotify:') >= 0){
			if (url.indexOf('user') < 0 || url.indexOf('playlist') < 0){
				message('Playlist not found', 'Spotify for now can only download playlists.');
				return false;
			}
		}
		addToQueue(url);
	}
});

//#############################################TAB_SEARCH#############################################\\
$('#tab_search_form_search').submit(function (ev) {

	ev.preventDefault();

	var searchString = $('#tab_search_form_search_input_searchString').val().trim();
	var mode = $('#tab_search_form_search').find('input[name=searchMode]:checked').val();

	if (searchString.length == 0) {
		message('Search can\'t be empty', 'You tried to search for nothing. But if you search nothing, you\'ll find nothing. So don\'t try it again.');
		return;
	}

	$('#tab_search_table_results').find('thead').find('tr').addClass('hide');
	$('#tab_search_table_results_tbody_results').addClass('hide');
	$('#tab_search_table_results_tbody_noResults').addClass('hide');
	$('#tab_search_table_results_tbody_loadingIndicator').removeClass('hide');

	socket.emit("search", {type: mode, text: searchString});
});

socket.on('search', function (data) {

	$('#tab_search_table_results_tbody_loadingIndicator').addClass('hide');

	if (data.items.length == 0) {
		$('#tab_search_table_results_tbody_noResults').removeClass('hide');
		return;
	}

	if (data.type == 'track') {
		showResults_table_track(data.items);
	} else if (data.type == 'album') {
		showResults_table_album(data.items);
	} else if (data.type == 'artist') {
		showResults_table_artist(data.items);
	} else if (data.type == 'playlist') {
		showResults_table_playlist(data.items);
	}
	$('#tab_search_table_results_tbody_results').removeClass('hide');
});

function showResults_table_track(tracks) {
	var tableBody = $('#tab_search_table_results_tbody_results');
	$(tableBody).html('');
	$('#tab_search_table_results_thead_track').removeClass('hide');
	for (var i = 0; i < tracks.length; i++) {
		var currentResultTrack = tracks[i];
		$(tableBody).append(
			'<tr>' +
			'<td><a href="#" class="circle single-cover" preview="'+currentResultTrack['preview']+'"><i class="material-icons preview_controls white-text">play_arrow</i><img class="circle" src="' + currentResultTrack['album']['cover_small'] + '"/></a></td>' +
			'<td><section class="centrado">' + currentResultTrack['title'] + (currentResultTrack.explicit_lyrics ? ' <i class="material-icons valignicon tiny materialize-red-text">error_outline</i>' : '')+ '</br>' +
			'' + currentResultTrack['artist']['name'] + '</br>' +
			'' + currentResultTrack['album']['title'] + '</br>' +
			'' + convertDuration(currentResultTrack['duration']) + '</br>' +
			'</section>'+
			'<td></td>'+
			'</tr>');
		generateDownloadLink(currentResultTrack['link']).appendTo(tableBody.children('tr:last').children('td:last')).wrap('<td class="toRight>');

		tableBody.children('tr:last').find('.preview_controls').hover( function () {
			$(this).css({opacity: 1});
		}, function () {
			if (($(this).parent().prop("playing") && preview_stopped) || !$(this).parent().prop("playing")){
				$(this).css({opacity: 0}, 200);
			}
		});

		tableBody.children('tr:last').find('.single-cover').click(function (e) {
			e.preventDefault();
			if ($(this).prop("playing")){
				if (preview_track.paused){
					preview_track.play();
					preview_stopped = false;
					$(this).children('i').text("pause");
					$(preview_track).animate({volume: 1}, 500);
				}else{
					preview_stopped = true;
					$(this).children('i').text("play_arrow");
					$(preview_track).animate({volume: 0}, 250, "swing", ()=>{ preview_track.pause() });
				}
			}else{
				$("*").removeProp("playing");
				$(this).prop("playing","playing");
				$('.preview_controls').text("play_arrow");
				$('.preview_controls').css({opacity:0});
				$(this).children('i').text("pause");
				$(this).children('i').css({opacity: 1});
				preview_stopped = false;
				$(preview_track).animate({volume: 0}, 250, "swing", ()=>{
					preview_track.pause();
					$('#preview-track_source').prop("src", $(this).attr("preview"));
					preview_track.load();
				});
			}
		});
	}
}

function showResults_table_album(albums) {
	var tableBody = $('#tab_search_table_results_tbody_results');
	$(tableBody).html('');
	$('#tab_search_table_results_thead_album').removeClass('hide');
	for (var i = 0; i < albums.length; i++) {
		var currentResultAlbum = albums[i];
		$(tableBody).append(
				'<tr>' +
				'<td><img src="' + currentResultAlbum['cover_small'] + '" class="circle" /></td>' +
				'<td><section class="centrado">'+
				(currentResultAlbum.explicit_lyrics ? '<i class="material-icons valignicon tiny materialize-red-text tooltipped" data-tooltip="Explicit">error_outline</i> ' : '') + 
				'' + currentResultAlbum['title'] + '</br>' +
				'' + currentResultAlbum['artist']['name'] + '</br>' +
				'' + currentResultAlbum['nb_tracks'] + '</br>' +
				'' + currentResultAlbum['record_type'] + '</td>' +
				'</section>' +
				'<td class="toRight"></td>' +
				'</tr>');
		tableBody.children().children('td:last').append(generateShowTracklistSelectiveButton(currentResultAlbum['link']));
		tableBody.children().children('td:last').append(generateDownloadLink(currentResultAlbum['link']));
	}
	$('.tooltipped').tooltip({delay: 100});
}

function showResults_table_artist(artists) {
	var tableBody = $('#tab_search_table_results_tbody_results');
	$(tableBody).html('');
	$('#tab_search_table_results_thead_artist').removeClass('hide');
	for (var i = 0; i < artists.length; i++) {
		var currentResultArtist = artists[i];
		$(tableBody).append(
				'<tr>' +
				'<td><img src="' + currentResultArtist['picture_small'] + '" class="circle" /></td>' +
				'<td><section class="centrado detallesArtist">' + currentResultArtist['name'] + '</br>' +
				'' + currentResultArtist['nb_album'] + " album" + (currentResultArtist['nb_album']!==1? "s":"") + '</td>' +
				'</section>'+
				'</tr>');
		generateShowTracklistButton(currentResultArtist['link']).appendTo(tableBody.children('tr:last')).wrap('<td class="toRight">');
	}
}

function showResults_table_playlist(playlists) {
	var tableBody = $('#tab_search_table_results_tbody_results');
	$(tableBody).html('');
	$('#tab_search_table_results_thead_playlist').removeClass('hide');
	for (var i = 0; i < playlists.length; i++) {
		var currentResultPlaylist = playlists[i];
		$(tableBody).append(
				'<tr>' +
				'<td><img src="' + currentResultPlaylist['picture_small'] + '" class="circle" /></td>' +
				'<td><section class="centrado">' + currentResultPlaylist['title'] + '</br>' +
				'' + currentResultPlaylist['nb_tracks'] + ' song' + (currentResultPlaylist['nb_tracks']>1?"s":"") + '</td>' +
				'</section>' +
				'<td class="toRight"></td>' +
				'</tr>');
		tableBody.children().children('td:last').append(generateShowTracklistSelectiveButton(currentResultPlaylist['link']));
		tableBody.children().children('td:last').append(generateDownloadLink(currentResultPlaylist['link']));
	}
	$('.tooltipped').tooltip({delay: 100});
}

function generateShowTracklistSelectiveButton(link) {
	var btn_showTrackListSelective = $('<a href="#" class="btn-flat"><i class="material-icons">list</i></a>');
	$(btn_showTrackListSelective).click(function (ev){
		ev.preventDefault();
		showTrackListSelective(link);
	});
	return btn_showTrackListSelective;
}

function generateShowTracklistButton(link) {
	var btn_showTrackList = $('<a href="#" class="btn-flat"><i class="material-icons">list</i></a>');
	$(btn_showTrackList).click(function (ev) {
		ev.preventDefault();
		showTrackList(link);
	});
	return btn_showTrackList;
}

var trackListSelectiveModalApp = new Vue({
	el: '#modal_trackListSelective',
	data: {
		title: null,
		head: null,
		body: []
	}
});

var trackListModalApp = new Vue({
	el: '#modal_trackList',
	data: {
		title: null,
		head: null,
		body: []
	}
});

function showTrackListSelective(link) {
	$('#modal_trackListSelective_table_trackListSelective_tbody_trackListSelective').addClass('hide');
	$('#modal_trackListSelective_table_trackListSelective_tbody_loadingIndicator').removeClass('hide');
	$('#modal_trackListSelective').modal('open');
	socket.emit('getTrackList', {id: getIDFromLink(link), type: getTypeFromLink(link)});
}

$('#download_track_selection').click(function(e){
	e.preventDefault();
	var urls = [];
	$("input:checkbox.trackCheckbox:checked").each(function(){
		urls.push($(this).val());
	});
	if(urls.length != 0){
		for (var ia = 0; ia < urls.length; ia++) {
			addToQueue(urls[ia]);
		}
	}
	$('#modal_trackListSelective').modal('close');
});

function showTrackList(link) {
	$('#modal_trackList_table_trackList_tbody_trackList').addClass('hide');
	$('#modal_trackList_table_trackList_tbody_loadingIndicator').removeClass('hide');
	$('#modal_trackList').modal('open');
	socket.emit("getTrackList", {id: getIDFromLink(link), type: getTypeFromLink(link)});
}

socket.on("getTrackList", function (data) {
	if (data.err){
		trackListSelectiveModalApp.title = "Can't get data"
		return;
	}
	if (data.response){
		var trackList = data.response.data, content = '';
		var trackListSelective = data.response.data, content = '';
		if (typeof trackList == 'undefined') {
			alert('Well, there seems to be a problem with this part of the app. Please notify the developer.');
			return;
		}

		if(data.reqType == 'album' || data.reqType == 'playlist'){
			var tableBody = $('#modal_trackListSelective_table_trackListSelective_tbody_trackListSelective');
		} else {
			var tableBody = $('#modal_trackList_table_trackList_tbody_trackList');
		}
		$(tableBody).html('');

		if (data.reqType == 'artist') {
			trackListModalApp.title = 'Album List';
			trackListModalApp.head = [
			];

			for (var i = 0; i < trackList.length; i++) {

				$(tableBody).append('<tr><td>' + (i + 1) + '</td>' +
						'<td class="centrado">'+
						(trackList[i].explicit_lyrics ? '<i class="material-icons valignicon tiny materialize-red-text tooltipped" data-tooltip="Explicit">error_outline</i></br>' : '') +
						'<a href="#" class="album_chip" data-link="' + trackList[i].link + '"><div class="chip"><img src="' + trackList[i].cover_small + '" />' + trackList[i].title + '</div></a></br>' +
						'' + trackList[i].release_date + '</br>' + 
						trackList[i].record_type + '</td></tr>');

				generateDownloadLink(trackList[i].link).appendTo(tableBody.children('tr:last')).wrap('<td>');
			}
			$('.album_chip').click(function(e){
				showTrackListSelective($(this).data('link'), true);
			});
		} else if(data.reqType == 'playlist') {
			trackListSelectiveModalApp.title = 'Playlist';

			trackListSelectiveModalApp.head = [
				{title: '<div class="valign-wrapper"><label><input class="selectAll" type="checkbox" id="selectAll"><span>Select all songs</span></label></div>'}
			];

			$('.selectAll').prop('checked', false);

			for (var i = 0; i < trackList.length; i++) {
				$(tableBody).append('<tr><td class="playNum">' + (i + 1) + '</td>' +
						'<td class="centrado">' + 
						(trackList[i].explicit_lyrics ? '<i class="material-icons valignicon tiny materialize-red-text tooltipped" data-tooltip="Explicit">error_outline</i> ' : '') + 
						trackList[i].title + '</br>' +
						'' + trackList[i].artist.name + '</br>' +
						'' + convertDuration(trackList[i].duration) + '</td>' +
						'<td><div class="valign-wrapper"><label><input class="trackCheckbox valign" type="checkbox" id="trackChk'+ i +'" value="' + trackList[i].link + '"><span></span></label></div></td></tr>');
			}
		} else if(data.reqType == 'album') {
			trackListSelectiveModalApp.title = 'Tracklist';

			trackListSelectiveModalApp.head = [
				{title: '<div class="valign-wrapper"><label><input class="selectAll" type="checkbox" id="selectAll"><span>Select all songs</span></label></div>'}
			];

			$('.selectAll').prop('checked', false);

			if (trackList[trackList.length-1].disk_number != 1){
				baseDisc = 0
			} else {
				baseDisc =1
			};

			for (var i = 0; i < trackList.length; i++) {
				discNum = trackList[i].disk_number
				if (discNum != baseDisc){
					$(tableBody).append('<tr><td colspan="4" style="opacity: 0.54;"><i class="material-icons valignicon tiny">album</i> '+discNum+'</td></tr>');
					baseDisc = discNum;
				}
				$(tableBody).append('<tr><td>' + trackList[i].track_position + '</td>' +
						'<td class="centrado">' + 
						(trackList[i].explicit_lyrics ? '<i class="material-icons valignicon tiny materialize-red-text tooltipped" data-tooltip="Explicit">error_outline</i> ' : '') + 
						trackList[i].title + '</br>' +
						'' + trackList[i].artist.name + '</br>' +
						'' + convertDuration(trackList[i].duration) + '</br>' +
						'<td><div class="valign-wrapper"><label><input class="trackCheckbox valign" type="checkbox" id="trackChk'+ i +'" value="' + trackList[i].link + '"><span></span></label></div></tr>');
			}
		} else {
			trackListModalApp.title = 'Tracklist';
			trackListModalApp.head = [
				{title: '#'},
				{title: 'Song'},
				{title: 'Artist'},
				{title: '<i class="material-icons">timer</i>'}
			];

			for (var i = 0; i < trackList.length; i++) {

				$(tableBody).append('<tr><td>' + (i + 1) + '</td>' +
						(trackList[i].explicit_lyrics ? '<td><i class="material-icons valignicon tiny materialize-red-text tooltipped" data-tooltip="Explicit">error_outline</i> ' : '<td> ') +
						trackList[i].title + '</td>' +
						'<td>' + trackList[i].artist.name + '</td>' +
						'<td>' + convertDuration(trackList[i].duration) + '</td></tr>');
			}
		}
		if(data.reqType == 'album' || data.reqType == 'playlist'){
			$('#modal_trackListSelective_table_trackListSelective_tbody_loadingIndicator').addClass('hide');
			$('#modal_trackListSelective_table_trackListSelective_tbody_trackListSelective').removeClass('hide');
		} else {
			$('#modal_trackList_table_trackList_tbody_loadingIndicator').addClass('hide');
			$('#modal_trackList_table_trackList_tbody_trackList').removeClass('hide');
		}
	}
});

//#############################################TAB_CHARTS#############################################\\
socket.on("getChartsCountryList", function (data) {
	for (var i = 0; i < data.countries.length; i++) {
		$('#tab_charts_select_country').append('<option value="' + data.countries[i]['country'] + '" data-icon="' + data.countries[i]['picture_small'] + '" class="left circle">' + data.countries[i]['country'] + '</option>');
		$('#modal_settings_select_chartsCounrty').append('<option value="' + data.countries[i]['country'] + '" data-icon="' + data.countries[i]['picture_small'] + '" class="left circle">' + data.countries[i]['country'] + '</option>');
	}

	$('#tab_charts_select_country').find('option[value="' + data.selected + '"]').attr("selected", true);
	$('#modal_settings_select_chartsCounrty').find('option[value="' + data.selected + '"]').attr("selected", true);

	$('select').formSelect();
});

$('#tab_charts_select_country').on('change', function () {

	var country = $(this).find('option:selected').val();

	$('#tab_charts_table_charts_tbody_charts').addClass('hide');
	$('#tab_charts_table_charts_tbody_loadingIndicator').removeClass('hide');

	socket.emit("getChartsTrackListByCountry", {country: country});

});

socket.on("getChartsTrackListByCountry", function (data) {
	var chartsTableBody = $('#tab_charts_table_charts_tbody_charts'), currentChartTrack;

	chartsTableBody.html('');
	
	for (var i = 0; i < data.tracks.length; i++) {
		currentChartTrack = data.tracks[i];
		var s1="", s2="";
		if(i%2==0)$(chartsTableBody).append("<div class='row'>");
		$(chartsTableBody).append(
				'<tr class="col s6">' +
				'<td class="centrado chartSong"><p><a href="#" class="circle single-cover" preview="'+currentChartTrack['preview']+'"><i class="material-icons preview_controls white-text">play_arrow</i><img src="' + currentChartTrack['album']['cover_small'] + '" class="circle" /></a></p>' +
				'<p>' + (i + 1) + '</p>' +
				'<p>' + currentChartTrack['title'] + '</p>' +
				'<p>' + currentChartTrack['artist']['name'] + '</p>' +
				'<p>' + currentChartTrack['album']['title'] + '</p>' +
				'<p>' + convertDuration(currentChartTrack['duration']) + '</p></td>'+
				'</tr>'+s2);
		generateDownloadLink(currentChartTrack['link']).appendTo(chartsTableBody.children().children('td:last')).wrap('<p>');
		if(i%2==1)$(chartsTableBody).append("</div>");
		chartsTableBody.children('tr:last').find('.preview_controls').hover( function () {
			$(this).css({opacity: 1});
		}, function () {
			if (($(this).parent().prop("playing") && preview_stopped) || !$(this).parent().prop("playing")){
				$(this).css({opacity: 0}, 200);
			}
		});

		chartsTableBody.children('tr:last').find('.single-cover').click(function (e) {
			e.preventDefault();
			if ($(this).prop("playing")){
				if (preview_track.paused){
					preview_track.play();
					preview_stopped = false;
					$(this).children('i').text("pause");
					$(preview_track).animate({volume: 1}, 500);
				}else{
					preview_stopped = true;
					$(this).children('i').text("play_arrow");
					$(preview_track).animate({volume: 0}, 250, "swing", ()=>{ preview_track.pause() });
				}
			}else{
				$("*").removeProp("playing");
				$(this).prop("playing","playing");
				$('.preview_controls').text("play_arrow");
				$('.preview_controls').css({opacity:0});
				$(this).children('i').text("pause");
				$(this).children('i').css({opacity: 1});
				preview_stopped = false;
				$(preview_track).animate({volume: 0}, 250, "swing", ()=>{
					preview_track.pause();
					$('#preview-track_source').prop("src", $(this).attr("preview"));
					preview_track.load();
				});
			}
		});
		if(i%2==1)$(chartsTableBody).append("</div>");

	}

	$('#tab_charts_table_charts_tbody_loadingIndicator').addClass('hide');
	chartsTableBody.removeClass('hide');

});

socket.on("getMePlaylistList", function (data) {
	$("#table_personal_playlists_loadingIndicator").css("visibility", "collapse");
	var tableBody = $('#table_personal_playlists');
	tableBody.css("visibility", "visible");
	$(tableBody).html('');
	for (var i = 0; i < data.playlists.length; i++) {
		var currentResultPlaylist = data.playlists[i];
		$(tableBody).append(
				'<tr>' +
				'<td><img src="' + currentResultPlaylist['image'] + '" class="circle" width="56px" /></td>' +
				'<td><section class="centrado">' + currentResultPlaylist['title'] + '</br>' +
				'' + currentResultPlaylist['songs'] + '</td>' +
				'</section>'+
				'<td class="toRight"></td>'+
				'</tr>');
		generateShowTracklistSelectiveButton(currentResultPlaylist['link']).appendTo(tableBody.children('tr:last').children('td:last')).wrap('<p>');
		generateDownloadLink(currentResultPlaylist['link']).appendTo(tableBody.children('tr:last').children('td:last')).wrap('<p>');
	}
	$('.tooltipped').tooltip({delay: 100});
});

//############################################TAB_DOWNLOADS###########################################\\
function addToQueue(url) {
	var type = getTypeFromLink(url), id = getIDFromLink(url);

	if (type == 'spotifyplaylist'){
		[user, id] = getPlayUserFromURI(url)
		userSettings.spotifyUser = user;
	}

	if (type == 'track') {
		userSettings.filename = userSettings.trackNameTemplate;
		userSettings.foldername = userSettings.albumNameTemplate;
	} else if (type == 'playlist' || type == 'spotifyplaylist') {
		userSettings.filename = userSettings.playlistTrackNameTemplate;
		userSettings.foldername = userSettings.albumNameTemplate;
	} else if (type == 'album' || type == 'artist'){
		userSettings.filename = userSettings.albumTrackNameTemplate;
		userSettings.foldername = userSettings.albumNameTemplate;
	} else {
		$('#modal_wrongURL').modal('open');
		return false;
	}

	if (alreadyInQueue(id)) {
		M.toast({html: '<i class="material-icons">playlist_add_check</i>Already in download-queue!', displayLength: 5000, classes: ''});

		return false;
	}

	if (id.match(/^[0-9]+$/) == null && type != 'spotifyplaylist') {
		$('#modal_wrongURL').modal('open');
		return false;
	}
	socket.emit("download" + type, {id: id, settings: userSettings});

	M.toast({html: '<i class="material-icons">add</i>Added to download-queue', displayLength: 5000, classes: ''});

}

function alreadyInQueue(id) {

	var alreadyInQueue = false;

	$('#tab_downloads_table_downloads').find('tbody').find('tr').each(function () {

		if ($(this).data('deezerid') == id) {
			alreadyInQueue = true;

			return false
		}

	});

	return alreadyInQueue;
}

socket.on('addToQueue', function (data) {

	var tableBody = $('#tab_downloads_table_downloads').find('tbody');

	$(tableBody).append(
			'<tr id="' + data.queueId + '" data-deezerid="' + data.id + '">' +
			'<td class="queueTitle">' + data.name + '</td>' +
			'<td class="queueSize center">' + data.size + '</td>' +
			'<td class="queueDownloaded center">' + data.downloaded + '</td>' +
			'<td class="queueFailed center">' + data.failed + '</td>' +
			'<td class="progressText"><div class="progress center"><div class="indeterminate center"></div></div></td>' +
			'</tr>');

	var btn_remove = $('<a href="#" class="btn-flat" style="padding: 0;"><i class="material-icons">remove</i></a>');

	$(btn_remove).click(function (ev) {

		ev.preventDefault();

		socket.emit("cancelDownload", {queueId: data.queueId});

	});

	btn_remove.appendTo(tableBody.children('tr:last')).wrap('<td class="eventBtn center">');
});

socket.on("downloadStarted", function (data) {

	$('#' + data.queueId).find('.indeterminate').removeClass('indeterminate').addClass('determinate');
	$('#' + data.queueId).find('.eventBtn').find('a').html('<i class="material-icons">clear</i>');
});

socket.on('updateQueue', function (data) {

	if (data.cancelFlag) {
		return;
	}

	$('#' + data.queueId).find('.queueDownloaded').html(data.downloaded);
	$('#' + data.queueId).find('.queueFailed').html(data.failed);

	if (data.failed == 0 && ((data.downloaded + data.failed) >= data.size)) {
		$('#' + data.queueId).find('.eventBtn').html('<i class="material-icons">done</i>');
		$('#' + data.queueId).addClass('finished');
		M.toast({html: '<i class="material-icons">done</i>One download completed!', displayLength: 5000, classes: ''})
	} else if (data.downloaded == 0 && ((data.downloaded + data.failed) >= data.size)) {
		$('#' + data.queueId).find('.eventBtn').html('<i class="material-icons">error</i>');
		$('#' + data.queueId).addClass('error');
		M.toast({html: '<i class="material-icons">error</i>One download failed!', displayLength: 5000, classes: ''})
	}
});

socket.on("downloadProgress", function (data) {

	$('#' + data.queueId).find('.progressText').html(parseInt(data.percentage) + '%');

});

socket.on("emptyDownloadQueue", function () {
	M.toast({html: '<i class="material-icons">done_all</i>All downloads completed!', displayLength: 5000, classes: ''});
});

socket.on("cancelDownload", function (data) {
	$('#' + data.queueId).addClass('animated fadeOutRight').on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
		$(this).remove();
		M.toast({html: '<i class="material-icons">clear</i>One download removed!', displayLength: 5000, classes: ''})
	});
});

$('#clearTracksTable').click(function (ev) {
	$('#tab_downloads_table_downloads').find('tbody').find('.finished', '.error').addClass('animated fadeOutRight').on('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
		$(this).remove();
	});
	return false;
});

/**
 * Given a spotify playlist URL or URI it returns the username of the owner of the playlist and the ID of the playlist
 */
function getPlayUserFromURI(url){
	var spotyUser, playlistID;
	if ((url.startsWith("http") && url.indexOf('open.spotify.com/') >= 0)){
		if (url.indexOf('user') < 0 || url.indexOf('playlist') < 0){
			message('Playlist not found', 'The URL seems to be wrong. Please check it and try it again.');
			return [false,false];
		}
		if (url.indexOf('?') > -1) {
			url = url.substring(0, url.indexOf("?"));
		}
		spotyUser = url.slice(url.indexOf("/user/")+6);
		spotyUser = spotyUser.substring(0, spotyUser.indexOf("/"));
		playlistID = url.slice(url.indexOf("/playlist/")+10);
	} else if (url.startsWith("spotify:")){
		spotyUser = url.slice(url.indexOf("user:")+5);
		spotyUser = spotyUser.substring(0, spotyUser.indexOf(":"));
		playlistID = url.slice(url.indexOf("playlist:")+9);
	} else {
		return [false,false];
	}
	return [spotyUser, playlistID]
}

function getIDFromLink(link) {
	return link.substring(link.lastIndexOf("/") + 1);
}

function getTypeFromLink(link) {
	var type;
	if (link.indexOf('spotify') > -1){
		type = "spotifyplaylist";
	} else	if (link.indexOf('track') > -1) {
		type = "track";
	} else if (link.indexOf('playlist') > -1) {
		type = "playlist";
	} else if (link.indexOf('album') > -1) {
		type = "album";
	} else if (link.indexOf('artist')) {
		type = "artist";
	}
	return type;
}

function generateDownloadLink(url) {
	var btn_download = $('<a href="#" class="btn-flat"><i class="material-icons">file_download</i></a>');
	$(btn_download).click(function (ev) {
		ev.preventDefault();
		addToQueue(url);
	});
	return btn_download;
}

function convertDuration(duration) {
	var mm, ss;
	mm = Math.floor(duration / 60);
	ss = duration - (mm * 60);
	if (ss < 10) {
		ss = "0" + ss;
	}
	return mm + ":" + ss;
}
