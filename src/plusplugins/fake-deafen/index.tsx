import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

import { addSettingsPanelButton, DeafenIcon, removeSettingsPanelButton } from "../../plugins/philsPluginLibrary";

export let fakeD = false;

function mute() {
    (document.querySelector('[aria-label="Mute"]') as HTMLElement).click();
}

function deafen() {
    (document.querySelector('[aria-label="Deafen"]') as HTMLElement).click();
}

const settings = definePluginSettings({
    muteUponFakeDeafen: {
        type: OptionType.BOOLEAN,
        description: "",
        default: false
    },
    mute: {
        type: OptionType.BOOLEAN,
        description: "",
        default: true
    },
    deafen: {
        type: OptionType.BOOLEAN,
        description: "",
        default: true
    },
    cam: {
        type: OptionType.BOOLEAN,
        description: "",
        default: false
    }
});

export default definePlugin({
    name: "fake deafen",
    description: "you're deafened but you're not",
    dependencies: ["PhilsPluginLibrary"],
    authors: [
        {
            id: 526331463709360141n,
            name: "desu"
        }
    ],

    patches: [
        {
            find: "}voiceStateUpdate(",
            replacement: {
                match: /self_mute:([^,]+),self_deaf:([^,]+),self_video:([^,]+)/,
                replace: "self_mute:$self.toggle($1, 'mute'),self_deaf:$self.toggle($2, 'deaf'),self_video:$self.toggle($3, 'video')"
            }
        }
    ],

    settings,
    toggle: (au: any, what: string) => {
        if (fakeD === false)
            return au;
        else
           switch (what) {
                case "mute": return settings.store.mute;
                case "deaf": return settings.store.deafen;
                case "video": return settings.store.cam;
            }
    },

    start() {
        addSettingsPanelButton({
            name: "faked", icon: DeafenIcon, tooltipText: "Fake Deafen", onClick: () => {
                fakeD = !fakeD;
                deafen();
                setTimeout(deafen, 250);

                if (settings.store.muteUponFakeDeafen)
                    setTimeout(mute, 300);
            }
        });
    },
    stop() {
        removeSettingsPanelButton("faked");
    }
});
