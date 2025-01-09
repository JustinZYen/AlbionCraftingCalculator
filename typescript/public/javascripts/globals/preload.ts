import { nameToId } from "../external-data.js";
import { ItemNameTrie } from "../classes/trie.js";

const itemNameTrie = new ItemNameTrie();
for (const name of Object.keys(nameToId)) {
    itemNameTrie.insert(name);

}

export { itemNameTrie };