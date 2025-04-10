class ItemNameTrie {
    root = new TrieNode();

    insert(fullName:string) {
        for (const nameWord of fullName.split(" ")) {
            this.#insertWord(nameWord,fullName);
        }
    }

    #insertWord(nameWord:string,fullName:string) {
        let current = this.root;
        for (const character of nameWord) {
            const c = character.toLowerCase();
            if (c.match(/[a-zA-Z0-9]/)) {
                if (!current.children.has(c)) {
                    current.children.set(c,new TrieNode());
                }
                current = current.children.get(c)!;
            }
        }
        current.words.add(fullName);
    }

    getMatchingWords(fullInput:string) {
        let matchingWords = new Set<string>();
        const inputWords = fullInput.split(" ");
        let index = 0;
        for (;index < inputWords.length; index++) {
            if (inputWords[index]!.length > 0) {
                matchingWords = this.getWordsMatchingWord(inputWords[index]!);
                index++;
                break;
            }
        }
        for (;index < inputWords.length; index++) {
            if (inputWords[index]!.length > 0) {
                matchingWords = matchingWords.intersection(this.getWordsMatchingWord(inputWords[index]!));
            }
        }
        return matchingWords;
    }

    private getWordsMatchingWord(nameWord:string) {
        let current = this.root;
        for (const character of nameWord) {
            const c = character.toLowerCase();
            if (c.match(/[a-zA-Z0-9]/)) {
                if (!current.children.has(c)) {
                    return new Set<string>();
                } else {
                    current = current.children.get(c)!;
                }
            }
        }
        let matchingWords = new Set<string>();
        const nodesToAddFrom = [current];
        while (nodesToAddFrom.length > 0) {
            const currentNode = nodesToAddFrom.pop()!;
            matchingWords = matchingWords.union(currentNode.words);
            for (const [_,child] of currentNode.children) {
                nodesToAddFrom.push(child);
            }
        }
        return matchingWords;
    }
}

class TrieNode {
    children = new Map<string,TrieNode>();
    words = new Set<string>(); // Full name of item names that contain this node as the final letter in one of their words
}

export {ItemNameTrie};