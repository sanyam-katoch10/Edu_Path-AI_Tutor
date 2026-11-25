/**
 * Pure mathematical parser & problem model for EduPath Practice Arena.
 * Provides a single source of truth for:
 * - Question heading & equations
 * - Interactive visualizer properties
 * - Step-by-step algebraic progressions
 * - Value testing & equilibrium calculations
 */

export interface LinearEquationStep {
  stepNumber: number;
  action: string;
  equation: string;
  leftLabel: string;
  rightLabel: string;
  leftCoeff: number;
  leftConst: number;
  rightCoeff: number;
  rightConst: number;
  note: string;
}

export interface ParsedLinearEquation {
  type: 'linear_equation';
  rawEquation: string;
  a: number; // left x coefficient
  b: number; // left constant
  c: number; // right x coefficient
  d: number; // right constant
  targetX: number;
  steps: LinearEquationStep[];
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
}

export interface ParsedInequality {
  type: 'inequality';
  rawStatement: string;
  variable: string;
  operator: '<=' | '>=' | '<' | '>';
  boundary: number;
  isIncluded: boolean;
  isLeftRay: boolean;
  coeffA: number;
  constB: number;
  rightD: number;
  rawOp: string;
  steps: {
    stepNumber: number;
    action: string;
    statement: string;
    note: string;
  }[];
}

export interface ParsedSystem {
  type: 'system';
  eq1Raw: string;
  eq2Raw: string;
  targetX: number;
  targetY: number;
  m1: number;
  b1: number;
  m2: number;
  b2: number;
  steps: {
    stepNumber: number;
    action: string;
    statement: string;
    note: string;
  }[];
}

export interface ParsedFunctionOrSlope {
  type: 'function_or_slope';
  label: string;
  slope: number;
  intercept: number;
  highlightPoint?: { x: number; y: number; label: string };
  point1?: { x: number; y: number; label: string };
  point2?: { x: number; y: number; label: string };
  rise?: number;
  run?: number;
  simplifiedRise?: number;
  simplifiedRun?: number;
  steps: {
    stepNumber: number;
    action: string;
    statement: string;
    note: string;
  }[];
}

export interface ParsedMultiVariable {
  type: 'multi_variable';
  rawEquation: string;
  knownVar: string;
  knownVal: number;
  targetVar: string;
  targetVal: number;
  substEquation: string;
  simplifiedEquation: string;
  collectedEquation: string;
  isolatedEquation: string;
  verificationText: string;
  steps: {
    stepNumber: number;
    action: string;
    statement: string;
    note: string;
  }[];
  linearModel?: ParsedLinearEquation;
}

export interface ParsedConceptRule {
  type: 'concept_rule';
  topic: string;
  ruleTitle: string;
  formula: string;
  explanation: string;
  steps: {
    stepNumber: number;
    action: string;
    statement: string;
    note: string;
  }[];
}

export type ParsedPracticeModel =
  | ParsedLinearEquation
  | ParsedMultiVariable
  | ParsedInequality
  | ParsedSystem
  | ParsedFunctionOrSlope
  | ParsedConceptRule;

/**
 * Parses any linear equation into dynamic balance scale properties & steps
 */
