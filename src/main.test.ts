import { describe, expect, test } from "bun:test";
import { parse } from "./main.ts";

describe("null のパース", () => {
    test("null をパースできる", () => {
        expect(parse("null")).toBe(null);
    });

    test("前後に空白があってもパースできる", () => {
        expect(parse("  \t\r\n null  ")).toBe(null);
    });

    test("nul のような不完全な入力はエラーになる", () => {
        expect(() => parse("nul")).toThrow();
    });

    test("nulls のような余計な文字を含む入力はエラーになる", () => {
        expect(() => parse("nulls")).toThrow();
    });
});

describe("真偽値のパース", () => {
    test("true をパースできる", () => {
        expect(parse("true")).toBe(true);
    });

    test("false をパースできる", () => {
        expect(parse("false")).toBe(false);
    });

    test("前後に空白があってもパースできる", () => {
        expect(parse("   true ")).toBe(true);
    });

    test("大文字の True はエラーになる", () => {
        expect(() => parse("True")).toThrow();
    });

    test("tru のような不完全な入力はエラーになる", () => {
        expect(() => parse("tru")).toThrow();
    });

    test("fals のような不完全な入力はエラーになる", () => {
        expect(() => parse("fals")).toThrow();
    });
});

describe("文字列のパース", () => {
    test("空文字列をパースできる", () => {
        expect(parse('""')).toBe("");
    });

    test("通常の文字列をパースできる", () => {
        expect(parse('"hello"')).toBe("hello");
    });

    test("日本語を含む文字列をパースできる", () => {
        expect(parse('"こんにちは"')).toBe("こんにちは");
    });

    test("空白を含む文字列をパースできる", () => {
        expect(parse('"hello world"')).toBe("hello world");
    });

    test("絵文字（サロゲートペア）を含む文字列をパースできる", () => {
        expect(parse('"🍣寿司"')).toBe("🍣寿司");
    });

    test("エスケープされたダブルクォートをパースできる", () => {
        expect(parse('"say \\"hi\\""')).toBe('say "hi"');
    });

    test("エスケープされたバックスラッシュをパースできる", () => {
        expect(parse('"a\\\\b"')).toBe("a\\b");
    });

    test("スラッシュのエスケープをパースできる", () => {
        expect(parse('"a\\/b"')).toBe("a/b");
    });

    test("改行のエスケープをパースできる", () => {
        expect(parse('"a\\nb"')).toBe("a\nb");
    });

    test("タブのエスケープをパースできる", () => {
        expect(parse('"a\\tb"')).toBe("a\tb");
    });

    test("復帰・バックスペース・改ページのエスケープをパースできる", () => {
        expect(parse('"\\r\\b\\f"')).toBe("\r\b\f");
    });

    test("Unicode エスケープをパースできる", () => {
        expect(parse('"\\u3042"')).toBe("あ");
    });

    test("サロゲートペアの Unicode エスケープをパースできる", () => {
        expect(parse('"\\ud83c\\udf63"')).toBe("🍣");
    });

    test("閉じクォートがない場合はエラーになる", () => {
        expect(() => parse('"hello')).toThrow();
    });

    test("末尾がバックスラッシュだけの場合はエラーになる", () => {
        expect(() => parse('"hello\\"')).toThrow();
    });

    test("シングルクォートの文字列はエラーになる", () => {
        expect(() => parse("'hello'")).toThrow();
    });
});

describe("数値のパース", () => {
    test("0 をパースできる", () => {
        expect(parse("0")).toBe(0);
    });

    test("正の整数をパースできる", () => {
        expect(parse("123")).toBe(123);
    });

    test("負の整数をパースできる", () => {
        expect(parse("-123")).toBe(-123);
    });

    test("小数をパースできる", () => {
        expect(parse("3.14")).toBe(3.14);
    });

    test("負の小数をパースできる", () => {
        expect(parse("-0.5")).toBe(-0.5);
    });

    test("指数表記をパースできる", () => {
        expect(parse("1e3")).toBe(1000);
    });

    test("大文字 E の指数表記をパースできる", () => {
        expect(parse("1E3")).toBe(1000);
    });

    test("符号付き指数表記をパースできる", () => {
        expect(parse("1.5e-3")).toBe(0.0015);
        expect(parse("2e+2")).toBe(200);
    });

    test("前後に空白があってもパースできる", () => {
        expect(parse("  42  ")).toBe(42);
    });

    test("先頭ゼロ付きの数値はエラーになる", () => {
        expect(() => parse("01")).toThrow();
    });

    test("先頭にプラス記号がある数値はエラーになる", () => {
        expect(() => parse("+1")).toThrow();
    });

    test("小数点で終わる数値はエラーになる", () => {
        expect(() => parse("1.")).toThrow();
    });

    test("小数点で始まる数値はエラーになる", () => {
        expect(() => parse(".5")).toThrow();
    });

    test("指数部が欠けている数値はエラーになる", () => {
        expect(() => parse("1e")).toThrow();
    });

    test("マイナス記号だけの入力はエラーになる", () => {
        expect(() => parse("-")).toThrow();
    });
});

