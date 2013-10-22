migration.up = function(db) {
    db.createTable({
        "columns": {
			"id": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "username" : "TEXT",
            "title": "TEXT",
			"count": "INTEGER"
        }
    });
};
 
migration.down = function(db) {
    db.dropTable();
};