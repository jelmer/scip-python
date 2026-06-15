import { Tokenizer } from 'pyright-internal/parser/tokenizer';

import { scip } from './scip';
import { addSyntaxHighlighting } from './syntaxHighlighting';

function highlight(text: string): scip.Occurrence[] {
    const tokenizerOutput = new Tokenizer().tokenize(text);
    const document = new scip.Document();
    addSyntaxHighlighting(document, tokenizerOutput);
    return document.occurrences;
}

// Returns the syntax kind of the occurrence covering the first appearance of
// `needle` in `text`, or undefined if no occurrence matches that exact range.
function kindAt(text: string, needle: string): scip.SyntaxKind | undefined {
    const offset = text.indexOf(needle);
    if (offset < 0) {
        throw new Error(`needle ${JSON.stringify(needle)} not found in source`);
    }

    // The snippets used here are single-line, so the column equals the offset.
    const startChar = offset;
    const endChar = offset + needle.length;

    const occurrences = highlight(text);
    const match = occurrences.find(
        (occ) => occ.range[0] === 0 && occ.range[1] === startChar && occ.range[occ.range.length - 1] === endChar
    );
    return match?.syntax_kind;
}

describe('addSyntaxHighlighting', () => {
    test.each([
        ['keyword', 'def f(): pass', 'def', scip.SyntaxKind.Keyword],
        ['boolean literal', 'x = True', 'True', scip.SyntaxKind.BooleanLiteral],
        ['none literal', 'x = None', 'None', scip.SyntaxKind.IdentifierNull],
        ['word operator', 'x = a and b', 'and', scip.SyntaxKind.IdentifierOperator],
        ['symbol operator', 'x = a + b', '+', scip.SyntaxKind.IdentifierOperator],
        ['string literal', 'x = "hi"', '"hi"', scip.SyntaxKind.StringLiteral],
        ['numeric literal', 'x = 42', '42', scip.SyntaxKind.NumericLiteral],
        ['bracket', 'x = [1]', '[', scip.SyntaxKind.PunctuationBracket],
        ['delimiter', 'x = a, b', ',', scip.SyntaxKind.PunctuationDelimiter],
    ])('highlights a %s', (_name, source, needle, expected) => {
        expect(kindAt(source, needle)).toBe(expected);
    });

    test('highlights comments', () => {
        const text = 'x = 1  # a comment\n';
        const occurrences = highlight(text);
        const comment = occurrences.find((occ) => occ.syntax_kind === scip.SyntaxKind.Comment);
        expect(comment).toBeDefined();
        // The comment occurrence falls within the trailing comment portion of
        // the line (at or after the '#').
        expect(comment!.range[0]).toBe(0);
        expect(comment!.range[1]).toBeGreaterThanOrEqual(text.indexOf('#'));
    });

    test('does not highlight plain identifiers', () => {
        // `value` spans columns 0-5; identifiers are left to the semantic
        // occurrences emitted by the tree visitor, so no syntax occurrence
        // should cover that range.
        const occurrences = highlight('value = other\n');
        const coversValue = occurrences.some((occ) => occ.range[1] === 0 && occ.range[occ.range.length - 1] === 5);
        expect(coversValue).toBe(false);
    });

    test('annotates an existing occurrence in place instead of duplicating', () => {
        const text = 'x = 42';
        const tokenizerOutput = new Tokenizer().tokenize(text);
        const document = new scip.Document();

        // Pre-seed a semantic occurrence over the `42` literal, as the tree
        // visitor would for a symbol.
        const numberStart = text.indexOf('42');
        document.occurrences.push(
            new scip.Occurrence({
                symbol: 'fake-symbol',
                symbol_roles: scip.SymbolRole.ReadAccess,
                range: [0, numberStart, numberStart + 2],
            })
        );

        addSyntaxHighlighting(document, tokenizerOutput);

        const overNumber = document.occurrences.filter(
            (occ) => occ.range[1] === numberStart && occ.range[occ.range.length - 1] === numberStart + 2
        );
        expect(overNumber).toHaveLength(1);
        expect(overNumber[0].symbol).toBe('fake-symbol');
        expect(overNumber[0].syntax_kind).toBe(scip.SyntaxKind.NumericLiteral);
    });
});
