/*
<!-- Instagram strings-->
<string name="connect_window_close">Close</string>
<string name="connect_window_title">Authorise</string>
<string name="instagram_error">There was an error talking to Instagram. Please try again a little later.</string>
<string name="instagram_auth_error">Instagram login error</string>
<string name="instagram_canceled">Instagram login canceled</string>
*/

var xhr = require('/xhr');

var OAuthAdapter = function(_clientId, _clientSecret, _signatureMethod, _urlCallback) {
	var consumerSecret = _clientId;
	var consumerKey = _clientSecret;
	var signatureMethod = _signatureMethod;
	var urlCallback = _urlCallback;
	var accessToken = null;
	var window = null;
	var winBase = null;
	var view = null;
	var webView = null;
	var self = this;

	this.load = function(callback) {
		self.callback = callback || function(){};
		
		if (Ti.App.Properties.hasProperty("instagram_token")) {
			accessToken = (Ti.App.Properties.getString("instagram_token") == "") ? null : Ti.App.Properties.getString("instagram_token");
		}
	};

	save_instagram = function() {
		var instagram = {
			"instagram_token": accessToken,
			"sid": Ti.App.Properties.getString("sid")
		}

		Ti.App.Properties.setString("instagram_token", accessToken);
		self.callback(null,"instagram_integrated");
	};

	this.isAuthorized = function() {
		return ! (accessToken == null);
	};

	hide_instagram = function() {
		winBase.close();
		window = null;
		winBase = null;
	};

	this.show = function(_url) {

		closeButton = Ti.UI.createButton({
			title: L("connect_window_close")
		});

		winBase = Ti.UI.createWindow({
			modal: true,
			modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_PAGESHEET,
			fullscreen: false,
			navBarHidden: true
		});
		window = Ti.UI.createWindow({
			//leftNavButton: closeButton,
			title: L("connect_window_title"),
			navBarHidden: false,
			barColor: "#010101"
		});
		var nav = Ti.UI.iPhone.createNavigationGroup({
			window: window
		});
		winBase.add(nav);

		view = Ti.UI.createView({
			backgroundColor: 'white'
		});

		webView = Ti.UI.createWebView({
			url: _url,
			autoDetect: [Ti.UI.iOS.AUTOLINK_NONE]
		});

		webView.addEventListener("load", function(e) {

			//Titanium.API.info(e.url);
			var regex = new RegExp("(#access_token)");

			if (e.url.indexOf(_urlCallback) == 0) {
				if (regex.test(e.url) == true) {
					accessToken = e.url.substr(urlCallback.length + 14, e.url.length);
					save_instagram();
					hide_instagram();
					//self.callback(null,'ok');
				}
				else {
					//self.callback('instagram_auth_error');
				}
			};

		});

		view.add(webView);

		closeButton.addEventListener("click", function(e) {
			self.callback("instagram_canceled");
			hide_instagram();
		});

		window.add(view);
		winBase.open({
			modal: true,
			modalTransitionStyle: Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
    		modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
		});
		
	};
};

exports.init = function(params) {
	var _self = this;
	var _clientId = params.clientId;
	var _clientSecret = params.clientSecret;
	var _urlCallback = params.urlCallback
	var _signatureMethod = params.signatureMethod || 'HMAC-SHA1';
		
	this.oAuthAdapter = new OAuthAdapter(_clientId, _clientSecret, _signatureMethod, _urlCallback);

	this.authenticate = function(callback) {
				
		var oAuthAdapter = this.oAuthAdapter;
		var isAuthorized = oAuthAdapter.isAuthorized();
		oAuthAdapter.load(callback);

		if (isAuthorized == false) {
			var URLRequest = "https://api.instagram.com/oauth/authorize/?client_id=" + _clientId + "&response_type=token&redirect_uri=" + _urlCallback + "&scope=likes+comments+relationships";
			oAuthAdapter.show(URLRequest);
		}
	};
};

exports.isAuthorized = function(){
	return Ti.App.Properties.hasProperty("instagram_token");
};

/*
 * From this point on, everything is related to the 
 * Instagram's API itself and not the oAuth module
 */

var baseURL = "https://api.instagram.com/v1/";

