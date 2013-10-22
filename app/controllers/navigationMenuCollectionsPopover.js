var instagram = require("/instagram");

function onTableViewTouched(e){
	$.trigger("selectedCollection", { name: e.rowData.data });
};

function reveal(view){
	$.navigationMenuCollectionsPopover.show({
		view: view
	});
};

function dismiss(){
	$.navigationMenuCollectionsPopover.hide();
};

function onEditButtonTouched(e){
	$.results.editing = !$.results.editing;
};

function onOpened(){
	var data = [];
	var collections = instagram.getCollections();
	
	// Go through every item in the collection
	collections.map(function(collection) {
		var collection = collection.toJSON();
	    
		data.push(Alloy.createController("tableViewRows/collection", { 
					"id": collection.id,
					"title": collection.title, 
					"count": collection.count
				}).getView());
	});
	
	$.results.data = data;
};

function onTableViewRowDeleted(e) {
	if (e.rowData && e.rowData.data) {
		instagram.deleteCollection(e.rowData.data.id);
	}
};

$.results.addEventListener("click", onTableViewTouched);

// Init all the content
onOpened();

// Expose these methods
exports.reveal = reveal;
exports.dismiss = dismiss;