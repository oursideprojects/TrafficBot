var Botkit = require('botkit');
var fs = require('fs');
var config = require('./config.json');
var controller = Botkit.facebookbot(config);
var request = require('request-promise');

var bot = controller.spawn({});

function getPlaceIdLink(apiKey, coordinates){
	return `https://roads.googleapis.com/v1/nearestRoads?points=${coordinates.lat},${coordinates.long}&key=${apiKey}`;
	// "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + coordinates.lat + ',' + coordinates.long +"&radius=500&type=restaurant&keyword=cruise&key=" + apiKey;
}

var getRoadData = (apiKey, coordinates) => {
	console.log('test')
	return request(getPlaceIdLink(apiKey, coordinates)).then(toJSON).then((response) => {
		console.log(response)
		return request(getRoadDataLink(apiKey, response.snappedPoints[0].placeId));
	}).then(toJSON);
}

var toJSON = (raw) => {
	return JSON.parse(raw);
}

var getRoadDataLink = (apiKey, placeId) => {
	return `https://maps.googleapis.com/maps/api/place/details/json?key=${apiKey}&placeid=${placeId}&language=EN`
}

controller.setupWebserver(5000, function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver, bot, function() {
      console.log('This bot is online!!!');
  });
});

// this is triggered when a user clicks the send-to-messenger plugin
controller.on('facebook_optin', function(bot, message) {
    bot.reply(message, 'Welcome to my app!');
});

// user said hello
controller.hears(['hello'], 'message_received', function(bot, message) {

    bot.reply(message, 'Hey there.');

});

controller.hears(['stuck'], 'message_received', function(bot, message) {

    bot.startConversation(message, function(err, convo) {
        convo.ask({
          text: 'Where are you stuck at?',
          quick_replies: [
            {
              content_type: 'location',
              text: 'Send Location',
              payload: 'stuck_location'
            }
          ]}, function(response, convo) {
            console.log(response);
            if(response.attachments && response.attachments[0].type == "location"){
              convo.say(getPlaceIdLink(config.google, response.attachments[0].payload.coordinates));
              getRoadData(config.google, response.attachments[0].payload.coordinates).then((data) => {
              	console.log(data);
              	convo.say(JSON.stringify(data));
              });
            }
            convo.say('Golly, I love ' + response.text + ' too!!!');
            convo.next();
        });

    });
});
