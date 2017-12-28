# Phone Finder Server
A server for an app that allows you to ring your phone remotely, even if the ringer is off.
The server is written in JavaScript using Node.JS and uses Socket.IO to manage network traffic and events.

This server is in developement, but is functional. The server was changed to be more simplified, and handle only the routing of traffic to different devices. No secure information is stored on, or handled by this server. Only the ids of the devices themselves, and the ids of the accounts using them.

The functionality of the app has not yet caught up to the full functionality of the server, so some features remain untested.

The database is now handled by a separate server using MySQL. 
