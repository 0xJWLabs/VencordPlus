/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings, Settings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { LazyComponent } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";
import { find, findLazy, findStoreLazy } from "@webpack";
import { ChannelStore, GuildMemberStore, RelationshipStore, Tooltip, UserStore, useStateFromStores } from "@webpack/common";

import { buildSeveralUsers } from "../typingTweaks";

const ThreeDots = LazyComponent(() => {
    // This doesn't really need to explicitly find Dots' own module, but it's fine
    const res = find(m => m.Dots && !m.Menu);

    return res?.Dots;
});

const TypingStore = findStoreLazy("TypingStore");
const UserGuildSettingsStore = findStoreLazy("UserGuildSettingsStore");

const Formatters = findLazy(m => m.Messages?.SEVERAL_USERS_TYPING);

function getDisplayName(guildId: string, userId: string) {
    return GuildMemberStore.getNick(guildId, userId) ?? UserStore.getUser(userId).username;
}

function TypingIndicator({ channelId }: { channelId: string; }) {
    const typingUsers: Record<string, number> = useStateFromStores(
        [TypingStore],
        () => ({ ...TypingStore.getTypingUsers(channelId) as Record<string, number> }),
        null,
        (old, current) => {
            const oldKeys = Object.keys(old);
            const currentKeys = Object.keys(current);

            return oldKeys.length === currentKeys.length && JSON.stringify(oldKeys) === JSON.stringify(currentKeys);
        }
    );

    const guildId = ChannelStore.getChannel(channelId).guild_id;

    if (!settings.store.includeMutedChannels) {
        const isChannelMuted = UserGuildSettingsStore.isChannelMuted(guildId, channelId);
        if (isChannelMuted) return null;
    }

    const myId = UserStore.getCurrentUser()?.id;

    const typingUsersArray = Object.keys(typingUsers).filter(id => id !== myId && !(RelationshipStore.isBlocked(id) && !settings.store.includeBlockedUsers));
    let tooltipText: string;

    switch (typingUsersArray.length) {
        case 0: break;
        case 1: {
            tooltipText = Formatters.Messages.ONE_USER_TYPING.format({ a: getDisplayName(guildId, typingUsersArray[0]) });
            break;
        }
        case 2: {
            tooltipText = Formatters.Messages.TWO_USERS_TYPING.format({ a: getDisplayName(guildId, typingUsersArray[0]), b: getDisplayName(guildId, typingUsersArray[1]) });
            break;
        }
        case 3: {
            tooltipText = Formatters.Messages.THREE_USERS_TYPING.format({ a: getDisplayName(guildId, typingUsersArray[0]), b: getDisplayName(guildId, typingUsersArray[1]), c: getDisplayName(guildId, typingUsersArray[2]) });
            break;
        }
        default: {
            tooltipText = Settings.plugins.TypingTweaks.enabled
                ? buildSeveralUsers({ a: getDisplayName(guildId, typingUsersArray[0]), b: getDisplayName(guildId, typingUsersArray[1]), count: typingUsersArray.length - 2 })
                : Formatters.Messages.SEVERAL_USERS_TYPING;
            break;
        }
    }

    if (typingUsersArray.length > 0) {
        return (
            <Tooltip text={tooltipText!}>
                {({ onMouseLeave, onMouseEnter }) => (
                    <div
                        style={{ marginLeft: 6, height: 16, display: "flex", alignItems: "center", zIndex: 0, cursor: "pointer" }}
                        onMouseLeave={onMouseLeave}
                        onMouseEnter={onMouseEnter}
                    >
                        <ThreeDots dotRadius={3} themed={true} />
                    </div>
                )}
            </Tooltip>
        );
    }

    return null;
}

const settings = definePluginSettings({
    includeMutedChannels: {
        type: OptionType.BOOLEAN,
        description: "Whether to show the typing indicator for muted channels.",
        default: false
    },
    includeBlockedUsers: {
        type: OptionType.BOOLEAN,
        description: "Whether to show the typing indicator for blocked users.",
        default: false
    }
});

export default definePlugin({
    name: "TypingIndicator",
    description: "Adds an indicator if someone is typing on a channel.",
    authors: [Devs.Nuckyz, Devs.obscurity],
    settings,

    patches: [
        {
            find: ".UNREAD_HIGHLIGHT",
            replacement: {
                match: /channel:(\i).{0,100}?channelEmoji,.{0,250}?\.children.{0,50}?:null/,
                replace: "$&,$self.TypingIndicator($1.id)"
            }
        }
    ],

    TypingIndicator: (channelId: string) => (
        <ErrorBoundary noop>
            <TypingIndicator channelId={channelId} />
        </ErrorBoundary>
    ),
});