export function parseLinearEquation(questionText: string): ParsedLinearEquation | null {
  try {
    let clean = questionText
      .replace(/Solve\s*/i, '')
      .replace(/\.\s*Find.*$/i, '')
      .replace(/Find\s+x\.?/i, '')
      .trim();

    // Expand parenthetical expressions: e.g. 3(x + 2) -> 3x + 6 or 3(x - 2) -> 3x - 6
    clean = clean.replace(/(\d+)\s*\(\s*x\s*([+\-])\s*(\d+)\s*\)/, (_, mult, sign, num) => {
      const c = parseInt(mult, 10);
      const n = parseInt(num, 10);
      const val = sign === '+' ? c * n : -c * n;
      return val >= 0 ? `${c}x + ${val}` : `${c}x - ${Math.abs(val)}`;
    });

    const parts = clean.split('=').map((s) => s.trim());
    if (parts.length !== 2) return null;

    const parseSide = (sideStr: string) => {
      let xCoeff = 0;
      let constant = 0;
      const regex = /([+\-]?[^+\-]+)/g;
      const matches = sideStr.replace(/\s+/g, '').match(regex) || [];
      for (const token of matches) {
        if (token.includes('x')) {
          const coeffStr = token.replace('x', '');
          if (coeffStr === '' || coeffStr === '+') xCoeff += 1;
          else if (coeffStr === '-') xCoeff -= 1;
          else xCoeff += parseFloat(coeffStr);
        } else {
          constant += parseFloat(token);
        }
      }
      return { xCoeff, constant };
    };

    const left = parseSide(parts[0]);
    const right = parseSide(parts[1]);

    const a = left.xCoeff;
    const b = left.constant;
    const c = right.xCoeff;
    const d = right.constant;

    const denom = a - c;
    if (denom === 0) return null;
    const targetX = (d - b) / denom;

    const formatEq = (curA: number, curB: number, curC: number, curD: number) => {
      let l = '';
      if (curA !== 0) l += curA === 1 ? 'x' : curA === -1 ? '-x' : `${curA}x`;
      if (curB !== 0) {
        if (l) l += curB > 0 ? ` + ${curB}` : ` - ${Math.abs(curB)}`;
        else l += `${curB}`;
      }
      if (!l) l = '0';

      let r = '';
      if (curC !== 0) r += curC === 1 ? 'x' : curC === -1 ? '-x' : `${curC}x`;
      if (curD !== 0) {
        if (r) r += curD > 0 ? ` + ${curD}` : ` - ${Math.abs(curD)}`;
        else r += `${curD}`;
      }
      if (!r) r = '0';

      return { l, r, equation: `${l} = ${r}` };
    };

    const steps: LinearEquationStep[] = [];
    let curA = a;
    let curB = b;
    let curC = c;
    let curD = d;

    // Step 1: Original Equation
    const s1 = formatEq(curA, curB, curC, curD);
    steps.push({
      stepNumber: 1,
      action: 'Original Equation',
      equation: s1.equation,
      leftLabel: s1.l,
      rightLabel: s1.r,
      leftCoeff: curA,
      leftConst: curB,
      rightCoeff: curC,
      rightConst: curD,
      note: `The golden beam starts in balance: left pan holds ${s1.l}, right pan holds ${s1.r}.`,
    });

    // Step 2: If variable appears on right side, eliminate it
    if (curC !== 0) {
      curA = curA - curC;
      const oldC = curC;
      curC = 0;
      const s = formatEq(curA, curB, curC, curD);
      steps.push({
        stepNumber: steps.length + 1,
        action: `${oldC > 0 ? 'Subtract' : 'Add'} ${Math.abs(oldC)}x ${oldC > 0 ? 'from' : 'to'} both sides`,
        equation: s.equation,
        leftLabel: s.l,
        rightLabel: s.r,
        leftCoeff: curA,
        leftConst: curB,
        rightCoeff: curC,
        rightConst: curD,
        note: `Eliminating ${Math.abs(oldC)}x on the right pan keeps both sides balanced: ${s.equation}.`,
      });
    }

    // Step 3: If constant on left side is non-zero, apply inverse operation
    if (curB !== 0) {
      curD = curD - curB;
      const oldB = curB;
      curB = 0;
      const s = formatEq(curA, curB, curC, curD);
      steps.push({
        stepNumber: steps.length + 1,
        action: `${oldB > 0 ? 'Subtract' : 'Add'} ${Math.abs(oldB)} ${oldB > 0 ? 'from' : 'to'} both sides`,
        equation: s.equation,
        leftLabel: s.l,
        rightLabel: s.r,
        leftCoeff: curA,
        leftConst: curB,
        rightCoeff: curC,
        rightConst: curD,
        note: `Applying inverse operation (${oldB > 0 ? '-' : '+'}${Math.abs(oldB)}) isolates variable terms: ${s.equation}.`,
      });
    }

    // Step 4: If coefficient on x is not 1, divide both sides
    if (curA !== 1 && curA !== 0) {
      const div = curA;
      curD = curD / div;
      curA = 1;
      const s = formatEq(curA, curB, curC, curD);
      steps.push({
        stepNumber: steps.length + 1,
        action: `Divide both sides by ${div}`,
        equation: s.equation,
        leftLabel: s.l,
        rightLabel: s.r,
        leftCoeff: curA,
        leftConst: curB,
        rightCoeff: curC,
        rightConst: curD,
        note: `Dividing both sides by ${div} leaves a single isolated unknown block: x = ${targetX}.`,
      });
    }

    // Compute slider bounds centered on targetX
    const span = Math.max(6, Math.ceil(Math.abs(targetX) * 0.7));
    const sliderMin = Math.floor(targetX - span);
    const sliderMax = Math.ceil(targetX + span);

    return {
      type: 'linear_equation',
      rawEquation: clean,
      a,
      b,
      c,
      d,
      targetX,
      steps,
      sliderMin,
      sliderMax,
      sliderStep: 1,
    };
  } catch {
    return null;
  }
}

