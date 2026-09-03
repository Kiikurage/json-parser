export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];

const SAFE_POW10_IN_DOUBLE = [
    1e0, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11,
    1e12, 1e13, 1e14, 1e15, 1e16, 1e17, 1e18, 1e19, 1e20, 1e21, 1e22,
];

interface State {
    input: string;
    position: number;
}

export function parse(input: string): JSONValue {
    const state = {input, position: 0}
    const value = parseValue(state);
    skipWhitespace(state);

    if (state.position !== state.input.length) {
        throw new SyntaxError("Unexpected end of input");
    }
    return value;
}

function parseValue(state: State): JSONValue {
    skipWhitespace(state);
    if (state.position < state.input.length) {
        switch (state.input[state.position]) {
            case '{':
                return parseObject(state);
            case '[':
                return parseArray(state);
            case '"':
                return parseString(state);
            case 't':
            case 'f':
                return parseBoolean(state);
            case 'n':
                return parseNull(state);
            default:
                return parseNumber(state);
        }
    }
    throw new SyntaxError("Unexpected end of input");
}

function parseObject(state: State): JSONObject {
    skipWhitespace(state);

    assertToken(state.input[state.position], '{');
    state.position++;

    skipWhitespace(state);
    if (state.input[state.position] === '}') {
        state.position++;
        return {};
    }

    const result: JSONObject = {};
    while (state.position < state.input.length) {
        const key = parseString(state);

        skipWhitespace(state);
        assertToken(state.input[state.position], ':');
        state.position++;

        Object.defineProperty(result, key, {
            value: parseValue(state),
            writable: true,
            enumerable: true,
            configurable: true,
        });

        skipWhitespace(state);
        if (state.input[state.position] === '}') {
            state.position++;
            return result;
        } else {
            assertToken(state.input[state.position], ',');
            state.position++;
        }
    }

    throw new SyntaxError("Unexpected end of input");
}

function parseString(state: State): string {
    skipWhitespace(state);
    assertToken(state.input[state.position], '"');
    state.position++;

    let value = '';

    let partFrom = state.position;
    while (state.position < state.input.length) {
        const c = state.input[state.position];
        state.position++;

        switch (c) {
            case '\\':
                value += state.input.slice(partFrom, state.position - 1);
                const c2 = state.input[state.position];
                state.position++;

                switch (c2) {
                    case '"':
                        value += '"';
                        break;
                    case '\\':
                        value += '\\';
                        break;
                    case '/':
                        value += '/';
                        break;
                    case 'b':
                        value += '\b';
                        break;
                    case 'f':
                        value += '\f';
                        break;
                    case 'n':
                        value += '\n';
                        break;
                    case 'r':
                        value += '\r';
                        break;
                    case 't':
                        value += '\t';
                        break;
                    case 'u':
                        const hex = state.input.slice(state.position, state.position + 4);
                        if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
                            throw new SyntaxError(`Invalid unicode escape sequence: \\u${hex}`);
                        }
                        value += String.fromCharCode(parseInt(hex, 16));
                        state.position += 4;
                        break;
                    default:
                        throw new SyntaxError(`Invalid escape sequence: \\${c2}`);
                }

                partFrom = state.position;
                break;
            case '"': {
                value += state.input.slice(partFrom, state.position - 1);
                return value;
            }
            default:
                if (c <= '\x1F') {
                    throw new SyntaxError("Control characters are not allowed in JSON strings");
                }
        }
    }
    throw new SyntaxError("Unexpected end of input");
}

