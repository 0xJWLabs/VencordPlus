/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and Megumin
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

import { Settings } from "@api/Settings";
import BackupAndRestoreTab from "@components/VencordSettings/BackupAndRestoreTab";
import CloudTab from "@components/VencordSettings/CloudTab";
import PatchHelperTab from "@components/VencordSettings/PatchHelperTab";
import PluginsTab from "@components/VencordSettings/PluginsTab";
import ThemesTab from "@components/VencordSettings/ThemesTab";
import UpdaterTab from "@components/VencordSettings/UpdaterTab";
import VencordTab from "@components/VencordSettings/VencordTab";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { i18n, React } from "@webpack/common";

import gitHash from "~git-hash";

export default definePlugin({
    name: "Settings",
    description: "Adds Settings UI and debug info",
    authors: [Devs.Ven, Devs.Megu],
    required: true,

    patches: [
        {
            find: ".versionHash",
            replacement: [
                {
                    match: /\[\(0,.{1,3}\.jsxs?\)\((.{1,10}),(\{[^{}}]+\{.{0,20}.versionHash,.+?\})\)," "/,
                    replace: (m, component, props) => {
                        props = props.replace(/children:\[.+\]/, "");
                        return `${m},$self.makeInfoElements(${component}, ${props})`;
                    }
                }
            ]
        },
        // Discord Stable
        // FIXME: remove once change merged to stable
        {
            find: "Messages.ACTIVITY_SETTINGS",
            replacement: {
                get match() {
                    switch (Settings.plugins.Settings.settingsLocation) {
                        case "top": return /\{section:(\i\.\i)\.HEADER,\s*label:(\i)\.\i\.Messages\.USER_SETTINGS/;
                        case "aboveNitro": return /\{section:(\i\.\i)\.HEADER,\s*label:(\i)\.\i\.Messages\.BILLING_SETTINGS/;
                        case "belowNitro": return /\{section:(\i\.\i)\.HEADER,\s*label:(\i)\.\i\.Messages\.APP_SETTINGS/;
                        case "belowActivity": return /(?<=\{section:(\i\.\i)\.DIVIDER},)\{section:"changelog"/;
                        case "bottom": return /\{section:(\i\.\i)\.CUSTOM,\s*element:.+?}/;
                        case "aboveActivity":
                        default:
                            return /\{section:(\i\.\i)\.HEADER,\s*label:(\i)\.\i\.Messages\.ACTIVITY_SETTINGS/;
                    }
                },
                replace: "...$self.makeSettingsCategories($1),$&"
            }
        },
        // Discord Canary
        {
            find: "Messages.ACTIVITY_SETTINGS",
            replacement: {
                match: /(?<=section:(.{0,50})\.DIVIDER\}\))([,;])(?=.{0,200}(\i)\.push.{0,100}label:(\i)\.header)/,
                replace: (_, sectionTypes, commaOrSemi, elements, element) => `${commaOrSemi} $self.addSettings(${elements}, ${element}, ${sectionTypes}) ${commaOrSemi}`
            }
        },
        {
            find: "Messages.USER_SETTINGS_ACTIONS_MENU_LABEL",
            replacement: {
                match: /(?<=function\((\i),\i\)\{)(?=let \i=Object.values\(\i.UserSettingsSections\).*?(\i)\.default\.open\()/,
                replace: "$2.default.open($1);return;"
            }
        }
    ],

    customSections: [] as ((SectionTypes: Record<string, unknown>) => any)[],

    makeSettingsCategories(SectionTypes: Record<string, unknown>) {
        return [
            {
                section: SectionTypes.HEADER,
                label: "Vencord",
                className: "vc-settings-header"
            },
            {
                section: "VencordSettings",
                label: "Vencord",
                element: VencordTab,
                className: "vc-settings"
            },
            {
                section: "VencordPlugins",
                label: "Plugins",
                element: PluginsTab,
                className: "vc-plugins"
            },
            {
                section: "VencordThemes",
                label: "Themes",
                element: ThemesTab,
                className: "vc-themes"
            },
            !IS_UPDATER_DISABLED && {
                section: "VencordUpdater",
                label: "Updater",
                element: UpdaterTab,
                className: "vc-updater"
            },
            {
                section: "VencordCloud",
                label: "Cloud",
                element: CloudTab,
                className: "vc-cloud"
            },
            {
                section: "VencordSettingsSync",
                label: "Backup & Restore",
                element: BackupAndRestoreTab,
                className: "vc-backup-restore"
            },
            IS_DEV && {
                section: "VencordPatchHelper",
                label: "Patch Helper",
                element: PatchHelperTab,
                className: "vc-patch-helper"
            },
            ...this.customSections.map(func => func(SectionTypes)),
            {
                section: SectionTypes.DIVIDER
            }
        ].filter(Boolean);
    },

    isRightSpot({ header, settings }: { header?: string; settings?: string[]; }) {
        const firstChild = settings?.[0];
        // lowest two elements... sanity backup
        if (firstChild === "LOGOUT" || firstChild === "SOCIAL_LINKS") return true;

        const { settingsLocation } = Settings.plugins.Settings;

        if (settingsLocation === "bottom") return firstChild === "LOGOUT";
        if (settingsLocation === "belowActivity") return firstChild === "CHANGELOG";

        if (!header) return;

        const names = {
            top: i18n.Messages.USER_SETTINGS,
            aboveNitro: i18n.Messages.BILLING_SETTINGS,
            belowNitro: i18n.Messages.APP_SETTINGS,
            aboveActivity: i18n.Messages.ACTIVITY_SETTINGS
        };
        return header === names[settingsLocation];
    },

    patchedSettings: new WeakSet(),

    addSettings(elements: any[], element: { header?: string; settings: string[]; }, sectionTypes: Record<string, unknown>) {
        if (this.patchedSettings.has(elements) || !this.isRightSpot(element)) return;

        this.patchedSettings.add(elements);

        elements.push(...this.makeSettingsCategories(sectionTypes));
    },

    options: {
        settingsLocation: {
            type: OptionType.SELECT,
            description: "Where to put the Vencord settings section",
            options: [
                { label: "At the very top", value: "top" },
                { label: "Above the Nitro section", value: "aboveNitro", default: true },
                { label: "Below the Nitro section", value: "belowNitro" },
                { label: "Above Activity Settings", value: "aboveActivity" },
                { label: "Below Activity Settings", value: "belowActivity" },
                { label: "At the very bottom", value: "bottom" },
            ]
        },
    },

    get electronVersion() {
        return VencordNative.native.getVersions().electron || window.armcord?.electron || null;
    },

    get chromiumVersion() {
        try {
            return VencordNative.native.getVersions().chrome
                // @ts-ignore Typescript will add userAgentData IMMEDIATELY
                || navigator.userAgentData?.brands?.find(b => b.brand === "Chromium" || b.brand === "Google Chrome")?.version
                || null;
        } catch { // inb4 some stupid browser throws unsupported error for navigator.userAgentData, it's only in chromium
            return null;
        }
    },

    get additionalInfo() {
        if (IS_DEV) return " (Dev)";
        if (IS_WEB) return " (Web)";
        if (IS_VESKTOP) return ` (Vesktop v${VesktopNative.app.getVersion()})`;
        if (IS_STANDALONE) return " (Standalone)";
        return "";
    },

    makeInfoElements(Component: React.ComponentType<React.PropsWithChildren>, props: React.PropsWithChildren) {
        const { electronVersion, chromiumVersion, additionalInfo } = this;

        return (
            <>
                <Component {...props}>Vencord {gitHash}{additionalInfo}</Component>
                {electronVersion && <Component {...props}>Electron {electronVersion}</Component>}
                {chromiumVersion && <Component {...props}>Chromium {chromiumVersion}</Component>}
            </>
        );
    }
});
