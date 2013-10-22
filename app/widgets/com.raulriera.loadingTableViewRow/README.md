<p align="center">
	<img src="https://github.com/raulriera/alloy-widgets/raw/master/assets/LoadingTableViewRow.png" />
</p>

Setup
------
Copy the `widgets` folder in `app/widgets` folder of your project.
And add dependencies in `config.json`.

### config.json ###
Add dependencies of `app/config.json`

```json
{
    "global": {},
    "env:development": {},
    "env:test": {},
    "env:production": {},
    "os:ios": {},
    "os:android": {},
    "dependencies": {
        "com.raulriera.loadingTableViewRow": "1.0"
    }
}
```

Usage
------
Add the following line inside the `TableView` you wish to append the loading row

```xml
<Widget src="com.raulriera.loadingTableViewRow" />
```


About
----------
Raúl Riera [@raulriera](https://twitter.com/raulriera/)
Copyright &copy; Have fun with it :)