function parseNumber(state: State): number {
    skipWhitespace(state);

    let isNegative = false;
    if (state.input[state.position] === '-') {
        isNegative = true;
        state.position++;
    }

    let numDigits = 0;
    let integer = 0n;
    if (state.input[state.position] === '0') {
        numDigits++;
        state.position++;
    } else {
        const digitStart = state.position;
        integer = parseDigits(state);
        numDigits = state.position - digitStart;
        if (state.position === digitStart) {
            throw new SyntaxError("Expected digit");
        }
    }

    let numFractionDigits = 0;
    let fractionDigits = 0n;
    if (state.input[state.position] === '.') {
        state.position++;
        const digitStart = state.position;
        fractionDigits = parseDigits(state);
        numFractionDigits = state.position - digitStart;
        if (numFractionDigits === 0) {
            throw new SyntaxError("Expected digit");
        }
    }

    let exponent = 0n;
    let isExponentNegative = false;
    if (state.input[state.position] === 'e' || state.input[state.position] === 'E') {
        state.position++;

        if (state.input[state.position] === '-') {
            isExponentNegative = true;
            state.position++;
        } else if (state.input[state.position] === '+') {
            state.position++;
        }

        const digitStart = state.position;
        exponent = parseDigits(state);
        if (state.position === digitStart) {
            throw new SyntaxError("Expected digit");
        }
    }
    if (isExponentNegative) {
        exponent = -exponent;
    }

    if (numFractionDigits === 0 && exponent === 0n) {
        return isNegative ? -Number(integer) : Number(integer);
    }

    let digits = integer * (10n ** BigInt(numFractionDigits)) + fractionDigits;
    if (digits === 0n && isNegative) {
        return -0;
    }

    const pow = exponent - BigInt(numFractionDigits);

    if (digits < (1n << 53n) && pow >= -22n && pow <= 22n) {
        // digits も 10**pow もdouble の範囲内なのでそのままdoubleにしてよい。
        // 丸め誤差は掛け算での1回のみ

        if (pow >= 0n) {
            const result = Number(digits) * SAFE_POW10_IN_DOUBLE[Number(pow)];
            return isNegative ? -result : result;
        } else {
            const result = Number(digits) / SAFE_POW10_IN_DOUBLE[Number(-pow)];
            return isNegative ? -result : result;
        }
    }

    // 指数が大きすぎる場合BigIntの計算が終わらなくなるため、計算をあらかじめ打ち切っておく
    const decimalExponent = pow + BigInt(numDigits);
    if (decimalExponent > 310n) return Infinity;
    if (decimalExponent < -330n) return 0;

    let value: number;
    if (pow >= 0n) {
        value = Number(digits * (10n ** pow))
    } else {
        const denominator = 10n ** (-pow);

        // doubleの仮数部53bit分の精度を確保したい
        // -> 53bit分の整数をBigIntで作り、doubleに変換してから指数部を調整する

        // このまま計算すると得られるbit数をまず確認. ただしdigits/denominatorの計算は
        // BigIntの切り捨てが発生してしまうため使えない。とくにdenominator側が非常に大きい場合
        // 0に潰れてしまう。

        // bitLength(digits / denominator)
        // ≒ bitLength(digits) - bitLength(denominator)
        // この計算は誤差を含むため、あとで実際に53ビットの精度がでていなければ補正している
        const precision = bitLength(digits) - bitLength(denominator);

        if (precision < 53) {
            // 53bit分の精度が確保できないので分子を2のべきでシフトして精度を確保する
            // 最大1074bitまでシフトできるので、精度が53bitになるようにシフトする
            let exp = Math.min(52 - precision, 1074);
            let div = roundedDiv(digits << BigInt(exp), denominator);
            if (exp !== 1074) {
                // 実際に計算してみて、53bit分の精度が確保できているか確認する
                // 53bit分の精度が確保できていない場合は調整が必要
                if (bitLength(div) === 52) {
                    exp += 1;
                    div = roundedDiv(digits << BigInt(exp), denominator);
                } else if (bitLength(div) === 54) {
                    exp -= 1;
                    div = roundedDiv(digits << BigInt(exp), denominator);
                }
            }
            // 2のべきでシフトした分を指数部で調整する
            // 指数部の調整なので仮数部の精度には影響しない
            value = ldexp(Number(div), -exp);
        } else {
            let exp = Math.min(precision - 52, 1023);
            let div = roundedDiv(digits, denominator << BigInt(exp));
            if (exp !== 1023) {
                if (bitLength(div) === 52) {
                    exp -= 1;
                    div = roundedDiv(digits, denominator << BigInt(exp));
                } else if (bitLength(div) === 54) {
                    exp += 1;
                    div = roundedDiv(digits, denominator << BigInt(exp));
                }
            }
            value = ldexp(Number(div), exp);
        }
    }

    if (isNegative) {
        value = -value;
    }
    return value;
}

// load exponent. 非常に大きな2のべき乗をかける際に使う。
// 指数が大きすぎると2のべき乗を直接作れない(Infinityになってしまう)ため、
// 精度を保ったまま2のべき乗をかけるために、分割して計算する
function ldexp(m: number, exp: number): number {
    while (exp > 1023) {
        m *= 2 ** 1023;
        exp -= 1023;
    }
    while (exp < -1074) {
        m *= 2 ** -1074;
        exp += 1074;
    }
    return m * 2 ** exp;
}

