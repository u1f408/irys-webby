export class Pattern {
    constructor(public regex: RegExp, public replacement: string) {}

    apply(raw: string): string {
        return raw.replace(this.regex, this.replacement);
    }
}

export class Rule {
    constructor(public name: string, public patterns: Pattern[]) {}

    apply(raw: string): string {
        return this.patterns.reduce(
            (result, pattern) => pattern.apply(result),
            raw
        );
    }
}

const defaultRules: Rule[] = [
    new Rule('bold', [
        new Pattern(/\*\*\s?([^\n]+)\*\*/g, '<strong>$1</strong>'),
        new Pattern(/\_\_\s?([^\n]+)\_\_/g, '<strong>$1</strong>'),
    ]),
    new Rule('italic', [
        new Pattern(/\*\s?([^\n]+)\*/g, '<em>$1</em>'),
        new Pattern(/\_\s?([^\n]+)\_/g, '<em>$1</em>'),
    ]),
    new Rule('link', [
        new Pattern(
            /\[([^\n]+)\]\(\<?([^\>\n]+)\>?\)/g,
            '<a href="$2" target="_blank" rel="noopener">$1</a>'
        ),
    ]),
    new Rule('paragraph', [
        new Pattern(/([^\n]+\n?)/g, '\n<p>$1</p>\n'),
    ]),
    new Rule('linebreak', [
        new Pattern(/\n(?!\n)/g, '<br>'), 
    ]),
];

export default class Markdown {
    private rules: Rule[]

    constructor(rules?: Rule[] = null) {
        this.rules = rules || Array.from(defaultRules);
    }

    public addRuleBefore(rule: Rule, before: string): Markdown {
        const index = this.rules.findIndex((r) => r.name === before);
        if (index !== -1)
            this.rules.splice(index, 0, rule);
        return this;
    }

    public addRule(rule: Rule): Markdown {
        this.addRuleBefore(rule, 'paragraph');
        return this;
    }

    public removeRule(ruleName: string): Markdown {
        const index = this.rules.findIndex((r) => r.name === ruleName);
        if (index !== -1)
            this.rules.splice(index, 1);
        return this;
    }

    public render(raw: string): string {
        return this.rules.reduce(
            (result, rule) => rule.apply(result),
            raw
        );
    }
}
