var instagram = require("/instagram");
var pins = [];
var searchHistory = Titanium.App.Properties.getObject("locationSearchHistory", null);

function onMapTouched(e){
	if (e.clicksource == "rightButton") {
		// Trigger that we selected an annotation
		$.trigger("selectedLocation", { 
			"id": e.annotation.locationId, 
			"title": e.annotation.title
		});
		
		// Store this last position
		Titanium.App.Properties.setObject("locationSearchHistory", {
			"latitude": e.annotation.latitude,
			"longitude": e.annotation.longitude
		});
		
		// Remove all annotations from the map
		$.mapView.removeAllAnnotations();
	}
}

function onMapRegionChanged(geolocationEvent){
	instagram.searchLocation(geolocationEvent.latitude, geolocationEvent.longitude, onLocationsSuccess, onLocationsError);	
};

function onLocationsSuccess(e){
	var locations = JSON.parse(e.data).data;
	var newPins = [];
	
	_.each(locations, function(location) {
		// Check if we already have that pin on the map
		if (!_.find(pins, function(pin){ return pin.locationId == location.id })) {
			// If we don't, then append it to our pins array
			newPins.push(Titanium.Map.createAnnotation({
			    "latitude": location.latitude,
			    "longitude": location.longitude,
			    "title": location.name,
			    "animate": true,
				"rightButton": Titanium.UI.iPhone.SystemButton.DISCLOSURE,
			    "locationId": location.id // Custom property to uniquely identify this annotation.
			}));			
		}
	});
	
	// Append the new pins to the "global" pins reference
	pins = pins.concat(newPins);
		
	// Check if our global reference is growing too large
	if (pins.length > 40) {
		// Remove a slice of the pins, from the global reference
		var pinsToRemove = pins.splice(0, 10);
		// Use the previously removed pins and removed them from the
		// map as well.
		_.each(pinsToRemove, function(pin){
			$.mapView.removeAnnotation(pin);
		});
	}
			
	$.mapView.addAnnotations(newPins);
};

function onLocationsError(e){
	Titanium.API.info(e);
};

function onCurrentPosition(geolocationEvent){
	// Update the map region
    $.mapView.setRegion({
    	"latitude": geolocationEvent.coords.latitude,
    	"longitude": geolocationEvent.coords.longitude,
    	"latitudeDelta": 0.004,
    	"longitudeDelta": 0.004
    });
	
	// Enable the button until the request is ready
	$.myLocationButton.enabled = true;
};

function reveal(view){
	$.navigationMenuLocationPopover.show({
		view: view
	});
};

function dismiss(){
	$.navigationMenuLocationPopover.hide();
};

function positionMapFromHistory(){
	// Update the map region
    $.mapView.setRegion({
    	"latitude": searchHistory.latitude,
    	"longitude": searchHistory.longitude,
    	"latitudeDelta": 0.004,
    	"longitudeDelta": 0.004
    });
	
	$.mapView.removeEventListener("complete", positionMapFromHistory);
};

function onMyLocationButtonTouched(e) {
	// Disable the button until the request is ready
	$.myLocationButton.enabled = false;
	// Fetch the current position of the user
	Titanium.Geolocation.getCurrentPosition(onCurrentPosition);
};

// Notify our intention
Titanium.Geolocation.purpose = L("gps_purpose_message");

// If there was no search history
if (!searchHistory) {
	// Fetch the current position of the user
	onMyLocationButtonTouched();
} else {
	// Wait for the map to be ready so we can position i
	$.mapView.addEventListener("complete", positionMapFromHistory);
}


// Expose these methods
exports.reveal = reveal;
exports.dismiss = dismiss;