// Helper function to retrieve the access token
function getAccessToken(){
	return Titanium.App.Properties.getString("instagram_token", null);
};

// Helper function to generate the repeated parts of the URLs
function generateURL(url) {
	return baseURL + url + "?access_token=" + getAccessToken();
};

/*
 * Search
 */

// Returns a feed corresponding to a hashtag
exports.searchByHashtag = function(hashtag, onSuccess, onError) {
	var token = getAccessToken();
	// If we haven' authenticated yet
	// (Sometimes we don't like the initial screen)
	// Use my client id
	if (!token) {
		var clientId = Alloy.Globals.instagram.clientId;
	
		new XHR().get(baseURL + "tags/" + hashtag + "/media/recent?client_id=" + clientId, onSuccess, onError, { ttl: 180 });
	// Otherwise, use the user's authentication token
	} else {
		new XHR().get(generateURL("tags/" + hashtag + "/media/recent"), onSuccess, onError, { ttl: 15 });
	}
};

// Returns a list of users with this username
exports.searchUser = function(username, onSuccess, onError){
	var token = getAccessToken();

	new XHR().get(generateURL("users/search") + "&q=" + username, onSuccess, onError);
};

// Returns a list of hashtags with this name
exports.searchHashtag = function(name, onSuccess, onError){
	var token = getAccessToken();

	new XHR().get(generateURL("tags/search") + "&q=" + name, onSuccess, onError);
};

// Returns a list of locations with this name
exports.searchLocation = function(latitude, longitude, onSuccess, onError){
	var token = getAccessToken();

	new XHR().get(generateURL("locations/search") + "&lat=" + latitude + "&lng=" + longitude, onSuccess, onError);
};

// Returns a feed corresponding to a location
exports.searchByLocation = function(locationId, onSuccess, onError) {
	var token = getAccessToken();

	new XHR().get(generateURL("locations/" + locationId + "/media/recent"), onSuccess, onError, { ttl: 15 });
};

/*
 * User
 */

// Set the current user
exports.setCurrentUser = function(user) {
	Titanium.App.Properties.setObject("current_user", user);
};

// Returns the user's information stored in the localsystem
exports.getCurrentUser = function() {
	return Titanium.App.Properties.getObject("current_user");
};

// Returns a user's information
exports.getUserInfo = function(userId, onSuccess, onError) {	
	new XHR().get(generateURL("users/" + userId), onSuccess, onError, { ttl: 1440 });
};

// Returns a user's photos
exports.getUserMedia = function(userId, onSuccess, onError) {	
	new XHR().get(generateURL("users/" + userId + "/media/recent"), onSuccess, onError, { ttl: 10 });
};

// Returns the user's current feed
exports.getFeed = function(onSuccess, onError) {	
	new XHR().get(generateURL("users/self/feed"), onSuccess, onError, { ttl: 10 });
};

// Get the status of the relationship with the user
exports.getRelationship = function(userId, onSuccess, onError) {
	// Relation types can be follow/unfollow/block/unblock/approve/deny
	new XHR().get(generateURL("users/" + userId + "/relationship"), onSuccess, onError, { ttl: 1440 });
};

// Follow, unfollow, block, etc a user
exports.setRelationship = function(userId, relation, onSuccess, onError) {
	// Relation types can be follow/unfollow/block/unblock/approve/deny
	new XHR().post(generateURL("users/" + userId + "/relationship"), relation, onSuccess, onError);
	// Clear our cached relationship request
	new XHR().clear(generateURL("users/" + userId + "/relationship"));
};

/*
 * Media
 */

exports.getMedia = function(mediaId, onSuccess, onError){
	new XHR().get(generateURL("media/" + mediaId ), onSuccess, onError, { ttl: 10 });
};

/*
 * Misc
 */

// Fetch from pagination
exports.getNextPageInPagination = function(nextURL, onSuccess, onError){
	new XHR().get(nextURL, onSuccess, onError, { ttl: 10 });
};

/*
 * Likes
 */

// Returns the user's likes
exports.getLiked = function(onSuccess, onError) {
	new XHR().get(generateURL("users/self/media/liked"), onSuccess, onError, { ttl: 10 });
};

