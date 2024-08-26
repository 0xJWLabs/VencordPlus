/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

import AuditLogChannelRow from "./components/AuditLogChannelRow";
import AuditLogPage from "./components/AuditLogPage";
import AuditLogPageWrapper from "./components/AuditLogPageWrapper";
import { useAuditLogPermission } from "./hooks";

export default definePlugin({
    name: "AuditLogChannel",
    description: "Adds an audit log channel",
    authors: [Devs.Sqaaakoi],
    patches: [
        {
            // Inject option into list of special channels
            find: ".GUILD_NEW_MEMBER_ACTIONS_PROGRESS_BAR):",
            group: true,
            replacement: [
                {
                    match: /let \i=\(0,\i\.\i\)\((\i\.id)\)/,
                    replace: "$&,vcHasAuditLogPermission=$self.useAuditLogPermission($1)"
                },
                {
                    match: /(\i)\.push\(\i\.\i\.GUILD_MOD_DASH_MEMBER_SAFETY\),/,
                    replace: '$&vcHasAuditLogPermission&&$1.push("audit-log"),'
                }
            ]
        },
        {
            // Render button
            find: 'this,"updateChannelListScroll",',
            replacement: {
                match: /case \i\.\i\.GUILD_MOD_DASH_MEMBER_SAFETY(:.{0,30}?jsx\)\()\i\.\i(,.{0,30}?)\i\.\i\.MEMBER_SAFETY},\i\.\i\.GUILD_MOD_DASH_MEMBER_SAFETY\);/,
                replace: '$&case "audit-log"$1$self.AuditLogChannelRow$2"audit-log"},"audit-log");'
            }
        },
        {
            // Render page
            find: "app view user trigger debugging",
            replacement: {
                match: /case \i\.\i\.MEMBER_SAFETY(:.{0,20}?jsx\)\()\i(,.{0,20}?;)/,
                replace: '$&case "audit-log"$1$self.AuditLogPageWrapper$2'
            }
        },
        {
            // Mark this route as valid at /channels/:guildId/audit-log
            find: 'MEMBER_SAFETY="member-safety"',
            replacement: {
                match: /(\i)\.MEMBER_SAFETY="member-safety"/,
                replace: '$&,$1.AUDIT_LOG="audit-log"'
            }
        }
    ],

    useAuditLogPermission,
    AuditLogChannelRow,
    AuditLogPage,
    AuditLogPageWrapper,
});
