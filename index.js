var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

var clients = {};

var primaryClientID = null;
var secondaryClientID = null;
var primaryScore = 0;
var secondaryScore = 0;
var primaryPos = 50;
var secondaryPos = 50;
var primaryUnit = 0;
var secondaryUnit = 0;

var started = false;
var ballMoveID = -1;

var bpx = 50;
var bpy = 50;
var speedx = 0.8;
var speedy = 0.65;

Math.rand = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

app.use("/css", express.static(__dirname + "/css"));
app.use("/js", express.static(__dirname + "/js"));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket){
    clients[socket.id] = socket;

    console.log('a user connected');

    if (primaryClientID === null) primaryClientID = socket.id;
    else if (secondaryClientID === null) secondaryClientID = socket.id;

    console.log(primaryClientID);

    socket.on("ppu", function(position){
        if (socket.id === primaryClientID) primaryPos = position;
        else if (socket.id === secondaryClientID) secondaryPos = position;
        socket.broadcast.emit("ppu", position);
    });

    socket.on("s", function(unit){
        if (socket.id === primaryClientID) primaryUnit = unit;
        else if (socket.id === secondaryClientID) secondaryUnit = unit;
    });

    socket.on("start", function(start){
        if (started === false) {
            started = true;

            moveBall();
        }
    });

    socket.on("disconnect", function(client){
        if (socket.id === primaryClientID) primaryClientID = null;
        else if (socket.id === secondaryClientID) secondaryClientID = null;
        primaryScore = 0;
        secondaryScore = 0;

        io.emit("as", 0);

        clearInterval(ballMoveID);
        started = false;
        bpx = 55;
        bpy = 50;
        speedx = 0.8;
        speedy = 0.65;
        console.log('user disconnected');
    });
});

server.listen(1337, function(){
    console.log("Listening on port 1337");
});

function moveBall() {
    ballMoveID = setInterval(function(){
        bpx += speedx;
        bpy += speedy;

        if (bpy > 100) {
            bpy = 100 - (100 - bpy);
            speedy = speedy * -1;
        } else if (bpy < 0) {
            bpy = bpy * -1;
            speedy = speedy * -1;
        }

        if (bpx > 50) {
            if (bpy > primaryPos * (85 / 100) && bpy < (primaryPos * (85 / 100) + 15) && bpx > 100 - (primaryUnit * 2)) {
                speedx = speedx * -1;
            }
        } else {
            if (bpy > secondaryPos * (85 / 100) && bpy < (secondaryPos * (85 / 100) + 15) && bpx < secondaryUnit * 2) {
                speedx = speedx * -1;
            }
        }

        if (bpx > 100) {
            bpx = 50;
            bpy = 50;

            speedx = 0.8;
            speedy = Math.round(Math.rand(4, 8) / 10);

            clients[primaryClientID].emit("os", ++secondaryScore);
            clients[secondaryClientID].emit("ys", secondaryScore);
        } else if (bpx < 0) {
            bpx = 50;
            bpy = 50;

            speedx = -0.8;
            speedy = Math.round(Math.rand(4, 8) / 10);

            clients[secondaryClientID].emit("os", ++primaryScore);
            clients[primaryClientID].emit("ys", primaryScore);
        }

        clients[primaryClientID].emit("bpu", JSON.stringify([bpx, bpy]));
        clients[secondaryClientID].emit("bpu", JSON.stringify([100 - bpx, bpy]));

        if (speedx > 0) speedx = speedx + 0.01;
        else speedx += 0.01*-1;
        if (speedy > 0)speedy = speedy + 0.01;
        else speedy += 0.01*-1
    }, 17);
}