describe("配列のパース", () => {
    test("空配列をパースできる", () => {
        expect(parse("[]")).toEqual([]);
    });

    test("空白のみを含む空配列をパースできる", () => {
        expect(parse("[  \n ]")).toEqual([]);
    });

    test("要素が1つの配列をパースできる", () => {
        expect(parse("[1]")).toEqual([1]);
    });

    test("複数要素の配列をパースできる", () => {
        expect(parse("[1, 2, 3]")).toEqual([1, 2, 3]);
    });

    test("異なる型が混在する配列をパースできる", () => {
        expect(parse('[1, "two", true, null]')).toEqual([1, "two", true, null]);
    });

    test("ネストした配列をパースできる", () => {
        expect(parse("[[1, 2], [3, [4]]]")).toEqual([[1, 2], [3, [4]]]);
    });

    test("要素間に改行やタブがあってもパースできる", () => {
        expect(parse("[\n\t1,\n\t2\n]")).toEqual([1, 2]);
    });

    test("閉じ括弧がない配列はエラーになる", () => {
        expect(() => parse("[1, 2")).toThrow();
    });

    test("末尾にカンマがある配列はエラーになる", () => {
        expect(() => parse("[1, 2,]")).toThrow();
    });

    test("カンマ区切りがない配列はエラーになる", () => {
        expect(() => parse("[1 2]")).toThrow();
    });

    test("カンマのみの配列はエラーになる", () => {
        expect(() => parse("[,]")).toThrow();
    });
});

describe("オブジェクトのパース", () => {
    test("空オブジェクトをパースできる", () => {
        expect(parse("{}")).toEqual({});
    });

    test("空白のみを含む空オブジェクトをパースできる", () => {
        expect(parse("{  \n }")).toEqual({});
    });

    test("キーが1つのオブジェクトをパースできる", () => {
        expect(parse('{"a": 1}')).toEqual({ a: 1 });
    });

    test("複数キーのオブジェクトをパースできる", () => {
        expect(parse('{"a": 1, "b": "two", "c": null}')).toEqual({ a: 1, b: "two", c: null });
    });

    test("空文字列のキーをパースできる", () => {
        expect(parse('{"": 1}')).toEqual({ "": 1 });
    });

    test("ネストしたオブジェクトをパースできる", () => {
        expect(parse('{"a": {"b": {"c": 1}}}')).toEqual({ a: { b: { c: 1 } } });
    });

    test("配列を値に持つオブジェクトをパースできる", () => {
        expect(parse('{"a": [1, {"b": 2}]}')).toEqual({ a: [1, { b: 2 }] });
    });

    test("コロンやカンマ周りに空白があってもパースできる", () => {
        expect(parse('{ "a" : 1 , "b" : 2 }')).toEqual({ a: 1, b: 2 });
    });

    test("閉じ括弧がないオブジェクトはエラーになる", () => {
        expect(() => parse('{"a": 1')).toThrow();
    });

    test("末尾にカンマがあるオブジェクトはエラーになる", () => {
        expect(() => parse('{"a": 1,}')).toThrow();
    });

    test("コロンがないオブジェクトはエラーになる", () => {
        expect(() => parse('{"a" 1}')).toThrow();
    });

    test("値がないオブジェクトはエラーになる", () => {
        expect(() => parse('{"a": }')).toThrow();
    });

    test("キーが文字列でないオブジェクトはエラーになる", () => {
        expect(() => parse("{a: 1}")).toThrow();
    });
});

describe("不正な入力", () => {
    test("空文字列はエラーになる", () => {
        expect(() => parse("")).toThrow();
    });

    test("空白のみの入力はエラーになる", () => {
        expect(() => parse("   \n\t ")).toThrow();
    });

    test("未知のトークンはエラーになる", () => {
        expect(() => parse("undefined")).toThrow();
    });

    test("閉じ括弧のみの入力はエラーになる", () => {
        expect(() => parse("]")).toThrow();
    });
});

describe("複合的な JSON", () => {
    const json = `{
        "name": "テスト",
        "version": 2,
        "tags": ["a", "b"],
        "nested": { "flag": false, "value": null, "ratio": -1.5e2 },
        "empty": {},
        "list": []
    }`;

    test("入れ子を含む JSON 全体をパースできる", () => {
        expect(parse(json)).toEqual({
            name: "テスト",
            version: 2,
            tags: ["a", "b"],
            nested: { flag: false, value: null, ratio: -150 },
            empty: {},
            list: [],
        });
    });

    test("JSON.parse と同じ結果になる", () => {
        expect(parse(json)).toEqual(JSON.parse(json));
    });
});

describe("入力末尾の余分なデータ", () => {
    test("値のあとにゴミが続く入力はエラーになる", () => {
        expect(() => parse("null junk")).toThrow();
    });

    test("null が2つ連続する入力はエラーになる", () => {
        expect(() => parse("nullnull")).toThrow();
    });

    test("true のあとに false が続く入力はエラーになる", () => {
        expect(() => parse("truefalse")).toThrow();
    });

    test("配列のあとに閉じ括弧が余る入力はエラーになる", () => {
        expect(() => parse("[]]")).toThrow();
    });

    test("数値が空白区切りで2つ並ぶ入力はエラーになる", () => {
        expect(() => parse("1 2")).toThrow();
    });

    test("文字列のあとに文字列が続く入力はエラーになる", () => {
        expect(() => parse('"a" "b"')).toThrow();
    });

    test("オブジェクトのあとにカンマが余る入力はエラーになる", () => {
        expect(() => parse("{} ,")).toThrow();
    });

    test("値のあとの空白だけなら許容される", () => {
        expect(parse("null   \n")).toBe(null);
    });
});

