const Discord = require('discord.js');
const client = new Discord.Client();
const HorsengelRoulette = require('..');

client.on('ready', () => {
	console.log('Logged in');
  });

client.on('message', msg => {
	if (msg.content.startsWith('?hr')) {
		const hr = new HorsengelRoulette(msg, msg.member, msg.mentions.members.first(), '?', 'fr');
		hr.load(6, 1);
		hr.start();
	}
});

client.login('MjU5NzYyOTYzMjIzODA1OTUy.DEHJcQ.WF8w0GdKAkvUT0tMa1R3J_87pls');