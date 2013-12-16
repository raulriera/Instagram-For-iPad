Instagram for iPad
------
My take of an Instagram Application for iPad built using Titanium Appcelerator. It is not completely developed and it has a few bugs, but you can take it for a spin with a simple setup in `alloy.js` file.

<p align="center">
	<img src="http://github.com/raulriera/Instagram-For-iPad/raw/master/ScreenShot1.jpg" />
</p>

Features
------

* Grid style navigation of Instagram
* Unique gesture driven navigation
* Pull down a grid to update them.
* Pull up (toss) a grid to remove them
* History of every search
* Ability to create as many grids as you like
* iOS 7 inspired design
* Multi orientation support
* Infinite loader of images
* Many more...

Usage
------
Remember to change these values (`alloy.js`) with your own credentials from [Instagram](http://instagram.com/developer/)

```js
// Instagram global values
Alloy.Globals.instagram = {
	clientId: "your-instagram-client-id",
	clientSecret: "your-instagram-client-secret",
	urlCallback: "your-instagram-URL-callback"
};
```

Dependencies
------
The following great modules are in use

```xml
<modules>
    <module platform="iphone" version="1.1.3">dk.napp.ui</module>
    <module platform="iphone" version="1.7.0">dk.napp.social</module>
</modules>
```

Contributors
------
Carlos Garcia [@carlitoxway](https://twitter.com/carlitoxway/)

About
----------
Raúl Riera [@raulriera](https://twitter.com/raulriera/)
Copyright &copy; Have fun with it :)
