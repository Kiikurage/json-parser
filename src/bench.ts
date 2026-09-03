import { parse } from "./main";

interface BenchResult {
    name: string;
    /** 1回あたりの所要時間(ミリ秒) */
    average: number;
    min: number;
    /** 1秒あたりの実行回数 */
    opsPerSecond: number;
}

/**
 * Bun.nanoseconds() で関数の実行時間を計測する。
 * 計測前にウォームアップを回して JIT の最適化を効かせた状態で測る。
 */
function measure(name: string, fn: () => unknown, iterations: number): BenchResult {
    const warmupCount = Math.max(1, Math.floor(iterations / 10));
    for (let i = 0; i < warmupCount; i++) {
        fn();
    }

    let total = 0;
    let min = Infinity;
    for (let i = 0; i < iterations; i++) {
        const start = Bun.nanoseconds();
        fn();
        const elapsed = Bun.nanoseconds() - start;
        total += elapsed;
        if (elapsed < min) {
            min = elapsed;
        }
    }

    const average = total / iterations / 1e6;
    return {
        name,
        average,
        min: min / 1e6,
        opsPerSecond: 1000 / average,
    };
}

/**
 * JSON を JavaScript の式として評価する。json2.js 以前に使われていた方式。
 * `{` がブロック文と解釈されないよう括弧で囲む必要がある。
 *
 * 注意: 構文の検証を一切しないため、信頼できない入力には決して使ってはいけない。
 * ここでは速度の比較対象としてのみ使う。
 */
function parseByEval(input: string): unknown {
    return (0, eval)(`(${input})`);
}

/** 自作パーサと JSON.parse を同じ入力で比較する */
function compare(title: string, input: string, iterations: number) {
    const sizeKB = (input.length / 1024).toFixed(1);
    console.log(`\n${title}  (${sizeKB} KB, ${iterations} 回)`);

    const results = [
        measure("自作 parse", () => parse(input), iterations),
        measure("JSON.parse", () => JSON.parse(input), iterations),
        measure("eval", () => parseByEval(input), iterations),
    ];

    const fastest = Math.min(...results.map((r) => r.average));
    for (const result of results) {
        const ratio = result.average / fastest;
        const label = ratio === 1 ? "基準" : `${ratio.toFixed(1)}x 遅い`;
        console.log(
            `  ${result.name.padEnd(12)}` +
            `平均 ${result.average.toFixed(3).padStart(8)} ms` +
            `  最速 ${result.min.toFixed(3).padStart(8)} ms` +
            `  ${Math.round(result.opsPerSecond).toLocaleString().padStart(9)} ops/s` +
            `  ${label}`,
        );
    }
}

/** 実際のアプリケーションが扱うような、型が混在したオブジェクトの配列 */
function makeMixedObjects(count: number): string {
    return JSON.stringify({
        items: Array.from({ length: count }, (_, i) => ({
            id: i,
            name: `item-${i}`,
            enabled: i % 2 === 0,
            score: i * 1.5,
            tags: ["alpha", "beta"],
            meta: null,
        })),
    });
}

/** 数値だけの配列。BigInt 経路の重さが出る */
function makeNumbers(count: number): string {
    return JSON.stringify(Array.from({ length: count }, (_, i) => i * 1.234567));
}

/** 整数だけの配列。小数と違い pow >= 0 の経路を通る */
function makeIntegers(count: number): string {
    return JSON.stringify(Array.from({ length: count }, (_, i) => i));
}

/** 文字列だけの配列。エスケープを含む場合と含まない場合 */
function makeStrings(count: number, withEscape: boolean): string {
    return JSON.stringify(
        Array.from({ length: count }, (_, i) =>
            withEscape ? `line\t${i}\n"quoted"\\` : `plain string number ${i}`,
        ),
    );
}

/** 深くネストしたオブジェクト。再帰の深さが出る */
function makeDeepNest(depth: number): string {
    return `${'{"a":'.repeat(depth)}1${"}".repeat(depth)}`;
}

console.log("=".repeat(78));
console.log("JSON パーサ ベンチマーク");
console.log("=".repeat(78));

compare("型が混在したオブジェクト配列 2000 件", makeMixedObjects(2000), 20);
compare("小数 20000 件", makeNumbers(20000), 10);
compare("整数 20000 件", makeIntegers(20000), 10);
compare("文字列 20000 件 (エスケープなし)", makeStrings(20000, false), 20);
compare("文字列 20000 件 (エスケープあり)", makeStrings(20000, true), 20);
compare("深さ 500 のネスト", makeDeepNest(500), 200);

console.log("");
