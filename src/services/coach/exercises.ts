// ============================================================================
// CodeCraft — Curated Debugging Challenges & Related Concept Exercises
// ============================================================================

import type { DebuggingExercise } from './types'

export const DEBUGGING_EXERCISES: DebuggingExercise[] = [
  // --------------------------------------------------------------------------
  // Concept: Zero Division Guard
  // --------------------------------------------------------------------------
  {
    id: 'ex-safe-average',
    title: 'Safe Average Calculator',
    conceptTag: 'zero-division-guard',
    conceptLabel: 'Division Safety & Empty Cases',
    difficulty: 'beginner',
    description:
      'The function `safe_average(numbers)` should calculate the average of a list of numbers. When an empty list is passed, it should return `0.0` instead of crashing with ZeroDivisionError.',
    buggyCode: `def safe_average(numbers: list[float]) -> float:
    # BUG: Crashes on empty list []
    total = sum(numbers)
    return total / len(numbers)
`,
    expectedSolutionCode: `def safe_average(numbers: list[float]) -> float:
    if not numbers:
        return 0.0
    total = sum(numbers)
    return total / len(numbers)
`,
    hints: [
      'Think about what len(numbers) returns when the list is empty. What happens when dividing by that number?',
      'When numbers is [], len(numbers) is 0, causing a ZeroDivisionError on line 4.',
      {
        originalText: '    total = sum(numbers)\n    return total / len(numbers)',
        replacementText: '    if not numbers:\n        return 0.0\n    total = sum(numbers)\n    return total / len(numbers)',
        explanation: 'Guard against empty lists by checking `if not numbers:` and returning 0.0 early.',
      },
    ],
    testCases: [
      {
        id: 'tc-avg-1',
        name: 'Standard list',
        callExpr: 'safe_average([10.0, 20.0, 30.0])',
        expected: '20.0',
        description: 'Calculates correct mean for regular numbers.',
      },
      {
        id: 'tc-avg-2',
        name: 'Single element',
        callExpr: 'safe_average([42.0])',
        expected: '42.0',
        description: 'Single element list returns element value.',
      },
      {
        id: 'tc-avg-3',
        name: 'Empty list guard',
        callExpr: 'safe_average([])',
        expected: '0.0',
        description: 'Empty list returns 0.0 without ZeroDivisionError.',
      },
    ],
    relatedExerciseId: 'ex-percentage-calc',
  },
  {
    id: 'ex-percentage-calc',
    title: 'Pass Rate Percentage',
    conceptTag: 'zero-division-guard',
    conceptLabel: 'Division Safety & Empty Cases',
    difficulty: 'beginner',
    description:
      'The function `pass_rate(passed, total)` calculates the percentage of students passing. When total enrolled is 0, it should return `0.0`.',
    buggyCode: `def pass_rate(passed: int, total: int) -> float:
    # BUG: When total is 0, ZeroDivisionError is raised
    return round((passed / total) * 100, 1)
`,
    expectedSolutionCode: `def pass_rate(passed: int, total: int) -> float:
    if total == 0:
        return 0.0
    return round((passed / total) * 100, 1)
`,
    hints: [
      'What happens if no students are enrolled (total == 0)?',
      'Division by total raises ZeroDivisionError when total is 0.',
      {
        originalText: '    return round((passed / total) * 100, 1)',
        replacementText: '    if total == 0:\n        return 0.0\n    return round((passed / total) * 100, 1)',
        explanation: 'Check if total is 0 and return 0.0 before dividing.',
      },
    ],
    testCases: [
      {
        id: 'tc-rate-1',
        name: 'Standard rate',
        callExpr: 'pass_rate(8, 10)',
        expected: '80.0',
      },
      {
        id: 'tc-rate-2',
        name: 'Zero total guard',
        callExpr: 'pass_rate(0, 0)',
        expected: '0.0',
      },
    ],
    relatedExerciseId: 'ex-safe-average',
  },

  // --------------------------------------------------------------------------
  // Concept: Loop Boundaries & Indexing
  // --------------------------------------------------------------------------
  {
    id: 'ex-find-max-index',
    title: 'Find Maximum Index',
    conceptTag: 'loops-indexing',
    conceptLabel: 'Loop Boundaries & Off-by-One',
    difficulty: 'beginner',
    description:
      'The function `find_max_index(nums)` should return the index of the largest value in `nums`. Fix the off-by-one boundary error in the loop.',
    buggyCode: `def find_max_index(nums: list[int]) -> int:
    max_idx = 0
    # BUG: Off-by-one causes IndexError on the last step
    for i in range(len(nums) + 1):
        if nums[i] > nums[max_idx]:
            max_idx = i
    return max_idx
`,
    expectedSolutionCode: `def find_max_index(nums: list[int]) -> int:
    max_idx = 0
    for i in range(len(nums)):
        if nums[i] > nums[max_idx]:
            max_idx = i
    return max_idx
`,
    hints: [
      'In Python, what is the highest valid index for a list of length N?',
      'Using `range(len(nums) + 1)` reaches index `len(nums)`, which is out of bounds for 0-indexed lists.',
      {
        originalText: '    for i in range(len(nums) + 1):',
        replacementText: '    for i in range(len(nums)):',
        explanation: 'Remove + 1 from range(len(nums)) to stay within valid sequence boundaries.',
      },
    ],
    testCases: [
      {
        id: 'tc-idx-1',
        name: 'Standard list',
        callExpr: 'find_max_index([3, 7, 2])',
        expected: '1',
      },
      {
        id: 'tc-idx-2',
        name: 'First element largest',
        callExpr: 'find_max_index([99, 12, 45])',
        expected: '0',
      },
      {
        id: 'tc-idx-3',
        name: 'Last element largest',
        callExpr: 'find_max_index([10, 20, 80])',
        expected: '2',
      },
    ],
    relatedExerciseId: 'ex-reverse-list',
  },
  {
    id: 'ex-reverse-list',
    title: 'Last Item Getter',
    conceptTag: 'loops-indexing',
    conceptLabel: 'Loop Boundaries & Off-by-One',
    difficulty: 'beginner',
    description:
      'The function `get_last_item(items)` should return the final element of a non-empty list. Fix the indexing error.',
    buggyCode: `def get_last_item(items: list[str]) -> str:
    # BUG: items[len(items)] is out of bounds
    return items[len(items)]
`,
    expectedSolutionCode: `def get_last_item(items: list[str]) -> str:
    return items[len(items) - 1]
`,
    hints: [
      'If a list has 3 items, what are their indices?',
      'A list of length N has elements from index 0 to N - 1. Accessing index N raises IndexError.',
      {
        originalText: '    return items[len(items)]',
        replacementText: '    return items[len(items) - 1]',
        explanation: 'Subtract 1 or use negative indexing `items[-1]`.',
      },
    ],
    testCases: [
      {
        id: 'tc-last-1',
        name: 'Multiple items',
        callExpr: 'get_last_item(["a", "b", "c"])',
        expected: "'c'",
      },
      {
        id: 'tc-last-2',
        name: 'Single item',
        callExpr: 'get_last_item(["solo"])',
        expected: "'solo'",
      },
    ],
    relatedExerciseId: 'ex-find-max-index',
  },

  // --------------------------------------------------------------------------
  // Concept: Function Scope & Returns
  // --------------------------------------------------------------------------
  {
    id: 'ex-count-vowels',
    title: 'Vowel Counter',
    conceptTag: 'functions-returns',
    conceptLabel: 'Loop Accumulation & Premature Return',
    difficulty: 'beginner',
    description:
      'The function `count_vowels(text)` should count all vowels (a, e, i, o, u) in `text`. Fix the premature return that halts counting on the first letter.',
    buggyCode: `def count_vowels(text: str) -> int:
    vowels = "aeiouAEIOU"
    count = 0
    for char in text:
        if char in vowels:
            count += 1
        # BUG: Indented return statement causes immediate exit
        return count
    return count
`,
    expectedSolutionCode: `def count_vowels(text: str) -> int:
    vowels = "aeiouAEIOU"
    count = 0
    for char in text:
        if char in vowels:
            count += 1
    return count
`,
    hints: [
      'Look at the indentation of the first return statement. When does it execute?',
      'The return statement inside the loop body executes on iteration 1, exiting before checking subsequent characters.',
      {
        originalText: '        if char in vowels:\n            count += 1\n        # BUG: Indented return statement causes immediate exit\n        return count',
        replacementText: '        if char in vowels:\n            count += 1',
        explanation: 'Remove premature return inside the loop body so all characters are counted.',
      },
    ],
    testCases: [
      {
        id: 'tc-vow-1',
        name: 'Multiple vowels',
        callExpr: 'count_vowels("hello")',
        expected: '2',
      },
      {
        id: 'tc-vow-2',
        name: 'Sentence',
        callExpr: 'count_vowels("CodeCraft Studio")',
        expected: '5',
      },
      {
        id: 'tc-vow-3',
        name: 'No vowels',
        callExpr: 'count_vowels("rhythm")',
        expected: '0',
      },
    ],
    relatedExerciseId: 'ex-sum-positives',
  },
  {
    id: 'ex-sum-positives',
    title: 'Sum Positive Numbers',
    conceptTag: 'functions-returns',
    conceptLabel: 'Loop Accumulation & Premature Return',
    difficulty: 'beginner',
    description:
      'The function `sum_positives(nums)` should sum all numbers greater than 0. Return the final sum after iterating through the whole list.',
    buggyCode: `def sum_positives(nums: list[int]) -> int:
    total = 0
    for n in nums:
        if n > 0:
            total += n
        return total
    return total
`,
    expectedSolutionCode: `def sum_positives(nums: list[int]) -> int:
    total = 0
    for n in nums:
        if n > 0:
            total += n
    return total
`,
    hints: [
      'Why does the function stop after examining only the first number?',
      'A return statement inside the loop terminates the function immediately.',
      {
        originalText: '        if n > 0:\n            total += n\n        return total',
        replacementText: '        if n > 0:\n            total += n',
        explanation: 'Remove the return statement from inside the loop.',
      },
    ],
    testCases: [
      {
        id: 'tc-pos-1',
        name: 'Mixed numbers',
        callExpr: 'sum_positives([1, -2, 3, 4])',
        expected: '8',
      },
      {
        id: 'tc-pos-2',
        name: 'All negatives',
        callExpr: 'sum_positives([-5, -1])',
        expected: '0',
      },
    ],
    relatedExerciseId: 'ex-count-vowels',
  },

  // --------------------------------------------------------------------------
  // Concept: Dictionary Key Lookups
  // --------------------------------------------------------------------------
  {
    id: 'ex-get-score',
    title: 'Player Score Lookup',
    conceptTag: 'dict-key-lookup',
    conceptLabel: 'Dictionary Handling & Key Safety',
    difficulty: 'beginner',
    description:
      'The function `get_player_score(scores, player)` should return the score for `player`. If the player is not found, return `0` instead of crashing with KeyError.',
    buggyCode: `def get_player_score(scores: dict[str, int], player: str) -> int:
    # BUG: scores[player] raises KeyError if player does not exist
    return scores[player]
`,
    expectedSolutionCode: `def get_player_score(scores: dict[str, int], player: str) -> int:
    return scores.get(player, 0)
`,
    hints: [
      'What happens when indexing a dictionary with a key that does not exist?',
      'Direct bracket notation `dict[key]` raises KeyError if the key is missing.',
      {
        originalText: '    return scores[player]',
        replacementText: '    return scores.get(player, 0)',
        explanation: 'Use `.get(player, 0)` to provide a safe fallback when the key is absent.',
      },
    ],
    testCases: [
      {
        id: 'tc-sc-1',
        name: 'Existing player',
        callExpr: 'get_player_score({"Alice": 100, "Bob": 80}, "Alice")',
        expected: '100',
      },
      {
        id: 'tc-sc-2',
        name: 'Missing player fallback',
        callExpr: 'get_player_score({"Alice": 100}, "Charlie")',
        expected: '0',
      },
    ],
    relatedExerciseId: 'ex-item-inventory',
  },
  {
    id: 'ex-item-inventory',
    title: 'Inventory Item Lookup',
    conceptTag: 'dict-key-lookup',
    conceptLabel: 'Dictionary Handling & Key Safety',
    difficulty: 'beginner',
    description:
      'The function `check_inventory(inv, item)` checks stock count. If `item` is not in inventory, return `0`.',
    buggyCode: `def check_inventory(inv: dict[str, int], item: str) -> int:
    return inv[item]
`,
    expectedSolutionCode: `def check_inventory(inv: dict[str, int], item: str) -> int:
    return inv.get(item, 0)
`,
    hints: [
      'How can you retrieve a dictionary value with a default fallback?',
      'Using `inv[item]` throws KeyError if item is not in inv.',
      {
        originalText: '    return inv[item]',
        replacementText: '    return inv.get(item, 0)',
        explanation: 'Use `inv.get(item, 0)`.',
      },
    ],
    testCases: [
      {
        id: 'tc-inv-1',
        name: 'In stock',
        callExpr: 'check_inventory({"wood": 15, "stone": 30}, "wood")',
        expected: '15',
      },
      {
        id: 'tc-inv-2',
        name: 'Out of stock',
        callExpr: 'check_inventory({"wood": 15}, "gold")',
        expected: '0',
      },
    ],
    relatedExerciseId: 'ex-get-score',
  },

  // --------------------------------------------------------------------------
  // Concept: Type Conversion
  // --------------------------------------------------------------------------
  {
    id: 'ex-sum-numeric-strings',
    title: 'Sum String Numbers',
    conceptTag: 'type-conversion',
    conceptLabel: 'Type Casting & Conversion',
    difficulty: 'beginner',
    description:
      'The function `sum_string_numbers(items)` receives a list of digit strings like `["10", "20", "30"]` and should return their integer sum (`60`). Convert strings before addition.',
    buggyCode: `def sum_string_numbers(items: list[str]) -> int:
    total = 0
    for s in items:
        # BUG: Adding int to str raises TypeError
        total += s
    return total
`,
    expectedSolutionCode: `def sum_string_numbers(items: list[str]) -> int:
    total = 0
    for s in items:
        total += int(s)
    return total
`,
    hints: [
      'What type is `total` (0) versus what type is `s` ("10")?',
      'Adding an integer `total` and a string `s` raises TypeError.',
      {
        originalText: '        total += s',
        replacementText: '        total += int(s)',
        explanation: 'Convert `s` to an integer with `int(s)` before adding.',
      },
    ],
    testCases: [
      {
        id: 'tc-str-1',
        name: 'Multiple numbers',
        callExpr: 'sum_string_numbers(["10", "20", "30"])',
        expected: '60',
      },
      {
        id: 'tc-str-2',
        name: 'Single number',
        callExpr: 'sum_string_numbers(["5"])',
        expected: '5',
      },
      {
        id: 'tc-str-3',
        name: 'Empty list',
        callExpr: 'sum_string_numbers([])',
        expected: '0',
      },
    ],
    relatedExerciseId: 'ex-join-digits',
  },
  {
    id: 'ex-join-digits',
    title: 'Multiply String Number',
    conceptTag: 'type-conversion',
    conceptLabel: 'Type Casting & Conversion',
    difficulty: 'beginner',
    description:
      'The function `double_number(num_str)` takes a string like `"7"` and returns double its numeric value (`14`). Fix string repetition.',
    buggyCode: `def double_number(num_str: str) -> int:
    # BUG: "7" * 2 evaluates to "77" instead of 14
    return num_str * 2
`,
    expectedSolutionCode: `def double_number(num_str: str) -> int:
    return int(num_str) * 2
`,
    hints: [
      'In Python, multiplying a string repeats it ("7" * 2 == "77").',
      'Convert num_str to integer before arithmetic multiplication.',
      {
        originalText: '    return num_str * 2',
        replacementText: '    return int(num_str) * 2',
        explanation: 'Wrap num_str in int().',
      },
    ],
    testCases: [
      {
        id: 'tc-dbl-1',
        name: 'Positive integer string',
        callExpr: 'double_number("7")',
        expected: '14',
      },
      {
        id: 'tc-dbl-2',
        name: 'Zero string',
        callExpr: 'double_number("0")',
        expected: '0',
      },
    ],
    relatedExerciseId: 'ex-sum-numeric-strings',
  },
]
