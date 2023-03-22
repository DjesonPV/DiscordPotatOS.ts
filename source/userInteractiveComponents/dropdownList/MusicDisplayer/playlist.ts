import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang';
import { CallableDropdownListCommandType } from '../../userInteractiveCommandType';

import { Tracklist } from '../../../voiceAPI/Tracklist';

import { Subscription } from '../../../voiceAPI/Subscription';

import { playlistCancel } from '../../buttonCommands/MusicDisplayer/playlistCancel';
import { playlistNext } from '../../buttonCommands/MusicDisplayer/playlistNEXT';
import { playlistRemove } from '../../buttonCommands/MusicDisplayer/playlistREMOVE';
import Messages from '../../../messageAPI/Messages';


const identifier = 'PotatOSMusicDisplayerPlaylist'; 

export const next: CallableDropdownListCommandType =
{
    dropdownList: (tracklist:Tracklist) => new DiscordJs.StringSelectMenuBuilder()
        .setCustomId(identifier)
        .setPlaceholder(Lang.get("MP_Playlist_placeholder$1", [`${tracklist.list.length-1}`]))
        .setMaxValues(1)
        .setMinValues(1)
        .addOptions(buildOptions(tracklist))
    ,
    action: function (interaction)
    {
        const guildId = interaction.guildId;
        if (guildId == null) throw new Error("MusicDisplayer Playlist no guildId");
        const subscription = Subscription.get(guildId);
        if (subscription === undefined || !subscription.isMemberConnected(interaction.member)) {
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
        
        Messages.reply(interaction, {
            content: Lang.get("MP_Playlist_question"),
            embeds: [new DiscordJs.EmbedBuilder()
                .setTitle(`${getDisplayEmoji(selectedIndex, selectedTrack.failed)} ${selectedTrack.data.playlistTitle}`)
                .setDescription(selectedTrack.data.playlistDescription)
            ],
            components: [ new DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>()
                .addComponents(playlistCancel.button, playlistNext.button, playlistRemove.button)
            ]
        }, 0, false, true)

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