describe("null / 真偽値の境界", () => {
    test("null のあとに文字が続く nullx はエラーになる", () => {
        expect(() => parse("nullx")).toThrow();
    });

    test("配列内の null を正しくパースできる", () => {
        expect(parse("[null]")).toEqual([null]);
    });

    test("配列内に null が複数あってもパースできる", () => {
        expect(parse("[null, null]")).toEqual([null, null]);
    });

    test("オブジェクトの値が null でもパースできる", () => {
        expect(parse('{"a": null}')).toEqual({ a: null });
    });

    test("null の直後がカンマでも位置がずれない", () => {
        expect(parse("[null, 1]")).toEqual([null, 1]);
    });

    test("truex はエラーになる", () => {
        expect(() => parse("truex")).toThrow();
    });

    test("配列内の true / false をパースできる", () => {
        expect(parse("[true, false]")).toEqual([true, false]);
    });

    test("大文字の NULL はエラーになる", () => {
        expect(() => parse("NULL")).toThrow();
    });
});

describe("配列の要素が失われないこと", () => {
    test("要素1つの配列で要素が消えない", () => {
        expect(parse("[1]")).toEqual([1]);
    });

    test("要素2つの配列で要素が消えない", () => {
        expect(parse("[1, 2]")).toEqual([1, 2]);
    });

    test("末尾要素まで含めて長さが一致する", () => {
        expect(parse("[1, 2, 3, 4, 5]")).toEqual([1, 2, 3, 4, 5]);
    });

    test("文字列だけの配列で要素が消えない", () => {
        expect(parse('["a"]')).toEqual(["a"]);
    });

    test("真偽値だけの配列で要素が消えない", () => {
        expect(parse("[true]")).toEqual([true]);
    });

    test("ネストした空配列を含む配列で要素が消えない", () => {
        expect(parse("[[]]")).toEqual([[]]);
    });

    test("空配列を2つ含む配列で要素が消えない", () => {
        expect(parse("[[], []]")).toEqual([[], []]);
    });

    test("入れ子の内側の配列の要素も消えない", () => {
        expect(parse("[[1, 2]]")).toEqual([[1, 2]]);
    });

    test("100 要素の配列をすべて保持できる", () => {
        const source = `[${Array.from({ length: 100 }, (_, i) => i).join(",")}]`;
        expect(parse(source)).toEqual(Array.from({ length: 100 }, (_, i) => i));
    });

    test("末尾がカンマ + 空白の配列はエラーになる", () => {
        expect(() => parse("[1, ]")).toThrow();
    });

    test("先頭がカンマの配列はエラーになる", () => {
        expect(() => parse("[,1]")).toThrow();
    });

    test("カンマが連続する配列はエラーになる", () => {
        expect(() => parse("[1,,2]")).toThrow();
    });

    test("閉じ括弧の種類が違う配列はエラーになる", () => {
        expect(() => parse("[1}")).toThrow();
    });

    test("開き括弧だけの入力はエラーになる", () => {
        expect(() => parse("[")).toThrow();
    });

    test("深くネストした配列をパースできる", () => {
        const depth = 50;
        const source = "[".repeat(depth) + "]".repeat(depth);
        let expected: unknown = [];
        for (let i = 1; i < depth; i++) expected = [expected];
        expect(parse(source)).toEqual(expected);
    });
});

describe("文字列のエスケープの意地悪ケース", () => {
    test("バックスラッシュだけの文字列をパースできる", () => {
        expect(parse('"\\\\"')).toBe("\\");
    });

    test("バックスラッシュで終わる文字列でも閉じクォートを見失わない", () => {
        expect(parse('"a\\\\"')).toBe("a\\");
    });

    test("バックスラッシュ2つで終わる文字列をパースできる", () => {
        expect(parse('"\\\\\\\\"')).toBe("\\\\");
    });

    test("エスケープされたクォートで文字列が終わらない", () => {
        expect(parse('"\\""')).toBe('"');
    });

    test("配列内のエスケープ入り文字列でも境界を誤らない", () => {
        expect(parse('["a\\\\", "b"]')).toEqual(["a\\", "b"]);
    });

    test("未定義のエスケープ \\x はエラーになる", () => {
        expect(() => parse('"\\x"')).toThrow();
    });

    test("エスケープされていない生の改行を含む文字列はエラーになる", () => {
        expect(() => parse('"a\nb"')).toThrow();
    });

    test("エスケープされていない生のタブを含む文字列はエラーになる", () => {
        expect(() => parse('"a\tb"')).toThrow();
    });

    test("制御文字 U+0000 のエスケープをパースできる", () => {
        expect(parse('"\\u0000"')).toBe("\u0000");
    });

    test("桁が足りない Unicode エスケープはエラーになる", () => {
        expect(() => parse('"\\u12"')).toThrow();
    });

    test("16進でない Unicode エスケープはエラーになる", () => {
        expect(() => parse('"\\uZZZZ"')).toThrow();
    });

    test("大文字16進の Unicode エスケープをパースできる", () => {
        expect(parse('"\\u3042\\u3044"')).toBe("あい");
    });

    test("エスケープの連続をすべて解釈できる", () => {
        expect(parse('"\\\\n"')).toBe("\\n");
    });

    test("バックスラッシュのあとに文字列終端が来る場合はエラーになる", () => {
        expect(() => parse('"abc\\')).toThrow();
    });
});

