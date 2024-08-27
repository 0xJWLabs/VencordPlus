/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { DataStore } from "@api/index";
import { PlusDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findStoreLazy } from "@webpack";
import { Menu, showToast } from "@webpack/common";
import { User } from "discord-types/general";

import { settings } from "./settings";

export let userWhitelist: string[] = [];

export const DATASTORE_KEY = "DnDBypass_whitelistedUsers";
const SelfPresenceStore = findStoreLazy("SelfPresenceStore");

const userContextMenuPatch: NavContextMenuPatchCallback = (children, props: { user: User, onClose(): void; }) => {
    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuItem
            label={userWhitelist.includes(props.user.id) ?
                "Remove user from DND whitelist" : "Add user to DND whitelist"}
            id="vc-dnd-whitelist"
            action={() => whitelistUser(props.user)}
        />
    );
};

function whitelistUser(user: User) {
    if (userWhitelist.includes(user.id)) {
        userWhitelist = userWhitelist.filter(id => id !== user.id);
        showToast("Removed user from DND whitelist");
    } else {
        userWhitelist.push(user.id);
        showToast("Added user to DND whitelist");
    }

    DataStore.set(DATASTORE_KEY, userWhitelist);
}

export default definePlugin({
    name: "DnDBypass",
    description: "Bypass DND for specified users",
    authors: [PlusDevs.mantikafasi],

    patches: [
        {
            find: "ThreadMemberFlags.NO_MESSAGES&&",
            replacement: {
                match: /return!\(null!=.+?&&!0/,
                replace: "if (!n.guild_id && $self.shouldNotify(t)) {return true;} $&"
            }
        }
    ],
    settings,
    contextMenus: { "user-context": userContextMenuPatch },

    shouldNotify(author: User) {
        console.log(author);
        if (SelfPresenceStore.getStatus() !== "dnd") {
            return false;
        }
        return userWhitelist.includes(author.id);
    },

    async start() {
        userWhitelist = await DataStore.get(DATASTORE_KEY) ?? [];
    },

    stop() { }

});
