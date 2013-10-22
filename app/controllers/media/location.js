var args = arguments[0] || {};

$.pin.applyProperties({
	"title": args.name, // this may not be present sometimes
	"latitude": args.latitude,
	"longitude": args.longitude
});

$.map.annotations = [$.pin];

$.map.region = {
	"latitude": args.latitude,
	"longitude": args.longitude,
	"latitudeDelta": 0.01, 
	"longitudeDelta": 0.01
};