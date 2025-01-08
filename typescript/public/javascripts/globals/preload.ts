import {namesPromise} from "../external-data.js";
import { ItemNameTrie } from "../classes/trie.js";

const itemNameTrie = new ItemNameTrie();
namesPromise.then((nameData)=>{
    for (const name of nameData) {
        itemNameTrie.insert(name);
    }
});

export {itemNameTrie};