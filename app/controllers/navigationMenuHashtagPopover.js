var instagram = require("/instagram");

var isSearching = false; // lock so that we don't spam the server
var searchHistory = Titanium.App.Properties.getList("hashtagSearchHistory", []).sort();

function onTableViewTouched(e){
	var tagName = e.rowData.data;
	$.trigger("selectedHashtag", { name: tagName });
	
	// Check if the tag has already been searched for
	if (searchHistory.indexOf(tagName) == -1) {
		searchHistory.push(tagName);
		// Update our search history
		Titanium.App.Properties.setList("hashtagSearchHistory", searchHistory);
	}
};

function onSeachBarChange(e){
	// Remove white spaces
	var value = e.value.replace(" ", "");
	// Update the searchBar
	$.searchBar.value = value;
	
	// If we trped more than 3 chars, then do an internet fetch
	if (value.length > 3 && !isSearching) {
		// Lock the search
		isSearching = true;
		// Search instagram for a tag with this name
		instagram.searchHashtag(value, onSearchSuccess, onSearchError);
		
		// Wait a bit
		setTimeout(function(){
			// Release the search lock
			isSearching = false;
		}, 150);
		
	// Do a "local" search on our previous results
	} else if (e.value.length > 0 && e.value.length <= 3) {
		var searchHistoryFiltered = _.filter(searchHistory, function(tagName){ 
			return tagName.toLowerCase().indexOf(value.toLowerCase()) !== -1;
		});
		
		populateSearchHistory(searchHistoryFiltered);
	// Display our entire history again
	} else {
		populateSearchHistory(searchHistory);
	}
	
	
};

function onSearchSuccess(e){	
	var data = JSON.parse(e.data).data;
	var rows = [];
	
	_.each(data, function (hashtag, index) {
		rows.push(Alloy.createController("tableViewRows/hashtag", { 
			"title": hashtag.name, 
			"count": hashtag.media_count 
		}).getView());
	});
		
	// Update the tableview
	$.results.data = rows;
};

function onSearchError(e){
	// Release the search lock
	isSearching = false;
	
	Titanium.API.info(e);
};

function reveal(view){
	$.navigationMenuHashtagPopover.show({
		view: view
	});
};

function dismiss(){
	$.navigationMenuHashtagPopover.hide();
};

function populateSearchHistory(array){
	var rows = [];
	
	// Populate the results with the previous searches (if any)
	_.each(array, function (hashtag, index) {
		rows.push(Alloy.createController("tableViewRows/hashtag", { 
			"title": hashtag
		}).getView());
	});
	
	// Update the tableview
	$.results.data = rows;
	
	// If there was data, enable the button (maybe it was disabled)
	if (rows.length) {
		$.clearButton.enabled = true;
	}
	
};

function onClearButtonTouched(e){
	// Reset the variable
	searchHistory = [];
	
	// Clear the content of the property
	Titanium.App.Properties.setList("hashtagSearchHistory", searchHistory);
	
	// Reset the tableView
	populateSearchHistory(searchHistory);
	
	// Disable the clear button
	$.clearButton.enabled = false;
}

function onSearchBarFocused(e){
	$.navigationMenuHashtagPopover.rightNavButton = null;
};

function onSearchBarBlurred(e){
	$.navigationMenuHashtagPopover.rightNavButton = $.clearButton;
};

// Initially populate the search history
populateSearchHistory(searchHistory);

// Focus on the textfield if there is no search history
if (!searchHistory.length) {
	// Focus on the searchBar
	$.searchBar.focus();
	// Disable the clear button
	$.clearButton.enabled = false;
}

$.results.addEventListener("click", onTableViewTouched);
$.searchBar.addEventListener("change", onSeachBarChange);
$.searchBar.addEventListener("focus", onSearchBarFocused);
$.searchBar.addEventListener("blur", onSearchBarBlurred);

// Expose these methods
exports.reveal = reveal;
exports.dismiss = dismiss;