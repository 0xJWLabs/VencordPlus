/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { PermissionsBits, PermissionStore, SelectedChannelStore, UserStore } from "@webpack/common";

const { toggleSelfMute } = findByPropsLazy("toggleSelfMute");
const { setServerMute } = findByPropsLazy("setServerMute");

interface VoiceState {
    guildId?: string;
    channelId?: string;
    mute: boolean;
    selfMute: boolean;
    userId: string;
}

export default definePlugin({
    name: "AskMeToMute",
    description: "Mute yourself when moderators server mute you, and automatically remove your server mute if you have permission.",
    authors: [Devs.Sqaaakoi],

    flux: {
        VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            if (!voiceStates) return;
            voiceStates.forEach(state => {
                if (state.userId !== UserStore.getCurrentUser().id) return;
                if (SelectedChannelStore.getVoiceChannelId() !== state.channelId) return;
                if (!state.guildId) return;
                if (!(state.mute && !state.selfMute)) return;
                if (!PermissionStore.canWithPartialContext(PermissionsBits.MUTE_MEMBERS, { channelId: state.channelId })) return;
                toggleSelfMute({ playSoundEffect: true });
                setServerMute(state.guildId, state.userId, false);
            });
        }
    }
});
