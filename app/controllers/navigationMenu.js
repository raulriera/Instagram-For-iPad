function buttonTouched(e) {
	var type = e.source.type;
	var data = null;
	
	// Cehck the type of button touched
	if (type == "user") {
		var popover = Alloy.createController('navigationMenuUserPopover');
		
		// Reveal the popover
		popover.reveal(e.source);
		
		// When a tag is selected
		popover.on("selectedUser", function(e){
			data = e;
			
			// Dispatch the event with the content
			$.trigger("shouldCreateNewGrid", { "type": type, "data": data });
			// Dismiss the popover
			popover.dismiss();
		});
	} else if (type == "hashtag") {
		var popover = Alloy.createController('navigationMenuHashtagPopover');
		
		// Reveal the popover
		popover.reveal(e.source);
		
		// When a tag is selected
		popover.on("selectedHashtag", function(e){
			data = e.name;
			
			// Dispatch the event with the content
			$.trigger("shouldCreateNewGrid", { "type": type, "data": data });
			// Dismiss the popover
			popover.dismiss();
		});
	} else if (type == "location") {
		var popover = Alloy.createController('navigationMenuLocationPopover');
		
		// Reveal the popover
		popover.reveal(e.source);
		
		// When a tag is selected
		popover.on("selectedLocation", function(e){			
			// Dispatch the event with the content
			$.trigger("shouldCreateNewGrid", { "type": type, "data": e });
			// Dismiss the popover
			popover.dismiss();
		});
	} else if (type == "collection") {
		var popover = Alloy.createController('navigationMenuCollectionsPopover');
		
		// Reveal the popover
		popover.reveal(e.source);
		
		// When a tag is selected
		popover.on("selectedCollection", function(e){
			data = e.name;
			
			// Dispatch the event with the content
			$.trigger("shouldCreateNewGrid", { "type": type, "data": data });
			// Dismiss the popover
			popover.dismiss();
		});
	}
	
	
}