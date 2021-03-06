const Discord = require('discord.js');


class Verbroulette {
	constructor(msg, player1, player2, prefix, language) {
		this.bot = msg.guild.me;
		this.channel = msg.channel;
		this.guild = msg.guild;
		this.players = [player1, player2];
		this.prefix = prefix;
		this.revolver = [];
		this.revolverString = '[o][o][o][o][o][o]';


		const regex = new RegExp('^[a-z]{2}(-[A-Z]{2})?$');

		if (regex.test(language)) { 
			language = language.substring(0, 2);
		}

		try {
			this.strings = require(`./locales/${language}/common.json`);
		} catch (e) {
			this.strings = require('./locales/en/common.json');
		}
	}

	load(magazine, bullets) {

		for (let chamber = 0; chamber < magazine; chamber++) {
			this.revolver[chamber] = 0;
		}


		const addBullets = (revolver) => {
			let chamber;
			
			if (this.players[1].id === this.bot.id) { 
				chamber = Math.floor(Math.random() * (magazine / 2)) * 2;
			} else {
				chamber = Math.floor(Math.random() * (magazine));
			}

			if (revolver[chamber] === 0) {
				revolver[chamber] = 1;
			} else {
				addBullets(revolver);
			}
			
			return revolver;
		}

		for (let b = 0; b < bullets; b++) {
			this.revolver = addBullets(this.revolver);
		}
		console.log(this.revolver);
	}

	async start() {

		if (this.players[1].id === this.players[0].id) {
			if (this.players[0].id === this.guild.ownerID) {
				return this.channel.send('Je ne peux pas vous suggérer de vous tirer. J\'aurais des remords après.');
			} else {
				return this.channel.send('Il serait plus facile de se donner des coups de pied. Ou vous auriez besoin d\'aide ?');
			}
		}

		this.channel.send(`${this.players[1]}, vous avez été défié par ${this.players[0]} à un duel de *roulette russe*. Votre réponse doit commencer par ${this.prefix}oui pour l'accepter. (Vous avez 30 secondes.)`);

		let answer = true;

		if (this.players[1].user.bot) {

			if (this.players[1].id === this.bot.id) {
				await this.sleep();

				const mood = Math.floor(Math.random() * 10);
				if (mood === 5) {
					if (this.players[1].user.id === this.guild.ownerID) {
						return this.channel.send('Je ne veux pas jouer à la roulette russe. Je suis désolé.');
					} else {
						const description = 'ne me dérange pas avec une roulette russe';
						await this.channel.send(`${this.prefix}kick ${players[0]} ${description}`);
						return this.kick(players[0], description);
					}
				}

				this.channel.send(`${this.prefix}oui`);

			} else {
				return this.channel.send(`Il est impossible de jouer contre ${this.players[1]}.`)
			}

		} else {
			answer = await this.channel.awaitMessages((msg) => {
				if (msg.author.id === this.players[1].id && msg.content === `${this.prefix}oui`) {
					return true;
				}
				return false;
			}, {maxMatches: 1, time: 30000, errors: ['time']})
			.catch(() => {
				return false;
			});
		}


		if (!answer) {
			return this.channel.send(`${this.players[1]} a préféré s'enfuir.`);
		}

		return this.game();
	}

	async game() {
		let player = this.players[0];

		for (let chamber = 0; chamber < this.revolver.length; chamber++) {

			this.channel.send(`${player}, c'est ton tour de tirer. Vous devriez utiliser la commande ${this.prefix}pan pour tirer. (Vous avez 30 secondes.)`);

			let answer = true;

			if (player.id === this.bot.id) {
				await this.sleep();
				this.channel.send(`${this.prefix}pan`);

			} else {
				answer = await this.channel.awaitMessages((msg) => {
					if (msg.author.id === player.id && msg.content === `${this.prefix}pan`) {
							return true;
						}
						return false;
					}, {maxMatches: 1, time: 30000, errors: ['time']})
				.catch(() => {
					return false;
				});
			}


			if (!answer) {
				return this.channel.send(`${player} a préféré s'enfuir.`);
			}


			if (this.revolver[chamber] === 0) {
				await this.channel.send({embed: this.embedRound(chamber, `${player} a tiré, mais il est toujours en vie.`)});

			} else {

				if (player.user.id === this.guild.ownerID) {
					return this.channel.send({embed: this.embedRound(chamber, `Je n'ai pas le droit de virer ${player} mais je peux dire qu'il a perdu.`, true)});

				} else if (player.user.id === this.bot.id) {
					return this.channel.send('Il doit y avoir une erreur...');

				} else {
					await this.channel.send({embed: this.embedRound(chamber, `${player} perd.`, true)});
					const description = 'a perdu la roulette russe';
					return this.kick(player, description);
				}
			}
	

			if (player.id  === this.players[0].id) {
				player = this.players[1];
			} else {
				player = this.players[0];
			}
		}
	}

	

	async kick(player, description) {
		if (this.bot.hasPermission('KICK_MEMBERS')) {
			await this.channel.send(`${this.prefix}kick ${player} ${description}`);
			await this.channel.send({embed: this.embedKick(player.user, description)});
			await this.channel.createInvite({maxAge: 8640, maxUses: 1}).then(invite => {
			player.user.send(`**Voici ton lien d'invitation**: ${invite}`);
			return player.kick(player, description);
		})
	}

	}

	async sleep() {
		return new Promise(res => setTimeout(res, 1200));
	}

	embedRound(round, description, gameOver = false) {
		round++;
		let index = round * 3 - 2;

		const replaceAt = (str, char, i) => {
			if (i > str.length - 1 || str.charAt(i) === char) {
				return str;
			}
			return str.substr(0, i) + char + str.substr(i + 1);
		};

		if (round > 0) {
			if (gameOver) {
				this.revolverString = replaceAt(this.revolverString, 'X', index);
			} else {
				let player;
				if ((round & 1) === 0) {
					player = 2;
				} else {
					player = 1;
				}
				this.revolverString = replaceAt(this.revolverString, player, index);
			}
		}

		return new Discord.RichEmbed()
			.setTitle('Roulette russe by Verb')
			.setColor('BLUE')
			.setDescription(description)
			//.setThumbnail()
			.addField('Joueur 1', this.players[0], true)
			.addField('Joueur 2', this.players[1], true)
			.addBlankField(true)
			.addField('Tour', round, true)
			.addField('Revolver', this.revolverString, true)
			.addBlankField(true);
	}

	embedKick(kicked, reason) {
		return new Discord.RichEmbed()
			.setAuthor(this.bot.user.tag, this.bot.user.displayAvatarURL)
			.setColor('ORANGE')
			.setThumbnail(kicked.displayAvatarURL)
			.addField('Action', 'Kick', true)
			.addField('Raison', reason, true)
			.addField('Membre', kicked, true)
			.addField('Membre ID', kicked.id, true);

	}
	
}

module.exports = Verbroulette;
