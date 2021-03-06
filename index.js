const app = angular.module("viewer", []);

const eveConf = {
    esiRoot: "https://esi.evetech.net",
    scopes: ["esi-universe.read_structures.v1", "esi-corporations.read_structures.v1"],
    datasources: ["tranquility", "singularity"],
    sso: {
        "tranquility": {
            root: "https://login.eveonline.com",
            clientID: "24700340bf7449c0a06e885bb5351f35"
        },
        "singularity": {
            root: "https://sisilogin.testeveonline.com",
            clientID: "b2e2ba92afe540839a378e30ff5e66eb"
        }
    }
};

app.controller("main", function ($http) {
    this.structures = [];
    this.structureNames = new Map();
    this.structureTypes = new Map();
    this.structureGroups = new Map();
    this.structureGroups.set(0, "");

    this.timeNow = Date.now();
    this.timeRemaining = t => {
        let fueledForHours = (Date.parse(t) - this.timeNow) / (1000 * 3600);
        let timeRemainingString = "";
        let localTimeString = new Date(t).toLocaleString();

        if (fueledForHours < 0) {
            timeRemainingString = "Fuel has already expired!";
        } else if (fueledForHours < 1) {
            timeRemainingString = "Fuel expires in less than an hour!";
        } else if (fueledForHours < 48) {
            timeRemainingString = `Fuel expires in ${Math.floor(fueledForHours)} hours.`;
        } else {
            timeRemainingString = `Fuel expires in ${Math.floor(fueledForHours / 24)} days.`;
        }

        return `${timeRemainingString} (${localTimeString} local time)`;
    };

    let get = (url, headers) => $http.get(url, {headers: headers});

    let ssoResponse = new URLSearchParams(window.location.hash.substr(1));

    if (ssoResponse.has("access_token") && ssoResponse.has("state") && eveConf.datasources.includes(ssoResponse.get("state"))) {
        let authHeaders = {Authorization: `Bearer ${ssoResponse.get("access_token")}`};
        let datasource = ssoResponse.get("state");

        let getStructureList = get(`${eveConf.esiRoot}/verify/?datasource=${datasource}`, authHeaders)
            .then(r => get(`${eveConf.esiRoot}/v4/characters/${r.data.CharacterID}/?datasource=${datasource}`))
            .then(r => get(`${eveConf.esiRoot}/v3/corporations/${r.data.corporation_id}/structures/?datasource=${datasource}`, authHeaders));

        getStructureList.then(r => {
            r.data.forEach(structure => {
                this.structureNames.has(structure.structure_id) || this.structureNames.set(structure.structure_id, `Structure #${structure.structure_id}`);
                get(`${eveConf.esiRoot}/v2/universe/structures/${structure.structure_id}/?datasource=${datasource}`, authHeaders).then(r => {
                    this.structureNames.set(structure.structure_id, r.data.name);
                });

            });
            r.data.forEach(structure => {
                if (!this.structureTypes.has(structure.type_id)) {
                    this.structureTypes.set(structure.type_id, {name: "", size: 0, group: 0});
                    get(`${eveConf.esiRoot}/v3/universe/types/${structure.type_id}/?datasource=${datasource}`).then(r => {
                        this.structureTypes.get(structure.type_id).name = r.data.name;
                        this.structureTypes.get(structure.type_id).size = r.data.dogma_attributes.find(e => e.attribute_id == 1547).value;
                        let group = r.data.group_id;
                        this.structureTypes.get(structure.type_id).group = group;
                        if (!this.structureGroups.has(group)) {
                            this.structureGroups.set(group, "");
                            get(`${eveConf.esiRoot}/v1/universe/groups/${group}/?datasource=${datasource}`).then(r => {
                                this.structureGroups.set(group, r.data.name);
                            });
                        }
                    });
                }
            });
            this.structures = r.data;
        });
    }
    else {
        this.needsAuth = true;
        this.datasources = {};
        for (let datasource of eveConf.datasources) {
            let queryString = new URLSearchParams();
            queryString.append("response_type", "token");
            queryString.append("client_id", eveConf.sso[datasource].clientID);
            queryString.append("scope", eveConf.scopes.join(" "));
            queryString.append("redirect_uri", window.location.origin + window.location.pathname);
            queryString.append("state", datasource);
            this.datasources[datasource] = eveConf.sso[datasource].root + "/oauth/authorize?" + queryString.toString();
        }
    }

});