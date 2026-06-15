# < definition scip-python python snapshot-util 0.1 highlight/__init__:

# format-options: showSyntaxKinds
#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ syntax Comment

import os
#^^^^^ syntax Keyword
#      ^^ reference  python-stdlib 3.11 os/__init__:


def greet(name: str) -> str:
#^^ syntax Keyword
#   ^^^^^ definition  snapshot-util 0.1 highlight/greet().
#        ^ syntax PunctuationBracket
#         ^^^^ definition  snapshot-util 0.1 highlight/greet().(name)
#             ^ syntax PunctuationDelimiter
#               ^^^ reference  python-stdlib 3.11 builtins/str#
#                  ^ syntax PunctuationBracket
#                    ^^ syntax PunctuationDelimiter
#                       ^^^ reference  python-stdlib 3.11 builtins/str#
#                          ^ syntax PunctuationDelimiter
    count = len(os.sep)
#   ^^^^^ definition local 0
#         ^ syntax IdentifierOperator
#           ^^^ reference local 1
#              ^ syntax PunctuationBracket
#               ^^ reference  python-stdlib 3.11 os/__init__:
#                 ^ syntax PunctuationDelimiter
#                  ^^^ reference  python-stdlib 3.11 os/sep.sep.
#                     ^ syntax PunctuationBracket
    if count > 0 and name:
#   ^^ syntax Keyword
#      ^^^^^ reference local 0
#            ^ syntax IdentifierOperator
#              ^ syntax NumericLiteral
#                ^^^ syntax IdentifierOperator
#                    ^^^^ reference  snapshot-util 0.1 highlight/greet().(name)
#                        ^ syntax PunctuationDelimiter
        return f"hello {name}"
#       ^^^^^^ syntax Keyword
#              ^^^^^^^^^^^^^^^ syntax StringLiteral
#                       ^^^^ reference  snapshot-util 0.1 highlight/greet().(name)
    return "bye"  # trailing comment
#   ^^^^^^ syntax Keyword
#          ^^^^^ syntax StringLiteral
#                  ^^^^^^^^^^^^^^^^^ syntax Comment


value = [1, 2, 3]
#^^^^ definition  snapshot-util 0.1 highlight/value.
#     ^ syntax IdentifierOperator
#       ^ syntax PunctuationBracket
#        ^ syntax NumericLiteral
#         ^ syntax PunctuationDelimiter
#           ^ syntax NumericLiteral
#            ^ syntax PunctuationDelimiter
#              ^ syntax NumericLiteral
#               ^ syntax PunctuationBracket
flag = True
#^^^ definition  snapshot-util 0.1 highlight/flag.
#    ^ syntax IdentifierOperator
#      ^^^^ syntax BooleanLiteral
nothing = None
#^^^^^^ definition  snapshot-util 0.1 highlight/nothing.
#       ^ syntax IdentifierOperator
#         ^^^^ syntax IdentifierNull

