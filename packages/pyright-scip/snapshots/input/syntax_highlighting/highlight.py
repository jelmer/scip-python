# format-options: showSyntaxKinds

import os


def greet(name: str) -> str:
    count = len(os.sep)
    if count > 0 and name:
        return f"hello {name}"
    return "bye"  # trailing comment


value = [1, 2, 3]
flag = True
nothing = None
