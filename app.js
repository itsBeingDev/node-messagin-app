var redis = require('redis');
var redisClient = redis.createClient();
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var messages = [];
var storeMessages = function(name, data){
	var message = JSON.stringify({name: name, data: data});
	redisClient.lpush('messages', message, function(err, response){
		redisClient.ltrim('messages', 0, 9);
	});
}

io.on('connection', function(client){
	console.log('Client Connected...');
	client.on('messages', function(data){
		var nickname = client.nickname;
		client.broadcast.emit('messages', nickname + ": " + data);
		storeMessages(nickname, data);
	});
	client.on('join', function(name){
		redisClient.lrange('messages', 0, -1, function(err, messages){

			client.nickname = name;
			messages.forEach(function(msg){
				var message = JSON.parse(msg);
				client.emit("messages", message.name + ": " + message.data);
			});
		});
	});
});

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

server.listen(8080);

