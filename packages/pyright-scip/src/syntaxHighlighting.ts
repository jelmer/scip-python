import { TextRange } from 'pyright-internal/common/textRange';
import { TextRangeCollection } from 'pyright-internal/common/textRangeCollection';
import { convertOffsetToPosition } from 'pyright-internal/common/positionUtils';
import { Comment, KeywordToken, KeywordType, Token, TokenType } from 'pyright-internal/parser/tokenizerTypes';
import { TokenizerOutput } from 'pyright-internal/parser/tokenizer';

import { scip } from './scip';
import { Position } from './lsif-typescript/Position';
import { Range } from './lsif-typescript/Range';

function offsetsToRange(start: number, length: number, lines: TextRangeCollection<TextRange>): Range {
    const posStart = convertOffsetToPosition(start, lines);
    const posEnd = convertOffsetToPosition(start + length, lines);
    return new Range(new Position(posStart.line, posStart.character), new Position(posEnd.line, posEnd.character));
}

// Keywords that name literal values are highlighted as literals rather than as
// plain keywords, matching how editors typically render them.
function keywordSyntaxKind(keywordType: KeywordType): scip.SyntaxKind {
    switch (keywordType) {
        case KeywordType.True:
        case KeywordType.False:
            return scip.SyntaxKind.BooleanLiteral;
        case KeywordType.None:
            return scip.SyntaxKind.IdentifierNull;
        case KeywordType.And:
        case KeywordType.Or:
        case KeywordType.Not:
        case KeywordType.Is:
        case KeywordType.In:
            return scip.SyntaxKind.IdentifierOperator;
        default:
            return scip.SyntaxKind.Keyword;
    }
}

function tokenSyntaxKind(token: Token): scip.SyntaxKind | undefined {
    switch (token.type) {
        case TokenType.Keyword:
            return keywordSyntaxKind((token as KeywordToken).keywordType);
        case TokenType.String:
            return scip.SyntaxKind.StringLiteral;
        case TokenType.Number:
            return scip.SyntaxKind.NumericLiteral;
        case TokenType.Operator:
            return scip.SyntaxKind.IdentifierOperator;
        case TokenType.Colon:
        case TokenType.Semicolon:
        case TokenType.Comma:
        case TokenType.Dot:
        case TokenType.Arrow:
        case TokenType.Ellipsis:
            return scip.SyntaxKind.PunctuationDelimiter;
        case TokenType.OpenParenthesis:
        case TokenType.CloseParenthesis:
        case TokenType.OpenBracket:
        case TokenType.CloseBracket:
        case TokenType.OpenCurlyBrace:
        case TokenType.CloseCurlyBrace:
            return scip.SyntaxKind.PunctuationBracket;
        default:
            // Identifiers are intentionally left to the semantic occurrences
            // emitted by the tree visitor, which carry richer information.
            // Structural tokens (NewLine, Indent, Dedent, EndOfStream, Invalid)
            // have no visible highlighting.
            return undefined;
    }
}

function rangeKey(range: number[]): string {
    return range.join(',');
}

/**
 * Emit `syntax_kind`-only occurrences for every highlightable token in the
 * file. Ranges that already have a semantic occurrence (definitions and
 * references emitted by the tree visitor) are skipped so we never emit two
 * occurrences for the same range; those semantic occurrences are annotated with
 * their syntax kind in place instead.
 */
export function addSyntaxHighlighting(document: scip.Document, tokenizerOutput: TokenizerOutput): void {
    const lines = tokenizerOutput.lines;

    const semanticByRange: Map<string, scip.Occurrence> = new Map();
    for (const occurrence of document.occurrences) {
        semanticByRange.set(rangeKey(occurrence.range), occurrence);
    }

    const emittedComments: Set<string> = new Set();

    const emitComments = (comments: Comment[] | undefined) => {
        if (!comments) {
            return;
        }
        for (const comment of comments) {
            const range = offsetsToRange(comment.start, comment.length, lines).toLsif();
            const key = rangeKey(range);
            if (emittedComments.has(key)) {
                continue;
            }
            emittedComments.add(key);
            document.occurrences.push(
                new scip.Occurrence({
                    range,
                    syntax_kind: scip.SyntaxKind.Comment,
                })
            );
        }
    };

    for (let i = 0; i < tokenizerOutput.tokens.count; i++) {
        const token = tokenizerOutput.tokens.getItemAt(i);

        // Comments are attached to the token that follows them rather than
        // appearing as standalone tokens in the stream.
        emitComments(token.comments);

        if (token.length === 0) {
            continue;
        }

        const syntaxKind = tokenSyntaxKind(token);
        if (syntaxKind === undefined) {
            continue;
        }

        const range = offsetsToRange(token.start, token.length, lines).toLsif();
        const existing = semanticByRange.get(rangeKey(range));
        if (existing) {
            // Annotate the existing semantic occurrence in place.
            if (existing.syntax_kind === scip.SyntaxKind.UnspecifiedSyntaxKind) {
                existing.syntax_kind = syntaxKind;
            }
            continue;
        }

        document.occurrences.push(
            new scip.Occurrence({
                range,
                syntax_kind: syntaxKind,
            })
        );
    }
}
