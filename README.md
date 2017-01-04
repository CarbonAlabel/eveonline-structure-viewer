# eveonline-structure-viewer

A web app for viewing the list of structures anchored by your corporation. It utilizes the CREST API and is written in AngularJS: everything is done client-side. This app won't be updated to use the newer ESI API.

It can be considered a demonstration of some concepts involved with CREST, namely endpoint walking and versioning, as well as use of OAuth 2.0 implicit grants. However, it does not handle endpoint pagination or deprecation, and actually doesn't do any kind of error handling at all.

It is fairly limited: the only information displayed is the ID, location, structure type, and the date on which the structure runs out of fuel. The structure name isn't displayed as the CREST API (soon to be deprecated and replaced with the ESI API) does not provide a way to fetch a structure's name.

Inspired by https://www.reddit.com/r/Eve/comments/5416d3/citadel_fuel_monitoring_tools/, can be tried out at https://taabe.net/dev/projects/structureViewer/.