describe("数値の意地悪ケース", () => {
    test("-0 をパースできる", () => {
        expect(Object.is(parse("-0"), -0)).toBe(true);
    });

    test("0.0 をパースできる", () => {
        expect(parse("0.0")).toBe(0);
    });

    test("非常に大きな整数をパースできる", () => {
        const source = "123456789012345678901234567890";
        expect(parse(source)).toBe(JSON.parse(source));
    });

    test("非常に小さい指数をパースできる", () => {
        expect(parse("1e-320")).toBe(1e-320);
    });

    test("指数の桁が大きい場合は Infinity になる", () => {
        expect(parse("1e999")).toBe(Infinity);
    });

    test("00 はエラーになる", () => {
        expect(() => parse("00")).toThrow();
    });

    test("-01 はエラーになる", () => {
        expect(() => parse("-01")).toThrow();
    });

    test("0x10 のような16進表記はエラーになる", () => {
        expect(() => parse("0x10")).toThrow();
    });

    test("Infinity はエラーになる", () => {
        expect(() => parse("Infinity")).toThrow();
    });

    test("NaN はエラーになる", () => {
        expect(() => parse("NaN")).toThrow();
    });

    test("1e+ はエラーになる", () => {
        expect(() => parse("1e+")).toThrow();
    });

    test("1.2.3 はエラーになる", () => {
        expect(() => parse("1.2.3")).toThrow();
    });

    test("--1 はエラーになる", () => {
        expect(() => parse("--1")).toThrow();
    });

    test("数値の直後に文字が続く 1abc はエラーになる", () => {
        expect(() => parse("1abc")).toThrow();
    });

    test("配列内の数値の直後がカンマでも位置がずれない", () => {
        expect(parse("[1,2]")).toEqual([1, 2]);
    });

    test("全角数字はエラーになる", () => {
        expect(() => parse("１")).toThrow();
    });
});

describe("オブジェクトの意地悪ケース", () => {
    test("キーが重複する場合は後勝ちになる", () => {
        expect(parse('{"a": 1, "a": 2}')).toEqual({ a: 2 });
    });

    test("__proto__ をキーに持っても自身のプロパティになる", () => {
        const result = parse('{"__proto__": 1}') as Record<string, unknown>;
        expect(Object.prototype.hasOwnProperty.call(result, "__proto__")).toBe(true);
        expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    });

    test("constructor をキーに持ってもパースできる", () => {
        expect(parse('{"constructor": 1}')).toEqual({ constructor: 1 } as never);
    });

    test("エスケープを含むキーを解釈できる", () => {
        expect(parse('{"a\\nb": 1}')).toEqual({ "a\nb": 1 });
    });

    test("Unicode エスケープのキーを解釈できる", () => {
        expect(parse('{"\\u3042": 1}')).toEqual({ あ: 1 });
    });

    test("キーと値のあいだに改行があってもパースできる", () => {
        expect(parse('{\n"a"\n:\n1\n}')).toEqual({ a: 1 });
    });

    test("コロンが2つあるオブジェクトはエラーになる", () => {
        expect(() => parse('{"a":: 1}')).toThrow();
    });

    test("カンマが連続するオブジェクトはエラーになる", () => {
        expect(() => parse('{"a": 1,, "b": 2}')).toThrow();
    });

    test("先頭がカンマのオブジェクトはエラーになる", () => {
        expect(() => parse('{, "a": 1}')).toThrow();
    });

    test("キーだけで値がないオブジェクトはエラーになる", () => {
        expect(() => parse('{"a"}')).toThrow();
    });

    test("閉じ括弧の種類が違うオブジェクトはエラーになる", () => {
        expect(() => parse('{"a": 1]')).toThrow();
    });

    test("開き括弧だけの入力はエラーになる", () => {
        expect(() => parse("{")).toThrow();
    });

    test("深くネストしたオブジェクトをパースできる", () => {
        const depth = 30;
        const source = '{"a":'.repeat(depth) + "1" + "}".repeat(depth);
        let expected: unknown = 1;
        for (let i = 0; i < depth; i++) expected = { a: expected };
        expect(parse(source)).toEqual(expected as never);
    });

    test("配列とオブジェクトが交互にネストしてもパースできる", () => {
        expect(parse('{"a": [{"b": [{"c": []}]}]}')).toEqual({ a: [{ b: [{ c: [] }] }] });
    });
});