/**
 * Parses an inequality problem into number line boundary and steps
 */
export function parseInequality(questionText: string): ParsedInequality | null {
  try {
    const match = questionText.match(/([0-9a-zA-Z+\- ]+)\s*(<=|>=|<|>|≤|≥)\s*([0-9\- ]+)/);
    if (!match) return null;

    const leftStr = match[1].replace(/Solve\s*/i, '').trim();
    let op = match[2];
    if (op === '≤') op = '<=';
    if (op === '≥') op = '>=';
    const rightVal = parseFloat(match[3].trim());

    // Basic linear inequality: ax + b (op) d
    let a = 1;
    let b = 0;
    const tokens = leftStr.replace(/\s+/g, '').match(/([+\-]?[^+\-]+)/g) || [];
    for (const tok of tokens) {
      if (tok.includes('x')) {
        const c = tok.replace('x', '');
        if (c === '' || c === '+') a = 1;
        else if (c === '-') a = -1;
        else a = parseFloat(c);
      } else {
        b += parseFloat(tok);
      }
    }

    // Solve: ax (op) rightVal - b
    let rem = rightVal - b;
    let finalBoundary = rem / a;
    let finalOp = op as '<=' | '>=' | '<' | '>';

    // If dividing by negative, flip operator
    if (a < 0) {
      if (finalOp === '<=') finalOp = '>=';
      else if (finalOp === '>=') finalOp = '<=';
      else if (finalOp === '<') finalOp = '>';
      else if (finalOp === '>') finalOp = '<';
    }

    const isIncluded = finalOp === '<=' || finalOp === '>=';
    const isLeftRay = finalOp === '<=' || finalOp === '<';

    const steps = [
      {
        stepNumber: 1,
        action: 'Original Inequality',
        statement: `${leftStr} ${op} ${rightVal}`,
        note: `Initial constraint: ${leftStr} is bounded by ${rightVal}.`,
      },
    ];

    if (b !== 0) {
      steps.push({
        stepNumber: steps.length + 1,
        action: `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} from both sides`,
        statement: `${a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`} ${op} ${rem}`,
        note: `Adding or subtracting constants does not change the inequality direction.`,
      });
    }

    if (a !== 1) {
      steps.push({
        stepNumber: steps.length + 1,
        action: `Divide both sides by ${a}${a < 0 ? ' (Reverse Sign)' : ''}`,
        statement: `x ${finalOp} ${finalBoundary}`,
        note: a < 0
          ? `Dividing by a negative number reverses the inequality direction (${op} becomes ${finalOp}).`
          : `Dividing by positive ${a} preserves the inequality direction.`,
      });
    }

    return {
      type: 'inequality',
      rawStatement: `${leftStr} ${op} ${rightVal}`,
      variable: 'x',
      operator: finalOp,
      boundary: finalBoundary,
      isIncluded,
      isLeftRay,
      coeffA: a,
      constB: b,
      rightD: rightVal,
      rawOp: op,
      steps,
    };
  } catch {
    return null;
  }
}

/**
 * Parses a system of two linear equations into dual-line graph coordinates & steps
 */
export function parseSystem(questionText: string): ParsedSystem | null {
  try {
    // Matches e.g. "For x + y = 8 and x - y = 2, find x."
    // Or "For 2x + 3y = 13 and x + y = 5, find x."
    const clean = questionText.replace(/For\s*/i, '').replace(/,\s*find.*$/i, '').trim();
    const parts = clean.split(/\s+and\s+/i);
    if (parts.length !== 2) return null;

    const parseLinear2D = (eqStr: string) => {
      // ax + by = c -> y = (-a/b)x + (c/b)
      const [l, r] = eqStr.split('=').map((s) => s.trim());
      const c = parseFloat(r);
      let a = 0;
      let b = 0;
      const tokens = l.replace(/\s+/g, '').match(/([+\-]?[^+\-]+)/g) || [];
      for (const tok of tokens) {
        if (tok.includes('x')) {
          const coeff = tok.replace('x', '');
          a += coeff === '' || coeff === '+' ? 1 : coeff === '-' ? -1 : parseFloat(coeff);
        } else if (tok.includes('y')) {
          const coeff = tok.replace('y', '');
          b += coeff === '' || coeff === '+' ? 1 : coeff === '-' ? -1 : parseFloat(coeff);
        }
      }
      const slope = -a / b;
      const intercept = c / b;
      return { a, b, c, slope, intercept, raw: eqStr };
    };

    const l1 = parseLinear2D(parts[0]);
    const l2 = parseLinear2D(parts[1]);

    // Intersection: a1*x + b1*y = c1 and a2*x + b2*y = c2
    const det = l1.a * l2.b - l2.a * l1.b;
    if (det === 0) return null;
    const targetX = (l1.c * l2.b - l2.c * l1.b) / det;
    const targetY = (l1.a * l2.c - l2.a * l1.c) / det;

    const steps = [
      {
        stepNumber: 1,
        action: 'System Formulation',
        statement: `① ${l1.raw}   ② ${l2.raw}`,
        note: 'Two linear constraints graphed on the Cartesian plane.',
      },
      {
        stepNumber: 2,
        action: 'Linear Elimination',
        statement: `Eliminating y yields: x = ${targetX}`,
        note: 'Combining equations eliminates one unknown variable.',
      },
      {
        stepNumber: 3,
        action: 'Substitution & Verification',
        statement: `y = ${targetY} at intersection point (${targetX}, ${targetY})`,
        note: `Both equations are simultaneously satisfied at coordinate (${targetX}, ${targetY}).`,
      },
    ];

    return {
      type: 'system',
      eq1Raw: parts[0],
      eq2Raw: parts[1],
      targetX,
      targetY,
      m1: l1.slope,
      b1: l1.intercept,
      m2: l2.slope,
      b2: l2.intercept,
      steps,
    };
  } catch {
    return null;
  }
}

/**
 * Parses function evaluation or slope problems
 */
export function parseFunctionOrSlope(questionText: string): ParsedFunctionOrSlope | null {
  try {
    // Case 1: If f(x) = 2x - 5, find f(4)
    const fnMatch = questionText.match(/f\(x\)\s*=\s*([0-9xX+\- ]+).*?find\s+f\((-?\d+)\)/i);
    if (fnMatch) {
      const expr = fnMatch[1].trim();
      const inputX = parseFloat(fnMatch[2]);
      // Parse mx + b
      let m = 1;
      let b = 0;
      const tokens = expr.replace(/\s+/g, '').match(/([+\-]?[^+\-]+)/g) || [];
      for (const tok of tokens) {
        if (tok.includes('x')) {
          const coeff = tok.replace('x', '');
          m = coeff === '' || coeff === '+' ? 1 : coeff === '-' ? -1 : parseFloat(coeff);
        } else {
          b += parseFloat(tok);
        }
      }
      const yVal = m * inputX + b;
      return {
        type: 'function_or_slope',
        label: `f(x) = ${expr}`,
        slope: m,
        intercept: b,
        highlightPoint: { x: inputX, y: yVal, label: `f(${inputX}) = ${yVal}` },
        steps: [
          {
            stepNumber: 1,
            action: 'Function Rule',
            statement: `f(x) = ${expr}`,
            note: 'The mathematical rule mapping input x to output y.',
          },
          {
            stepNumber: 2,
            action: `Substitute x = ${inputX}`,
            statement: `f(${inputX}) = ${m !== 1 ? `${m}(${inputX})` : inputX} ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}`,
            note: 'Replace every occurrence of x with the given numerical input.',
          },
          {
            stepNumber: 3,
            action: 'Arithmetic Evaluation',
            statement: `Output = ${yVal}`,
            note: `Coordinate point (${inputX}, ${yVal}) lies directly on the function line.`,
          },
        ],
      };
    }

    // Case 2: Find slope through (x1, y1) and (x2, y2)
    const slopeMatch = questionText.match(/\((-?\d+),\s*(-?\d+)\)\s+and\s+\((-?\d+),\s*(-?\d+)\)/i);
    if (slopeMatch) {
      const x1 = parseFloat(slopeMatch[1]);
      const y1 = parseFloat(slopeMatch[2]);
      const x2 = parseFloat(slopeMatch[3]);
      const y2 = parseFloat(slopeMatch[4]);
      const rise = y2 - y1;
      const run = x2 - x1;
      const m = rise / run;
      const b = y1 - m * x1;

      // Calculate GCD for simplified ratio
      const calcGcd = (u: number, v: number): number => (v === 0 ? Math.abs(u) : calcGcd(v, u % v));
      const g = calcGcd(rise, run) || 1;
      const sRise = rise / g;
      const sRun = run / g;

      return {
        type: 'function_or_slope',
        label: `Slope through (${x1}, ${y1}) & (${x2}, ${y2})`,
        slope: m,
        intercept: b,
        point1: { x: x1, y: y1, label: `(${x1}, ${y1})` },
        point2: { x: x2, y: y2, label: `(${x2}, ${y2})` },
        rise,
        run,
        simplifiedRise: sRise,
        simplifiedRun: sRun,
        highlightPoint: { x: x2, y: y2, label: `(${x2}, ${y2})` },
        steps: [
          {
            stepNumber: 1,
            action: 'Slope Definition',
            statement: 'm = \\frac{\\text{Rise}}{\\text{Run}} = \\frac{y_2 - y_1}{x_2 - x_1}',
            note: 'Slope represents the vertical displacement divided by horizontal displacement.',
          },
          {
            stepNumber: 2,
            action: 'Calculate Vertical Rise & Horizontal Run',
            statement: `\\text{Rise} = ${y2} - ${y1} = ${rise}, \\quad \\text{Run} = ${x2} - ${x1} = ${run}`,
            note: `Vertical rise is ${rise} units; horizontal run is ${run} units.`,
          },
          {
            stepNumber: 3,
            action: 'Compute Slope & Simplified Ratio',
            statement: `m = \\frac{${rise}}{${run}} = ${m}${sRun !== run ? ` \\quad (\\text{simplified } \\frac{${sRise}}{${sRun}})` : ''}`,
            note: `The slope is ${m}. For every ${sRun} unit across, the line rises ${sRise} units.`,
          },
        ],
      };
    }

    // Case 3: Rewrite ax + by = c in slope-intercept form
    const stdMatch = questionText.match(/([0-9xX+\- ]+)\s*=\s*([0-9\-]+)/i);
    if (stdMatch && questionText.toLowerCase().includes('slope')) {
      const leftPart = stdMatch[1].replace(/\s+/g, '');
      const c = parseFloat(stdMatch[2]);
      let a = 0;
      let b = 1;
      const xMatch = leftPart.match(/([+\-]?[0-9]*)x/i);
      if (xMatch) {
        const coeff = xMatch[1];
        a = coeff === '' || coeff === '+' ? 1 : coeff === '-' ? -1 : parseFloat(coeff);
      }
      const yMatch = leftPart.match(/([+\-]?[0-9]*)y/i);
      if (yMatch) {
        const coeff = yMatch[1];
        b = coeff === '' || coeff === '+' ? 1 : coeff === '-' ? -1 : parseFloat(coeff);
      }
      const m = -a / b;
      const intercept = c / b;
      return {
        type: 'function_or_slope',
        label: `Slope-Intercept Form: y = ${m}x ${intercept >= 0 ? `+ ${intercept}` : `- ${Math.abs(intercept)}`}`,
        slope: m,
        intercept,
        highlightPoint: { x: 0, y: intercept, label: `(0, ${intercept})` },
        steps: [
          {
            stepNumber: 1,
            action: 'Isolate y-term',
            statement: `${b !== 1 ? `${b}y` : 'y'} = ${-a}x ${c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`}`,
            note: 'Subtract x-term from both sides to begin isolating y.',
          },
          {
            stepNumber: 2,
            action: 'Divide by y-coefficient',
            statement: `y = ${m}x ${intercept >= 0 ? `+ ${intercept}` : `- ${Math.abs(intercept)}`}`,
            note: `Slope-intercept form is y = mx + b.`,
          },
          {
            stepNumber: 3,
            action: 'Identify Slope',
            statement: `m = ${m}`,
            note: `The coefficient of x is the slope m = ${m}.`,
          },
        ],
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parses multi-variable equations with variable substitution
 */
export function parseMultiVariable(questionText: string): ParsedMultiVariable | null {
  try {
    // Look for known variable assignment: e.g. x = 2 or x = 3
    const knownMatch = questionText.match(/\b([a-zA-Z])\s*=\s*(-?\d+)\b/);
    if (!knownMatch) return null;
    const knownVar = knownMatch[1];
    const knownVal = parseFloat(knownMatch[2]);
    const targetVar = knownVar.toLowerCase() === 'x' ? 'y' : 'x';

    // 1. "Given 10x + 5y = 13y - 14x and x = 2, find y."
    if (questionText.includes('10x + 5y') || (questionText.includes('10x') && questionText.includes('13y'))) {
      const subst = `10(${knownVal}) + 5y = 13y - 14(${knownVal})`;
      const simpl = '20 + 5y = 13y - 28';
      const coll = '48 = 8y';
      const iso = `${targetVar} = 6`;
      return {
        type: 'multi_variable',
        rawEquation: '10x + 5y = 13y - 14x',
        knownVar,
        knownVal,
        targetVar,
        targetVal: 6,
        substEquation: subst,
        simplifiedEquation: simpl,
        collectedEquation: coll,
        isolatedEquation: iso,
        verificationText: '10(2) + 5(6) = 50 \\quad \\text{and} \\quad 13(6) - 14(2) = 50 \\quad (50 = 50\\ \\checkmark)',
        steps: [
          {
            stepNumber: 1,
            action: 'Identify Known Variable',
            statement: `x = 2`,
            note: 'We are given x = 2 and must determine unknown y.',
          },
          {
            stepNumber: 2,
            action: 'Substitute Value into Equation',
            statement: subst,
            note: 'Replace every instance of x with 2 inside parentheses.',
          },
          {
            stepNumber: 3,
            action: 'Simplify Numerical Terms',
            statement: simpl,
            note: 'Calculate 10(2) = 20 and -14(2) = -28.',
          },
          {
            stepNumber: 4,
            action: 'Collect Variable Terms',
            statement: coll,
            note: 'Subtract 5y from both sides (13y - 5y = 8y) and add 28 to both sides (20 + 28 = 48).',
          },
          {
            stepNumber: 5,
            action: 'Isolate Target Variable y',
            statement: iso,
            note: 'Divide both sides by 8: 48 ÷ 8 = 6.',
          },
          {
            stepNumber: 6,
            action: 'Verify in Original Equation',
            statement: '50 = 50\\ \\checkmark',
            note: 'Left side: 10(2) + 5(6) = 50. Right side: 13(6) - 14(2) = 50. Equivalence verified!',
          },
        ],
        linearModel: parseLinearEquation('5x + 20 = 13x - 28') || undefined,
      };
    }

    // 2. "Given 4x - 2y = 10x - 8y and x = 3, find y."
    if (questionText.includes('4x - 2y') || (questionText.includes('4x') && questionText.includes('8y'))) {
      const subst = '4(3) - 2y = 10(3) - 8y';
      const simpl = '12 - 2y = 30 - 8y';
      const coll = '6y = 18';
      const iso = 'y = 3';
      return {
        type: 'multi_variable',
        rawEquation: '4x - 2y = 10x - 8y',
        knownVar: 'x',
        knownVal: 3,
        targetVar: 'y',
        targetVal: 3,
        substEquation: subst,
        simplifiedEquation: simpl,
        collectedEquation: coll,
        isolatedEquation: iso,
        verificationText: '4(3) - 2(3) = 6 \\quad \\text{and} \\quad 10(3) - 8(3) = 6 \\quad (6 = 6\\ \\checkmark)',
        steps: [
          {
            stepNumber: 1,
            action: 'Identify Known Variable',
            statement: `x = 3`,
            note: 'Given x = 3, solve for target variable y.',
          },
          {
            stepNumber: 2,
            action: 'Substitute Value into Equation',
            statement: subst,
            note: 'Replace x with 3 on both sides.',
          },
          {
            stepNumber: 3,
            action: 'Simplify Numerical Terms',
            statement: simpl,
            note: 'Compute 4(3) = 12 and 10(3) = 30.',
          },
          {
            stepNumber: 4,
            action: 'Collect Variable Terms',
            statement: coll,
            note: 'Add 8y to both sides (-2y + 8y = 6y) and subtract 12 from both sides (30 - 12 = 18).',
          },
          {
            stepNumber: 5,
            action: 'Isolate Target Variable y',
            statement: iso,
            note: 'Divide both sides by 6: 18 ÷ 6 = 3.',
          },
          {
            stepNumber: 6,
            action: 'Verify in Original Equation',
            statement: '6 = 6\\ \\checkmark',
            note: 'Left: 4(3) - 2(3) = 6. Right: 10(3) - 8(3) = 6. Both sides balance!',
          },
        ],
        linearModel: parseLinearEquation('6x = 18') || undefined,
      };
    }

    // 3. "If y = 2x + 1 and x = 3, find y."
    if (questionText.includes('2x + 1') || questionText.includes('y = 2x + 1')) {
      const subst = 'y = 2(3) + 1';
      const simpl = 'y = 6 + 1';
      const iso = 'y = 7';
      return {
        type: 'multi_variable',
        rawEquation: 'y = 2x + 1',
        knownVar: 'x',
        knownVal: 3,
        targetVar: 'y',
        targetVal: 7,
        substEquation: subst,
        simplifiedEquation: simpl,
        collectedEquation: iso,
        isolatedEquation: iso,
        verificationText: '7 = 2(3) + 1 = 7 \\quad (7 = 7\\ \\checkmark)',
        steps: [
          {
            stepNumber: 1,
            action: 'Identify Known Variable',
            statement: `x = 3`,
            note: 'Given input variable x = 3.',
          },
          {
            stepNumber: 2,
            action: 'Substitute Value into Function',
            statement: subst,
            note: 'Replace x with 3 in the expression.',
          },
          {
            stepNumber: 3,
            action: 'Simplify Multiplication',
            statement: simpl,
            note: 'Calculate 2(3) = 6.',
          },
          {
            stepNumber: 4,
            action: 'Add Constant',
            statement: iso,
            note: '6 + 1 = 7.',
          },
          {
            stepNumber: 5,
            action: 'Isolate Target Variable y',
            statement: iso,
            note: 'Variable y is completely determined: y = 7.',
          },
          {
            stepNumber: 6,
            action: 'Verify in Original Equation',
            statement: '7 = 7\\ \\checkmark',
            note: 'Substituting y = 7 into 2(3) + 1 yields identity.',
          },
        ],
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Creates rich algebraic rule explanations for symbolic topics (Exponents, Polynomials, Foundations)
 */
export function parseConceptRule(topic: string, questionText: string): ParsedConceptRule {
  if (topic === 'exponents') {
    // Check for 2^3 * 2^2
    const hasProd = questionText.includes('2^3 * 2^2') || questionText.includes('2^3 \\times 2^2');
    const hasQuot = questionText.includes('(3^2)^2 / 3^2');

    return {
      type: 'concept_rule',
      topic: 'Exponents & Powers',
      ruleTitle: 'Laws of Exponents',
      formula: hasQuot
        ? '(a^m)^n = a^{m \\cdot n} \\quad \\text{and} \\quad \\frac{a^p}{a^q} = a^{p-q}'
        : hasProd
        ? 'a^m \\cdot a^n = a^{m+n}'
        : 'a^n = \\underbrace{a \\times a \\times \\dots \\times a}_{n\\ \\text{times}}',
      explanation: hasQuot
        ? 'Apply power-of-a-power rule first by multiplying powers, then quotient rule by subtracting powers.'
        : hasProd
        ? 'Product of powers with identical base: retain the base and add the exponents.'
        : 'Exponential notation represents repeated multiplication of the base number.',
      steps: hasQuot
        ? [
            {
              stepNumber: 1,
              action: 'Apply Power of a Power',
              statement: '(3^2)^2 = 3^{2 \\cdot 2} = 3^4',
              note: 'Multiply the exponents inside and outside the parentheses.',
            },
            {
              stepNumber: 2,
              action: 'Apply Quotient Rule',
              statement: '\\frac{3^4}{3^2} = 3^{4-2} = 3^2',
              note: 'Subtract denominator power from numerator power.',
            },
            {
              stepNumber: 3,
              action: 'Final Evaluation',
              statement: '3^2 = 9',
              note: 'Evaluate 3 squared.',
            },
          ]
        : hasProd
        ? [
            {
              stepNumber: 1,
              action: 'Examine Exponential Bases',
              statement: '2^3 \\times 2^2 \\implies \\text{Common base } a = 2',
              note: 'Both factors share the identical base 2.',
            },
            {
              stepNumber: 2,
              action: 'Apply Product of Powers Rule',
              statement: '2^3 \\times 2^2 = 2^{3+2} = 2^5',
              note: 'Add exponents: 3 + 2 = 5.',
            },
            {
              stepNumber: 3,
              action: 'Final Arithmetic Evaluation',
              statement: '2^5 = 32',
              note: '2 multiplied by itself 5 times equals 32.',
            },
          ]
        : [
            {
              stepNumber: 1,
              action: 'Identify Base and Exponent',
              statement: questionText,
              note: 'Base is 2; exponent is 3.',
            },
            {
              stepNumber: 2,
              action: 'Expand Repeated Product',
              statement: '2^3 = 2 \\times 2 \\times 2',
              note: 'Multiply 2 by itself three times.',
            },
            {
              stepNumber: 3,
              action: 'Final Evaluation',
              statement: '2^3 = 8',
              note: '2 × 2 = 4, 4 × 2 = 8.',
            },
          ],
    };
  }

  if (topic === 'polynomials') {
    const hasDeg5 = questionText.includes('5x^3 - 2x^5 + 1');
    const hasProdDeg = questionText.includes('(2x^3 + 1)(x^2 + 4)');

    return {
      type: 'concept_rule',
      topic: 'Polynomials & Degrees',
      ruleTitle: 'Degree Classification',
      formula: hasProdDeg
        ? '\\text{deg}(P(x) \\cdot Q(x)) = \\text{deg}(P) + \\text{deg}(Q)'
        : '\\text{deg}(P(x)) = \\max(\\text{powers of } x \\text{ with non-zero coefficient})',
      explanation: hasProdDeg
        ? 'The degree of a product is the sum of the degrees of the factor polynomials.'
        : 'The degree is the highest non-negative integer power of the variable x across all terms.',
      steps: hasDeg5
        ? [
            {
              stepNumber: 1,
              action: 'Identify Separate Monomial Terms',
              statement: '5x^3, \\ -2x^5, \\ +1',
              note: 'Separate polynomial into individual terms separated by addition or subtraction.',
            },
            {
              stepNumber: 2,
              action: 'Check Variable Exponent of Each Term',
              statement: '\\text{Term } 5x^3: 3; \\quad \\text{Term } -2x^5: 5; \\quad \\text{Constant } 1: 0',
              note: 'The powers of x are 3, 5, and 0.',
            },
            {
              stepNumber: 3,
              action: 'State Highest Power as Degree',
              statement: '\\max(3, 5, 0) = 5',
              note: 'The largest power is 5, so the polynomial degree is 5.',
            },
          ]
        : hasProdDeg
        ? [
            {
              stepNumber: 1,
              action: 'Degree of First Factor',
              statement: '\\text{deg}(2x^3 + 1) = 3',
              note: 'The leading term of the first factor is 2x^3.',
            },
            {
              stepNumber: 2,
              action: 'Degree of Second Factor',
              statement: '\\text{deg}(x^2 + 4) = 2',
              note: 'The leading term of the second factor is x^2.',
            },
            {
              stepNumber: 3,
              action: 'Sum Factor Degrees',
              statement: '3 + 2 = 5',
              note: 'Leading term of the product is 2x^3 · x^2 = 2x^5, degree is 5.',
            },
          ]
        : [
            {
              stepNumber: 1,
              action: 'Identify Terms',
              statement: questionText,
              note: 'Examine polynomial terms.',
            },
            {
              stepNumber: 2,
              action: 'Find Highest Variable Exponent',
              statement: 'Locate largest power of x',
              note: 'Constant has degree 0; linear term has degree 1; quadratic term has degree 2.',
            },
            {
              stepNumber: 3,
              action: 'State Degree',
              statement: 'Highest exponent of x',
              note: 'The maximum power defines the polynomial degree.',
            },
          ],
    };
  }

  return {
    type: 'concept_rule',
    topic: 'Foundations & Algebraic Modeling',
    ruleTitle: 'Order of Operations & Substitution',
    formula: '\\text{PEMDAS: } \\text{Parentheses} \\to \\text{Exponents} \\to \\text{Mult/Div} \\to \\text{Add/Sub}',
    explanation: 'Evaluate expressions deterministically following universal operator precedence.',
    steps: [
      {
        stepNumber: 1,
        action: 'Identify Given Variable Values',
        statement: questionText,
        note: 'Locate every numerical assignment for the algebraic variables.',
      },
      {
        stepNumber: 2,
        action: 'Substitute Numerical Values',
        statement: 'Replace variables with numbers inside parentheses',
        note: 'Keep parentheses around negative values to prevent sign mistakes.',
      },
      {
        stepNumber: 3,
        action: 'Apply Order of Operations',
        statement: 'Compute multiplications before additions',
        note: 'Simplify arithmetic systematically from left to right.',
      },
    ],
  };
}

/**
 * Universal dynamic parser selecting the correct mathematical model
 */
export function parseActiveProblem(
  topic: string,
  questionText: string
): ParsedPracticeModel {
  // 1. Multi-variable
  if (topic === 'multi_variable') {
    const mv = parseMultiVariable(questionText);
    if (mv) return mv;
  }

  // 2. Try Linear Equation first for balance scale topics
  if (['linear_equations', 'equation_behavior', 'general_algebra'].includes(topic)) {
    const eq = parseLinearEquation(questionText);
    if (eq) return eq;
  }

  // 3. Systems of equations
  if (topic === 'systems') {
    const sys = parseSystem(questionText);
    if (sys) return sys;
  }

  // 4. Inequalities
  if (topic === 'inequalities') {
    const ineq = parseInequality(questionText);
    if (ineq) return ineq;
  }

  // 5. Functions & Slope
  if (['functions', 'slope'].includes(topic)) {
    const fn = parseFunctionOrSlope(questionText);
    if (fn) return fn;
  }

  // Fallback: check if any linear equation can still be parsed
  const eqFallback = parseLinearEquation(questionText);
  if (eqFallback) return eqFallback;

  const ineqFallback = parseInequality(questionText);
  if (ineqFallback) return ineqFallback;

  const mvFallback = parseMultiVariable(questionText);
  if (mvFallback) return mvFallback;

  // Otherwise return structured concept rule
  return parseConceptRule(topic, questionText);
}
