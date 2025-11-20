import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../UserCommandType.js';
import Messages from '../../messageAPI/Messages.js';
import Lang from '../../Lang.js';


/* /!\ DISCLAIMER /!\ __________________________________________________________

These (/) Commands are hardcoded in French as they are purely based on private 
jokes. They will not be usefull to anyone but me.
If you're reusing this code, remove this file and its imports in UserCommands, 
or use them, do as you want I'm not your boss
____________________________________________________________________  /////// */

export const pc: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
        .setName("pc")
        .setDescription("Demande à Nathan quand est-ce qu'il reçoit son ordinateur.")
    ,
    action: function (interaction)
    {
        if (interaction.channel === null) throw new Error(Lang.get('SC_interactionNotComplete'));

        const sentences = [
            "Alors il est bien ton pc Nathan ?",
            "Alors Nathan ce pc ?",
            "Il arrive quand ton pc ?"
        ];
    
        let sentenceKey = Math.floor(Math.random() * sentences.length);
    
        Messages.noReplyForThisInterraction(interaction); 
        Messages.print(interaction.channel as Exclude<DiscordJs.TextBasedChannel,DiscordJs.PartialGroupDMChannel>, sentences[sentenceKey]);
    }
};

export const pd: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
        .setName("pd")
        .setDescription("C'est réel")
    ,
    action: function (interaction)
    {
        if (interaction.channel === null) throw new Error(Lang.get('SC_interactionNotComplete'));
    
        Messages.noReplyForThisInterraction(interaction); 
        Messages.print(interaction.channel as Exclude<DiscordJs.TextBasedChannel,DiscordJs.PartialGroupDMChannel>, "Cyril c'est un sacré sacripant");
    }
};

export const pk: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
        .setName("pk")
        .setDescription("Demande la direction pour trouver l'être cher")
    ,
    action: function (interaction)
    {
        if (interaction.channel === null) throw new Error(Lang.get('SC_interactionNotComplete'));
    
        Messages.noReplyForThisInterraction(interaction); 
        Messages.print(interaction.channel as Exclude<DiscordJs.TextBasedChannel,DiscordJs.PartialGroupDMChannel>, "Quel est le chemin le plus court pour aller vers ton coeur ?");
    }
};

export const pxtain: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
        .setName("putain")
        .setDescription("PREND ÇA !")
    ,
    action: function (interaction)
    {
        if (interaction.channel === null) throw new Error(Lang.get('SC_interactionNotComplete'));
    
        Messages.noReplyForThisInterraction(interaction); 
        Messages.print(interaction.channel as Exclude<DiscordJs.TextBasedChannel,DiscordJs.PartialGroupDMChannel>, "https://c.tenor.com/Xk5yKpCr96sAAAAd/christmas-tree-hit.gif", 10);
    }
};
