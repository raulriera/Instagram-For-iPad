var args = arguments[0] || {};
var instagram = require("/instagram");

// Setup the variables we just received
args = cleanUpMediaJSON(args.media);

// Clean up the "media" object before using it
function cleanUpMediaJSON(media){
	// Reset the comments
	//media.comments.count = 0;
	media.comments.data = [];
	// Reset the likes
	//media.likes.count = 0;
	media.likes.data = [];
	
	return media;
};

// When the request for all the user's collections completes
function onOpened(){
	var rows = [];
	// Fetch all the current user's collections
	var data = instagram.getCollections();
	var collectionsWithThisMedia = Alloy.createCollection("media");
	collectionsWithThisMedia.includedCollections({
		"mediaId": args.id,
		"username": instagram.getCurrentUser().username
	});
	// Transform this to JSON so we can use it in underscore
	collectionsWithThisMedia = collectionsWithThisMedia.toJSON();
	
	// Go through every item in the collection
	data.map(function(collection) {
		var collection = collection.toJSON();
	    var hasCheck = false;
		
		// Check if this media is already present in this collection
		var collectionsWithThisMediaFiltered = _.where(collectionsWithThisMedia, {
			"collection_id": collection.id
		});
		// If this array constants something after that filer, say yes
		if (collectionsWithThisMediaFiltered.length){
			hasCheck = true;
		}
				
		rows.push(Alloy.createController("tableViewRows/collection", { 
					"id": collection.id,
					"title": collection.title, 
					"count": collection.count,
					"hasCheck": hasCheck
				}).getView());
	});
	
	// Update the data
	$.collectionsTableView.data = rows;
};

// Everytime the user changes the value of the textfeld
function onTextFieldChanged(e){
	if (e.value.length) {
		$.newButton.enabled = true;
	} else {
		$.newButton.enabled = false;
	}
};

// When the button to create a new collection is touched
function onCreateButtonTouched(e){
	// Disable the button to prevent further requests
	$.newButton.enabled = false;
	
	// Create a new collection with the current entered value
	instagram.addCollection($.textBox.value, onCreateCollectionSuccess);
};

// When creating a new collection (the form) completes
function onCreateCollectionSuccess(data){
	
	var collection = Alloy.createController("tableViewRows/collection", { 
			"id": data.id,
			"title": data.title, 
			"count": data.count 
		}).getView();
	
	// Insert the newly created collection at the bottom of the tableview
	$.collectionsTableView.appendRow(collection, true);
	// Scroll to the bottom
	if ($.collectionsTableView.data[0] && $.collectionsTableView.data[0].rows){
		$.collectionsTableView.scrollToIndex($.collectionsTableView.data[0].rows.length-1);
	}
	
	// Clear the textfield
	$.textBox.value = "";
	// Hide the keyboard
	$.textBox.blur();
	// Disable the button because the field is empty again
	$.newButton.enabled = false;
};

// When the tableview that holds all the collections is touched
function onTableViewTouched(e){
	instagram.togglePhotoInCollection({
		"collectionId": e.source.data.id,
		"media": args
	}, onTogglePhotoInCollectionSuccess);
};

function onTogglePhotoInCollectionSuccess(data){
	onOpened();
};

// Init everything
onOpened();