const express = require("express");
const listen = require("socket.io").listen;
const app = express();
const path = require('path');

// to serve static files
app.use(express.static(path.join(__dirname, 'public')));

const server = require("http").createServer(app);
const io = require("socket.io")(server);
const users = new Set();
const connections = [];
const port = process.env.PORT || 1234;
server.listen(port);

// useful function to find a user inside a set
const setFind = (set, cb) => {
    for (const e of set) {
      if (cb(e)) {
        return e;
      }
    }
    return;
  }

app.get("/",  (eq, resp) => {
    // setting the route
    resp.sendFile(path.join(__dirname,  "public/html/index.html"));
});

io.sockets.on("connection", function (socket) {
    //when client connects to server
    connections.push(socket); //add plug details to custom array
    console.log(`Connected Socket: ${socket.id}`)
    console.log("Connected : %s socket connected", connections.length); //curr connections
    socket.on("disconnect", function () {
        //client disc. from server
        connections.splice(connections.indexOf(socket), 1); //delete plug details
        // finding user based on socket.id
        let user = setFind(users, e => e.id === socket.id);
        if (!(user === undefined)) {
            console.log(`User disconnected: ${socket.id} - ${user.username}`)
            // deleting it from the users set
            users.delete(user);
            console.log(`*** ${connections.length} socket connected with ${users.size} users`); //curr connections
            // broadcast to all
            io.sockets.emit("user left", { username: user.username, numuser: users.size });
        }
    });
    socket.on("add user", function (data) {
        console.log(data);
        // add to the users lists
        users.add({id: socket.id, username: data});
        // broadcast to everyone, including sender
        io.sockets.emit("new user", { username: data, numuser: users.size });
        //
        console.log(`New User: ${socket.id} - ${data}`);
    });
    socket.on("user hidden", function (data) {
        console.log("user hidden: " + data);
        socket.broadcast.emit("user hidden", { username: data, numuser: users.size });
    });
    socket.on("user visible", function (data) {
        console.log("user visible: " + data);
        socket.broadcast.emit("user visible", { username: data, numuser: users.size });
    });
    socket.on("send message", function (data) {
        console.log(data);
        // finding user based on socket.id
        let user = setFind(users, e => e.id === socket.id);
        // broadcast to everyone, excluding sender (the sender will have his own blue bubble)
        socket.broadcast.emit("new message", { msg: data, username: user.username, numuser: users.size });
    });
});
console.log('Server is listening');

/* REFERENCE:
   https://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender

// sending to sender-client only
socket.emit('message', "this is a test");

// sending to all clients, include sender
io.emit('message', "this is a test");

// sending to all clients except sender
socket.broadcast.emit('message', "this is a test");

// sending to all clients in 'game' room(channel) except sender
socket.broadcast.to('game').emit('message', 'nice game');

// sending to all clients in 'game' room(channel), include sender
io.in('game').emit('message', 'cool game');

// sending to sender client, only if they are in 'game' room(channel)
socket.to('game').emit('message', 'enjoy the game');

// sending to all clients in namespace 'myNamespace', include sender
io.of('myNamespace').emit('message', 'gg');

// sending to individual socketid
socket.broadcast.to(socketid).emit('message', 'for your eyes only');

// list socketid
for (var socketid in io.sockets.sockets) {}
 OR
Object.keys(io.sockets.sockets).forEach((socketid) => {});

#How do you get socketid for sending to an individual socket?
var io = require('socket.io')(server);
io.on('connection', function(socket) { console.log(socket.id); })
*/