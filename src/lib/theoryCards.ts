export interface TheoryCard {
  // Legacy fields kept for backward compatibility
  title: string;
  type: "concept" | "example" | "trap" | "desmos";
  content: string;
}

export interface ExpertTheory {
  concept: string;     // Brief explanation
  strategy: string;    // How to beat this question type
  example: string;     // Sample question + step-by-step
  proTip: string;      // 1500+ scorer secret
  desmosShortcut?: string; // Math-only Desmos shortcut
}

// New expert-tier theory keyed by topic id
export const EXPERT_THEORY: Record<string, ExpertTheory> = {
  "linear-equations": {
    concept: "**Heart of Algebra — Linear Equations & Inequalities** (full Digital SAT blueprint).\n\n**One variable**: ax + b = c. Isolate x by reversing operations. Inequalities follow the same rules **except**: flip the sign when you multiply or divide by a negative.\n\n**Two variables — three forms**:\n- **Slope-intercept**: y = mx + b → m = slope, b = y-intercept\n- **Standard**: Ax + By = C → x-intercept = C/A, y-intercept = C/B\n- **Point-slope**: y − y₁ = m(x − x₁)\n- **Slope**: m = (y₂ − y₁) / (x₂ − x₁)\n\n**Line relationships**:\n- **Parallel** → m₁ = m₂ (different b)\n- **Perpendicular** → m₁ · m₂ = −1 (negative reciprocals)\n- **Coinciding** → same m and same b\n\n**Linear inequalities** describe a half-plane. Dashed boundary for `<` / `>`, solid for `≤` / `≥`. Shade above for `y >`, below for `y <`.\n\n**Interpreting constants in context**: in C = 0.15m + 25, the 25 is a fixed/start-up cost (y-intercept) and 0.15 is the per-unit/marginal cost (slope).",
    strategy: "Isolate variable by reversing operations; translate word problems carefully ('is' → =, 'of' → ×, 'more than' → +, 'per' → rate slope). For parallel/perpendicular, extract the slope FIRST and ignore intercepts until the end. For inequalities, test (0, 0) to decide which side to shade. For 'interpret the meaning of constant' questions, attach units to every number — the slope is always 'units of y per 1 unit of x.'",
    example: "Find the line through (2, −1) parallel to y = 3x + 7.\n1) Parallel ⇒ m = 3\n2) y − (−1) = 3(x − 2) → y = 3x − 7 ✓\n\nInequality: solve −2x + 5 > 11. Subtract 5: −2x > 6. Divide by −2 (flip!): x < −3.",
    proTip: "**No-solution / infinite-solutions in ONE variable**: if simplifying both sides gives 0 = (nonzero), no solution. If it gives 0 = 0, infinitely many. **Perpendicular trap**: vertical (x = c) and horizontal (y = c) lines are perpendicular even though the slope product isn't −1 (one slope is undefined).",
    desmosShortcut: "### 🎒 DESMOS SHORTCUT\n\n- **When to use**: Any linear-equation, slope, parallel/perpendicular, intercept, or inequality-shading question.\n- **What to type**:\n  1. Type the equation directly: `y = mx + b`\n  2. Second line on a new row: `y = m₂x + b₂`\n  3. Inequalities: type `y > mx + b` — Desmos auto-shades\n  4. Replace any unknown with `k` to spawn a slider\n- **What to look for**:\n  - **Slope** → click two points; read Δy/Δx\n  - **Intercepts** → click where the line crosses each axis\n  - **Parallel** → identical slope, lines never touch\n  - **Perpendicular** → slopes multiply to −1, meet at right angle\n  - **Solution set** → the shaded region\n- **Pro move**: Drag the `k` slider until the geometry matches (parallel, passes through a point). Done in under 15 seconds.",
  },
  "systems-of-equations": {
    concept: "**Systems of Two Linear Equations** — two equations, two unknowns.\n\n**Methods**:\n- **Substitution**: isolate one variable, plug into the other\n- **Elimination**: add/subtract scaled equations to cancel a variable\n- **Graphing**: solution = intersection point\n\n**Solution count (the trichotomy)**:\n- **Exactly 1** → different slopes → lines cross once\n- **0 (no solution)** → same slope, different intercepts → parallel lines\n- **Infinitely many** → same slope AND same intercept → one equation is a scalar multiple of the other\n\n**Word problems**: define variables with units, write one equation for totals (count) and one for value (cost, weight, etc.).",
    strategy: "Use elimination when coefficients align; substitution when a variable is already isolated. For 'how many solutions / find k' problems, rewrite both lines in y = mx + b and compare m's and b's side-by-side — don't solve. Always label units on both variables in word problems.",
    example: "Find k so that 3x + ky = 6 and 6x + 4y = 5 has NO solution.\nParallel ⇒ ratio of x and y coefficients equal but constants differ: 3/6 = k/4 → k = 2. Check 6/5 ≠ 3/2.5 ✓.\n\nWord: 12 coins (nickels + dimes) total $0.95. n + d = 12, 0.05n + 0.10d = 0.95 → d = 7, n = 5.",
    proTip: "Memorize the trichotomy: same m + same b = ∞; same m + different b = 0; different m = 1. For 'infinitely many solutions,' the entire second equation must be a multiple of the first — set up a single ratio across ALL three terms (Ax, By, C).",
    desmosShortcut: "### 🎒 DESMOS SHORTCUT\n\n- **When to use**: Any 2-equation system — including 'how many solutions' and 'find k.'\n- **What to type**:\n  1. Line 1: type the first equation\n  2. Line 2: type the second equation\n  3. Replace any unknown with `k` and add a slider\n- **What to look for**:\n  - **One dot** → 1 solution; click to read (x, y)\n  - **Parallel** → 0 solutions\n  - **Same line** → infinitely many\n- **Pro move**: For 'find k for no solution,' drag the `k` slider until lines look parallel — that value IS the answer. Zero algebra, under 15 seconds.",
  },
  "quadratics": {
    concept: "**Advanced Math — Quadratics, Polynomials, Exponentials, Radicals & Rationals** (full Advanced Math blueprint).\n\n### Quadratics — ax² + bx + c = 0\nThree forms:\n- **Standard**: y = ax² + bx + c\n- **Vertex**: y = a(x − h)² + k → vertex (h, k); MAX if a < 0, MIN if a > 0\n- **Factored**: y = a(x − r₁)(x − r₂) → roots r₁, r₂\n\n**Vertex shortcut**: x = −b/(2a). **Quadratic formula**: x = (−b ± √(b² − 4ac)) / (2a).\n\n**Discriminant** Δ = b² − 4ac:\n- Δ > 0 → 2 real roots\n- Δ = 0 → 1 (double) root, parabola tangent to x-axis\n- Δ < 0 → 0 real roots\n\n**Sum/product of roots**: r₁ + r₂ = −b/a, r₁ · r₂ = c/a.\n\n### Exponential Growth & Decay — y = a · b^x\n- a = starting value (y-intercept)\n- b > 1 → growth; 0 < b < 1 → decay\n- Doubling: y = a · 2^(t/T_double). Half-life: y = a · (1/2)^(t/T_half)\n- Percent change form: y = a · (1 + r)^t (r = +growth or −decay rate)\n- Compound interest: A = P(1 + r/n)^(nt)\n\n### Polynomials\n- **Remainder Theorem**: P(x) divided by (x − c) leaves remainder P(c)\n- **Factor Theorem**: (x − c) is a factor ⇔ P(c) = 0\n- Cubic/quartic graphs: end-behavior set by leading term; #real roots ≤ degree\n- Polynomial × line intersections solved by setting expressions equal\n\n### Radical & Rational Equations\n- Square both sides to clear roots — **always plug answers back** to detect extraneous solutions\n- Rational equations: multiply by LCD; check that no solution makes a denominator 0 (those are extraneous)",
    strategy: "Try factoring first (fastest). If ugly, use the quadratic formula. For 'how many solutions,' compute Δ — don't solve. For max/min, use x = −b/(2a) then plug back. For exponentials, identify (a, b) and the time unit. For radicals/rationals, isolate, square or clear denominator, then verify every answer.",
    example: "Maximum of y = −2x² + 8x + 1: a = −2, x_v = −8/−4 = 2, y_v = −8 + 16 + 1 = 9.\n\nFind c so x² + 6x + c = 0 has exactly one solution: Δ = 36 − 4c = 0 → c = 9.\n\nRadical trap: √(x + 6) = x. Square: x + 6 = x². Solve x² − x − 6 = 0 → x = 3 or x = −2. Check: x = 3 ✓ (√9 = 3); x = −2 ✗ (√4 = 2 ≠ −2). Only x = 3.",
    proTip: "**Discriminant questions are 'set Δ = …' questions** — never actually solve. **Vieta's**: for x² + bx + c, sum of roots = −b, product = c — solves many 'find b and c given roots' problems in one line. **Exponential traps**: 'decreases by 8% per year' → multiply by 0.92, NOT 1.08.",
    desmosShortcut: "### 🎒 DESMOS SHORTCUT\n\n- **When to use**: Any quadratic, polynomial, exponential, radical, or rational — roots, vertex, max/min, intersections, or 'find k.'\n- **What to type**:\n  1. `y = ax^2 + bx + c` (use `^` for exponent)\n  2. Exponential: `y = a · b^x`\n  3. Polynomials: `y = x^3 − 4x` (any degree)\n  4. Radical: `y = sqrt(x + 6)` and `y = x` — intersection = solution (auto-skips extraneous)\n  5. Rational: type the equation directly; Desmos shows holes/asymptotes\n  6. Replace unknown with `k` for a slider\n- **What to look for**:\n  - **Roots / zeros** → click each x-intercept → labeled (r, 0)\n  - **Vertex** → click turning point → (h, k)\n  - **Max / min** → y-coordinate of vertex\n  - **#solutions** → count x-axis crossings (2, 1, 0)\n  - **Intersections** → click where any two curves cross\n- **Pro move**: 'Find k so parabola is tangent to x-axis' → drag `k` slider until curve JUST kisses the axis (Δ = 0). Under 15 seconds.",
  },
  "ratios-rates": {
    concept: "**Problem Solving & Data Analysis — Ratios, Rates, Proportions & Units**.\n\n- **Ratio** a:b compares same-unit quantities. **Rate** has different units (mph, $/lb).\n- **Proportion**: a/b = c/d ⇒ cross-multiply ad = bc.\n- **Unit conversion**: multiply by 1 in the form (desired unit / equivalent old unit). Chain conversions to cancel units.\n- **Speed/Density**: distance = rate × time; density = mass / volume.\n- **Scale**: if every length scales by k, area scales by k² and volume by k³.\n- **Combined work**: add RATES, never times. Worker A finishes in 4 h, B in 6 h → combined rate = 1/4 + 1/6 = 5/12 per hour → together 12/5 = 2.4 h.\n- **Percent scaling**: a 'doubled' rate means ×2; a '50% increase' means ×1.5.",
    strategy: "Label units on every number. Convert FIRST, compute second. Set up the proportion with the unknown on top of one fraction. For combined rates, switch to per-unit-time form. For mixture problems, build a table: amount × concentration = pure substance.",
    example: "3 workers build 12 chairs in 4 h → 1 chair per worker-hour. 5 workers × 6 h = 30 chairs.\n\nUnit chain: 60 mi/h × (1 h / 3600 s) × (5280 ft / 1 mi) = 88 ft/s.",
    proTip: "Always write units beside numbers. The #1 SAT trap is mixing minutes/hours or feet/inches. **Scale trap**: doubling every linear dimension multiplies area by 4 and volume by 8, not 2.",
    desmosShortcut: "### 🎒 DESMOS SHORTCUT\n\n- **When to use**: Proportions, unit conversions, mixture and combined-rate problems.\n- **What to type**:\n  1. Type the proportion directly, e.g. `12/4 = x/6` — Desmos solves for x\n  2. Or set y₁ = (a/b)·x and y₂ = c → click intersection\n  3. For unit conversion, just type the chain: `60 * (5280/3600)`\n- **Pro move**: For 'how long together?' type `1/4 + 1/6 = 1/t` and let Desmos solve.",
  },
  "percentages": {
    concept: "**Percentages & Percent Change**.\n\n- Percent = Part / Whole × 100. 'Of' = ×, so 30% of 200 = 0.30 × 200 = 60.\n- **% increase**: multiply by (1 + r). **% decrease**: multiply by (1 − r).\n- **Successive percent changes MULTIPLY, never add**.\n- **Reverse percent**: if the final is F after a discount of d%, original = F / (1 − d).\n- **Percent change formula**: (New − Old) / Old × 100.\n- **Compound growth/decay**: y = a · (1 + r)^t.",
    strategy: "Convert percents to decimals before computing. For successive changes, chain multiplications. For reverse problems, divide by the multiplier instead of subtracting. For 'what percent of A is B,' write B/A × 100.",
    example: "Price rises 20%, then falls 20%. Final = 100 × 1.20 × 0.80 = 96. Net change = −4%, NOT 0%.\n\nReverse: shirt costs $60 after 25% off. Original = 60 / 0.75 = $80.",
    proTip: "**Successive % trap**: −20% then +20% does NOT recover the original — you lose 4%. **Percent of percent**: 'B is what percent of A' ≠ 'A is what percent of B' — order matters.",
    desmosShortcut: "### 🎒 DESMOS SHORTCUT\n\n- **What to type**:\n  1. Compound growth: `y = P · (1 + r)^x` with sliders on P and r\n  2. Reverse percent: `Final / (1 − discount)` — read the cell\n  3. Successive: `Original * (1 + r₁) * (1 + r₂)`\n- **Pro move**: Slide r to match the given final value for parameter questions.",
  },
  "geometry": {
    concept: "**Geometry & Trigonometry** (full Digital SAT blueprint — reference sheet is free points).\n\n### Area & Volume (reference sheet)\n- Triangle: A = ½bh\n- Rectangle: A = bh\n- Circle: A = πr², C = 2πr\n- Rectangular prism: V = ℓwh\n- Cylinder: V = πr²h\n- Cone: V = ⅓πr²h\n- Sphere: V = (4/3)πr³\n- Pyramid: V = ⅓(base area)(h)\n\n### Lines, Angles & Triangles\n- Angles on a straight line sum to 180°; in a triangle, 180°.\n- **Pythagorean**: a² + b² = c²\n- **Special right triangles**: 45°-45°-90° → sides 1 : 1 : √2; 30°-60°-90° → sides 1 : √3 : 2\n- **Similar triangles**: equal angles, sides in proportion; ratios of areas = (side ratio)²\n- **Congruent**: SSS, SAS, ASA, AAS\n\n### Circles\n- Standard equation: **(x − h)² + (y − k)² = r²** → center (h, k), radius r\n- Convert from x² + y² + Dx + Ey + F = 0 by completing the square in x and y\n- **Arc length** (θ in radians) = rθ; **Sector area** = ½r²θ\n- Degrees ↔ radians: ×π/180 and ×180/π\n- Inscribed angle = ½ central angle on the same arc\n\n### Right-Triangle Trigonometry\n- **SOH CAH TOA**: sin = opp/hyp, cos = adj/hyp, tan = opp/adj\n- **Co-function identity**: sin(x°) = cos(90° − x°), cos(x°) = sin(90° − x°)\n- Pythagorean identity (informational): sin²θ + cos²θ = 1",
    strategy: "Sketch the figure if not provided. Label every length and angle. Use the reference sheet — don't memorize formulas it gives you. Convert degrees ↔ radians before plugging into arc length or sector area. For circles given in expanded form, complete the square BOTH variables to find (h, k, r). For trig word problems, draw a right triangle and label opposite/adjacent/hypotenuse relative to the named angle.",
    example: "Circle of radius 6, arc subtends 60° at the center. Arc = r·θ = 6·(π/3) = 2π.\n\nCircle in expanded form: x² + y² − 6x + 4y − 12 = 0. Complete: (x − 3)² + (y + 2)² = 25 → center (3, −2), r = 5.\n\nRight triangle: hyp = 13, opp = 5 → sin θ = 5/13, cos θ = 12/13.",
    proTip: "**Co-function trap**: sin(20°) = cos(70°). Many SAT questions just ask you to recognize this. **Tangent length**: a tangent line is perpendicular to the radius at the point of tangency. **45-45-90 / 30-60-90** appear constantly — memorize the side ratios so you don't waste time computing.",
    desmosShortcut: "### 🎒 DESMOS SHORTCUT\n\n- **When to use**: Any coordinate-geometry, circle, or trig problem.\n- **What to type**:\n  1. Circle: type `(x − h)^2 + (y − k)^2 = r^2` — Desmos draws it instantly. Click center and any point on the rim.\n  2. Expanded form: type the whole equation as given; Desmos draws the circle so you can READ (h, k) and r off the graph.\n  3. Trig: switch to **Degree mode** (wrench icon → Degrees). Type `sin(30)`, `cos(60)`, `tan(45)` — read decimal values directly.\n  4. Distance: type `sqrt((x₂ − x₁)^2 + (y₂ − y₁)^2)` with your numbers.\n  5. Verify a point on a circle: type the point `(a, b)` — if the dot lies on the curve, it satisfies the equation.\n- **Pro move**: For 'find the radius from this equation,' just plot it — radius is half the visible diameter. Under 15 seconds.",
  },
  "statistics": {
    concept: "**Problem Solving & Data Analysis — Statistics, Scatterplots, Probability, Surveys**.\n\n### One-Variable Data\n- **Mean** = sum / count. Sensitive to outliers.\n- **Median** = middle value after sorting. Resistant to outliers.\n- **Mode** = most frequent.\n- **Range** = max − min.\n- **Standard deviation** = spread around the mean (no formula needed — only compare which dataset is more spread).\n- Read **dot plots, histograms, box plots**: median is the middle bar; mean is pulled toward long tail.\n\n### Two-Variable Data & Scatterplots\n- **Line of best fit**: y = mx + b minimizes total residual.\n- **Positive / negative / no association**.\n- **Linear vs exponential**: linear adds the same amount per step; exponential multiplies by the same factor per step.\n- A point ABOVE the line ⇒ actual > predicted (positive residual).\n\n### Probability & Two-Way Tables\n- P(A) = favorable / total.\n- **Conditional**: P(A | B) = (A and B) / (B). Restrict the denominator to the 'given' row or column.\n- Independent events: P(A and B) = P(A) · P(B).\n\n### Sample Surveys & Experiments\n- **Random sampling** → results generalize to the whole population.\n- **Random assignment** → can claim CAUSE.\n- **Margin of error** shrinks as sample size grows (∝ 1/√n).\n- 'Increase confidence / shrink MoE' → almost always answer: 'increase sample size.'",
    strategy: "For 'effect of adding/removing a value' questions, check the MEDIAN first (often unchanged), then mean. For scatter plots, identify trend + outliers visually. For two-way tables, circle the 'given' row/column FIRST, then read the favorable cell. For survey questions, separate sampling (generalizability) from assignment (causation).",
    example: "Data: 3, 7, 7, 9, 14. Median = 7, Mean = 8. Add 100 → median = 8, mean ≈ 23.3.\n\nTwo-way table — given 60 students are seniors and 18 of them take Spanish, P(Spanish | senior) = 18/60 = 0.30.",
    proTip: "**MoE shrinks like 1/√n** — quadrupling the sample halves the MoE. **Causation requires random assignment** (an experiment), not just random sampling (a survey). **SD vs range**: a dataset with values clumped near the mean has small SD even if range is large.",
    desmosShortcut: "### 🎒 DESMOS SHORTCUT\n\n- **When to use**: Statistics, regression, or any data list.\n- **What to type**:\n  1. Create a list: `L = [3, 7, 7, 9, 14]`\n  2. Then on new lines: `mean(L)`, `median(L)`, `stdev(L)`, `total(L)`, `min(L)`, `max(L)` — instant values\n  3. For scatterplots, open a **table** and paste paired (x, y) data\n  4. For line of best fit, type `y₁ ~ a · x₁ + b` — Desmos reports a and b (and R²)\n  5. For exponential fit, type `y₁ ~ a · b^(x₁)`\n- **Pro move**: For 'which value of x makes the mean equal to M,' add an unknown into the list (e.g. `L = [3, 7, 7, 9, k]`) and slide `k` until `mean(L) = M`.",
  },
  "advanced-math": {
    concept: "**Advanced Math — Functions, Composition, Nonlinear Systems, and Modeling**.\n\n- **Function notation**: f(x) means 'output when input is x.' f(3) replaces every x with 3.\n- **Composition**: f(g(x)) — apply g first, then f. Generally f(g(x)) ≠ g(f(x)).\n- **Transformations**: f(x) + k shifts UP k; f(x + k) shifts LEFT k; −f(x) reflects over x-axis; f(−x) reflects over y-axis; a·f(x) stretches vertically.\n- **Nonlinear systems**: line + parabola intersect by setting expressions equal → quadratic. Discriminant tells how many intersections.\n- **Exponential modeling**: y = a · b^x. Identify a (start), b (per-step factor). 'Decreases by 8% per year' → b = 0.92.\n- **Inverse functions**: swap x and y, solve for y.\n- **Domain & range from a graph**: domain = x-values covered; range = y-values covered.",
    strategy: "Work composition INSIDE-OUT. For transformation questions, remember 'inside the parentheses' shifts go OPPOSITE (left/right is reversed). For nonlinear systems, substitute the line into the curve to get a single-variable equation. For exponential word problems, convert percent change into the (1 ± r) factor before writing the model.",
    example: "f(x) = x², g(x) = x + 3. f(g(2)) = f(5) = 25. g(f(2)) = g(4) = 7.\n\nIntersection: y = x + 1 and y = x² − 3. Set equal: x² − x − 4 = 0 → x = (1 ± √17)/2.\n\nExponential: population doubles every 5 years from 1200 → P(t) = 1200 · 2^(t/5).",
    proTip: "**Decrease by 8%/yr** → multiplier is 0.92, not 0.08. **'Half-life of 7 yrs'** → P(t) = P₀ · (1/2)^(t/7). **Function from table**: check if differences (linear) or ratios (exponential) are constant.",
    desmosShortcut: "### 🎒 DESMOS SHORTCUT\n\n- **When to use**: Function evaluation, composition, transformations, intersections, exponential models.\n- **What to type**:\n  1. Define: `f(x) = x^2`, `g(x) = x + 3`\n  2. Evaluate: `f(g(2))` — Desmos prints the value\n  3. Graph both, then click intersection points\n  4. Exponential: `y = a · b^x` with sliders on a, b\n  5. For 'find k so curves intersect exactly once,' replace constant with `k` slider; slide until tangent\n- **Pro move**: Use Desmos's intersection click feature for ANY nonlinear-system question — never solve by hand.",
  },
  "central-ideas": {
    concept: "The central idea is the author's overall point — broader than any single detail. Look at the first sentence, transitions, and conclusion to triangulate it.",
    strategy: "After reading, summarize the passage in your own 10-word sentence BEFORE looking at choices. Then match your summary to an answer.",
    example: "Passage about how a scientist proved corals adapt to warming. Central idea = 'corals show unexpected adaptive capacity' (broad). Wrong: 'the scientist used genetic sequencing' (detail).",
    proTip: "Beware the Extreme Word Trap — choices with 'always,' 'never,' 'only' are usually wrong. The correct answer is almost always moderate in tone.",
  },
  "command-of-evidence": {
    concept: "You're given a claim and must pick the textual quote OR the data point that BEST supports it. Specificity wins.",
    strategy: "Restate the claim in your own words. For each choice, ask 'does this DIRECTLY prove the claim, or just relate to the topic?' For quantitative evidence, the right answer matches BOTH the variable and the direction stated.",
    example: "Claim: 'Method A is more efficient than Method B for samples >50.'\nCorrect evidence: a row showing A's time is lower than B's at n=100. Wrong: a row at n=10 (off-scope).",
    proTip: "Out-of-Scope Trap: answers about a different variable, sample, or time period are wrong even if true. Match every word of the claim to the evidence.",
  },
  "words-in-context": {
    concept: "Vocabulary in context. The SAT tests SECONDARY meanings of common words ('grave' = serious, 'novel' = new, 'arrest' = stop).",
    strategy: "Cover the answer choices. Read the sentence and PREDICT a synonym in your own words. Then match.",
    example: "'The committee adopted a grave tone after the announcement.' Predict: serious. Match → 'somber.' Wrong: 'burial-related.'",
    proTip: "If the most common meaning of a word is one of the choices, it's usually a trap. The SAT rewards knowing Tier 2 academic meanings.",
  },
  "text-structure": {
    concept: "Tests WHY the author included a sentence/paragraph — its function, not its content. Common structures: claim → evidence → counterargument; problem → solution; cause → effect.",
    strategy: "Re-read the referenced lines, then ask 'what is the author DOING here?' Verbs in answer choices matter: 'illustrates,' 'qualifies,' 'undermines,' 'concedes.'",
    example: "After making a claim, the author writes 'However, recent data suggests otherwise.' Function = 'introduce a counterexample to the previous claim.'",
    proTip: "When two answers seem close, pick the one that includes WHY (purpose), not WHAT (content). 'Describes X' is content; 'contrasts with prior view' is function.",
  },
  "standard-conventions": {
    concept: "Tests boundaries (commas, semicolons, colons, dashes), subject-verb agreement, pronouns, and parallel structure. Two independent clauses CANNOT join with just a comma.",
    strategy: "When choosing punctuation, identify whether each side is an independent clause (can stand alone). IC + IC → semicolon, period, or comma + FANBOYS. IC + dependent → comma OK.",
    example: "WRONG (comma splice): 'I studied hard, I aced the test.' RIGHT: 'I studied hard; I aced the test.' OR 'I studied hard, so I aced the test.'",
    proTip: "Comma Splice Trap is the #1 SAT punctuation error. If both sides have a subject + verb that could be sentences alone, never use just a comma between them.",
  },
  "expression-of-ideas": {
    concept: "Tests transitions and concise revisions. Match the transition word to the LOGICAL relationship between sentences.",
    strategy: "Cover the transition. Ask: is sentence 2 contrasting, adding, exemplifying, or concluding from sentence 1? Then pick the matching word.",
    example: "'The drug reduced symptoms in 80% of patients. ___, side effects were severe.' → 'However' (contrast). NOT 'Therefore' (cause).",
    proTip: "'Therefore' / 'Thus' = result. 'However' / 'Nevertheless' = contrast. 'Furthermore' / 'Moreover' = addition. 'For example' / 'Specifically' = illustration. Memorize the buckets.",
  },
  "rhetorical-synthesis": {
    concept: "Given research notes (bullets), write/select a sentence that achieves a STATED GOAL (e.g., 'introduce the topic to a new reader,' 'emphasize a contrast').",
    strategy: "Underline the goal in the prompt. Every choice will use real notes — only one matches the goal exactly. Read the goal TWICE before reading choices.",
    example: "Goal: 'emphasize a similarity.' Right: 'Like X, Y also...' Wrong: 'X differs from Y in that...' (true but wrong goal).",
    proTip: "Goal Mismatch Trap: 3 of 4 choices are factually accurate from the notes. The trap is picking a TRUE statement that doesn't fulfill the SPECIFIC rhetorical purpose.",
  },
};

// Legacy multi-card data preserved for components still using the old shape.
// When a topic has a desmosShortcut, append it as an extra slide.
export const THEORY_CARDS: Record<string, TheoryCard[]> = Object.fromEntries(
  Object.entries(EXPERT_THEORY).map(([id, t]) => {
    const base: TheoryCard[] = [
      { title: "Concept", type: "concept", content: t.concept },
      { title: "Strategy", type: "concept", content: t.strategy },
      { title: "Worked Example", type: "example", content: t.example },
      { title: "1500+ Pro Tip", type: "trap", content: t.proTip },
    ];
    if (t.desmosShortcut) {
      base.push({ title: "🎒 DESMOS SHORTCUT", type: "desmos", content: t.desmosShortcut });
    }
    return [id, base];
  })
);
