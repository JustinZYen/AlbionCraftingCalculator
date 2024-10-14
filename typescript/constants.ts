class CityNames {
    static CAERLEON = Symbol("Caerleon");
    static BRIDGEWATCH = Symbol("Bridgewatch");
    static FORT_STERLING = Symbol("Fort Sterling");  
    static LYMHURST = Symbol("Lymhurst");  
    static MARTLOCK = Symbol("Martlock");
    static THETFORD = Symbol("Thetford");
    static BRECILIEN = Symbol("Brecilien");

}
const cityBonuses = new Map([
    [CityNames.CAERLEON, {
        refining: [],
        crafting:[]
    }],
    [CityNames.BRIDGEWATCH, {
        refining: [],
        crafting:[]
    }],
    [CityNames.FORT_STERLING, {
        refining: [],
        crafting:[]
    }],
    [CityNames.LYMHURST, {
        refining: [],
        crafting:[]
    }],
    [CityNames.MARTLOCK, {
        refining: [],
        crafting:[]
    }],
    [CityNames.THETFORD, {
        refining: [],
        crafting:[]
    }],
    [CityNames.BRECILIEN, {
        refining: [],
        crafting:[]
    }],
]);
export {cityBonuses};