describe("空白文字の扱い", () => {
    test("改行のみで区切られた配列をパースできる", () => {
        expect(parse("[\n1\n,\n2\n]")).toEqual([1, 2]);
    });

    test("CRLF を含む入力をパースできる", () => {
        expect(parse('{\r\n"a": 1\r\n}')).toEqual({ a: 1 });
    });

    test("垂直タブは空白として扱われずエラーになる", () => {
        expect(() => parse("\v null")).toThrow();
    });

    test("改ページは空白として扱われずエラーになる", () => {
        expect(() => parse("\f null")).toThrow();
    });

    test("ノーブレークスペースは空白として扱われずエラーになる", () => {
        expect(() => parse("\u00a0null")).toThrow();
    });

    test("BOM 付きの入力はエラーになる", () => {
        expect(() => parse("\ufeffnull")).toThrow();
    });
});

describe("JSON.parse との一致", () => {
    const validCases = [
        "null",
        "true",
        "false",
        "0",
        "-1.5e3",
        '"escaped: \\\\ \\" \\n \\u3042"',
        "[]",
        "{}",
        "[1, [2, [3, []]]]",
        '{"a": [1, 2, {"b": null}], "c": {"d": []}}',
        '[{"x": 1}, {"x": 2}]',
    ];

    for (const source of validCases) {
        test(`正しい JSON と同じ結果になる: ${source}`, () => {
            expect(parse(source)).toEqual(JSON.parse(source));
        });
    }

    const invalidCases = [
        "",
        "'a'",
        "[1,]",
        '{"a":}',
        "{'a':1}",
        "[01]",
        "tru",
        "undefined",
        "[1 2]",
        '"unterminated',
        "1 2",
    ];

    for (const source of invalidCases) {
        test(`不正な JSON でエラーになる: ${JSON.stringify(source)}`, () => {
            expect(() => JSON.parse(source)).toThrow();
            expect(() => parse(source)).toThrow();
        });
    }
});

describe("文字列中の制御文字（網羅）", () => {
    const controlChars = Array.from({ length: 0x20 }, (_, i) => i);

    for (const code of controlChars) {
        const hex = code.toString(16).padStart(2, "0").toUpperCase();
        test(`U+00${hex} が生で含まれる文字列はエラーになる`, () => {
            expect(() => parse(`"a${String.fromCharCode(code)}b"`)).toThrow();
        });
    }

    test("DEL (U+007F) は生で含まれてもパースできる", () => {
        expect(parse('"a\u007fb"')).toBe("a\u007fb");
    });

    test("制御文字はエスケープすればパースできる", () => {
        expect(parse('"\\u001f"')).toBe("\u001f");
    });

    test("制御文字を含むキーはエラーになる", () => {
        expect(() => parse(`{"a${String.fromCharCode(0x01)}": 1}`)).toThrow();
    });
});

describe("サロゲートと Unicode の境界", () => {
    test("単独の上位サロゲートを JSON.parse と同じく受け入れる", () => {
        const source = '"\\ud83c"';
        expect(parse(source)).toBe(JSON.parse(source));
    });

    test("単独の下位サロゲートを JSON.parse と同じく受け入れる", () => {
        const source = '"\\udf63"';
        expect(parse(source)).toBe(JSON.parse(source));
    });

    test("順序が逆のサロゲートペアも JSON.parse と同じ結果になる", () => {
        const source = '"\\udf63\\ud83c"';
        expect(parse(source)).toBe(JSON.parse(source));
    });

    test("サロゲートペアの長さが 2 になる", () => {
        expect((parse('"\\ud83c\\udf63"') as string).length).toBe(2);
    });

    test("U+FFFF のエスケープをパースできる", () => {
        expect(parse('"\\uffff"')).toBe("\uffff");
    });

    test("\\u のあとが 4 桁未満で文字列が終わる場合はエラーになる", () => {
        expect(() => parse('"\\u00"')).toThrow();
    });

    test("\\u のあとの 4 文字に閉じクォートが混ざる場合はエラーになる", () => {
        expect(() => parse('"\\u12"3"')).toThrow();
    });

    test("\\u のあとに空白が混ざる場合はエラーになる", () => {
        expect(() => parse('"\\u 123"')).toThrow();
    });

    test("大文字 \\U のエスケープはエラーになる", () => {
        expect(() => parse('"\\U0041"')).toThrow();
    });

    test("\\0 のエスケープはエラーになる", () => {
        expect(() => parse('"\\0"')).toThrow();
    });

    test("\\v のエスケープはエラーになる", () => {
        expect(() => parse('"\\v"')).toThrow();
    });

    test("\\' のエスケープはエラーになる", () => {
        expect(() => parse("\"\\'\"")).toThrow();
    });

    test("改行をエスケープした行継続はエラーになる", () => {
        expect(() => parse('"a\\\nb"')).toThrow();
    });
});

