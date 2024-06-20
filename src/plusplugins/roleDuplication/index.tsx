/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import definePlugin from "@utils/types";
import { GuildStore, Menu, SelectedGuildStore } from "@webpack/common";
import { Guild, Role } from "discord-types/general";

import { createRole } from "./api";
import { openModal } from "./modal";


function MakeContextCallback(type: "settings" | "other"): NavContextMenuPatchCallback {
    return type === "settings" ? (children, { guild, role }: { guild: Guild; role: Role; }) => {
        children.splice(-1, 0,
            <Menu.MenuItem
                id={"vc-dup-role"}
                label="Duplicate"
                action={async () => { createRole(guild, role); }}
            />
        );
    } : (children, contextMenuApiArguments) => {
        const guildid = SelectedGuildStore.getGuildId();
        const role = GuildStore.getRole(guildid, contextMenuApiArguments.id);
        if (role == null) return;
        children.splice(-1, 0,
            <Menu.MenuItem
                id={"vc-dup-role"}
                label="Clone"
                action={() => openModal(role)}
            />
        );
    };
}

export default definePlugin({
    name: "roleDuplication",
    description: "be able to duplicate/clone roles",
    authors: [],
    contextMenus: {
        "guild-settings-role-context": MakeContextCallback("settings"),
        "dev-context": MakeContextCallback("other")
    }
});
