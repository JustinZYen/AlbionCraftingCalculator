import { stationNames } from "./constants.js";
import { namesPromise } from "./external-data.js";
import { ItemNameTrie } from "./trie.js";
/**
 * Maps item ids (in Albion binaries) to crafting station ids (in Albion binaries)
 */
const buildingsThatCanCraft = fetch("https://raw.githubusercontent.com/ao-data/ao-bin-dumps/refs/heads/master/buildings.json").then((response) => {
    return response.json();
}).then((buildingsJSON) => {
    const craftBuildingArray = buildingsJSON.buildings.craftbuilding;
    const stationBonuses = Object.create(null);
    for (const craftBuilding of craftBuildingArray) {
        const buildingName = craftBuilding["@uniquename"];
        if (buildingName in stationNames) {
            const itemsList = craftBuilding.craftingitemlist.craftitem;
            for (const item of itemsList) {
                stationBonuses[item["@uniquename"]] = buildingName;
            }
        }
    }
    return stationBonuses;
});
const itemNameTrie = new ItemNameTrie();
namesPromise.then((nameData) => {
    for (const name of nameData) {
        itemNameTrie.insert(name);
    }
});
export { buildingsThatCanCraft, itemNameTrie };
