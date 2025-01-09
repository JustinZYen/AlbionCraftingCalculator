import { ItemData } from "./classes/item.js";

const itemsJSON = await (await fetch("https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json")).json();

const processedItemsJSON:{[key:string]:ItemData} = {};
(function extractItems(currentValue:{}|[]|string) {
    if (typeof currentValue != "object") {
        return;
    }
    if ("@uniquename" in currentValue) {
        processedItemsJSON[currentValue["@uniquename"] as string] = currentValue as ItemData;
        return;
    }
    for (const value of Object.values(currentValue)) {
        extractItems(value);
    }
})(itemsJSON.items);

const nameToId:{[key:string]:string[]} = Object.create(null); // Null-prototype to minimize possible issues
const idToName:{[key:string]:string} = Object.create(null);
const localizationJSON:{ // More fields exist, but these are the only ones I care about
    UniqueName:string
    LocalizedNames:{
        "EN-US":string
    } | null
}[] = await (await fetch("https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json")).json();
for (const localizationInfo of localizationJSON) {
    if (localizationInfo.LocalizedNames == null) {
        // Items like @ITEMS_QUESTITEM_TUTORIAL_HERETIC_PLANS have their LocalizedNames property set to null
        continue;
    }
    const itemId = localizationInfo.UniqueName;
    const itemName = localizationInfo.LocalizedNames["EN-US"]
    idToName[itemId] = itemName;
    if (Object.hasOwn(nameToId,itemName)) {
        nameToId[itemName]!.push(itemId);
    } else {
        nameToId[itemName] = [itemId];
    }
}
export {processedItemsJSON,nameToId,idToName};
