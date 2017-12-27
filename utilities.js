var bcrypt = require('bcryptjs');
var fs = require('fs');

module.exports = {
    load_user_database: function () { // Loads the user database
        console.log('[status] Loading user database from disk...');

        fs.readFile('userdb.json', 'utf8', function readFileCallback(err, data) {
            if (err) {
                console.log('[error] ' + err);
            }
            else {
                obj = JSON.parse(data.substring(1));
                console.log('[complete] Loaded user database from disk.');
                return obj;
            }
        });
    },

    write_user_database: function (json_database) {
        console.log('[status] Saving user database to disk...');
        fs.writeFile('userdb.json', JSON.stringify(json_database), function (err) {
            if (err) {
                console.log('[error] ' + err);
            } else {
                console.log('[complete] Saved user database to disk.');
            }
        });
    },

    hash_password: function (password_text, salt) {
        return bcrypt.hashSync(password_text, salt);
    },

    gen_salt: function (cost) {
        return bcrypt.genSaltSync(cost);
    },

    // boolean
    compare_password_to_hash: function (password_text, hash) {
        return bcrypt.compareSync(password_text, hash);
    },

    search_by_email: function (database, email) {
        var user = null;
        for (var i = 0; i < database.users.length; i++) {
            if (database.users[i].email != null && database.users[i].email != "" && database.users[i].email == email) {
                return database.users[i];
            }
        }
    }
};

/*
    The user database is stored in JSON format. Below is the structure:

     var database = {
                users: [{
                        id: 0,
                        unique_id: 0,
                        name: "",
                        email: "",
                        encrypted_password: "",
                        salt: "",
                        date_added: "",
                        date_updated: "",
                        owned_devices: [{
                                        id: 0,
                                        unique_id: 0
                                       }] // This is a list of device IDs
                       }],

                online_devices: [{
                                    unique_id: "",
                                    owner_id: "",
                                    socket: socket
                                }]
            };
*/
