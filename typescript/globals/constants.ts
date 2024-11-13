enum City {
    CAERLEON = "Caerleon",
    BRIDGEWATCH = "Bridgewatch",
    FORT_STERLING = "Fort Sterling",
    LYMHURST = "Lymhurst",
    MARTLOCK = "Martlock",
    THETFORD = "Thetford",
    BRECILIEN = "Brecilien",
}

/**
 * Maps city strings (e.g. "Lymhurst") to City (enum) values
 */
const reverseCity:{[key:string]:City} = Object.create(null);
for (const city in City) {
    const cityEnum = city as keyof typeof City;
    const myCity:City = City[cityEnum];
    reverseCity[myCity as string] =  myCity;
}
Object.freeze(reverseCity);

/**
 * Maps City (enum) to their city numbers in the Albion binaries (e.g. "3005")
 */
const cityMarketNumbers:{[key in City]:string} = Object.create(null); // Mozilla web docs say to use this to avoid having potential incidental overlap with prototype values
cityMarketNumbers[City.CAERLEON] = "3005";
cityMarketNumbers[City.BRIDGEWATCH] = "2004";
cityMarketNumbers[City.FORT_STERLING] = "4002";
cityMarketNumbers[City.LYMHURST] = "1002";
cityMarketNumbers[City.MARTLOCK] = "3008";
cityMarketNumbers[City.THETFORD] = "0007";
cityMarketNumbers[City.BRECILIEN] = "5003";
Object.freeze(cityMarketNumbers);

/** Sample demo for using reversecity */
/*
let s = "Lymhurst";
if (Object.hasOwn(reverseCity,s)) {
    console.log(cityMarketNumbers[reverseCity[s]!]);
}
*/ 

// Crafting Bonuses
/**
 * Base crafting bonus for all items in the cities
 */
const baseCityBonus = 0.18;
/**
 * Maps city name to map of item ids and their corresponding bonus amounts
 */
const cityBonuses:{[key in City]:{[key:string]:number}} = Object.create(null);
// #region City crafting bonus values
const thetfordBonus = {
    "ore":0.4,
    "meat_pig":0.1,
    "mace":0.15,
    "naturestaff":0.15,
    "firestaff":0.15,
    "leather_armor":0.15,
    "cloth_helmet":0.15
}
Object.freeze(thetfordBonus);
const lymhurstBonus = {
    "fiber":0.4,
    "meat_goose":0.1,
    "sword":0.15,
    "bow":0.15,
    "arcanestaff":0.15,
    "leather_helmet":0.15,
    "leather_shoes":0.15
}
Object.freeze(lymhurstBonus);
const bridgewatchBonus = {
    "rock":0.4,
    "meat_goat":0.1,
    "crossbow":0.15,
    "dagger":0.15,
    "cursestaff":0.15,
    "plate_armor":0.15,
    "cloth_shoes":0.15
}
Object.freeze(bridgewatchBonus);
const martlockBonus = {
    "hide":0.4,
    "meat_cow":0.1,
    "axe":0.15,
    "quarterstaff":0.15,
    "froststaff":0.15,
    "plate_shoes":0.15,
    "offhand":0.15
}
Object.freeze(martlockBonus);
const fortSterlingBonus = {
    "wood":0.4,
    "meat_chicken":0.1,
    "meat_sheep":0.1,
    "hammer":0.15,
    "spear":0.15,
    "holystaff":0.15,
    "plate_helmet":0.15,
    "cloth_armor":0.15
}
Object.freeze(fortSterlingBonus);
const caerleonBonus = {
    "gatherergear":0.15,
    "tools":0.15,
    "food":0.15,
    "knuckles":0.15,
    "shapeshifterstaff":0.15
}
Object.freeze(caerleonBonus);
const brecilienBonus = {
    "cape":0.15,
    "bag":0.15,
    "potion":0.15
}
Object.freeze(brecilienBonus);
// #endregion
cityBonuses[City.CAERLEON] = caerleonBonus;
cityBonuses[City.BRIDGEWATCH] = bridgewatchBonus;
cityBonuses[City.FORT_STERLING] = fortSterlingBonus;
cityBonuses[City.LYMHURST] = lymhurstBonus;
cityBonuses[City.MARTLOCK] = martlockBonus;
cityBonuses[City.THETFORD] = thetfordBonus;
cityBonuses[City.BRECILIEN] = brecilienBonus;
Object.freeze(cityBonuses);

const reverseCityBonuses:{[key:string]:City} = Object.create(null);
for (const [cityName,bonuses] of Object.entries(cityBonuses)) {
    const cityNameAsEnum = reverseCity[cityName]!;
    for (const itemName in bonuses) {
        reverseCityBonuses[itemName] = cityNameAsEnum;
    }
}
Object.freeze(reverseCityBonuses);

/**
 * Maps Albion binary names for crafting stations to their ingame names
 */
const stationNames:{[key:string]:string} = Object.create(null);
stationNames["T8_FORGE"] = "Warrior's Forge";
stationNames["T8_HUNTERSLODGE"] = "Hunter's Lodge";
stationNames["T8_MAGICITEMS"] = "Mage's Tower";
stationNames["T8_TOOLMAKER"] = "Toolmaker";
stationNames["T8_ALCHEMIST"] = "Alchemist's Lab";
stationNames["T8_STABLE"] = "Saddler";
stationNames["T8_COOK"] = "Cook";
stationNames["T8_BUTCHER"] = "Butcher";
stationNames["T8_CARPENTERSWORKSHOP"] = "Lumbermill";
stationNames["T8_SMELTER"] = "Smelter";
stationNames["T8_STONEMASONRY"] = "Stonemason";
stationNames["T8_TANNERY"] = "Tanner";
stationNames["T8_WEAVINGMILL"] = "Weaver";
Object.freeze(stationNames)
export { baseCityBonus, cityBonuses, reverseCityBonuses, stationNames, City };

// @craftingcategory for refined resources (@shopsubcategory1 says refined name (not right for crafting bonus))
// @shopsubcategory1 for weapons
// @shopsubcategory1 for helmet
// @shopsubcategory1 for armor
// @shopsubcategory1 for shoes
// @craftingcategory and @subcategory1 work for capes
// @craftingcategory and @subcategory1 work for bags
// @craftingcategory and @shopcategory works for tools !!!tools may have @subcategory1
// @craftingcategory for food


// Crafting category for all??