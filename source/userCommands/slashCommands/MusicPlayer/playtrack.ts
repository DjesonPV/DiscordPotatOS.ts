import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../../UserCommandType.js';
import Lang from '../../../Lang.js';
import { Subscription } from '../../../voiceAPI/Subscription.js';
import Messages from '../../../messageAPI/Messages.js';
const SurfYT = await import('surfyt-api');
import { Track, TrackType } from '../../../voiceAPI/Track.js';
import botPersonality from '../../../modules/botPersonality.js';

export const playtrack: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
    .setName(Lang.get('SC_playtrack_commandName'))
    .setDescription(Lang.get('SC_playtrack_commandDescription$1', [botPersonality.nickname]))
    .addStringOption(option => option
        .setName(Lang.get('SC_playtrack_optionName'))
        .setDescription(Lang.get('SC_playtrack_optionDescription'))
    )
    ,
    action: async function (interaction) {
        const thinkingMessage = await Messages.startThinking(interaction);

        const query = interaction.options.getString(Lang.get('SC_playtrack_optionName'));

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
                Messages.replyAlert(interaction, Lang.get('MP_PlaytrackSearchError$1', [query]));
            });

            if (searchResult?.[0]?.url != undefined){
                url = searchResult[0].url;
            } else {
                Messages.replyAlert(interaction, Lang.get("MP_SearchError"));
            }
        }

        if (url !== undefined) {
            const track = new Track(interaction.id, query, url, TrackType.Track, 0.2);
            if (subscription === null) Subscription.create(interaction, track);
            else subscription.tracklist.add(track);
        }
        
        Messages.stopThinking(thinkingMessage);
    }
};

const isItAnURL = (text:string) => text.match(/^https?:\/\/(?:[a-zA-Z0-9\-]{1,64}\.){0,}(?:[a-zA-Z0-9\-]{2,63})(?:\.(?:xn--)?[a-zA-Z0-9]{2,})(\:[0-9]{1,5})?(?:\/[^\s]*)?$/) !== null;
