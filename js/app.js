"use strict";

$(document).ready(function(){app.init()});

var socket = io();

var app = app || {};

app = {
    width: -1,
    height: -1,
    barHeight: -1,
    distanceToTop: -1,
    unit: -1,
    init: function() {
        app.calculatePixels();
        pong.init();
        app.receiveSocketUpdate();

        $(window).resize(function(){app.calculatePixels()});
    },
    calculatePixels: function() {
        var playingField = $("main > section:first-child");
        var you = $("#you");
        app.width = playingField.innerWidth();
        app.height = playingField.innerHeight();
        app.distanceToTop = Math.round(playingField.offset().top + 16);

        $("section:first-child > div:first-child").css("margin-bottom", app.height * 0.15);
        $("section:first-child > div > div").css("height", app.height * 0.15);

        app.barHeight = you.innerHeight();

        app.unit = (you.innerWidth() / app.width) * 100;

        socket.on('connect', function(){socket.emit("s", app.unit);});
        socket.emit("s", app.unit);
    },
    receiveSocketUpdate: function() {
        socket.on("ppu", function(percentage){
            pong.positionOtherBar(percentage);
        });

        socket.on("bpu", function(positionJSON){
            var position = JSON.parse(positionJSON);
            pong.positionBall(position[0], position[1]);
        });

        socket.on("ys", function(score){
            $("#your_score").text(score);
        });

        socket.on("os", function(score){
            $("#other_score").text(score);
        });

        socket.on("as", function(score){
            $("#your_score").text(score);
            $("#other_score").text(score);
        });
    }
};

var pong = pong || {};

pong = {
    init: function() {
        pong.maxPercentage = ((app.height - app.barHeight) / app.height) * 100;
        var playingField = $("main > section:first-child");
        playingField.mousemove(function(e){
            pong.positionOwnBar(e.offsetY);
        });

        playingField.bind("touchmove", function(e){
            var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            pong.positionOwnBar(touch.pageY - app.distanceToTop);
        });

        playingField.on("click", function(){
            socket.emit("start", true);
        });
    },
    positionOwnBar: function(position) {
        var you = $("#you");
        var percentage = ((position - (app.barHeight / 2)) / (app.height - (app.barHeight))) * 100;
        if (percentage < 0) percentage = 0;
        else if (percentage > 100) percentage = 100;
        you.css("top", percentage + "%");
        socket.emit("ppu", percentage);
    },
    positionOtherBar: function(percentage) {
        if (percentage < 0) percentage = 0;
        else if (percentage > pong.otherMaxPercentage) percentage = pong.otherMaxPercentage;
        $("#other").css("top", percentage + "%");
    },
    positionBall: function(x, y) {
        $("#ball").css("top", "calc(" + y + "% - .5em)").css("left", "calc(" + x + "% - .5em)").show();
    }
};