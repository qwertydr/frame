# Research Bootcamp Static Portal

Static portal with the existing curriculum, authentication/session flow, routing, countdowns, resource links, and responsive UI preserved.

## Video engine

The lesson player uses the YouTube IFrame Player API with the portal's custom control layer. The `videoId` fields in `data/modules.json` are treated as YouTube watch IDs.

Replace each existing `videoId` value with the corresponding YouTube watch ID. No other module structure needs to change.

The player keeps YouTube's iframe behind the portal UI, disables native player controls, synchronizes play/pause, mute, volume, seeking, time, playback rate and fullscreen with the custom controls, and returns to the lesson thumbnail with a custom replay action when playback ends.
