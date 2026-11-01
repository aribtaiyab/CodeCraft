// ============================================================================
// CodeCraft — CodeRefine Curated Educational Python Examples
// ============================================================================

import type { RefineCuratedExample, RefineGoalOption } from './types'

export const REFINE_GOALS: RefineGoalOption[] = [
  {
    id: 'readability',
    label: 'Improve readability',
    shortLabel: 'Readability',
    description: 'Make code cleaner, more idiomatic, and easier to follow at a glance.',
    iconName: 'BookOpen',
  },
  {
    id: 'dry',
    label: 'Remove repeated code',
    shortLabel: 'Remove Duplication',
    description: 'Consolidate duplicate logic into reusable functions or parameters (DRY).',
    iconName: 'Copy',
  },
  {
    id: 'structure',
    label: 'Improve function structure',
    shortLabel: 'Function Structure',
    description: 'Separate mixed responsibilities into focused, single-purpose functions.',
    iconName: 'Layers',
  },
  {
    id: 'naming',
    label: 'Improve variable naming',
    shortLabel: 'Variable Naming',
    description: 'Replace cryptic abbreviations with descriptive, intention-revealing names.',
    iconName: 'Type',
  },
  {
    id: 'simplify',
    label: 'Simplify complicated logic',
    shortLabel: 'Simplify Logic',
    description: 'Flatten deep nested if/else ladders and use clean guard clauses.',
    iconName: 'Sparkles',
  },
  {
    id: 'custom',
    label: 'Custom improvement request',
    shortLabel: 'Custom Goal',
    description: 'Specify an exact improvement or pattern you would like to explore.',
    iconName: 'Wand2',
  },
]

export const CURATED_REFINE_EXAMPLES: RefineCuratedExample[] = [
  {
    id: 'example-readability',
    goal: 'readability',
    suggestedGoal: 'readability',
    title: 'Word Formatter (Manual Loop to Idiomatic Python)',
    description: 'A manual string concatenation loop that can be written with cleaner Python idioms.',
    originalCode: `def format_tags(tags):
    # Format a list of tag strings with commas
    result = ""
    i = 0
    while i < len(tags):
        tag = tags[i]
        if i == len(tags) - 1:
            result = result + "#" + tag.strip()
        else:
            result = result + "#" + tag.strip() + ", "
        i = i + 1
    return result

sample_tags = ["python", "education", "coding  ", "beginner"]
print("Formatted:", format_tags(sample_tags))
`,
  },
  {
    id: 'example-dry',
    goal: 'dry',
    suggestedGoal: 'dry',
    title: 'User Tier Discount (Repeated Validation & Math)',
    description: 'Identical discount calculations and range checks duplicated in three branches.',
    originalCode: `def calculate_invoice(tier, amount):
    if tier == "bronze":
        if amount > 100:
            discount = amount * 0.05
            final_price = amount - discount
            print(f"Applied 5% discount: saved \${discount:.2f}")
            return final_price
        else:
            print("No discount applicable")
            return amount
    elif tier == "silver":
        if amount > 100:
            discount = amount * 0.10
            final_price = amount - discount
            print(f"Applied 10% discount: saved \${discount:.2f}")
            return final_price
        else:
            print("No discount applicable")
            return amount
    elif tier == "gold":
        if amount > 100:
            discount = amount * 0.20
            final_price = amount - discount
            print(f"Applied 20% discount: saved \${discount:.2f}")
            return final_price
        else:
            print("No discount applicable")
            return amount
    return amount

print("Silver $250 total:", calculate_invoice("silver", 250))
print("Gold $50 total:", calculate_invoice("gold", 50))
`,
  },
  {
    id: 'example-structure',
    goal: 'structure',
    suggestedGoal: 'structure',
    title: 'Student Grade Processor (Monolith to Single Responsibility)',
    description: 'One 30-line function doing parsing, computing averages, ranking, and report output.',
    originalCode: `def process_student_grades(raw_records):
    # Monolithic function doing parsing, calculating, and printing
    cleaned_students = []
    for record in raw_records:
        parts = record.split(":")
        name = parts[0].strip()
        scores = [int(s.strip()) for s in parts[1].split(",")]
        avg_score = sum(scores) / len(scores)
        if avg_score >= 90:
            letter = "A"
        elif avg_score >= 80:
            letter = "B"
        elif avg_score >= 70:
            letter = "C"
        else:
            letter = "F"
        cleaned_students.append((name, round(avg_score, 1), letter))

    # Print summary report directly
    print("--- GRADE REPORT ---")
    for s in cleaned_students:
        print(f"Student: {s[0]} | Average: {s[1]} | Grade: {s[2]}")
    return cleaned_students

records = ["Alice: 92, 88, 95", "Bob: 74, 80, 68", "Charlie: 85, 87, 90"]
process_student_grades(records)
`,
  },
  {
    id: 'example-naming',
    goal: 'naming',
    suggestedGoal: 'naming',
    title: 'Order Checkout (Cryptic Variables to Descriptive Names)',
    description: 'Variables named a, b, c, d, flag1, tmp hiding the business purpose of the code.',
    originalCode: `def proc_order(a, b, c):
    # a: cart items, b: discount code rate, c: express shipping flag
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
    id: 'example-simplify',
    goal: 'simplify',
    suggestedGoal: 'simplify',
    title: 'Access Control (Deep Nested Ifs to Clean Guard Clauses)',
    description: 'Deeply nested 4-layer condition ladder with redundant comparisons.',
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
]

