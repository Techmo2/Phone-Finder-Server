
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var devices = [];

const debug = true;
const port = 3000;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/restricted.html');
});

io.on('connection', function (socket) {
    var this_device_id;
    socket.emit('request data', {});

    socket.on('device data', function (data) {
        var device_id = data.device_id;
        this_device_id = device_id;
        var user_id = data.user_id;
        var device_already_in_library = false;

        if (debug) {
            console.log('[status] Device connected with device_id: ' + device_id + ' and user_id: ' + user_id);
        }

        for (var i = 0; i < devices.length; i++) {
            if (devices[i].device_id == device_id) {
                if (debug) {
                    console.log('[warning] Device connected, but was already in device library. Looks like it wasnt removed when it disconnected.');
                }
                device_already_in_library = true;
                break;
            }          
        }
        if (!device_already_in_library) {
            devices.push({
                device_id: device_id,
                user_id: user_id,
                socket: socket
            });
            if (debug) {
                console.log('[status] Device ' + device_id + ' added to device library');
            }
        }
    });

    socket.on('ring phone', function (data) {
        var device_id = data.device_id;
        var user_id = data.user_id;
        var found_phone = false;

        if (debug) {
            console.log('[status] Request from device { device_id: ' + this_device_id + ', user_id: ' + user_id + ' } to ring device { device_id: ' + device_id + ', user_id: unknown }');
        }

        for (var i = 0; i < devices.length; i++) {
            if (devices[i].device_id == device_id) {
                if (debug) {
                    console.log('[status] Requested ring belongs to user: ' + devices[i].user_id);
                }
                if (devices[i].user_id == user_id) {
                    socket.emit('start ring', { user_id: user_id }); // Tell the phone to ring, and give them the user id for verification.
                    found_phone = true;
                    if (debug) {
                        console.log('[success] Ring successful');
                    }
                    break;
                }
                else {
                    if (debug) {
                        console.log('[failure] The user_id of the sender does not match the user_id of the requested device');
                    }
                }
            }
        }

        if (!found_phone) {
            socket.emit('invalid phone', {});
        }
    });

    socket.on('stop phone', function (data) {
        var device_id = data.device_id;
        var user_id = data.user_id;
        var found_phone = false;

        if (debug) {
            console.log('[status] Request from device { device_id: ' + this_device_id + ', user_id: ' + user_id + ' } to stop ringing device { device_id: ' + device_id + ', user_id: unknown }');
        }

        for (var i = 0; i < devices.length; i++) {
            if (devices[i].device_id == device_id) {
                if (debug) {
                    console.log('[status] Requested ring belongs to user: ' + devices[i].user_id);
                }
                if (devices[i].user_id == user_id) {
                    socket.emit('stop ring', { user_id: user_id }); // Tell the phone to stop ringing, and give them the user id for verification.
                    found_phone = true;
                    if (debug) {
                        console.log('[success] Ring stop successful');
                    }
                    break;
                }
                else {
                    if (debug) {
                        console.log('[failure] The user_id of the sender does not match the user_id of the requested device');
                    }
                }
            }
        }

        if (!found_phone) {
            socket.emit('invalid phone', {});
        }
    });

    socket.on('ping phone', function (data) {
        var device_id = data.device_id;
        var user_id = data.user_id;
        var found_phone = false;

        if (debug) {
            console.log('[status] Request from device { device_id: ' + this_device_id + ', user_id: ' + user_id + ' } to ping device { device_id: ' + device_id + ', user_id: unknown }');
        }

        for (var i = 0; i < devices.length; i++) {
            if (devices[i].device_id == device_id) {
                if (debug) {
                    console.log('[status] Requested ring belongs to user: ' + devices[i].user_id);
                }
                if (devices[i].user_id == user_id) {
                    devices[i].socket.emit('ping', { user_id: user_id }); // Ping the phone, and give them the user id for verification.
                    found_phone = true;
                    socket.on('pong', function (data) {
                        if (debug) {
                            console.log('[success] Ping successful');
                        }
                        socket.emit('pong', {});
                    });
                    break;
                }
                else {
                    if (debug) {
                        console.log('[failure] The user_id of the sender does not match the user_id of the requested device');
                    }
                }
            }
        }

        if (!found_phone) {
            socket.emit('invalid phone', {});
        }
    });

    socket.on('disconnect', function () {
        for (var i = 0; i < devices.length; i++) {
            if (devices[i].device_id == this_device_id) {
                devices.splice(i, 1);
                break;
            }
        }
    });
});

http.listen(port, function () {
    console.log('[status] Server listening on port ' + port);
});
