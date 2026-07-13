export function calculateBasic(a, operator, b) {
    const x = parseFloat(a);
    const y = parseFloat(b);

    switch (operator) {
        case '+':
            return x + y;
        case '-':
            return x - y;
        case '×':
            return x * y;
        case '÷':
            if (y === 0) throw new Error('Cannot divide by zero');
            return x / y;
        case '%':
            return x % y;
        default:
            throw new Error(`Unknown operator: ${operator}`);
    }
}

export function squareRoot(a) {
    const x = parseFloat(a);
    if (x < 0) throw new Error('Cannot take square root of a negative number');
    return Math.sqrt(x);
}

export function power(a, b) {
    return Math.pow(parseFloat(a), parseFloat(b));
}

export function trig(fn, degrees) {
    const radians = (parseFloat(degrees) * Math.PI) / 180;
    switch (fn) {
        case 'sin':
            return Math.sin(radians);
        case 'cos':
            return Math.cos(radians);
        case 'tan':
            return Math.tan(radians);
        default:
            throw new Error(`Unknown trig function: ${fn}`);
    }
}

export function log10(a) {
    const x = parseFloat(a);
    if (x <= 0) throw new Error('Logarithm undefined for values <= 0');
    return Math.log10(x);
}

export function naturalLog(a) {
    const x = parseFloat(a);
    if (x <= 0) throw new Error('Logarithm underfined for values <= 0');
    return Math.log(x);
}

export function factorial(n) {
    const x = parseInt(n, 10);
    if (x < 0) throw new Error('Factorial undefined for negative numbers');
    if (x > 170) throw new Error('Number too large for factorial');
    let result = 1;
    for (let i = 2; i <= x; i++) result *= i;
    return result;
}

export function solveQuadratic(a, b, c) {
    const A = parseFloat(a);
    const B = parseFloat(b);
    const C = parseFloat(c);

    if (A === 0) {
        throw new Error('Coefficient "a" cannot be 0 (that would make it linear, not quadratic');
    }

    const discriminant = B * B - 4 * A * C
    const twoA = 2 * A

    if (discriminant > 0) {
        const sqrtD = Math.sqrt(discriminant);
        const root1 = (-B + sqrtD) / twoA;
        const root2 = (-B - sqrtD) / twoA;
        return {
            type: 'real-distinct',
            roots: [root1, root2],
            discriminant,
        };
    }

    if (discriminant === 0 ) {
        const root = -B / twoA;
        return {
            type: 'real-repeated',
            roots: [root],
            discriminant,
        };
    }

    const realPart = -B / twoA;
    const imaginaryPart = Math.sqrt(-discriminant) / twoA;
    return {
        type: 'complex',
        roots: [
            { real: realPart, imaginary: imaginaryPart },
            { real: realPart, imaginary: -imaginaryPart },
        ],
        discriminant,
    };
}


export function formatQuadraticResult(result) {
    const round = (n) => Math.round(n * 10000) / 10000;

    if (result.type === 'real-distinct') {
        const [r1, r2] = result.roots.map(round);
        return `x₁ = ${r1}, x₂ = ${r2}`;
    }
    if (result.type === 'real-repeated') {
        return `x = ${round(result.roots[0])} (repeated root)`;
    }

    const [r1, r2] = result.roots;
    const sign = r1.imaginary >= 0 ? '+' : '-';
    return `x₁ = ${round(r1.real)} ${sign} ${round(Math.abs(r1.imaginary))}i, x₂ = ${round(r2.real)} ${sign === '+' ? '-' : '+'
    } ${round(Math.abs(r1.imaginary))}i`;
}


export function formatNumber(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'Error';
    if (!Number.isFinite(value)) return 'Error';

    const rounded = Math.round(value * 1e10) / 1e10
    return rounded.toString();
}

