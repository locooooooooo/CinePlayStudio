export type RuntimeValue = boolean | number | string;
export type RuntimeVariables = Record<string, RuntimeValue>;

const name = "[A-Za-z_][A-Za-z0-9_]*";
const literal = `(?:true|false|-?\\d+(?:\\.\\d+)?|"[^"\\r\\n]*"|'[^'\\r\\n]*')`;
const conditionPattern = new RegExp(`^(${name})\\s*(===|!==|>=|<=|>|<)\\s*(${literal})$`);
const actionPattern = new RegExp(`^variables\\.(${name})\\s*(=|\\+=|-=)\\s*(${literal})$`);

export function evaluateCondition(condition: string | undefined, variables: RuntimeVariables): { allowed: boolean; reason?: string } {
  if (!condition?.trim()) return { allowed: true };
  const match = conditionPattern.exec(condition.trim());
  if (!match) return { allowed: false, reason: "只支持变量与字面量比较" };
  const left = variables[match[1]];
  if (left === undefined) return { allowed: false, reason: `变量 ${match[1]} 未定义` };
  const right = parseLiteral(match[3]);
  switch (match[2]) {
    case "===": return { allowed: left === right };
    case "!==": return { allowed: left !== right };
    case ">": return { allowed: typeof left === "number" && typeof right === "number" && left > right };
    case ">=": return { allowed: typeof left === "number" && typeof right === "number" && left >= right };
    case "<": return { allowed: typeof left === "number" && typeof right === "number" && left < right };
    case "<=": return { allowed: typeof left === "number" && typeof right === "number" && left <= right };
    default: return { allowed: false, reason: "不支持的比较符" };
  }
}

export function applyAction(action: string | undefined, variables: RuntimeVariables): { variables: RuntimeVariables; error?: string } {
  if (!action?.trim()) return { variables: { ...variables } };
  const match = actionPattern.exec(action.trim());
  if (!match) return { variables: { ...variables }, error: "只支持 variables.name =/+=/-= 字面量" };
  const current = variables[match[1]];
  const value = parseLiteral(match[3]);
  if (current !== undefined && typeof current !== typeof value) return { variables: { ...variables }, error: "变量类型不匹配" };
  const next = match[2] === "=" ? value : arithmetic(match[2], current, value);
  if (next === undefined) return { variables: { ...variables }, error: "+= 和 -= 只支持数字变量" };
  return { variables: { ...variables, [match[1]]: next } };
}

function arithmetic(operator: string, current: RuntimeValue | undefined, value: RuntimeValue): RuntimeValue | undefined {
  if (typeof current !== "number" || typeof value !== "number") return undefined;
  return operator === "+=" ? current + value : current - value;
}

function parseLiteral(value: string): RuntimeValue {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.startsWith("\"") || value.startsWith("'")) return value.slice(1, -1);
  return Number(value);
}