describe("数値の精度", () => {
    const precisionCases = [
        "1.1",
        "8.7",
        "0.1",
        "0.3",
        "2.675",
        "1.005",
        "0.000001",
        "1e-7",
        "123.456",
        "9007199254740993",
        "1.7976931348623157e308",
        "5e-324",
        "0.1e1",
        "1000000000000000000000",
        "1.2345678901234567",
    ];

    for (const source of precisionCases) {
        test(`JSON.parse と同じ値になる: ${source}`, () => {
            expect(parse(source)).toBe(JSON.parse(source));
        });
    }

    test("負の数でも JSON.parse と同じ値になる", () => {
        expect(parse("-8.7")).toBe(JSON.parse("-8.7"));
    });

    test("小数の総和が JSON.parse と一致する", () => {
        const source = "[0.1, 0.2, 0.3, 0.7, 8.7, 1.1]";
        expect(parse(source)).toEqual(JSON.parse(source));
    });
});

describe("数値の極端な入力", () => {
    test("指数が巨大な場合は Infinity になる", () => {
        expect(parse("1e99999999999999999999")).toBe(Infinity);
    });

    test("指数が巨大な負値の場合は 0 になる", () => {
        expect(parse("1e-99999999999999999999")).toBe(0);
    });

    test("-0.0 は -0 になる", () => {
        expect(Object.is(parse("-0.0"), -0)).toBe(true);
    });

    test("-0e0 は -0 になる", () => {
        expect(Object.is(parse("-0e0"), -0)).toBe(true);
    });

    test("0 に指数が付いても 0 のままになる", () => {
        expect(parse("0e100")).toBe(0);
    });

    test("先頭ゼロのあとに小数点が続く 0.5 はパースできる", () => {
        expect(parse("0.5")).toBe(0.5);
    });

    test("先頭ゼロのあとに数字が続く 0123 はエラーになる", () => {
        expect(() => parse("0123")).toThrow();
    });

    test("-0 のあとに数字が続く -00 はエラーになる", () => {
        expect(() => parse("-00")).toThrow();
    });

    test("小数点のあとに指数が続く 1.e5 はエラーになる", () => {
        expect(() => parse("1.e5")).toThrow();
    });

    test("指数のあとに小数点が続く 1e1.5 はエラーになる", () => {
        expect(() => parse("1e1.5")).toThrow();
    });

    test("指数記号が2つある 1e2e3 はエラーになる", () => {
        expect(() => parse("1e2e3")).toThrow();
    });

    test("数字の途中にアンダースコアがある 1_000 はエラーになる", () => {
        expect(() => parse("1_000")).toThrow();
    });

    test("末尾に n が付く BigInt リテラルはエラーになる", () => {
        expect(() => parse("1n")).toThrow();
    });

    test("小数点だけの入力はエラーになる", () => {
        expect(() => parse(".")).toThrow();
    });

    test("e だけの入力はエラーになる", () => {
        expect(() => parse("e")).toThrow();
    });

    test("小数部が 0 だけの 1.000 をパースできる", () => {
        expect(parse("1.000")).toBe(1);
    });

    test("小数部の桁数が多くても JSON.parse と一致する", () => {
        const source = "0.00000000000000000000001";
        expect(parse(source)).toBe(JSON.parse(source));
    });

    test("整数部の桁数が多くても JSON.parse と一致する", () => {
        const source = "10000000000000000000000000000000000";
        expect(parse(source)).toBe(JSON.parse(source));
    });
});

describe("パース位置がずれないこと", () => {
    test("数値のあとの区切りを見失わない", () => {
        expect(parse('{"a": 1, "b": 2}')).toEqual({ a: 1, b: 2 });
    });

    test("指数付き数値のあとの区切りを見失わない", () => {
        expect(parse("[1e2, 3]")).toEqual([100, 3]);
    });

    test("小数のあとの閉じ括弧を見失わない", () => {
        expect(parse("[1.5]")).toEqual([1.5]);
    });

    test("0 のあとの閉じ括弧を見失わない", () => {
        expect(parse("[0]")).toEqual([0]);
    });

    test("負の数のあとの区切りを見失わない", () => {
        expect(parse("[-1,-2]")).toEqual([-1, -2]);
    });

    test("空白なしのオブジェクトをパースできる", () => {
        expect(parse('{"a":1,"b":[2,3],"c":{"d":true}}')).toEqual({ a: 1, b: [2, 3], c: { d: true } });
    });

    test("空オブジェクトを値に持つ配列をパースできる", () => {
        expect(parse("[{},{}]")).toEqual([{}, {}]);
    });

    test("空配列を値に持つオブジェクトをパースできる", () => {
        expect(parse('{"a":[],"b":[]}')).toEqual({ a: [], b: [] });
    });

    test("文字列のあとの区切りを見失わない", () => {
        expect(parse('["a","b"]')).toEqual(["a", "b"]);
    });

    test("エスケープを含む文字列のあとの区切りを見失わない", () => {
        expect(parse('["a\\"b","c"]')).toEqual(['a"b', "c"]);
    });
});

