/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Cooper/coopeeo, Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import definePlugin from "@utils/types";
import { Connection } from "./connection-types";
import { connect } from "http2";

export default definePlugin({
    name: "AllConnectionsEnabled",
    description: "Enables all connections.",
    authors: [
        {
            name: "Cooper",
            id: 594864203102158859n
        }
    ],
    patches: [
        {
            find: "getPlatformUserUrl:",
            replacement: {
                match: /(let \i=)(\[.*?\])(,\i=\i.{0,40},\i=.{0,30}?;)/,
                replace: "$1$self.changeConnections($2)$3"
            }
        }
    ],
    changeConnections(connections: Connection[]) {
        connections
            .filter(connection => connection.enabled == !1)
            .forEach(connection => {
                connection.enabled = true;
                console.log(`Enabled connection ${connection.name}`);
                connection.name += " (Disabled)";
            });
        return connections;
    }
});
