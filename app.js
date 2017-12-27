var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var utilities = require('./utilities.js');
var schedule = require('node-schedule');

const port = 666;
const use_session_key = false;
var session_key = null;
var num_connections = 0;
var user_database = [];
var online_devices = [];

var backupSchedule = new schedule.RecurrenceRule();
backupSchedule.minute = 30; // Save the database to the disk every 30 minutes

var keySchedule = new schedule.RecurrenceRule();
keySchedule.minute = 1; // Generate a new session key every minute

// This class represents a device that is currently signed into an account and online

// A callback function for the backup schedule
function saveDatabase() {
    utilities.write_user_database(user_database);
}

// The session key is a string of numbers posessed by all connected devices.
// They must have they key to do anything on the server that requires a user.
// A session key will be obtained when the user logs in.
// The session key will be changed every minute.
// If the session key is disabled, the device will reicieve 'null'.
function updateSessionKey() {
    var newKey = utilities.gen_salt(5);
    for (var i = 0; i < online_devices.length; i++) {
        if (online_devices[i] != null) {
            online_devices[i].socket.emit('new key', { key: newKey });
        }
    }
}

console.log('==== PhoneFinder Integrated Server v1.0 ====');
user_database = utilities.load_user_database(); 





// If someone tries connecting with their web browser
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/restricted.html');
});

http.listen(port, function () {
    console.log('[status] Server listening on port ' + port);
});

io.on('connection', function (socket) {
    num_connections++;
    var user = null;
    socket.emit('request credentials', {});



    // When the user sends their credentials
    socket.on('send credentials', function (data) {
        var email = data.email;
        var password = data.password;

        // Search for the user in the database
        user = utilities.search_by_email(user_database, email);
        if (user != null) {
            var hash_password = user.encrypted_password;

            if (utilities.compare_password_to_hash(password, hash_password)) {
                // Log the user in
                socket.emit('login successful', { session_key: session_key, id: user.id, unique_id: user.unique_id, name: user.name, email: user.email, owned_devices: user.owned_devices });
                // when the user logs in with a new device, its their responsibility to send an add device request.
            }
            else {
                // Go away
                socket.emit('credentials invalid', {});
            }
        } else {
            socket.emit('credentials invalid', {});
        }
    });



    // When the user wants to ring a phone
    socket.on('ring phone', function (data) {
        // first try using id to search for the phone (the index),
        // if it doesnt match the correct phone, iterate through the 
        // array of devices and compare unique_id
        var phone = null;
        var phone_index = data.id;

        if (!use_session_key) {
            if (phone_index < online_devices.length && online_devices[phone_index].unique_id == data.unique_id) {
                phone = online_devices[phone_index];
            }
            else {
                for (phone_index = 0; phone_index < online_devices.length; phone_index++) {
                    // If the device's unique id matches the one provided, and the device is owned by the user
                    if (online_devices[phone_index].unique_id == data.unique_id && online_devices[phone_index].owner_id == user.unique_id) {
                        phone = online_devices[phone_index];
                    }
                }
            }
        }
        else {
            if (session_key == data.session_key) {
                if (phone_index < online_devices.length && online_devices[phone_index].unique_id == data.unique_id) {
                    phone = online_devices[phone_index];
                }
                else {
                    for (phone_index = 0; phone_index < online_devices.length; phone_index++) {
                        // If the device's unique id matches the one provided, and the device is owned by the user
                        if (online_devices[phone_index].unique_id == data.unique_id && online_devices[phone_index].owner_id == user.unique_id) {
                            phone = online_devices[phone_index];
                        }
                    }
                }
            }
            else {
                socket.emit('key invalid', {});
            }
        }

        if (phone_index != null) {
            var phone_socket = phone.socket;
            phone_socket.emit('start ringing', {});
        }
        else {
            socket.emit('phone invalid', {});
        }
    });



    socket.on('add device', function (data) {

    });
});

// Configure a schedule to backup the database
schedule.scheduleJob(backupSchedule, saveDatabase);

if (use_session_key) {
    schedule.scheduleJob(keySchedule, updateSessionKey);
}