function bitLength(n: bigint): number {
    if (n < 0n) n = -n;
    let bit = 0;
    while (n > 0n) {
        n >>= 1n;
        bit++;
    }
    return bit;
}

// 通常切り捨てであるbigintの割り算を四捨五入で行う
// ちょうど x.5 の場合は、偶数側に丸める
function roundedDiv(numerator: bigint, denominator: bigint): bigint {
    const mod = numerator % denominator;
    let div = numerator / denominator;
    if (mod * 2n > denominator) {
        div += 1n;
    } else if (mod * 2n === denominator) {
        if ((div & 1n) === 1n) {
            div += 1n;
        }
    }
    return div;
}

function parseDigits(state: State): bigint {
    let digits = 0;
    let digitsBigInt = 0n;

    while (state.position < state.input.length) {
        if (digits >= Number.MAX_SAFE_INTEGER / 10) {
            break
        }

        switch (state.input[state.position]) {
            case '0':
                digits = digits * 10;
                break
            case '1':
                digits = digits * 10 + 1;
                break
            case '2':
                digits = digits * 10 + 2;
                break
            case '3':
                digits = digits * 10 + 3;
                break
            case '4':
                digits = digits * 10 + 4;
                break
            case '5':
                digits = digits * 10 + 5;
                break
            case '6':
                digits = digits * 10 + 6;
                break
            case '7':
                digits = digits * 10 + 7;
                break
            case '8':
                digits = digits * 10 + 8;
                break
            case '9':
                digits = digits * 10 + 9;
                break
            default:
                return BigInt(digits);
        }
        state.position++;
    }
    digitsBigInt = BigInt(digits);

    while (state.position < state.input.length) {
        switch (state.input[state.position]) {
            case '0':
                digitsBigInt = digitsBigInt * 10n;
                break
            case '1':
                digitsBigInt = digitsBigInt * 10n + 1n;
                break
            case '2':
                digitsBigInt = digitsBigInt * 10n + 2n;
                break
            case '3':
                digitsBigInt = digitsBigInt * 10n + 3n;
                break
            case '4':
                digitsBigInt = digitsBigInt * 10n + 4n;
                break
            case '5':
                digitsBigInt = digitsBigInt * 10n + 5n;
                break
            case '6':
                digitsBigInt = digitsBigInt * 10n + 6n;
                break
            case '7':
                digitsBigInt = digitsBigInt * 10n + 7n;
                break
            case '8':
                digitsBigInt = digitsBigInt * 10n + 8n;
                break
            case '9':
                digitsBigInt = digitsBigInt * 10n + 9n;
                break
            default:
                return digitsBigInt;
        }
        state.position++;
    }

    return digitsBigInt;
}

function parseBoolean(state: State): boolean {
    skipWhitespace(state);
    if (state.input.slice(state.position, state.position + 4) === "true") {
        state.position += 4;
        return true;
    } else if (state.input.slice(state.position, state.position + 5) === "false") {
        state.position += 5;
        return false;
    }
    throw new SyntaxError('Expected boolean value');
}

function parseNull(state: State): null {
    skipWhitespace(state);
    assertToken(state.input.slice(state.position, state.position + 4), "null");
    state.position += 4;

    return null;
}

function parseArray(state: State): JSONArray {
    skipWhitespace(state);
    assertToken(state.input[state.position], '[');
    state.position++;

    skipWhitespace(state);
    if (state.input[state.position] === ']') {
        state.position++;
        return [];
    }

    const result: JSONArray = [];
    while (state.position < state.input.length) {
        skipWhitespace(state);
        result.push(parseValue(state))
        skipWhitespace(state);
        if (state.input[state.position] === ']') {
            state.position++;
            return result;
        } else {
            assertToken(state.input[state.position], ',');
            state.position++;
        }
    }

    throw new SyntaxError("Unexpected end of input");
}

function skipWhitespace(state: State) {
    while (state.position < state.input.length) {
        const c = state.input[state.position];
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
            state.position++;
        } else {
            break;
        }
    }
}

function assertToken<T extends string>(actual: unknown, expected: T): asserts actual is T {
    if (actual !== expected) {
        throw new SyntaxError(`Expected token '${expected}', but got '${actual}'`);
    }
}