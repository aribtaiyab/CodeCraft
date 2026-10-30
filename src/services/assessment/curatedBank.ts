// ============================================================================
// CodeCraft — Curated Verified Question Bank
// Phase 6: Deterministic, verified Python assessment questions
// ============================================================================

import type {
  AssessmentQuestion,
  AssessmentTopic,
  AssessmentDifficulty,
} from './types'

export const CURATED_QUESTIONS: AssessmentQuestion[] = [
  // --------------------------------------------------------------------------
  // Topic 1: Python Fundamentals
  // --------------------------------------------------------------------------
  {
    id: 'mcq_fund_01',
    type: 'mcq',
    topic: 'python_fundamentals',
    difficulty: 'beginner',
    points: 10,
    prompt: 'What is the output of the following Python code snippet?',
    codeSnippet: `x = 7
y = 2
print(x // y, x % y)`,
    options: [
      { id: 'opt_1', text: '3.5 1' },
      { id: 'opt_2', text: '3 1' },
      { id: 'opt_3', text: '3 0.5' },
      { id: 'opt_4', text: '4 1' },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'In Python, // is floor division which returns the integer quotient 3, and % is modulo which returns the remainder 1.',
    verifiedByExecution: true,
  },
  {
    id: 'mcq_fund_02',
    type: 'mcq',
    topic: 'python_fundamentals',
    difficulty: 'beginner',
    points: 10,
    prompt: 'Which of the following creates a boolean True value in Python?',
    options: [
      { id: 'opt_1', text: 'bool(0)' },
      { id: 'opt_2', text: 'bool("")' },
      { id: 'opt_3', text: 'bool("False")' },
      { id: 'opt_4', text: 'bool([])' },
    ],
    correctOptionId: 'opt_3',
    explanation:
      'Any non-empty string in Python evaluates to True in boolean context, including "False". Empty strings, 0, and empty lists evaluate to False.',
    isConceptual: true,
  },
  {
    id: 'mcq_fund_03',
    type: 'mcq',
    topic: 'python_fundamentals',
    difficulty: 'intermediate',
    points: 15,
    prompt: 'What will be printed when this string slicing code runs?',
    codeSnippet: `s = "CodeCraft"
print(s[2:8:2])`,
    options: [
      { id: 'opt_1', text: 'deC' },
      { id: 'opt_2', text: 'dCa' },
      { id: 'opt_3', text: 'der' },
      { id: 'opt_4', text: 'dCr' },
    ],
    correctOptionId: 'opt_4',
    explanation:
      'Slice [2:8:2] starts at index 2 ("d"), steps by 2 ("e" at 3 is skipped, taking "C" at 4, "r" at 6), stopping before index 8. Result: "dCr".',
    verifiedByExecution: true,
  },
  {
    id: 'code_fund_01',
    type: 'coding',
    topic: 'python_fundamentals',
    difficulty: 'beginner',
    points: 25,
    prompt:
      'Write a function `convert_temperature(celsius: float) -> float` that converts Celsius to Fahrenheit rounded to 2 decimal places using the formula: (celsius * 9/5) + 32.',
    starterCode: `def convert_temperature(celsius: float) -> float:
    # Your code here
    pass
`,
    functionName: 'convert_temperature',
    testCases: [
      {
        id: 'tc_fund_1',
        name: 'Freezing point of water',
        callExpr: 'convert_temperature(0.0)',
        expected: '32.0',
      },
      {
        id: 'tc_fund_2',
        name: 'Boiling point of water',
        callExpr: 'convert_temperature(100.0)',
        expected: '212.0',
      },
      {
        id: 'tc_fund_3',
        name: 'Negative temperature parity',
        callExpr: 'convert_temperature(-40.0)',
        expected: '-40.0',
      },
      {
        id: 'tc_fund_4',
        name: 'Body temperature with rounding',
        callExpr: 'convert_temperature(37.0)',
        expected: '98.6',
        isHidden: true,
      },
    ],
    explanation:
      'Calculate (celsius * 9 / 5) + 32 and return round(result, 2). -40 Celsius equals -40 Fahrenheit.',
  },
  {
    id: 'mcq_fund_04',
    type: 'mcq',
    topic: 'python_fundamentals',
    difficulty: 'intermediate',
    points: 15,
    prompt: 'What will be printed by the following f-string formatted expression?',
    codeSnippet: `name = "Craft"
score = 9.8765
print(f"{name}_{score:.2f}")`,
    options: [
      { id: 'opt_1', text: 'Craft_9.87' },
      { id: 'opt_2', text: 'Craft_9.88' },
      { id: 'opt_3', text: 'Craft_9.9' },
      { id: 'opt_4', text: 'Craft_9.8765' },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'The format specification :.2f rounds the floating-point value to two decimal places, rounding 9.8765 to 9.88. The output is "Craft_9.88".',
    verifiedByExecution: true,
  },
  {
    id: 'mcq_fund_05',
    type: 'mcq',
    topic: 'python_fundamentals',
    difficulty: 'beginner',
    points: 10,
    prompt: 'What is the output when a list reference is mutated through another variable?',
    codeSnippet: `a = [10, 20]
b = a
b.append(30)
print(len(a), a[-1])`,
    options: [
      { id: 'opt_1', text: '2 20' },
      { id: 'opt_2', text: '3 30' },
      { id: 'opt_3', text: '2 30' },
      { id: 'opt_4', text: '3 20' },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'In Python, variables bound to lists reference the same underlying list in memory. Mutating through b affects a, so len(a) is 3 and a[-1] is 30.',
    verifiedByExecution: true,
  },
  {
    id: 'code_fund_02',
    type: 'coding',
    topic: 'python_fundamentals',
    difficulty: 'beginner',
    points: 20,
    prompt:
      'Write a function `count_consonants(text: str) -> int` that returns the number of English consonant letters in the string, case-insensitively. Ignore vowels (a, e, i, o, u), digits, spaces, and punctuation.',
    starterCode: `def count_consonants(text: str) -> int:
    # Your code here
    pass
`,
    functionName: 'count_consonants',
    testCases: [
      {
        id: 'tc_fund_c1',
        name: 'Simple word',
        callExpr: 'count_consonants("Python")',
        expected: '5',
      },
      {
        id: 'tc_fund_c2',
        name: 'Phrase with spaces and vowels',
        callExpr: 'count_consonants("Hello World!")',
        expected: '7',
      },
      {
        id: 'tc_fund_c3',
        name: 'Only vowels',
        callExpr: 'count_consonants("aeiou AEIOU")',
        expected: '0',
      },
      {
        id: 'tc_fund_c4',
        name: 'Digits and symbols only',
        callExpr: 'count_consonants("12345!@#$")',
        expected: '0',
        isHidden: true,
      },
    ],
    explanation:
      'Iterate over characters in text.lower(), check char.isalpha() and char not in "aeiou", and sum matches.',
  },

  // --------------------------------------------------------------------------
  // Topic 2: Control Flow & Loops
  // --------------------------------------------------------------------------
  {
    id: 'mcq_flow_01',
    type: 'mcq',
    topic: 'control_flow',
    difficulty: 'beginner',
    points: 10,
    prompt: 'What is the output of this loop with a break statement?',
    codeSnippet: `total = 0
for i in range(1, 6):
    if i == 4:
        break
    total += i
print(total)`,
    options: [
      { id: 'opt_1', text: '6' },
      { id: 'opt_2', text: '10' },
      { id: 'opt_3', text: '15' },
      { id: 'opt_4', text: '4' },
    ],
    correctOptionId: 'opt_1',
    explanation:
      'The loop adds 1 + 2 + 3 = 6. When i becomes 4, the break executes immediately before adding 4, exiting the loop.',
    verifiedByExecution: true,
  },
  {
    id: 'mcq_flow_02',
    type: 'mcq',
    topic: 'control_flow',
    difficulty: 'intermediate',
    points: 15,
    prompt: 'What does this loop with an else clause print?',
    codeSnippet: `found = False
for num in [2, 4, 6]:
    if num % 2 != 0:
        found = True
        break
else:
    found = "All even"
print(found)`,
    options: [
      { id: 'opt_1', text: 'False' },
      { id: 'opt_2', text: 'True' },
      { id: 'opt_3', text: 'All even' },
      { id: 'opt_4', text: 'None' },
    ],
    correctOptionId: 'opt_3',
    explanation:
      'A loop else block in Python executes only if the loop completes without hitting a break statement. Since all numbers are even, the break never triggers.',
    verifiedByExecution: true,
  },
  {
    id: 'code_flow_01',
    type: 'coding',
    topic: 'control_flow',
    difficulty: 'beginner',
    points: 25,
    prompt:
      'Write a function `sum_of_evens(numbers: list[int]) -> int` that returns the sum of all positive even integers in the given list. If there are no positive even integers, return 0.',
    starterCode: `def sum_of_evens(numbers: list[int]) -> int:
    # Your code here
    pass
`,
    functionName: 'sum_of_evens',
    testCases: [
      {
        id: 'tc_flow_1',
        name: 'Mixed integers',
        callExpr: 'sum_of_evens([1, 2, 3, 4, 5, 6])',
        expected: '12',
      },
      {
        id: 'tc_flow_2',
        name: 'Negative and zero numbers',
        callExpr: 'sum_of_evens([-4, -2, 0, 2, 8])',
        expected: '10',
      },
      {
        id: 'tc_flow_3',
        name: 'Empty list',
        callExpr: 'sum_of_evens([])',
        expected: '0',
      },
      {
        id: 'tc_flow_4',
        name: 'Only odd numbers',
        callExpr: 'sum_of_evens([1, 3, 5, 7, 9])',
        expected: '0',
        isHidden: true,
      },
    ],
    explanation:
      'Iterate through the list, filter for `n > 0 and n % 2 == 0`, and accumulate the sum.',
  },
  {
    id: 'mcq_flow_03',
    type: 'mcq',
    topic: 'control_flow',
    difficulty: 'beginner',
    points: 10,
    prompt: 'What will be printed by this while loop decrement?',
    codeSnippet: `count = 5
nums = []
while count > 0:
    nums.append(count)
    count -= 2
print(nums)`,
    options: [
      { id: 'opt_1', text: '[5, 3, 1]' },
      { id: 'opt_2', text: '[5, 3, 1, -1]' },
      { id: 'opt_3', text: '[5, 4, 3, 2, 1]' },
      { id: 'opt_4', text: '[3, 1]' },
    ],
    correctOptionId: 'opt_1',
    explanation:
      'The loop appends 5, then count becomes 3; appends 3, count becomes 1; appends 1, count becomes -1. Since -1 > 0 is False, the loop terminates with [5, 3, 1].',
    verifiedByExecution: true,
  },
  {
    id: 'mcq_flow_04',
    type: 'mcq',
    topic: 'control_flow',
    difficulty: 'intermediate',
    points: 15,
    prompt: 'What is the output of the nested ternary expression below?',
    codeSnippet: `x = 10
y = 25
level = "A" if x > 15 else ("B" if y > 20 else "C")
print(level)`,
    options: [
      { id: 'opt_1', text: 'A' },
      { id: 'opt_2', text: 'B' },
      { id: 'opt_3', text: 'C' },
      { id: 'opt_4', text: 'None' },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'Since x > 15 is False (10 is not > 15), execution proceeds to the else branch: "B" if y > 20 else "C". Since y = 25 > 20 is True, it returns "B".',
    verifiedByExecution: true,
  },
  {
    id: 'code_flow_02',
    type: 'coding',
    topic: 'control_flow',
    difficulty: 'intermediate',
    points: 25,
    prompt:
      'Write a function `fizz_buzz_list(n: int) -> list[str]` that returns a list of strings representing numbers from 1 to n inclusive. For multiples of 3, use "Fizz"; for multiples of 5, use "Buzz"; for multiples of both, use "FizzBuzz"; otherwise use the string number.',
    starterCode: `def fizz_buzz_list(n: int) -> list[str]:
    # Your code here
    pass
`,
    functionName: 'fizz_buzz_list',
    testCases: [
      {
        id: 'tc_flow_fb1',
        name: 'First 5 elements',
        callExpr: 'fizz_buzz_list(5)',
        expected: "['1', '2', 'Fizz', '4', 'Buzz']",
      },
      {
        id: 'tc_flow_fb2',
        name: 'Range with both 3 and 5',
        callExpr: 'fizz_buzz_list(15)[-1]',
        expected: "'FizzBuzz'",
      },
      {
        id: 'tc_flow_fb3',
        name: 'Edge case n = 1',
        callExpr: 'fizz_buzz_list(1)',
        expected: "['1']",
      },
      {
        id: 'tc_flow_fb4',
        name: 'Zero count',
        callExpr: 'fizz_buzz_list(0)',
        expected: '[]',
        isHidden: true,
      },
    ],
    explanation:
      'Loop from 1 to n: check if i % 15 == 0 ("FizzBuzz"), elif i % 3 == 0 ("Fizz"), elif i % 5 == 0 ("Buzz"), else str(i).',
  },

  // --------------------------------------------------------------------------
  // Topic 3: Functions & Scope
  // --------------------------------------------------------------------------
  {
    id: 'mcq_func_01',
    type: 'mcq',
    topic: 'functions_scope',
    difficulty: 'beginner',
    points: 10,
    prompt: 'What happens when a Python function does not explicitly return a value?',
    options: [
      { id: 'opt_1', text: 'It raises a ReturnValueMissing error.' },
      { id: 'opt_2', text: 'It returns None.' },
      { id: 'opt_3', text: 'It returns 0.' },
      { id: 'opt_4', text: 'It returns an empty string.' },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'In Python, functions without an explicit return statement implicitly return None when execution reaches the end of the function body.',
    isConceptual: true,
  },
  {
    id: 'mcq_func_02',
    type: 'mcq',
    topic: 'functions_scope',
    difficulty: 'intermediate',
    points: 15,
    prompt: 'What is the output of this code with a default mutable argument?',
    codeSnippet: `def append_val(item, target=[]):
    target.append(item)
    return len(target)

a = append_val(1)
b = append_val(2)
print(a, b)`,
    options: [
      { id: 'opt_1', text: '1 1' },
      { id: 'opt_2', text: '1 2' },
      { id: 'opt_3', text: '2 2' },
      { id: 'opt_4', text: 'An exception is raised' },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'Default arguments in Python are evaluated once at function definition time. The list target persists across calls, so the first call returns 1 and the second returns 2.',
    verifiedByExecution: true,
  },
  {
    id: 'code_func_01',
    type: 'coding',
    topic: 'functions_scope',
    difficulty: 'intermediate',
    points: 25,
    prompt:
      'Write a function `clamp(val: float, low: float, high: float) -> float` that restricts a number to be between `low` and `high` inclusive. If `val < low`, return `low`. If `val > high`, return `high`. Otherwise, return `val`.',
    starterCode: `def clamp(val: float, low: float, high: float) -> float:
    # Your code here
    pass
`,
    functionName: 'clamp',
    testCases: [
      {
        id: 'tc_func_1',
        name: 'Value inside range',
        callExpr: 'clamp(5.0, 0.0, 10.0)',
        expected: '5.0',
      },
      {
        id: 'tc_func_2',
        name: 'Value below lower bound',
        callExpr: 'clamp(-3.0, 0.0, 10.0)',
        expected: '0.0',
      },
      {
        id: 'tc_func_3',
        name: 'Value above upper bound',
        callExpr: 'clamp(14.5, 0.0, 10.0)',
        expected: '10.0',
      },
      {
        id: 'tc_func_4',
        name: 'Value exactly on boundary',
        callExpr: 'clamp(10.0, 0.0, 10.0)',
        expected: '10.0',
        isHidden: true,
      },
    ],
    explanation:
      'Use max(low, min(val, high)) or simple conditional branches to clamp val within [low, high].',
  },
  {
    id: 'mcq_func_03',
    type: 'mcq',
    topic: 'functions_scope',
    difficulty: 'intermediate',
    points: 15,
    prompt: 'What is the output of this code demonstrating local scope assignment?',
    codeSnippet: `num = 42

def change_val():
    num = 10
    return num

res = change_val()
print(res, num)`,
    options: [
      { id: 'opt_1', text: '10 10' },
      { id: 'opt_2', text: '10 42' },
      { id: 'opt_3', text: '42 42' },
      { id: 'opt_4', text: 'UnboundLocalError' },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'Assigning to num inside change_val creates a local variable within that function scope. The outer global variable num remains 42. Output is "10 42".',
    verifiedByExecution: true,
  },
  {
    id: 'mcq_func_04',
    type: 'mcq',
    topic: 'functions_scope',
    difficulty: 'advanced',
    points: 15,
    prompt: 'What does *args receive when positional arguments are passed to a function?',
    options: [
      { id: 'opt_1', text: 'A list containing the positional arguments' },
      { id: 'opt_2', text: 'A tuple containing the positional arguments' },
      { id: 'opt_3', text: 'A dictionary mapping indices to values' },
      { id: 'opt_4', text: 'A generator yielding each argument' },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'In Python, the *args parameter collects variable positional arguments into an immutable tuple.',
    isConceptual: true,
  },
  {
    id: 'code_func_02',
    type: 'coding',
    topic: 'functions_scope',
    difficulty: 'beginner',
    points: 20,
    prompt:
      'Write a function `safe_divide(numerator: float, denominator: float) -> float` that returns numerator / denominator rounded to 2 decimal places. If denominator is 0.0, return 0.0 without raising a ZeroDivisionError.',
    starterCode: `def safe_divide(numerator: float, denominator: float) -> float:
    # Your code here
    pass
`,
    functionName: 'safe_divide',
    testCases: [
      {
        id: 'tc_func_sd1',
        name: 'Standard division',
        callExpr: 'safe_divide(10.0, 4.0)',
        expected: '2.5',
      },
      {
        id: 'tc_func_sd2',
        name: 'Zero divisor guard',
        callExpr: 'safe_divide(5.0, 0.0)',
        expected: '0.0',
      },
      {
        id: 'tc_func_sd3',
        name: 'Repeating decimal rounding',
        callExpr: 'safe_divide(10.0, 3.0)',
        expected: '3.33',
      },
      {
        id: 'tc_func_sd4',
        name: 'Negative numerator',
        callExpr: 'safe_divide(-9.0, 2.0)',
        expected: '-4.5',
        isHidden: true,
      },
    ],
    explanation:
      'Guard against zero denominator: `if denominator == 0: return 0.0` then `return round(numerator / denominator, 2)`.',
  },

  // --------------------------------------------------------------------------
  // Topic 4: Data Structures
  // --------------------------------------------------------------------------
  {
    id: 'mcq_ds_01',
    type: 'mcq',
    topic: 'data_structures',
    difficulty: 'beginner',
    points: 10,
    prompt: 'What is the output of this dictionary retrieval?',
    codeSnippet: `user = {"name": "Arib", "role": "Dev"}
print(user.get("age", 25))`,
    options: [
      { id: 'opt_1', text: 'None' },
      { id: 'opt_2', text: 'KeyError' },
      { id: 'opt_3', text: '25' },
      { id: 'opt_4', text: '{"age": 25}' },
    ],
    correctOptionId: 'opt_3',
    explanation:
      'The dict.get(key, default) method returns the provided default value (25) when the requested key is not present in the dictionary, avoiding a KeyError.',
    verifiedByExecution: true,
  },
  {
    id: 'mcq_ds_02',
    type: 'mcq',
    topic: 'data_structures',
    difficulty: 'intermediate',
    points: 15,
    prompt: 'What is the result of the following list comprehension?',
    codeSnippet: `nums = [1, 2, 3, 4, 5]
evens_squared = [x**2 for x in nums if x % 2 == 0]
print(evens_squared)`,
    options: [
      { id: 'opt_1', text: '[1, 4, 9, 16, 25]' },
      { id: 'opt_2', text: '[4, 16]' },
      { id: 'opt_3', text: '[2, 4]' },
      { id: 'opt_4', text: '[16]' },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'The comprehension filters for even numbers (2, 4) and squares each (2**2 = 4, 4**2 = 16), yielding [4, 16].',
    verifiedByExecution: true,
  },
  {
    id: 'code_ds_01',
    type: 'coding',
    topic: 'data_structures',
    difficulty: 'intermediate',
    points: 25,
    prompt:
      'Write a function `deduplicate_preserve_order(items: list[str]) -> list[str]` that returns a new list containing the unique elements of `items` in the exact order they first appeared.',
    starterCode: `def deduplicate_preserve_order(items: list[str]) -> list[str]:
    # Your code here
    pass
`,
    functionName: 'deduplicate_preserve_order',
    testCases: [
      {
        id: 'tc_ds_1',
        name: 'List with duplicates',
        callExpr: 'deduplicate_preserve_order(["apple", "banana", "apple", "orange", "banana"])',
        expected: "['apple', 'banana', 'orange']",
      },
      {
        id: 'tc_ds_2',
        name: 'Already unique items',
        callExpr: 'deduplicate_preserve_order(["a", "b", "c"])',
        expected: "['a', 'b', 'c']",
      },
      {
        id: 'tc_ds_3',
        name: 'Empty list',
        callExpr: 'deduplicate_preserve_order([])',
        expected: '[]',
      },
      {
        id: 'tc_ds_4',
        name: 'All identical elements',
        callExpr: 'deduplicate_preserve_order(["x", "x", "x"])',
        expected: "['x']",
        isHidden: true,
      },
    ],
    explanation:
      'Use a seen set along with an output list, or dict.fromkeys() in Python 3.7+, to deduplicate while preserving insertion order.',
  },
  {
    id: 'mcq_ds_03',
    type: 'mcq',
    topic: 'data_structures',
    difficulty: 'beginner',
    points: 10,
    prompt: 'What is the length of the set created from this list with duplicates?',
    codeSnippet: `items = [1, 2, 2, 3, 1, 4, 3]
s = set(items)
print(len(s))`,
    options: [
      { id: 'opt_1', text: '7' },
      { id: 'opt_2', text: '4' },
      { id: 'opt_3', text: '3' },
      { id: 'opt_4', text: '5' },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'Sets in Python store only unique elements. The unique numbers in [1, 2, 2, 3, 1, 4, 3] are {1, 2, 3, 4}, so len(s) is 4.',
    verifiedByExecution: true,
  },
  {
    id: 'mcq_ds_04',
    type: 'mcq',
    topic: 'data_structures',
    difficulty: 'intermediate',
    points: 15,
    prompt: 'What will be printed by this dictionary comprehension?',
    codeSnippet: `words = ["code", "craft", "py"]
lengths = {w: len(w) for w in words if len(w) > 3}
print(sorted(lengths.keys()))`,
    options: [
      { id: 'opt_1', text: "['code', 'craft', 'py']" },
      { id: 'opt_2', text: "['code', 'craft']" },
      { id: 'opt_3', text: "['craft']" },
      { id: 'opt_4', text: "['py']" },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'The comprehension filters for strings with len(w) > 3. "code" (len 4) and "craft" (len 5) pass; "py" (len 2) is excluded. Result sorted keys: ["code", "craft"].',
    verifiedByExecution: true,
  },
  {
    id: 'code_ds_02',
    type: 'coding',
    topic: 'data_structures',
    difficulty: 'intermediate',
    points: 25,
    prompt:
      'Write a function `word_frequency(words: list[str]) -> dict[str, int]` that counts occurrences of each word in lower case. Return a dictionary mapping lowercase word -> integer count.',
    starterCode: `def word_frequency(words: list[str]) -> dict[str, int]:
    # Your code here
    pass
`,
    functionName: 'word_frequency',
    testCases: [
      {
        id: 'tc_ds_wf1',
        name: 'List with case variations',
        callExpr: 'word_frequency(["Python", "python", "Code", "PYTHON"])',
        expected: "{'python': 3, 'code': 1}",
      },
      {
        id: 'tc_ds_wf2',
        name: 'Empty list',
        callExpr: 'word_frequency([])',
        expected: '{}',
      },
      {
        id: 'tc_ds_wf3',
        name: 'Single word list',
        callExpr: 'word_frequency(["apple"])',
        expected: "{'apple': 1}",
      },
      {
        id: 'tc_ds_wf4',
        name: 'Multiple distinct items',
        callExpr: 'word_frequency(["a", "b", "c", "b"])',
        expected: "{'a': 1, 'b': 2, 'c': 1}",
        isHidden: true,
      },
    ],
    explanation:
      'Iterate over words: convert each to word.lower() and accumulate in a dictionary via freq[w] = freq.get(w, 0) + 1.',
  },

  // --------------------------------------------------------------------------
  // Topic 5: Algorithms & Problem Solving
  // --------------------------------------------------------------------------
  {
    id: 'mcq_algo_01',
    type: 'mcq',
    topic: 'algorithms_logic',
    difficulty: 'intermediate',
    points: 15,
    prompt: 'What does this iterative function calculate for a positive integer n?',
    codeSnippet: `def compute(n):
    res = 1
    for i in range(1, n + 1):
        res *= i
    return res

print(compute(4))`,
    options: [
      { id: 'opt_1', text: '10' },
      { id: 'opt_2', text: '24' },
      { id: 'opt_3', text: '16' },
      { id: 'opt_4', text: '64' },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'The function calculates the factorial of n (n!). For n = 4, 1 * 2 * 3 * 4 = 24.',
    verifiedByExecution: true,
  },
  {
    id: 'code_algo_01',
    type: 'coding',
    topic: 'algorithms_logic',
    difficulty: 'intermediate',
    points: 25,
    prompt:
      'Write a function `is_palindrome_phrase(s: string) -> bool` that checks if a string is a palindrome, considering only alphanumeric characters and ignoring letter case. Return True if it is a palindrome, False otherwise.',
    starterCode: `def is_palindrome_phrase(s: str) -> bool:
    # Your code here
    pass
`,
    functionName: 'is_palindrome_phrase',
    testCases: [
      {
        id: 'tc_algo_1',
        name: 'Classic palindrome phrase',
        callExpr: 'is_palindrome_phrase("A man, a plan, a canal: Panama")',
        expected: 'True',
      },
      {
        id: 'tc_algo_2',
        name: 'Non-palindrome word',
        callExpr: 'is_palindrome_phrase("race a car")',
        expected: 'False',
      },
      {
        id: 'tc_algo_3',
        name: 'Empty string',
        callExpr: 'is_palindrome_phrase("")',
        expected: 'True',
      },
      {
        id: 'tc_algo_4',
        name: 'Single character with punctuation',
        callExpr: 'is_palindrome_phrase("!@# a $#@")',
        expected: 'True',
        isHidden: true,
      },
    ],
    explanation:
      'Filter characters using char.isalnum() and char.lower(), then check if cleaned == cleaned[::-1].',
  },
  {
    id: 'code_algo_02',
    type: 'coding',
    topic: 'algorithms_logic',
    difficulty: 'advanced',
    points: 30,
    prompt:
      'Write a function `two_sum(nums: list[int], target: int) -> list[int]` that finds two indices in `nums` such that their values add up to `target`. Return the indices sorted in ascending order as `[index1, index2]`. Assume exactly one solution exists.',
    starterCode: `def two_sum(nums: list[int], target: int) -> list[int]:
    # Your code here
    pass
`,
    functionName: 'two_sum',
    testCases: [
      {
        id: 'tc_algo_5',
        name: 'Basic target sum',
        callExpr: 'two_sum([2, 7, 11, 15], 9)',
        expected: '[0, 1]',
      },
      {
        id: 'tc_algo_6',
        name: 'Unordered elements',
        callExpr: 'two_sum([3, 2, 4], 6)',
        expected: '[1, 2]',
      },
      {
        id: 'tc_algo_7',
        name: 'Identical numbers',
        callExpr: 'two_sum([3, 3], 6)',
        expected: '[0, 1]',
      },
      {
        id: 'tc_algo_8',
        name: 'Negative numbers in array',
        callExpr: 'two_sum([-1, -2, -3, -4, -5], -8)',
        expected: '[2, 4]',
        isHidden: true,
      },
    ],
    explanation:
      'Use a dictionary mapping value -> index to find the complement (target - num) in O(n) time.',
  },
  {
    id: 'mcq_algo_02',
    type: 'mcq',
    topic: 'algorithms_logic',
    difficulty: 'intermediate',
    points: 15,
    prompt: 'In binary search over a 0-indexed sorted array of size 10 (indices 0 to 9), what is the first midpoint index computed via (low + high) // 2?',
    codeSnippet: `low = 0
high = 9
mid = (low + high) // 2
print(mid)`,
    options: [
      { id: 'opt_1', text: '4' },
      { id: 'opt_2', text: '5' },
      { id: 'opt_3', text: '4.5' },
      { id: 'opt_4', text: '0' },
    ],
    correctOptionId: 'opt_1',
    explanation:
      '(0 + 9) // 2 evaluates to 9 // 2 = 4 using integer floor division.',
    verifiedByExecution: true,
  },
  {
    id: 'mcq_algo_03',
    type: 'mcq',
    topic: 'algorithms_logic',
    difficulty: 'advanced',
    points: 15,
    prompt: 'What will happen if a recursive function lacks a correct base case condition?',
    options: [
      { id: 'opt_1', text: 'It returns None after 10 iterations' },
      { id: 'opt_2', text: 'It raises RecursionError: maximum recursion depth exceeded' },
      { id: 'opt_3', text: 'It automatically converts into an iterative while loop' },
      { id: 'opt_4', text: 'The program restarts from main()' },
    ],
    correctOptionId: 'opt_2',
    explanation:
      'Without a terminating base case, the function continues calling itself until Python reaches its call stack limit, raising a RecursionError.',
    isConceptual: true,
  },
  {
    id: 'code_algo_03',
    type: 'coding',
    topic: 'algorithms_logic',
    difficulty: 'intermediate',
    points: 25,
    prompt:
      'Write a function `find_second_largest(nums: list[int]) -> int | None` that returns the second largest distinct integer in `nums`. If there are fewer than 2 distinct integers in `nums`, return None.',
    starterCode: `def find_second_largest(nums: list[int]):
    # Your code here
    pass
`,
    functionName: 'find_second_largest',
    testCases: [
      {
        id: 'tc_algo_sl1',
        name: 'Distinct positive integers',
        callExpr: 'find_second_largest([10, 5, 20, 8, 12])',
        expected: '12',
      },
      {
        id: 'tc_algo_sl2',
        name: 'List with duplicates of the maximum',
        callExpr: 'find_second_largest([20, 20, 15, 10])',
        expected: '15',
      },
      {
        id: 'tc_algo_sl3',
        name: 'All elements identical',
        callExpr: 'find_second_largest([7, 7, 7])',
        expected: 'None',
      },
      {
        id: 'tc_algo_sl4',
        name: 'Single element list',
        callExpr: 'find_second_largest([42])',
        expected: 'None',
        isHidden: true,
      },
    ],
    explanation:
      'Convert nums to unique set: `unique = sorted(set(nums))`. If `len(unique) < 2: return None`. Return `unique[-2]`.',
  },
]

export function getCuratedQuestions(
  topic?: AssessmentTopic,
  difficulty?: AssessmentDifficulty
): AssessmentQuestion[] {
  return CURATED_QUESTIONS.filter((q) => {
    if (topic && q.topic !== topic) return false
    if (difficulty && q.difficulty !== difficulty) return false
    return true
  })
}
