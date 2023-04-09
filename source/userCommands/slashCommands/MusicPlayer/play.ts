import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../../UserCommandType';
import Lang from '../../../Lang';
import { Subscription } from '../../../voiceAPI/Subscription';
import Messages from '../../../messageAPI/Messages';
import * as SurfYT from 'surfyt-api';
import { Track, TrackType } from '../../../voiceAPI/Track';

export const play: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
    .setName('play')
    .setDescription("Music Player - Play") // #####
    .addStringOption(option => option
        .setName('query')
        .setDescription("url or sarch terms")    
    )
    ,
    action: async function (interaction) {
        const thinkingMessage = await Messages.startThinking(interaction);

        const query = interaction.options.getString('query');

        let subscription = Subscription.get(interaction.guildId);

        if (query === null && subscription !== null) {
            // Subscription and no request, will unpause
            if (subscription.audioPlayer.paused) subscription.resume();
            Messages.stopThinking(thinkingMessage);
            return;
        }

        if (query === null) {
            // No Subscription and no request, will ignore
            Messages.stopThinking(thinkingMessage);
            return;
        }

        // We have a request

        let url:string|undefined = undefined;

        if (isItAnURL(query)) {
            url = query;
        } else {
            // query is a string
            const searchResult = await SurfYT.searchYoutubeFor(
                `${query}`,
                {
                    showVideos: true,
                    showLives: true,
                    showShorts: true,
                    location: 'FR',
                    language: 'fr'
                }
            )
            .catch(_ => {
                Messages.replyAlert(interaction, 'YT Searching Error ####')
            });

            if (searchResult?.[0]?.url != undefined){
                url = searchResult[0].url;
            } else {
                Messages.replyAlert(interaction, "Search yielded no result ###")
            }
        }

        if (url !== undefined) {
            const track = new Track(interaction.id, query, url, TrackType.Track, 0.15);

            if (subscription === null) Subscription.create(interaction, track);
            else subscription.tracklist.add(track);
        }
        
        Messages.stopThinking(thinkingMessage);
    }
};

const isItAnURL = (text:string) => text.match(/^https?:\/\/(?:[a-zA-Z0-9\-]{1,64}\.){0,}(?:[a-zA-Z0-9\-]{2,63})(?:\.(?:xn--)?[a-zA-Z0-9]{2,})(\:[0-9]{1,5})?(?:\/[^\s]*)?$/) !== null;
