var Botkit = require('botkit');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json'));
var controller = Botkit.facebookbot(config);

var bot = controller.spawn({});

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
              convo.say('I like the location too: '+ JSON.stringify(response.attachments[0].payload.coordinates));
              var places = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + response.attachments[0].payload.coordinates.lat + ',' + response.attachments[0].payload.coordinates.long +"&radius=500&type=restaurant&keyword=cruise&key=AIzaSyD-atRbfV0DYbNhPNtOErg4p_IwI3Z8CgM"
            }
            convo.say('Golly, I love ' + response.text + ' too!!!');
            convo.next();
        });
    });
});