// Returns the full list of likers
exports.getLikers = function(mediaId, onSuccess, onError) {
	new XHR().get(generateURL("media/" + mediaId + "/likes"), onSuccess, onError, { ttl: 10 });
};

// Likes a media
exports.likeMedia = function(mediaId, onSuccess, onError) {	
	new XHR().post(generateURL("media/" + mediaId + "/likes"), null, onSuccess, onError);
};

// Unlikes a media
exports.unlikeMedia = function(mediaId, onSuccess, onError) {	
	new XHR().destroy(generateURL("media/" + mediaId + "/likes"), onSuccess, onError);
};

/*
 * Comments
 */

// Returns the full list of comments
exports.getComments = function(mediaId, onSuccess, onError) {
	new XHR().get(generateURL("media/" + mediaId + "/comments"), onSuccess, onError, { ttl: 5 });
};

// Creates a comment
exports.addComment = function(mediaId, data, onSuccess, onError) {
	new XHR().post(generateURL("media/" + mediaId + "/comments"), data, onSuccess, onError);
};

/*
 * Collections
 */

// Return the content of a collection
exports.searchByCollection = function(data, onSuccess){
	var currentUser = exports.getCurrentUser();	
	var mediaCollection = Alloy.createCollection("media");
		
	// Fetch the media inside this colleciton of the current user
	mediaCollection.index({ 
		"username": currentUser.username,
		"collectionId": data.id
	});
	
	onSuccess(mediaCollection.toJSON());
};

// Returns a list of all the collections of the current user
exports.getCollections = function() {
	var currentUser = exports.getCurrentUser();	
	var collections = Alloy.createCollection("collection");
	
	// Fetch the collections of the current user
	collections.index({ 
		"username": currentUser.username 
	});
	
	return collections;
};

// Creates a collection
exports.addCollection = function(title, onSuccess, onError) {
	var currentUser = exports.getCurrentUser();
	var collection = Alloy.createModel("collection", {
		"title": title,
		"username": currentUser.username,
		"count": 0
	});
	
	collection.save();
	
	onSuccess(collection.toJSON());
};

// Add or Remove a media from a collection
exports.togglePhotoInCollection = function(data, onSuccess) {
	var action = ""; // this is used to know what happended inside this method
	var currentUser = exports.getCurrentUser();
	// Check if this media is already in some collections
	var mediaInCollections = Alloy.createCollection("media");
	mediaInCollections.isAlreadyInCollection({
		"mediaId": data.media.id,
		"collectionId": data.collectionId,
		"username": currentUser.username
	});
	var collection = Alloy.createCollection("collection");
	collection.show({
		"username": currentUser.username,
		"collectionId": data.collectionId
	});
		
	// If we found the media in the collection, then delete it
	// this will be our way to "remove" media from collections
	if (mediaInCollections.at(0)) {
		action = "destroy";
		// Remove the object
		mediaInCollections.at(0).destroy();
		// Decrease the count in the collection
		collection.at(0).set("count", collection.at(0).get("count")-1);
	// Otherwise, create it
	} else {
		action = "create";
		var media = Alloy.createModel("media", {
			"collection_id": data.collectionId,
	        "username" : currentUser.username,
	        "media_id" : data.media.id,
	        "media" : JSON.stringify(data.media)
		});
		// Save the object to the database
		media.save();
		// Increment the count in the collection
		collection.at(0).set("count", collection.at(0).get("count")+1);
	}
	
	// Update the collection
	collection.at(0).save();
	
	// Execute the callback with the action performed
	onSuccess(action);
	
};

// Delete a collection (and all the related media)
exports.deleteCollection = function(collectionId){
	var currentUser = exports.getCurrentUser();
	var collection = Alloy.createCollection("collection");
	var mediaInCollection = Alloy.createCollection("media");
	
	// Fetch the collection
	collection.show({
		"username": currentUser.username,
		"collectionId": collectionId
	});
	// Destroy it
	collection.at(0).destroy();
	
	// Fetch and destroy all the related media to that collection
	mediaInCollection.deleteAll({
		"username": currentUser.username,
		"collectionId": collectionId
	});
};