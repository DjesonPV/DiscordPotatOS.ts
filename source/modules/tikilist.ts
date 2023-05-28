import { readFileSync } from "fs";
import * as Schedule from 'node-schedule';
import * as DiscordJs from 'discord.js';

export async function init(client:DiscordJs.Client, guildId:DiscordJs.Snowflake, userId:DiscordJs.Snowflake) {
    const nickList = readFileSync("./resources/tikilist.txt", "utf-8").split('\n');

    const changeName = () => {
        const index = Math.floor(Date.now() / 86400000) % nickList.length;
        // 86400000 = 24*60*60*1000 ms

        client.guilds.fetch(guildId).then(guild => {
            return guild.members.fetch(userId).then(member => {
                return member.setNickname(nickList[index]);
            })
        }).catch(console.error);
    }

    // Every day at 00h01
    const rule = new Schedule.RecurrenceRule();
    rule.dayOfWeek = [new Schedule.Range(0,6)];
    rule.hour = 0;
    rule.minute = 1;

    Schedule.scheduleJob(rule, changeName);
}
