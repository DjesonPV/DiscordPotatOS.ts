import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang.js';
import { CallableDropdownListCommandType } from '../../userInteractiveCommandType.js';

import { Tracklist } from '../../../voiceAPI/Tracklist.js';

import { Subscription } from '../../../voiceAPI/Subscription.js';

import { playlistCancel } from '../../buttonCommands/MusicDisplayer/playlistCANCEL.js';
import { playlistNext } from '../../buttonCommands/MusicDisplayer/playlistNEXT.js';
import { playlistRemove } from '../../buttonCommands/MusicDisplayer/playlistREMOVE.js';
import Messages from '../../../messageAPI/Messages.js';
import { getAlertMessagePayload } from '../../../messageAPI/Messages.js';
import { followOnInteraction } from '../../followOnInteraction.js';

import botPersonality from '../../../modules/botPersonality.js';


const identifier = 'PotatOSMusicDisplayerPlaylist'; 

export const playlist: CallableDropdownListCommandType =
{
    dropdownList: (tracklist:Tracklist) => new DiscordJs.StringSelectMenuBuilder()
        .setCustomId(identifier)
        .setPlaceholder(Lang.get("MP_Playlist_placeholder$1", [`${tracklist.list.length-1}`]))
        .setMaxValues(1)
        .setMinValues(1)
        .addOptions(buildOptions(tracklist))
    ,
    action: async function (interaction)
    {
        const guildId = interaction.guildId;
        if (guildId == null) throw new Error("MusicDisplayer Playlist no guildId");
        const subscription = Subscription.get(guildId);
        if (subscription === null || !subscription.isMemberConnected(interaction.member)) {
            interaction.deferUpdate();
            return;
        }

        const selectedId = interaction.values[0];
        const selectedTrack = subscription.tracklist.list.find(track => track.id === selectedId);
        
        if (selectedTrack === undefined) {
            interaction.deferUpdate();
            return;
        }
        
        const selectedIndex = subscription.tracklist.list.indexOf(selectedTrack);
        
        const message = await Messages.replyEphemeral(interaction, {
            content: Lang.get("MP_Playlist_question"),
            embeds: [new DiscordJs.EmbedBuilder()
                .setTitle(`${getDisplayEmoji(selectedIndex, selectedTrack.failed)} ${selectedTrack.data.playlistTitle}`)
                .setDescription(selectedTrack.data.playlistDescription)
            ],
            components: [ new DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>()
                .addComponents(playlistCancel.button, playlistNext.button, playlistRemove.button)
            ]
        });

        followOnInteraction(interaction, message, [playlistCancel.identifier, playlistNext.identifier, playlistRemove.identifier], 'button', (collectedInteraction) =>{
            collectedInteraction.deferUpdate();
            if (subscription.isMemberConnected(collectedInteraction.member)) { // the user could disconnect between presses
                switch (collectedInteraction.customId) {
                    case playlistNext.identifier:
                        subscription.tracklist.skipQueueing(selectedId);
                    break;
                    case playlistRemove.identifier:
                        subscription.tracklist.remove(selectedId);
                    break;
                    case playlistCancel.identifier:
                    default:
                    ;
                }
                
                Messages.replyEphemeral(interaction, {
                    content: Lang.get("MP_Playlist_requestRoger"),
                    components: [],
                    embeds: []
                });

            } else {
                const messageOptions = getAlertMessagePayload(Lang.get("MP_failedToExecuteCommand$1", [botPersonality.nickname]));
                messageOptions.content = "";
                messageOptions.components= [];

                Messages.replyEphemeral(interaction, messageOptions);
            }
        })

    },
    identifier: identifier
};

function buildOptions(tracklist:Tracklist) {
    let options:DiscordJs.StringSelectMenuOptionBuilder[] = [];

    tracklist.list.forEach((track, i) => { options.push(new DiscordJs.StringSelectMenuOptionBuilder()
        .setLabel(track.data.playlistTitle)
        .setDescription(track.data.playlistDescription)
        .setValue(track.id)
        .setEmoji(getPlaylistEmoji(i, track.failed))
    )});

    return options;
}

function getDisplayEmoji(i:number, failed:boolean = false){
    if (failed) return ':x:';
    return [
        ':notes:',      // 🎶
        ':track_next:', // ⏭
        ':two:',        // 2️⃣
        ':three:',      // 3️⃣
        ':four:',       // 4️⃣
        ':five:',       // 5️⃣
        ':six:',        // 6️⃣
        ':seven:',      // 7️⃣
        ':eight:',      // 8️⃣
        ':nine:',       // 9️⃣
        ':keycap_ten:'  // 🔟
    ][i] ?? ':hash:';   // #️⃣
}

function getPlaylistEmoji(i:number, failed:boolean = false){
    if (failed) return '❌';
    return ['🎶', '⏭', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][i] ?? '#️⃣';
}
