document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const formulaDisplay = document.getElementById('calc-formula');
    const inputDisplay = document.getElementById('calc-input');
    const keypad = document.querySelector('.calc-keypad');
    const historyPanel = document.getElementById('history-panel');
    const toggleHistoryBtn = document.getElementById('toggle-history-btn');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyList = document.getElementById('history-list');
    const logoutBtn = document.getElementById('logout-btn');

    // Calculator State
    let currentInput = '0';
    let previousInput = '';
    let activeOperator = '';
    let formula = '';
    let shouldResetDisplay = false;
    let history = JSON.parse(localStorage.getItem('calvix_history')) || [];

    // Initialize History UI
    updateHistoryUI();

    // Map Keyboard keys to button data values
    const keyMap = {
        '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
        '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
        '.': '.', ',': '.',
        '+': '+', '-': '-', '*': '*', '/': '/',
        '^': '^',
        'Enter': '=', '=': '=',
        'Backspace': 'backspace',
        'Escape': 'clear', 'c': 'clear', 'C': 'clear'
    };

    // Keyboard Event Listener
    window.addEventListener('keydown', (e) => {
        const value = keyMap[e.key];
        if (value) {
            e.preventDefault();
            handleInput(value);
            triggerButtonVisualFeedback(value);
        }
    });

    // Keypad Event Listener
    keypad.addEventListener('click', (e) => {
        const button = e.target.closest('.btn');
        if (!button) return;
        
        const value = button.getAttribute('data-val');
        handleInput(value);
    });

    // History Panel Event Listeners
    toggleHistoryBtn.addEventListener('click', () => {
        historyPanel.classList.add('open');
    });

    closeHistoryBtn.addEventListener('click', () => {
        historyPanel.classList.remove('open');
    });

    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        localStorage.removeItem('calvix_history');
        updateHistoryUI();
    });

    // Logout Event Listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('calvix_logged_in');
            window.location.href = 'login.html';
        });
    }

    // Listen to history list clicks
    historyList.addEventListener('click', (e) => {
        const item = e.target.closest('.history-item');
        if (!item) return;
        
        const result = item.getAttribute('data-result');
        currentInput = result;
        shouldResetDisplay = true;
        updateDisplay();
        historyPanel.classList.remove('open');
    });

    // Visual feedback for keyboard presses
    function triggerButtonVisualFeedback(value) {
        let btn = null;
        if (value === 'clear') {
            btn = document.getElementById('btn-clear');
        } else if (value === 'backspace') {
            btn = document.getElementById('btn-backspace');
        } else if (value === '=') {
            btn = document.getElementById('btn-equal');
        } else if (value === '+') {
            btn = document.getElementById('btn-add');
        } else if (value === '-') {
            btn = document.getElementById('btn-sub');
        } else if (value === '*') {
            btn = document.getElementById('btn-mul');
        } else if (value === '/') {
            btn = document.getElementById('btn-div');
        } else if (value === '^') {
            btn = document.getElementById('btn-power');
        } else {
            // Find by data-val attribute
            btn = document.querySelector(`.btn[data-val="${value}"]`);
        }

        if (btn) {
            btn.classList.add('keyboard-active');
            btn.classList.add('btn-pulse');
            setTimeout(() => {
                btn.classList.remove('keyboard-active');
            }, 100);
            btn.addEventListener('animationend', () => {
                btn.classList.remove('btn-pulse');
            }, { once: true });
        }
    }

    // Main controller for actions
    function handleInput(value) {
        if (!isNaN(value) || value === '.') {
            inputNumber(value);
        } else if (['+', '-', '*', '/', '^'].includes(value)) {
            inputOperator(value);
        } else {
            switch (value) {
                case 'clear':
                    clearAll();
                    break;
                case 'backspace':
                    backspace();
                    break;
                case '±':
                    negate();
                    break;
                case 'sqrt':
                    squareRoot();
                    break;
                case '%':
                    percentage();
                    break;
                case '=':
                    calculate();
                    break;
            }
        }
        updateDisplay();
    }

    // Logic for number entry
    function inputNumber(digit) {
        if (shouldResetDisplay) {
            currentInput = digit === '.' ? '0.' : digit;
            shouldResetDisplay = false;
        } else {
            if (digit === '.') {
                if (!currentInput.includes('.')) {
                    currentInput += '.';
                }
            } else {
                if (currentInput === '0') {
                    currentInput = digit;
                } else {
                    currentInput += digit;
                }
            }
        }
    }

    // Logic for operators
    function inputOperator(operator) {
        if (activeOperator && !shouldResetDisplay) {
            calculate();
        }
        previousInput = currentInput;
        activeOperator = operator;
        formula = `${formatNumberForFormula(previousInput)} ${getOperatorSymbol(operator)}`;
        shouldResetDisplay = true;
    }

    // Calculate result
    function calculate() {
        if (!activeOperator || shouldResetDisplay) return;

        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);
        let result = 0;

        if (isNaN(prev) || isNaN(current)) return;

        switch (activeOperator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    currentInput = 'Error: Div by 0';
                    formula = '';
                    activeOperator = '';
                    shouldResetDisplay = true;
                    return;
                }
                result = prev / current;
                break;
            case '^':
                result = Math.pow(prev, current);
                break;
        }

        // Format result nicely
        const formattedResult = formatResult(result);
        
        // Update history
        const expr = `${formatNumberForFormula(previousInput)} ${getOperatorSymbol(activeOperator)} ${formatNumberForFormula(currentInput)} =`;
        saveHistoryItem(expr, formattedResult);

        // Update display states
        formula = '';
        currentInput = formattedResult;
        activeOperator = '';
        shouldResetDisplay = true;
    }

    // Unary Operators
    function negate() {
        if (currentInput === '0' || currentInput.includes('Error')) return;
        currentInput = (parseFloat(currentInput) * -1).toString();
    }

    function squareRoot() {
        const val = parseFloat(currentInput);
        if (isNaN(val) || val < 0) {
            currentInput = 'Error: Invalid';
            shouldResetDisplay = true;
        } else {
            const result = Math.sqrt(val);
            const formatted = formatResult(result);
            saveHistoryItem(`√(${formatNumberForFormula(currentInput)}) =`, formatted);
            currentInput = formatted;
            shouldResetDisplay = true;
        }
    }

    function percentage() {
        const val = parseFloat(currentInput);
        if (isNaN(val)) return;
        const result = val / 100;
        const formatted = formatResult(result);
        saveHistoryItem(`%(${formatNumberForFormula(currentInput)}) =`, formatted);
        currentInput = formatted;
        shouldResetDisplay = true;
    }

    function backspace() {
        if (shouldResetDisplay) {
            currentInput = '0';
        } else {
            if (currentInput.length > 1) {
                currentInput = currentInput.slice(0, -1);
                if (currentInput === '-' || currentInput === '-0') {
                    currentInput = '0';
                }
            } else {
                currentInput = '0';
            }
        }
    }

    function clearAll() {
        currentInput = '0';
        previousInput = '';
        activeOperator = '';
        formula = '';
        shouldResetDisplay = false;
    }

    // Helper functions
    function getOperatorSymbol(op) {
        const symbols = {
            '+': '+',
            '-': '−',
            '*': '×',
            '/': '÷',
            '^': '^'
        };
        return symbols[op] || op;
    }

    function formatNumberForFormula(valStr) {
        if (valStr.includes('Error')) return valStr;
        const val = parseFloat(valStr);
        if (isNaN(val)) return valStr;
        // Keep expression formatting clean
        return formatResult(val);
    }

    function formatResult(val) {
        if (isNaN(val)) return 'Error';
        if (!isFinite(val)) return 'Error: Overflow';

        // Limit decimal precision and scientific notation if too long
        const valStr = val.toString();
        if (valStr.length > 12) {
            if (Math.abs(val) > 1e12 || (Math.abs(val) < 1e-6 && val !== 0)) {
                return val.toExponential(6);
            } else {
                // Round float point precision issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
                return parseFloat(val.toFixed(10)).toString();
            }
        }
        return valStr;
    }

    function updateDisplay() {
        inputDisplay.textContent = currentInput;
        formulaDisplay.textContent = formula;

        // Auto-scale fonts for very long numbers to prevent break layouts
        const length = currentInput.length;
        if (length > 12) {
            inputDisplay.style.fontSize = '1.4rem';
        } else if (length > 8) {
            inputDisplay.style.fontSize = '1.8rem';
        } else {
            inputDisplay.style.fontSize = '2.3rem';
        }
    }

    // History log logic
    function saveHistoryItem(expr, result) {
        if (result.includes('Error')) return; // Don't save errors
        
        history.unshift({ expr, result });
        if (history.length > 30) history.pop(); // Cap history to 30 items
        
        localStorage.setItem('calvix_history', JSON.stringify(history));
        updateHistoryUI();
    }

    function updateHistoryUI() {
        if (history.length === 0) {
            historyList.innerHTML = '<li class="history-empty">No calculations yet</li>';
            return;
        }

        historyList.innerHTML = history.map(item => `
            <li class="history-item" data-result="${item.result}" tabindex="0" title="Click to reuse result">
                <span class="history-expr">${item.expr}</span>
                <span class="history-result">${item.result}</span>
            </li>
        `).join('');
    }
});
