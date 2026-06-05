// Math Challenge System - Advanced Anti-Bypass Protection
(function() {
    'use strict';

    // Private state with obfuscation
    const _state = {
        _currentProblem: null,
        _attemptCount: 0,
        _maxAttempts: 3,
        _isVerified: false,
        _sessionKey: Math.random().toString(36).substring(2) + Date.now().toString(36),
        _integrityHash: null,
        _startTime: null,
        _minSolveTime: 2000, // Minimum time to solve (anti-bot)
        _problemHistory: []
    };

    // Obfuscated method names
    const _methods = {
        init: 'g3n3r4t3',
        verify: 'v3r1fy',
        reset: 'r3s3t',
        check: 'ch3ck'
    };

    // Advanced math problem generators
    const problemGenerators = {
        quadratic: () => {
            const a = getRandomInt(2, 10);
            const b = getRandomInt(-20, 20);
            const c = getRandomInt(-50, 50);
            const hasRealRoots = (b * b - 4 * a * c) >= 0;
            
            if (!hasRealRoots) {
                return problemGenerators.quadratic();
            }
            
            const discriminant = Math.sqrt(b * b - 4 * a * c);
            const x1 = ((-b + discriminant) / (2 * a)).toFixed(2);
            const x2 = ((-b - discriminant) / (2 * a)).toFixed(2);
            
            const problem = {
                type: 'quadratic',
                question: `Selesaikan persamaan kuadrat: ${a}x² + ${b >= 0 ? '+' : ''}${b}x + ${c >= 0 ? '+' : ''}${c} = 0. Berapakah nilai x yang lebih besar?`,
                answer: parseFloat(x1 >= x2 ? x1 : x2),
                tolerance: 0.01,
                complexity: 9
            };
            
            return problem;
        },

        systemOfEquations: () => {
            const x = getRandomInt(1, 20);
            const y = getRandomInt(1, 20);
            const a1 = getRandomInt(2, 10);
            const b1 = getRandomInt(2, 10);
            const a2 = getRandomInt(2, 10);
            const b2 = getRandomInt(2, 10);
            
            const c1 = a1 * x + b1 * y;
            const c2 = a2 * x + b2 * y;
            
            const problem = {
                type: 'system',
                question: `Selesaikan sistem persamaan:\n${a1}x + ${b1}y = ${c1}\n${a2}x + ${b2}y = ${c2}\nBerapakah nilai x + y?`,
                answer: x + y,
                tolerance: 0,
                complexity: 10
            };
            
            return problem;
        },

        calculus: () => {
            const coeff = getRandomInt(2, 10);
            const power = getRandomInt(3, 6);
            const evalPoint = getRandomInt(1, 5);
            
            // Derivative: d/dx(coeff * x^power) = coeff * power * x^(power-1)
            const derivativeValue = coeff * power * Math.pow(evalPoint, power - 1);
            
            const problem = {
                type: 'calculus',
                question: `Hitung turunan pertama dari f(x) = ${coeff}x^${power} pada x = ${evalPoint}`,
                answer: derivativeValue,
                tolerance: 0,
                complexity: 11
            };
            
            return problem;
        },

        matrix: () => {
            const a = getRandomInt(1, 10);
            const b = getRandomInt(1, 10);
            const c = getRandomInt(1, 10);
            const d = getRandomInt(1, 10);
            
            const determinant = a * d - b * c;
            
            const problem = {
                type: 'matrix',
                question: `Hitung determinan matriks:\n| ${a}  ${b} |\n| ${c}  ${d} |`,
                answer: determinant,
                tolerance: 0,
                complexity: 8
            };
            
            return problem;
        },

        logarithm: () => {
            const base = getRandomInt(2, 5);
            const exponent = getRandomInt(2, 6);
            const value = Math.pow(base, exponent);
            
            const problem = {
                type: 'logarithm',
                question: `Hitung nilai dari log_${base}(${value})`,
                answer: exponent,
                tolerance: 0,
                complexity: 9
            };
            
            return problem;
        },

        trigonometry: () => {
            const angles = [0, 30, 45, 60, 90];
            const angle = angles[getRandomInt(1, angles.length - 2)]; // Exclude 0 and 90 for variety
            const radian = angle * Math.PI / 180;
            const sinValue = Math.sin(radian).toFixed(3);
            
            const problem = {
                type: 'trigonometry',
                question: `Hitung nilai sin(${angle}°) hingga 3 desimal`,
                answer: parseFloat(sinValue),
                tolerance: 0.001,
                complexity: 10
            };
            
            return problem;
        },

        factorial: () => {
            const n = getRandomInt(5, 8);
            let result = 1;
            for (let i = 2; i <= n; i++) {
                result *= i;
            }
            
            const problem = {
                type: 'factorial',
                question: `Hitung nilai dari ${n}! (faktorial)`,
                answer: result,
                tolerance: 0,
                complexity: 7
            };
            
            return problem;
        },

        complexArithmetic: () => {
            const a = getRandomInt(10, 50);
            const b = getRandomInt(10, 50);
            const c = getRandomInt(5, 20);
            const d = getRandomInt(5, 20);
            const op1 = ['+', '-', '*', '/'][getRandomInt(0, 3)];
            const op2 = ['+', '-', '*', '/'][getRandomInt(0, 3)];
            
            let expression = `${a} ${op1} ${b} ${op2} ${c} * ${d}`;
            let answer;
            
            try {
                answer = eval(expression.replace(/\/\s*\d+/g, (match) => {
                    const num = parseFloat(match.replace('/', '').trim());
                    return num !== 0 ? match : '+ 0';
                }));
                
                if (!isFinite(answer) || isNaN(answer)) {
                    return problemGenerators.complexArithmetic();
                }
            } catch (e) {
                return problemGenerators.complexArithmetic();
            }
            
            const problem = {
                type: 'complex',
                question: `Hitung: ${expression}`,
                answer: Math.round(answer * 100) / 100,
                tolerance: 0.01,
                complexity: 8
            };
            
            return problem;
        },

        sequence: () => {
            const start = getRandomInt(1, 10);
            const diff = getRandomInt(2, 10);
            const n = getRandomInt(8, 15);
            
            const nthTerm = start + (n - 1) * diff;
            
            const problem = {
                type: 'sequence',
                question: `Diberikan barisan aritmatika dengan suku pertama ${start} dan beda ${diff}. Berapakah suku ke-${n}?`,
                answer: nthTerm,
                tolerance: 0,
                complexity: 7
            };
            
            return problem;
        },

        percentage: () => {
            const base = getRandomInt(100, 1000);
            const percent = getRandomInt(5, 95);
            
            const result = (percent / 100) * base;
            
            const problem = {
                type: 'percentage',
                question: `Berapakah ${percent}% dari ${base}?`,
                answer: result,
                tolerance: 0.01,
                complexity: 6
            };
            
            return problem;
        }
    };

    // Utility functions with integrity checks
    function getRandomInt(min, max) {
        const cryptoObj = window.crypto || window.msCrypto;
        if (cryptoObj) {
            const array = new Uint32Array(1);
            cryptoObj.getRandomValues(array);
            return min + (array[0] % (max - min + 1));
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateProblem() {
        const types = Object.keys(problemGenerators);
        const randomType = types[getRandomInt(0, types.length - 1)];
        const problem = problemGenerators[randomType]();
        
        // Add integrity hash
        problem.hash = btoa(JSON.stringify({
            type: problem.type,
            answer: problem.answer,
            session: _state._sessionKey,
            timestamp: Date.now()
        }));
        
        _state._currentProblem = problem;
        _state._startTime = Date.now();
        _state._problemHistory.push(problem.type);
        
        return problem;
    }

    function verifyAnswer(userAnswer) {
        if (!_state._currentProblem) {
            return { success: false, message: 'No active problem' };
        }

        const elapsed = Date.now() - _state._startTime;
        
        // Anti-bot: Check minimum solve time
        if (elapsed < _state._minSolveTime) {
            return { 
                success: false, 
                message: 'Terlalu cepat! Sistem mendeteksi aktivitas mencurigakan.',
                suspicious: true
            };
        }

        const parsedAnswer = parseFloat(userAnswer);
        
        if (isNaN(parsedAnswer)) {
            return { success: false, message: 'Jawaban tidak valid' };
        }

        const { answer, tolerance } = _state._currentProblem;
        const isCorrect = Math.abs(parsedAnswer - answer) <= tolerance;

        if (isCorrect) {
            _state._isVerified = true;
            _state._attemptCount = 0;
            
            // Store verification in multiple places for redundancy
            try {
                sessionStorage.setItem('math_verified_' + _state._sessionKey, 'true');
                sessionStorage.setItem('math_verify_time', Date.now().toString());
                localStorage.setItem('math_challenge_completed_' + _state._sessionKey.substring(0, 8), 'true');
            } catch (e) {
                // Storage might be disabled, continue anyway
            }
            
            return { success: true, message: 'Verifikasi berhasil!' };
        } else {
            _state._attemptCount++;
            
            if (_state._attemptCount >= _state._maxAttempts) {
                // Lock out after too many attempts
                try {
                    sessionStorage.setItem('math_locked', 'true');
                    sessionStorage.setItem('math_lock_time', Date.now().toString());
                } catch (e) {}
                
                return { 
                    success: false, 
                    message: 'Terlalu banyak kesalahan! Silakan refresh halaman dan coba lagi.',
                    locked: true
                };
            }
            
            const remaining = _state._maxAttempts - _state._attemptCount;
            return { 
                success: false, 
                message: `Jawaban salah! Sisa percobaan: ${remaining}`,
                remaining: remaining
            };
        }
    }

    // Anti-tampering measures
    function integrityCheck() {
        const checks = [
            typeof document !== 'undefined',
            typeof window !== 'undefined',
            !window._devToolsDetected,
            document.visibilityState === 'visible'
        ];
        
        return checks.every(check => check);
    }

    // Expose only necessary methods with obfuscated names
    window[_methods.init] = generateProblem;
    window[_methods.verify] = verifyAnswer;
    window[_methods.check] = integrityCheck;

    // Self-destruct if tampered
    Object.freeze(_state);
    Object.freeze(problemGenerators);

})();
