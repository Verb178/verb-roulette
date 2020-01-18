const Discord = require('discord.js');

// Bioman is the name of the bot which originally directly included the Horsengel roulette. It means "the bot that implements this module".
class HorsengelRoulette {
	constructor(msg, player1, player2, prefix, language) {
		this.bot = msg.guild.me;
		this.channel = msg.channel;
		this.guild = msg.guild;
		this.players = [player1, player2];
		this.prefix = prefix;
		this.revolver = [];
		this.revolverString = '[o][o][o][o][o][o]';

		// Language
		const regex = new RegExp('^[a-z]{2}(-[A-Z]{2})?$');

		if (regex.test(language)) { // Language format (xx-YY) verification
			language = language.substring(0, 2);
		}

		try {
			this.strings = require(`./locales/${language}/common.json`);
		} catch (e) {
			this.strings = require('./locales/en/common.json');
		}
	}

	load(magazine, bullets) {
		// Initialise the chambers
		for (let chamber = 0; chamber < magazine; chamber++) {
			this.revolver[chamber] = 0;
		}

		// Adds bullets to random chambers
		const addBullets = (revolver) => {
			let chamber;
			
			if (this.players[1].id === this.bot.id) { // B doesn't lose
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
		// Stops the game if both players are the same member
		if (this.players[1].id === this.players[0].id) {
			if (this.players[0].id === this.guild.ownerID) {
				return this.channel.send('Je ne peux pas vous suggérer de vous tirer. J\'aurais des remords après.');
			} else {
				return this.channel.send('Il serait plus facile de se donner des coups de pied. Ou vous auriez besoin d\'aide ?');
			}
		}

		this.channel.send(`${this.players[1]}, vous avez été défié par ${this.players[0]} à un duel de *roulette russe*. Votre réponse doit commencer par ${this.prefix}oui pour l'accepter. (Vous avez 30 secondes.)`);

		let answer = true;

		// A bot is provoked
		if (this.players[1].user.bot) {
			// Bioman is provoked
			if (this.players[1].id === this.bot.id) {
				await this.sleep();
				// Bot refuses to play
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
				// Bioman accepts to play
				this.channel.send(`${this.prefix}oui`);
			// An other bot is provoked
			} else {
				return this.channel.send(`Il est impossible de jouer contre ${this.players[1]}.`)
			}
		// A member is provoked
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

		// The provoked member refuses to play
		if (!answer) {
			return this.channel.send(`${this.players[1]} a préféré s'enfuir.`);
		}

		return this.game();
	}

	async game() {
		let player = this.players[0];

		for (let chamber = 0; chamber < this.revolver.length; chamber++) {
			// Waiting for the answer
			this.channel.send(`${player}, c'est ton tour de tirer. Vous devriez utiliser la commande ${this.prefix}pan pour tirer. (Vous avez 30 secondes.)`);

			let answer = true;
			// Game against the bot
			if (player.id === this.bot.id) {
				await this.sleep();
				this.channel.send(`${this.prefix}pan`);
			// Game against a member
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

			// Game abandoned by a player
			if (!answer) {
				return this.channel.send(`${player} a préféré s'enfuir.`);
			}

			// No bullet
			if (this.revolver[chamber] === 0) {
				await this.channel.send({embed: this.embedRound(chamber, `${player} a tiré, mais il est toujours en vie.`)});
			// Game over
			} else {
				// The loser is the guild owner
				if (player.user.id === this.guild.ownerID) {
					return this.channel.send({embed: this.embedRound(chamber, `Je n'ai pas le droit de virer ${player} mais je peux dire qu'il a perdu.`, true)});
				// Loser is Bioman
				} else if (player.user.id === this.bot.id) {
					return this.channel.send('Il doit y avoir une erreur...');
				// The loser is a member
				} else {
					await this.channel.send({embed: this.embedRound(chamber, `${player} perd.`, true)});
					const description = 'a perdu la roulette russe';
					return this.kick(player, description);
				}
			}
	
			// Player swticher
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
			awaitthis.channel.createInvite({maxAge: 0}).then(invite => {
			player.user.send(`**Voici ton lien d'invitation**: ${invite}`);
			return player.kick(player, description);
		})
	}

		return this.channel.send('Je n\'ai pas la permission de kick.');
	}

	async sleep() {
		return new Promise(res => setTimeout(res, 1200));
	}

	embedRound(round, description, gameOver = false) {
		round++;
		let index = round * 3 - 2; // Brackets management

		const replaceAt = (str, char, i) => {
			if (i > str.length - 1 || str.charAt(i) === char) {
				return str;
			}
			return str.substr(0, i) + char + str.substr(i + 1);
		};

		// Replaces the character between brackets by 1, 2 or X
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
			//.setImage('https://img1.closermag.fr/var/closermag/storage/images/media/images-des-contenus/article/2016-08-04-corbier-l-ancien-complice-de-dorothee-je-deviens-ce-que-les-medias-ont-fait-de-moi-c-est-a-dire-rien/archive-corbier-1989/5405200-2-fre-FR/Archive-Corbier-1989_exact1024x768_l.jpg')
			.setThumbnail(kicked.displayAvatarURL)
			.addField('Action', 'Kick', true)
			.addField('Raison', reason, true)
			.addField('Membre', kicked, true)
			.addField('Membre ID', kicked.id, true);

	}
	
}

module.exports = HorsengelRoulette;
