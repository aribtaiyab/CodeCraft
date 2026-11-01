// ============================================================================
// CodeCraft — CodeRefine Curated Educational Python Examples
// ============================================================================

import type { RefineCuratedExample, RefineGoalOption } from './types'

export const REFINE_GOALS: RefineGoalOption[] = [
  {
    id: 'performance',
    label: 'Performance Optimization',
    shortLabel: 'Performance Optimization',
    description:
      'Make the code more efficient by identifying unnecessary computations and improving algorithmic efficiency where meaningful.',
    iconName: 'Zap',
  },
  {
    id: 'easy_to_understand',
    label: 'Easy to Understand',
    shortLabel: 'Easy to Understand',
    description:
      'Make code cleaner, simpler and easier for beginners to understand.',
    iconName: 'Sparkles',
  },
  {
    id: 'shortest_code',
    label: 'Shortest Code',
    shortLabel: 'Shortest Code',
    description:
      'Simplify your code and find a shorter way to achieve the same result.',
    iconName: 'Minimize2',
  },
]

export const CURATED_REFINE_EXAMPLES: RefineCuratedExample[] = [
  {
    id: 'example-perf-duplicates',
    goal: 'performance',
    suggestedGoal: 'performance',
    title: 'Common Elements Filter (Performance Optimization)',
    description: 'Nested linear search with O(N²) overhead improved to O(1) set lookups.',
    originalCode: `def find_common_items(list_a, list_b):
    # Inefficient membership check in nested loop
    common = []
    for item in list_a:
        if item in list_b:
            if item not in common:
                common.append(item)
    return common

sample_a = [1, 2, 3, 4, 5, 2, 4]
sample_b = [3, 4, 5, 6, 7]
print("Common:", find_common_items(sample_a, sample_b))
`,
  },
  {
    id: 'example-perf-string',
    goal: 'performance',
    suggestedGoal: 'performance',
    title: 'Log Processor (Performance Optimization)',
    description: 'Repeated immutable string allocations in loop that can use list join or comprehension.',
    originalCode: `def build_report(entries):
    # Repeated string concatenation creates new string objects in memory
    output = ""
    for entry in entries:
        if entry["status"] == "SUCCESS":
            output = output + "[" + entry["id"] + "] " + entry["msg"].strip() + "\\n"
    return output

logs = [
    {"id": "L1", "status": "SUCCESS", "msg": "Database synced"},
    {"id": "L2", "status": "FAILED", "msg": "Timeout connecting"},
    {"id": "L3", "status": "SUCCESS", "msg": "Worker finished"}
]
print(build_report(logs))
`,
  },
  {
    id: 'example-easy-checkout',
    goal: 'easy_to_understand',
    suggestedGoal: 'easy_to_understand',
    title: 'Order Checkout (Easy to Understand)',
    description: 'Cryptic variables (a, b, c, d) and flags refactored into self-documenting code.',
    originalCode: `def proc_order(a, b, c):
    # a: items, b: discount, c: express flag
    d = 0
    for x in a:
        d = d + (x["qty"] * x["price"])

    tmp = d * b
    res = d - tmp

    flag1 = False
    if c == True:
        res = res + 15.0
        flag1 = True

    return {"sub": d, "disc": tmp, "tot": res, "exp": flag1}

items = [{"qty": 2, "price": 25.0}, {"qty": 1, "price": 40.0}]
result = proc_order(items, 0.10, True)
print("Order summary:", result)
`,
  },
  {
    id: 'example-easy-access',
    goal: 'easy_to_understand',
    suggestedGoal: 'easy_to_understand',
    title: 'Access Control (Easy to Understand)',
    description: 'Deep 4-layer nested if/else ladder simplified with clean guard clauses.',
    originalCode: `def check_user_access(user):
    # Deeply nested conditional pyramid
    if user is not None:
        if "is_active" in user and user["is_active"] == True:
            if "role" in user:
                if user["role"] == "admin" or user["role"] == "moderator":
                    if "subscription_valid" in user and user["subscription_valid"] == True:
                        return "Access Granted: High Clearance"
                    else:
                        return "Access Denied: Expired Subscription"
                else:
                    return "Access Denied: Insufficient Role"
            else:
                return "Access Denied: Missing Role"
        else:
            return "Access Denied: Inactive Account"
    else:
        return "Access Denied: Invalid User Object"

user_a = {"is_active": True, "role": "admin", "subscription_valid": True}
user_b = {"is_active": False, "role": "admin", "subscription_valid": True}
print("User A:", check_user_access(user_a))
print("User B:", check_user_access(user_b))
`,
  },
  {
    id: 'example-shortest-evens',
    goal: 'shortest_code',
    suggestedGoal: 'shortest_code',
    title: 'Even Squares Total (Shortest Code)',
    description: 'Verbose multi-line loop accumulator simplified with a concise Python expression.',
    originalCode: `def sum_even_squares(numbers):
    # Verbose intermediate variables and manual loop accumulation
    total = 0
    for n in numbers:
        if n % 2 == 0:
            square = n * n
            total = total + square
    return total

sample_nums = [1, 2, 3, 4, 5, 6, 7, 8]
print("Sum of even squares:", sum_even_squares(sample_nums))
`,
  },
]