describe("オブジェクトのプロトタイプ汚染", () => {
    test("__proto__ キーがプロトタイプを差し替えない", () => {
        const result = parse('{"__proto__": {"polluted": true}}') as Record<string, unknown>;
        expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    test("__proto__ キーが自身の列挙可能プロパティになる", () => {
        const result = parse('{"__proto__": 1}') as Record<string, unknown>;
        expect(Object.keys(result)).toEqual(["__proto__"]);
    });

    test("エスケープで書いた __proto__ キーも同様に扱われる", () => {
        const result = parse('{"__proto__\\u0000": 1}') as Record<string, unknown>;
        expect(Object.keys(result)).toEqual(["__proto__\u0000"]);
    });

    test("toString キーで上書きしてもオブジェクトが壊れない", () => {
        const result = parse('{"toString": 1}') as Record<string, unknown>;
        expect(result.toString).toBe(1);
        expect(Object.keys(result)).toEqual(["toString"]);
    });

    test("hasOwnProperty キーを持ってもパースできる", () => {
        const result = parse('{"hasOwnProperty": 1}') as Record<string, unknown>;
        expect(Object.keys(result)).toEqual(["hasOwnProperty"]);
    });

    test("重複キーが上書きされ列挙は1つだけになる", () => {
        const result = parse('{"a": 1, "b": 2, "a": 3}') as Record<string, unknown>;
        expect(Object.keys(result)).toEqual(["a", "b"]);
        expect(result.a).toBe(3);
    });

    test("キーの挿入順が保持される", () => {
        const result = parse('{"z": 1, "a": 2, "m": 3}') as Record<string, unknown>;
        expect(Object.keys(result)).toEqual(["z", "a", "m"]);
    });

    test("数字のようなキーでも挿入順が保持される", () => {
        const result = parse('{"2": 1, "1": 2}') as Record<string, unknown>;
        expect(Object.keys(result)).toEqual(Object.keys(JSON.parse('{"2": 1, "1": 2}')));
    });
});

describe("構文の取り違え", () => {
    test("配列をオブジェクトの閉じ括弧で閉じるとエラーになる", () => {
        expect(() => parse('{"a": [1}')).toThrow();
    });

    test("オブジェクトを配列の閉じ括弧で閉じるとエラーになる", () => {
        expect(() => parse('[{"a": 1]')).toThrow();
    });

    test("括弧の対応が入れ違いだとエラーになる", () => {
        expect(() => parse('{"a": [1, 2}]')).toThrow();
    });

    test("閉じ括弧が多いとエラーになる", () => {
        expect(() => parse("[[1]]]")).toThrow();
    });

    test("閉じ括弧が足りないとエラーになる", () => {
        expect(() => parse("[[1]")).toThrow();
    });

    test("オブジェクトのキーが配列だとエラーになる", () => {
        expect(() => parse('{[1]: 2}')).toThrow();
    });

    test("オブジェクトのキーが数値だとエラーになる", () => {
        expect(() => parse("{1: 2}")).toThrow();
    });

    test("オブジェクトのキーが true だとエラーになる", () => {
        expect(() => parse("{true: 2}")).toThrow();
    });

    test("コロンの代わりにイコールを使うとエラーになる", () => {
        expect(() => parse('{"a" = 1}')).toThrow();
    });

    test("セミコロン区切りはエラーになる", () => {
        expect(() => parse('{"a": 1; "b": 2}')).toThrow();
    });

    test("配列でコロンを使うとエラーになる", () => {
        expect(() => parse("[1: 2]")).toThrow();
    });

    test("コメント付きの JSON はエラーになる", () => {
        expect(() => parse('{"a": 1} // comment')).toThrow();
    });

    test("ブロックコメントを含む JSON はエラーになる", () => {
        expect(() => parse('{/* c */"a": 1}')).toThrow();
    });

    test("NDJSON のような複数行はエラーになる", () => {
        expect(() => parse('{"a":1}\n{"b":2}')).toThrow();
    });
});

describe("再帰の深さと規模", () => {
    test("深さ 200 のネストした配列をパースできる", () => {
        const depth = 200;
        const source = "[".repeat(depth) + "1" + "]".repeat(depth);
        expect(parse(source)).toEqual(JSON.parse(source));
    });

    test("深さ 200 のネストしたオブジェクトをパースできる", () => {
        const depth = 200;
        const source = '{"a":'.repeat(depth) + "1" + "}".repeat(depth);
        expect(parse(source)).toEqual(JSON.parse(source));
    });

    test("1000 キーのオブジェクトをパースできる", () => {
        const entries = Array.from({ length: 1000 }, (_, i) => `"k${i}":${i}`).join(",");
        const source = `{${entries}}`;
        expect(parse(source)).toEqual(JSON.parse(source));
    });

    test("長い文字列をパースできる", () => {
        const source = JSON.stringify("a".repeat(10000));
        expect(parse(source)).toBe(JSON.parse(source));
    });

    test("エスケープだらけの長い文字列をパースできる", () => {
        const source = JSON.stringify('"\\\n\t'.repeat(1000));
        expect(parse(source)).toBe(JSON.parse(source));
    });

    test("JSON.stringify した複雑なオブジェクトを往復できる", () => {
        const original = {
            list: [1, -2.5, 1e10, null, true, false, "文字列", { nested: [[]] }],
            map: { "": 0, "キー": "値", 'quote"': "back\\slash", "tab\t": "nl\n" },
            deep: { a: { b: { c: { d: [1, { e: null }] } } } },
        };
        expect(parse(JSON.stringify(original))).toEqual(original);
    });
});

describe("丸めが中間ちょうどになる入力（round-half-even）", () => {
    // 値が隣接する2つの double のちょうど中間に落ちる入力。
    // 切り捨て固定でも切り上げ固定でも正しくならず、偶数側に倒す必要がある。
    const midpoints = [
        "4503599627370496.5",
        "4503599627370497.5",
        "4503599627370498.5",
        "4503599627370499.5",
        "4503599627370501.5",
        "4503599627370506.5",
        "4503599627370507.5",
        "9007199254740989.5",
        "9007199254740990.5",
        "2251799813685248.75",
        "2251799813685249.75",
        "2251799813685250.75",
        "2251799813685253.75",
        "1125899906842624.375",
        "1125899906842624.625",
        "1125899906842624.875",
        "1125899906842625.375",
        "562949953421312.1875",
        "562949953421312.4375",
        "562949953421312.6875",
        "281474976710656.09375",
        "281474976710656.21875",
        "281474976710656.84375",
        "140737488355328.046875",
        "140737488355328.109375",
        "35184372088832.01171875",
        "35184372088832.02734375",
    ];

    for (const source of midpoints) {
        test(`中間ちょうどを偶数側に丸める: ${source}`, () => {
            expect(parse(source)).toBe(JSON.parse(source));
        });
    }

    test("中間よりわずかに下は切り捨てになる", () => {
        const source = "4503599627370497.4999999999";
        expect(parse(source)).toBe(JSON.parse(source));
    });

    test("中間よりわずかに上は切り上げになる", () => {
        const source = "4503599627370497.5000000001";
        expect(parse(source)).toBe(JSON.parse(source));
    });

    test("負の中間ちょうども偶数側に丸める", () => {
        const source = "-4503599627370497.5";
        expect(parse(source)).toBe(JSON.parse(source));
    });
});

describe("小数部を持つ大きな値（分母をシフトする経路）", () => {
    // 値が 2^52 以上で小数部を持つ入力。分子ではなく分母をスケールする側の経路。
    const cases = [
        "7421664968825945.6",
        "8348387379735214.4",
        "8192105442548748.8",
        "4503599627370496.5",
        "9007199254740992.5",
        "12345678901234567.8",
        "99999999999999999.9",
        "18014398509481984.25",
        "36028797018963968.125",
        "4611686018427387904.5",
        "1e17",
        "12345678901234567890.5",
        "-7421664968825945.6",
    ];

    for (const source of cases) {
        test(`JSON.parse と同じ値になる: ${source}`, () => {
            expect(parse(source)).toBe(JSON.parse(source));
        });
    }
});

describe("JSON.parse との網羅比較", () => {
    // 決定的な擬似乱数で入力を生成し、JSON.parse と全件突き合わせる
    function makeRandom(seed: number): () => number {
        let s = seed >>> 0;
        return () => {
            s ^= s << 13; s >>>= 0;
            s ^= s >> 17;
            s ^= s << 5; s >>>= 0;
            return s / 0x100000000;
        };
    }

    test("有効数字と指数を振った 2000 件が一致する", () => {
        const rand = makeRandom(20260904);
        const mismatches: string[] = [];
        for (let i = 0; i < 2000; i++) {
            const digits = Math.floor(rand() * 1e17) + 1;
            const exponent = Math.floor(rand() * 80) - 50;
            const source = `${digits}e${exponent}`;
            if (!Object.is(parse(source), JSON.parse(source))) mismatches.push(source);
        }
        expect(mismatches).toEqual([]);
    });

    test("小数点を含む表記の 2000 件が一致する", () => {
        const rand = makeRandom(12345);
        const mismatches: string[] = [];
        for (let i = 0; i < 2000; i++) {
            const int = Math.floor(rand() * 1e16);
            const fracLen = 1 + Math.floor(rand() * 18);
            const frac = String(Math.floor(rand() * 10 ** fracLen)).padStart(fracLen, "0");
            const source = `${int}.${frac}`;
            if (!Object.is(parse(source), JSON.parse(source))) mismatches.push(source);
        }
        expect(mismatches).toEqual([]);
    });

    test("桁数の少ない値 1000 件が一致する", () => {
        const rand = makeRandom(777);
        const mismatches: string[] = [];
        for (let i = 0; i < 1000; i++) {
            const source = `${Math.floor(rand() * 1000)}.${Math.floor(rand() * 1000)}`;
            if (!Object.is(parse(source), JSON.parse(source))) mismatches.push(source);
        }
        expect(mismatches).toEqual([]);
    });

    test("指数が極端な 1000 件が一致する", () => {
        const rand = makeRandom(31415);
        const mismatches: string[] = [];
        for (let i = 0; i < 1000; i++) {
            const digits = Math.floor(rand() * 1e15) + 1;
            const exponent = Math.floor(rand() * 700) - 350;
            const source = `${digits}e${exponent}`;
            if (!Object.is(parse(source), JSON.parse(source))) mismatches.push(source);
        }
        expect(mismatches).toEqual([]);
    });
});
