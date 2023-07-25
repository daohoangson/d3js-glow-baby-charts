import { readFileSync } from "fs";
import { join } from "path";

let generator: Generator;

export default () => {
  if (!generator) {
    generator = new Generator();

    const adjectives = readFileSync(join(__dirname, "adjectives.txt"), "utf-8");
    generator.use(adjectives);

    const nouns = readFileSync(join(__dirname, "nouns.txt"), "utf-8");
    generator.use(nouns);
  }

  return generator.choose();
};

class Dictionary {
  words: string[];

  constructor(data: string) {
    this.words = [];
    data.split(/\s+/).forEach((w) => (w ? this.words.push(w) : null));
  }

  choose() {
    const random = Math.floor(Math.random() * this.words.length);
    return this.words[random];
  }
}

class Generator {
  dicts: Dictionary[];

  constructor() {
    this.dicts = [];
  }

  choose() {
    const words = this.dicts.map((d) => d.choose());
    return words.join("-");
  }

  use(data: string) {
    this.dicts.push(new Dictionary(data));
  }
}
