const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io')

const app = express();
const server = http.createServer(app);
const io = socketio(server);  

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname,'./public')

app.use(express.static(publicDirectoryPath));


function handler (request, response) {

    request.addListener('end', function () {
        fileServer.serve(request, response); // this will return the correct file
    });
}

io.on('connection',(socket)=>{
    console.log('New connection')

     // Start listening for mouse move events
     socket.on('mousemove', function (data) {

    // This line sends the event (broadcasts it)
    // to everyone except the originating client.
    socket.broadcast.emit('moving', data);
    });
})

server.listen(port,()=>{
    console.log('Server is up on port : ' +port );
})