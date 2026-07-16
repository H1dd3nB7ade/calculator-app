import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TextInput, Modal } from 'react-native';
import { calculateBasic, formatNumber, solveQuadratic, formatQuadraticResult, squareRoot, power, log10, naturalLog, trig, factorial } from '../utils/math';
import { fetchHistory, saveHistoryEntry, clearHistory } from '../services/api';
import HistoryPanel from '../components/HistoryPanel';


const BASIC_BUTTONS = [
    ['AC', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '⌫', '='],
];

const SCIENTIFIC_BUTTONS = [
  ['√', 'x²', 'xʸ', 'log'],
  ['ln', 'sin', 'cos', 'tan'],
  ['n!', 'π', 'e', '⌫']
];

const UNARY_FUNCTION_META = {
  '√': { prefix: '√(', suffix: ')' },
  log: { prefix: 'log(', suffix: ')' },
  ln: { prefix: 'ln(', suffix: ')' },
  sin: { prefix: 'sin(', suffix: '°)' },
  cos: { prefix: 'cos(', suffix: '°)' },
  tan: { prefix: 'tan(', suffix: '°)' },
  'x²': { prefix: '', suffix: '²' },
  'n!': { prefix: '', suffix: '!' },
};


export default function CalculatorScreen() {
    // Basic calculator state
    const [display, setDisplay] = useState('0');
    const [expression, setExpression] = useState('');
    const [answer, setAnswer] = useState('');
    const [firstOperand, setFirstOperand] = useState(null);
    const [operator, setOperator] = useState(null);
    const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
    const [pendingFunction, setPendingFunction] = useState(null);
    const [pendingConstant, setPendingConstant] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);

    // Which screen is being shown
    const [mode, setMode] = useState('basic')

    // Quadratic mode state - Text imputs and result
    const [quadA, setQuadA] = useState('');
    const [quadB, setQuadB] = useState('');
    const [quadC, setQuadC] = useState('');
    const [quadResult, setQuadResult] = useState(null);

    useEffect(() => {
      loadHistory();
    }, []);

    async function loadHistory() {
      const data = await fetchHistory();
      setHistory(data);
    }

    async function logCalculation(expressionText, resultText, type = 'basic') {
      const entry = await saveHistoryEntry({ expression: expressionText, result: resultText, type });
      if (entry) setHistory((prev) => [entry, ...prev]);
    }

    async function handleClearHistory() {
      await clearHistory();
      setHistory([]);
    }

    function handleBasicPress(label) {
        if (/[0-9]/.test(label)) return inputDigit(label);
        if (label === '.') return inputDecimal();
        if (label === 'AC') return clearAll();
        if (label === '±') return toggleSign();
        if (label === '⌫') return backspace();
        if (label === '=') {
          if (pendingConstant) return handleConstantCompletion();
          if (pendingFunction) return handleUnaryCompletion();
          if (operator === 'xʸ') return handlePowerCompletion();
          return handleEquals();
        }
        return handleOperator(label);
    }

    function handleQuadraticSolve() {
        try {
            const result = solveQuadratic(quadA, quadB, quadC);
            const formatted = formatQuadraticResult(result);
            setQuadResult(formatted);
            logCalculation(completedExpression, formatNumber(result), 'scientific');
        } catch (err) {
            setQuadResult(err.message);
        }
    }

    function handleScientific(fn) {
      
      if (fn === 'π' || fn === 'e') {
        const symbol = fn === 'π' ? 'π' : 'e';
        const constantValue = fn === 'π' ? Math.PI : Math.E;
        const lead = expression ? `${expression} ` : '';

        if (display !== '0' && !waitingForSecondOperand && !pendingFunction) {
          // A number's already typed — show "7π" but don't compute yet.
          setExpression(`${lead}${display}${symbol}`);
          setPendingConstant({ symbol, value: constantValue, base: display });
          setAnswer('');
        } else {
          // Nothing meaningful typed — just insert the constant's raw value.
          setDisplay(formatNumber(constantValue));
          setExpression(`${lead}${symbol}`);
          setAnswer('');
          setWaitingForSecondOperand(false);
          setPendingConstant(null);
        }
        setPendingFunction(null);
        return;
      }

      if (fn === 'xʸ') {
        setFirstOperand(parseFloat(display));
        setOperator('xʸ');
        setWaitingForSecondOperand(true);
        setExpression(`${display} ^`);
        setAnswer('');
        return;
      }

      const meta = UNARY_FUNCTION_META[fn]
      if (!meta) return;

      if (display !== '0' && !waitingForSecondOperand && !pendingFunction) {
        try {
          const result = computeUnary(fn, display);
          const lead = expression ? `${expression} ` : '';
          const completedExpression = `${lead}${meta.prefix}${display}${meta.suffix}`;
          setDisplay(formatNumber(result));
          setExpression(`${completedExpression} =`);
          setAnswer(formatNumber(result));
        } catch (err) {
          console.log('SCIENTIFIC ERROR:', err.message);
          setDisplay('Error');
          setExpression('');
          setAnswer('');
        }
        return;
      }
      const lead = expression ? `${expression} ` : '';
      setPendingFunction(fn);
      setExpression(`${lead}${meta.prefix}`);
      setWaitingForSecondOperand(true);
      setAnswer('');


    }

    function handlePowerCompletion() {
      if (operator === 'xʸ' && !waitingForSecondOperand) {
        try {
           const result = power(firstOperand, display);
           const completedExpression = `${firstOperand}^${display}`;
           setDisplay(formatNumber(result));
           setExpression(`${completedExpression} =`);
           setAnswer(formatNumber(result));
           logCalculation(completedExpression, formatNumber(result), 'scientific');
        } catch (err) {
           console.log('SCIENTIFIC ERROR:', err.message);
           setDisplay('Error');
           setExpression('');
           setAnswer('');
        }
        setFirstOperand(null);
        setOperator(null);
      }
    }

    function computeUnary(fn, numberStr) {
      switch (fn) {
        case '√': return squareRoot(numberStr);
        case 'x²': return power(numberStr, 2);
        case 'log': return log10(numberStr);
        case 'ln': return naturalLog(numberStr);
        case 'sin': return trig('sin', numberStr);
        case 'cos': return trig('cos', numberStr);
        case 'tan': return trig('tan', numberStr);
        case 'n!': return factorial(numberStr);
        default: throw new Error('Unknown function');
      }
    }

    function handleUnaryCompletion() {
      if (!pendingFunction) return;
      const meta = UNARY_FUNCTION_META[pendingFunction];
      const current = display;

      try {
        const result = computeUnary(pendingFunction, current);
        const completedExpression = `${expression}${current}${meta.suffix}`;
        setDisplay(formatNumber(result));
        setExpression(`${completedExpression} =`);
        setAnswer(formatNumber(result));
        logCalculation(completedExpression, formatNumber(result), 'scientific');
      } catch (err) {
        console.log('SCIENTIFIC ERROR:', err.message)
        setDisplay('Error');
        setExpression('');
        setAnswer('');
      }

      setPendingFunction(null);
    }

    function handleConstantCompletion() {
      if (!pendingConstant) return ;
      const result = parseFloat(pendingConstant.base) * pendingConstant.value;
      setDisplay(formatNumber(result));
      setExpression((prev) => `${prev} =`);
      setAnswer(formatNumber(result));
      logCalculation(completedExpression, formatNumber(result), 'scientific');
      setPendingConstant(null);
    }

    let expressionDisplay;
    if (pendingFunction) {
      const meta = UNARY_FUNCTION_META[pendingFunction];
      expressionDisplay = waitingForSecondOperand
      ? (expression || pendingFunction)
      : `${expression}${display}${meta.suffix}`;
    } else if (operator && !waitingForSecondOperand) {
      expressionDisplay = `${expression} ${display}`;
    } else {
      expressionDisplay = expression || display;
    }


    return (
  <SafeAreaView style={styles.safeArea}>
    <TouchableOpacity onPress={() => setShowHistory(true)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
      <Text style={styles.topBarLink}>History</Text>
    </TouchableOpacity>
    <View style={styles.topBar}>
      {['basic', 'scientific', 'quadratic'].map((m) => (
        <TouchableOpacity key={m} onPress={() => setMode(m)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={mode === m ? styles.modeTabActive : styles.modeTab}>
            {m === 'basic' ? 'Basic' : m === 'scientific' ? 'Scientific' : 'Quadratic'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {mode === 'quadratic' ? (
      <ScrollView contentContainerStyle={styles.quadraticContainer}>
        <Text style={styles.quadraticTitle}>Solve ax² + bx + c = 0</Text>
        <TextInput style={styles.quadInput} value={quadA} onChangeText={setQuadA} placeholder="a" placeholderTextColor="#999" keyboardType="numbers-and-punctuation" />
        <TextInput style={styles.quadInput} value={quadB} onChangeText={setQuadB} placeholder="b" placeholderTextColor="#999" keyboardType="numbers-and-punctuation" />
        <TextInput style={styles.quadInput} value={quadC} onChangeText={setQuadC} placeholder="c" placeholderTextColor="#999" keyboardType="numbers-and-punctuation" />
        <TouchableOpacity style={styles.solveButton} onPress={handleQuadraticSolve}>
          <Text style={styles.solveButtonText}>Solve</Text>
        </TouchableOpacity>
        {quadResult && <Text style={styles.quadResult}>{quadResult}</Text>}
      </ScrollView>
    ) : (
      <>
        <View style={styles.displayContainer}>
          <Text style={styles.expressionText}>{expressionDisplay}</Text>
          <Text style={styles.answerText}>{answer}</Text>
        </View>

        {mode === 'scientific' && (
          <View style={styles.scientificGrid}>
            {SCIENTIFIC_BUTTONS.map((row, i) => (
              <View key={i} style={styles.row}>
                {row.map((label) => (
                  <TouchableOpacity
                    key={label}
                    style={styles.scientificButton}
                    onPress={() => (label === '⌫' ? backspace() : handleScientific(label))}
                  >
                    <Text style={styles.scientificButtonText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}


        <View style={styles.basicGrid}>
          {BASIC_BUTTONS.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((label) => {
                const isOperator = ['÷', '×', '-', '+', '='].includes(label);
                const isFunction = ['AC', '±', '%', '⌫'].includes(label);

                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.button, isOperator && styles.operatorButton, isFunction && styles.functionButton]}
                    onPress={() => handleBasicPress(label)}
                  >
                    <Text style={[styles.buttonText, isOperator && styles.operatorText]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </>
    )}
    <Modal visible={showHistory} animationType="slide">
      <HistoryPanel
        history={history}
        onClose={() => setShowHistory(false)}
        onClear={handleClearHistory}
      />
    </Modal>
  </SafeAreaView>
);


function inputDigit(digit) {
    if (waitingForSecondOperand) {
        setDisplay(digit);
        setWaitingForSecondOperand(false);
        if (operator === null && pendingFunction === null) {
            setExpression('');
            setAnswer('');
        }
    } else {
        setDisplay(display === '0' ? digit : display + digit)
    }
}

function inputDecimal() {
    if (waitingForSecondOperand) {
        setDisplay('0.');
        setWaitingForSecondOperand(false);
        return;
    }
    if (!display.includes('.')) {
        setDisplay(display + '.');
    }
}

function clearAll() {
    setDisplay('0');
    setExpression('')
    setAnswer('')
    setPendingFunction(null);
    setPendingConstant(null);
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
}

function backspace() {
    if (display.length === 1) {
        setDisplay('0')
    } else {
        setDisplay(display.slice(0, -1));
    }
}

function toggleSign() {
    setDisplay((parseFloat(display) * -1).toString());
}

function handleOperator(nextOperator) {
  let currentValueStr = display;
  let currentExprStr = display;

  if (pendingConstant) {
    const resolved = parseFloat(pendingConstant.base) * pendingConstant.value;
    currentValueStr = formatNumber(resolved);
    currentExprStr = expression; // this already holds "7π" from handleScientific
    setPendingConstant(null);
  }

  const inputValue = parseFloat(currentValueStr);
  setAnswer('');

  if (operator && waitingForSecondOperand) {
    setOperator(nextOperator);
    setExpression(`${formatNumber(firstOperand)} ${nextOperator}`);
    return;
  }

  if (firstOperand === null) {
    setFirstOperand(inputValue);
    setExpression(`${currentExprStr} ${nextOperator}`);
  } else if (operator) {
    try {
      const result = calculateBasic(firstOperand, operator, currentValueStr);
      setDisplay(formatNumber(result));
      setFirstOperand(result);
      setExpression(`${formatNumber(result)} ${nextOperator}`);
    } catch (err) {
      setDisplay('Error');
      setExpression('');
      setFirstOperand(null);
      setOperator(null);
      setWaitingForSecondOperand(false);
      return;
    }
  }

  setWaitingForSecondOperand(true);
  setOperator(nextOperator);
}

  function handleEquals() {
    if (operator === null || waitingForSecondOperand) return;

    try {
      const result = calculateBasic(firstOperand, operator, display);
      const completedExpression = `${expression} ${display}`;
      setDisplay(formatNumber(result));
      setExpression(`${completedExpression} =`);
      setAnswer(formatNumber(result));
      logCalculation(completedExpression, formatNumber(result));
      setFirstOperand(null);
      setOperator(null);
      setWaitingForSecondOperand(true);
    } catch (err) {
      setDisplay('Error');
      setExpression('');
      setAnswer('');
      setFirstOperand(null);
      setOperator(null);
    }
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingTop: 40,
  },
  modeTab: {
    color: '#8e8e93',
    fontSize: 16,
  },
  modeTabActive: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  displayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  expressionText: {
    color: '#a5a5a5',
    fontSize: 34,
    textAlign: 'left',
  },
  answerText: {
    color: '#fff',
    fontSize: 56,
    textAlign: 'right',
    marginTop: 16,
  },
  basicGrid: {
    padding: 12,
  },
  scientificGrid: {
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scientificButton: {
    width: 80,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 28,
  },
  scientificButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  quadraticContainer: {
    padding: 24,
    paddingTop: 40,
  },
  quadraticTitle: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  quadInput: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
    fontSize: 20,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  solveButton: {
    backgroundColor: '#ff9500',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  solveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  quadResult: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 24,
  },
  operatorButton: {
    backgroundColor: '#ff9500',
  },
  functionButton: {
    backgroundColor: '#a5a5a5',
  },
  operatorText: {
    color: '#fff',
  },
  topBarLink: {
    color: '#ff9500',
    fontSize: 16,
  },
});

