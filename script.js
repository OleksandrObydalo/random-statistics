// script.js
document.addEventListener('DOMContentLoaded', () => {
    // === Существующие элементы ===
    const distributionTypeSelect = document.getElementById('distribution-type');
    const discreteDistributionControls = document.getElementById('discrete-distribution-controls');
    const discreteDistributionTypeSelect = document.getElementById('discrete-distribution-type');

    const minInput = document.getElementById('min');
    const maxInput = document.getElementById('max');
    const countInput = document.getElementById('count');
    const generateBtn = document.getElementById('generate-btn');
    const clearBtn = document.getElementById('clear-btn');
    const numbersOutput = document.getElementById('numbers-output');
    const binWidthInput = document.getElementById('bin-width');
    const updateHistogramBtn = document.getElementById('update-histogram');
    const xScaleInput = document.getElementById('x-scale');
    const yScaleInput = document.getElementById('y-scale');
    const updateCdfBtn = document.getElementById('update-cdf');
    const statisticalOutput = document.getElementById('statistical-output');

    const uniformParams = document.getElementById('uniform-params');
    const bernoulliParams = document.getElementById('bernoulli-params');
    const binomialParams = document.getElementById('binomial-params');
    const poissonParams = document.getElementById('poisson-params');

    // === Новые элементы для непрерывных распределений ===
    const continuousDistributionControls = document.getElementById('continuous-distribution-controls');
    const continuousDistributionTypeSelect = document.getElementById('continuous-distribution-type');
    const exponentialParams = document.getElementById('exponential-params');
    const normalParams = document.getElementById('normal-params');

    // SVG и служебные переменные — без изменений
    const histogramSvg = d3.select('#histogram');
    const cumulativeSvg = d3.select('#cumulative');
    let generatedNumbers = [];
    const margin = { top: 40, right: 20, bottom: 50, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // === Генерация чисел ===
    function generateRandomNumbers() {
        const distributionType = distributionTypeSelect.value;
        const count = parseInt(countInput.value);
        if (isNaN(count) || count <= 0) {
            alert('Please enter a valid number of values!');
            return;
        }
        generatedNumbers = [];

        if (distributionType === 'discrete') {
            // — Существующая логика для discrete —
            const discreteDistType = discreteDistributionTypeSelect.value;
            switch (discreteDistType) {
                case 'uniform':
                    const min = parseInt(minInput.value);
                    const max = parseInt(maxInput.value);
                    if (isNaN(min) || isNaN(max) || min >= max) {
                        alert('Please enter valid minimum and maximum values (min < max)!');
                        return;
                    }
                    for (let i = 0; i < count; i++) {
                        generatedNumbers.push(
                            Math.floor(Math.random() * (max - min + 1) + min)
                        );
                    }
                    break;
                case 'bernoulli':
                    const p = parseFloat(document.getElementById('bernoulli-p').value);
                    if (isNaN(p) || p < 0 || p > 1) {
                        alert('Please enter a valid probability between 0 and 1!');
                        return;
                    }
                    for (let i = 0; i < count; i++) {
                        generatedNumbers.push(Math.random() < p ? 1 : 0);
                    }
                    break;
                case 'binomial':
                    const n = parseInt(document.getElementById('binomial-n').value);
                    const binomialP = parseFloat(document.getElementById('binomial-p').value);
                    if (isNaN(n) || n <= 0 || isNaN(binomialP) || binomialP < 0 || binomialP > 1) {
                        alert('Please enter valid binomial parameters!');
                        return;
                    }
                    // … код binomial без изменений …
                    for (let i = 0; i < count; i++) {
                        const u = Math.random();
                        let cumProb = 0, k = 0;
                        do {
                            const coeff = binomialCoefficient(n, k) *
                                Math.pow(binomialP, k) *
                                Math.pow(1 - binomialP, n - k);
                            cumProb += coeff;
                            if (u <= cumProb) {
                                generatedNumbers.push(k);
                                break;
                            }
                            k++;
                        } while (k <= n);
                        if (k > n) generatedNumbers.push(n);
                    }
                    break;
                case 'poisson':
                    const lambda = parseFloat(document.getElementById('poisson-lambda').value);
                    if (isNaN(lambda) || lambda <= 0) {
                        alert('Please enter a valid lambda value (greater than 0)!');
                        return;
                    }
                    for (let i = 0; i < count; i++) {
                        const L = Math.exp(-lambda);
                        let k = 0, p = 1;
                        do {
                            k++;
                            p *= Math.random();
                        } while (p > L);
                        generatedNumbers.push(k - 1);
                    }
                    break;
            }
        } else {
            // === Новая логика для continuous ===
            const contType = continuousDistributionTypeSelect.value;
            switch (contType) {
                case 'uniform':
                    const min = parseFloat(minInput.value);
                    const max = parseFloat(maxInput.value);
                    if (isNaN(min) || isNaN(max) || min >= max) {
                        alert('Please enter valid minimum and maximum values (min < max)!');
                        return;
                    }
                    for (let i = 0; i < count; i++) {
                        generatedNumbers.push(Math.random() * (max - min) + min);
                    }
                    break;
                case 'exponential':
                    const λ = parseFloat(document.getElementById('exponential-lambda').value);
                    if (isNaN(λ) || λ <= 0) {
                        alert('Please enter a valid lambda value (greater than 0)!');
                        return;
                    }
                    for (let i = 0; i < count; i++) {
                        const u = Math.random();
                        generatedNumbers.push(-Math.log(1 - u) / λ);
                    }
                    break;
                case 'normal':
                    const mean = parseFloat(document.getElementById('normal-mean').value);
                    const sigma = parseFloat(document.getElementById('normal-sigma').value);
                    if (isNaN(mean) || isNaN(sigma) || sigma <= 0) {
                        alert('Please enter valid mean and positive sigma!');
                        return;
                    }
                    for (let i = 0; i < count; i++) {
                        const u1 = Math.random(), u2 = Math.random();
                        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                        generatedNumbers.push(mean + sigma * z);
                    }
                    break;
            }
        }

        displayNumbers();
        drawHistogram();
        drawCumulativeDistribution();
        displayStatistics();
    }

    // === Обработчик показа параметров ===
    function updateDistributionControls() {
        const type = distributionTypeSelect.value;
        if (type === 'discrete') {
            discreteDistributionControls.classList.add('active');
            continuousDistributionControls.classList.remove('active');

            // скрываем все
            [uniformParams, bernoulliParams, binomialParams, poissonParams, exponentialParams, normalParams]
                .forEach(el => el.classList.remove('active'));

            // показываем только нужный блок
            switch (discreteDistributionTypeSelect.value) {
                case 'uniform': uniformParams.classList.add('active'); break;
                case 'bernoulli': bernoulliParams.classList.add('active'); break;
                case 'binomial': binomialParams.classList.add('active'); break;
                case 'poisson': poissonParams.classList.add('active'); break;
            }
        } else {
            discreteDistributionControls.classList.remove('active');
            continuousDistributionControls.classList.add('active');

            // скрываем все
            [uniformParams, bernoulliParams, binomialParams, poissonParams, exponentialParams, normalParams]
                .forEach(el => el.classList.remove('active'));

            // показываем только нужный блок
            switch (continuousDistributionTypeSelect.value) {
                case 'uniform': uniformParams.classList.add('active'); break;
                case 'exponential': exponentialParams.classList.add('active'); break;
                case 'normal': normalParams.classList.add('active'); break;
            }
        }
    }

    // === Остальные функции (displayNumbers, drawHistogram, drawCumulativeDistribution, calculateStatistics, displayStatistics, clearResults) без изменений ===
    // …
    
    // === Навешиваем слушатели ===
    generateBtn.addEventListener('click', generateRandomNumbers);
    clearBtn.addEventListener('click', clearResults);
    updateHistogramBtn.addEventListener('click', drawHistogram);
    updateCdfBtn.addEventListener('click', drawCumulativeDistribution);
    distributionTypeSelect.addEventListener('change', () => {
        updateInputTypes();
        updateDistributionControls();
    });
    discreteDistributionTypeSelect.addEventListener('change', updateDistributionControls);
    continuousDistributionTypeSelect.addEventListener('change', updateDistributionControls);

    // === Инициализация ===
    updateInputTypes();
    updateDistributionControls();
    clearResults();
});
