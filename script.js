document.addEventListener('DOMContentLoaded', () => {
    // Existing DOM elements
    const distributionTypeSelect = document.getElementById('distribution-type');
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

    // New DOM elements for discrete distributions
    const discreteDistributionControls = document.getElementById('discrete-distribution-controls');
    const discreteDistributionTypeSelect = document.getElementById('discrete-distribution-type');
    const uniformParams = document.getElementById('uniform-params');
    const bernoulliParams = document.getElementById('bernoulli-params');
    const binomialParams = document.getElementById('binomial-params');
    const poissonParams = document.getElementById('poisson-params');

    // New DOM elements for continuous distributions
    const continuousDistributionControls = document.getElementById('continuous-distribution-controls');
    const continuousDistributionTypeSelect = document.getElementById('continuous-distribution-type');
    const uniformContinuousParams = document.getElementById('uniform-continuous-params');
    const exponentialParams = document.getElementById('exponential-params');
    const normalParams = document.getElementById('normal-params');

    // SVG elements
    const histogramSvg = d3.select('#histogram');
    const cumulativeSvg = d3.select('#cumulative');

    // Generated numbers
    let generatedNumbers = [];

    // SVG dimensions
    const margin = { top: 40, right: 20, bottom: 50, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Helper functions for discrete distributions
    function factorial(n) {
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    function binomialCoefficient(n, k) {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        
        // Use a more numerically stable method to compute binomial coefficient
        let result = 1;
        for (let i = 1; i <= k; i++) {
            result *= (n - (i - 1));
            result /= i;
        }
        return result;
    }

    // Generate random numbers based on selected distribution
    function generateRandomNumbers() {
        const distributionType = distributionTypeSelect.value;
        const count = parseInt(countInput.value);

        if (isNaN(count) || count <= 0) {
            alert('Please enter a valid number of values!');
            return;
        }

        generatedNumbers = [];

        if (distributionType === 'discrete') {
            const discreteDistType = discreteDistributionTypeSelect.value;
            
            switch (discreteDistType) {
                case 'uniform':
                    const min = parseInt(minInput.value);
                    const max = parseInt(maxInput.value);
                    
                    if (isNaN(min) || isNaN(max) || min >= max) {
                        alert('Please enter valid minimum and maximum values (min < max)!');
                        return;
                    }
                    
                    // Generate uniform discrete distribution
                    for (let i = 0; i < count; i++) {
                        const randomNum = Math.floor(Math.random() * (max - min + 1) + min);
                        generatedNumbers.push(randomNum);
                    }
                    break;
                
                case 'bernoulli':
                    const p = parseFloat(document.getElementById('bernoulli-p').value);
                    
                    if (isNaN(p) || p < 0 || p > 1) {
                        alert('Please enter a valid probability between 0 and 1!');
                        return;
                    }
                    
                    // Generate Bernoulli trials (0 or 1)
                    for (let i = 0; i < count; i++) {
                        const randomNum = Math.random() < p ? 1 : 0;
                        generatedNumbers.push(randomNum);
                    }
                    break;
                
                case 'binomial':
                    const n = parseInt(document.getElementById('binomial-n').value);
                    const binomialP = parseFloat(document.getElementById('binomial-p').value);
                    
                    if (isNaN(n) || n <= 0) {
                        alert('Please enter a valid number of trials (greater than 0)!');
                        return;
                    }
                    
                    if (isNaN(binomialP) || binomialP < 0 || binomialP > 1) {
                        alert('Please enter a valid probability between 0 and 1!');
                        return;
                    }
                    
                    // Generate binomial distribution
                    for (let i = 0; i < count; i++) {
                        // Method 1: Direct calculation of binomial probabilities
                        const u = Math.random();
                        let cumulativeProb = 0;
                        let k = 0;
                        
                        do {
                            // P(X = k) = C(n,k) * p^k * (1-p)^(n-k)
                            const prob = binomialCoefficient(n, k) * 
                                        Math.pow(binomialP, k) * 
                                        Math.pow(1 - binomialP, n - k);
                            
                            cumulativeProb += prob;
                            
                            if (u <= cumulativeProb) {
                                generatedNumbers.push(k);
                                break;
                            }
                            
                            k++;
                        } while (k <= n);
                        
                        // Fallback if numerical issues occur
                        if (k > n) {
                            generatedNumbers.push(n);
                        }
                    }
                    break;
                
                case 'poisson':
                    const lambda = parseFloat(document.getElementById('poisson-lambda').value);
                    
                    if (isNaN(lambda) || lambda <= 0) {
                        alert('Please enter a valid lambda value (greater than 0)!');
                        return;
                    }
                    
                    // Generate Poisson distribution
                    for (let i = 0; i < count; i++) {
                        // Knuth's algorithm for generating Poisson random variables
                        const L = Math.exp(-lambda);
                        let k = 0;
                        let p = 1;
                        
                        do {
                            k++;
                            p *= Math.random();
                        } while (p > L);
                        
                        generatedNumbers.push(k - 1); // k-1 because we start with k=1
                    }
                    break;
            }
        } else {
            // Continuous distribution
            const continuousDistType = continuousDistributionTypeSelect.value;
            
            switch (continuousDistType) {
                case 'uniform':
                    const contMin = parseFloat(document.getElementById('continuous-min').value);
                    const contMax = parseFloat(document.getElementById('continuous-max').value);
                    
                    if (isNaN(contMin) || isNaN(contMax) || contMin >= contMax) {
                        alert('Please enter valid minimum and maximum values (min < max)!');
                        return;
                    }
                    
                    for (let i = 0; i < count; i++) {
                        const randomNum = Math.random() * (contMax - contMin) + contMin;
                        generatedNumbers.push(randomNum);
                    }
                    break;
                
                case 'exponential':
                    const exponentialLambda = parseFloat(document.getElementById('exponential-lambda').value);
                    
                    if (isNaN(exponentialLambda) || exponentialLambda <= 0) {
                        alert('Please enter a valid lambda value (greater than 0)!');
                        return;
                    }
                    
                    for (let i = 0; i < count; i++) {
                        // Inverse transform sampling for exponential distribution
                        const u = Math.random();
                        const randomNum = -Math.log(1 - u) / exponentialLambda;
                        generatedNumbers.push(randomNum);
                    }
                    break;
                
                case 'normal':
                    const mean = parseFloat(document.getElementById('normal-mean').value);
                    const sigma = parseFloat(document.getElementById('normal-sigma').value);
                    
                    if (isNaN(sigma) || sigma <= 0) {
                        alert('Please enter a valid standard deviation (greater than 0)!');
                        return;
                    }
                    
                    for (let i = 0; i < count; i++) {
                        // Box-Muller transform for generating normal distribution
                        const u1 = Math.random();
                        const u2 = Math.random();
                        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                        const randomNum = mean + z0 * sigma;
                        generatedNumbers.push(randomNum);
                    }
                    break;
            }
        }

        displayNumbers();
        drawHistogram();
        drawCumulativeDistribution();
        displayStatistics();
    }

    // Display generated numbers with appropriate precision
    function displayNumbers() {
        const distributionType = distributionTypeSelect.value;
        generatedNumbers.sort((a, b) => a - b);
        
        if (distributionType === 'discrete') {
            numbersOutput.textContent = generatedNumbers.join(', ');
        } else {
            // Show floating-point numbers with 3 decimal places
            numbersOutput.textContent = generatedNumbers.map(num => num.toFixed(3)).join(', ');
        }
    }

    // Draw histogram
    function drawHistogram() {
        const distributionType = distributionTypeSelect.value;
        const binWidth = parseFloat(binWidthInput.value) || 10;
        
        histogramSvg.selectAll('*').remove();
        
        if (generatedNumbers.length === 0) return;

        const g = histogramSvg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const min = Math.min(...generatedNumbers);
        const max = Math.max(...generatedNumbers);

        // Adjust bin width and number of bins for continuous distribution
        const binWidthAdjusted = distributionType === 'discrete' ? 
            binWidth : 
            (max - min) / 20; // Default to 20 bins for continuous

        // Create bins
        const numBins = Math.ceil((max - min) / binWidthAdjusted);
        const bins = Array(numBins).fill(0);
        
        generatedNumbers.forEach(num => {
            const binIndex = Math.floor((num - min) / binWidthAdjusted);
            bins[binIndex]++;
        });

        const xScale = d3.scaleLinear()
            .domain([min, min + numBins * binWidthAdjusted])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins)])
            .range([height, 0])
            .nice();

        // Draw bars
        g.selectAll('.bar')
            .data(bins)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', (d, i) => xScale(min + i * binWidthAdjusted))
            .attr('width', width / numBins - 1)
            .attr('y', d => yScale(d))
            .attr('height', d => height - yScale(d))
            .append('title')
            .text((d, i) => {
                const binStart = min + i * binWidthAdjusted;
                const binEnd = binStart + binWidthAdjusted;
                return `Range: ${binStart.toFixed(3)}-${binEnd.toFixed(3)}\nCount: ${d}`;
            });

        // Add axes
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d => d.toFixed(distributionType === 'discrete' ? 0 : 2));
        const yAxis = d3.axisLeft(yScale);

        g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis);

        g.append('g')
            .attr('class', 'axis y-axis')
            .call(yAxis);

        // Add axis labels
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', `translate(${width/2},${height + 35})`)
            .text('Value');

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('y', -40)
            .attr('x', -height/2)
            .text('Frequency');

        // Add title
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', `translate(${width/2},-15)`)
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text(`Frequency Histogram (Bin Width: ${binWidthAdjusted.toFixed(3)})`);
    }

    // Draw cumulative distribution
    function drawCumulativeDistribution() {
        const xScaleFactor = parseFloat(xScaleInput.value) || 1;
        const yScaleFactor = parseFloat(yScaleInput.value) || 1;
        
        cumulativeSvg.selectAll('*').remove();
        
        if (generatedNumbers.length === 0) return;

        const g = cumulativeSvg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const min = Math.min(...generatedNumbers);
        const max = Math.max(...generatedNumbers);

        // Create cumulative data
        const sortedNumbers = [...generatedNumbers].sort((a, b) => a - b);
        const cumulativeData = [];
        
        for (let i = 0; i <= 100; i++) {
            const interpolatedValue = min + (max - min) * (i / 100);
            const count = sortedNumbers.filter(num => num <= interpolatedValue).length;
            cumulativeData.push({ x: interpolatedValue, y: count });
        }

        // Scale adjustments
        const xScale = d3.scaleLinear()
            .domain([min, min + (max - min) * xScaleFactor])
            .range([0, width])
            .clamp(true);

        const yScale = d3.scaleLinear()
            .domain([0, sortedNumbers.length * yScaleFactor])
            .range([height, 0])
            .clamp(true);

        // Draw line
        const line = d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y));

        g.append('path')
            .datum(cumulativeData)
            .attr('class', 'line')
            .attr('d', line);

        // Add axes
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d => d.toFixed(2));
        const yAxis = d3.axisLeft(yScale);

        g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis);

        g.append('g')
            .attr('class', 'axis y-axis')
            .call(yAxis);

        // Add axis labels
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', `translate(${width/2},${height + 35})`)
            .text('Value');

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('y', -40)
            .attr('x', -height/2)
            .text('Cumulative Count');

        // Add title
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', `translate(${width/2},-15)`)
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text(`Cumulative Distribution (X: ${xScaleFactor}x, Y: ${yScaleFactor}x)`);
    }

    // Add statistical calculations function
    function calculateStatistics() {
        if (generatedNumbers.length === 0) {
            return {
                mean: 0,
                variance: 0,
                standardDeviation: 0
            };
        }

        // Calculate Mean (E(X))
        const mean = generatedNumbers.reduce((sum, num) => sum + num, 0) / generatedNumbers.length;

        // Calculate Variance
        const variance = generatedNumbers.reduce((sum, num) => {
            return sum + Math.pow(num - mean, 2);
        }, 0) / generatedNumbers.length;

        // Calculate Standard Deviation
        const standardDeviation = Math.sqrt(variance);

        return {
            mean,
            variance,
            standardDeviation
        };
    }

    // Display statistical metrics
    function displayStatistics() {
        const stats = calculateStatistics();

        statisticalOutput.innerHTML = `
            <p>Mean (E(X)): ${stats.mean.toFixed(4)}</p>
            <p>Variance (Var(X)): ${stats.variance.toFixed(4)}</p>
            <p>Standard Deviation (σ): ${stats.standardDeviation.toFixed(4)}</p>
        `;
    }

    // Clear all results
    function clearResults() {
        generatedNumbers = [];
        numbersOutput.textContent = '';
        histogramSvg.selectAll('*').remove();
        cumulativeSvg.selectAll('*').remove();
        statisticalOutput.innerHTML = '';
    }

    // Show/hide distribution controls based on selections
    function updateDistributionControls() {
        const distributionType = distributionTypeSelect.value;
        
        // Show/hide continuous distribution type selector
        continuousDistributionControls.classList.toggle('active', distributionType === 'continuous');
        discreteDistributionControls.classList.toggle('active', distributionType === 'discrete');
        
        if (distributionType === 'continuous') {
            const continuousDistType = continuousDistributionTypeSelect.value;
            
            // Hide all params first
            uniformContinuousParams.classList.remove('active');
            exponentialParams.classList.remove('active');
            normalParams.classList.remove('active');
            
            // Hide discrete distribution params
            uniformParams.classList.remove('active');
            bernoulliParams.classList.remove('active');
            binomialParams.classList.remove('active');
            poissonParams.classList.remove('active');
            
            // Show appropriate continuous params
            switch (continuousDistType) {
                case 'uniform':
                    uniformContinuousParams.classList.add('active');
                    break;
                case 'exponential':
                    exponentialParams.classList.add('active');
                    break;
                case 'normal':
                    normalParams.classList.add('active');
                    break;
            }
        } else {
            // Existing discrete distribution control logic
            const discreteDistType = discreteDistributionTypeSelect.value;
            
            // Hide all params first
            uniformParams.classList.remove('active');
            bernoulliParams.classList.remove('active');
            binomialParams.classList.remove('active');
            poissonParams.classList.remove('active');
            
            // Hide continuous distribution params
            uniformContinuousParams.classList.remove('active');
            exponentialParams.classList.remove('active');
            normalParams.classList.remove('active');
            
            // Show appropriate discrete params
            switch (discreteDistType) {
                case 'uniform':
                    uniformParams.classList.add('active');
                    break;
                case 'bernoulli':
                    bernoulliParams.classList.add('active');
                    break;
                case 'binomial':
                    binomialParams.classList.add('active');
                    break;
                case 'poisson':
                    poissonParams.classList.add('active');
                    break;
            }
        }
    }

    // Update input types based on distribution type
    function updateInputTypes() {
        const distributionType = distributionTypeSelect.value;
        minInput.step = distributionType === 'discrete' ? '1' : 'any';
        maxInput.step = distributionType === 'discrete' ? '1' : 'any';
        
        // If switching to discrete, ensure min/max are integers
        if (distributionType === 'discrete') {
            minInput.value = Math.floor(parseFloat(minInput.value));
            maxInput.value = Math.ceil(parseFloat(maxInput.value));
        }
    }

    // Event listeners
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

    // Initial setup
    updateInputTypes();
    updateDistributionControls();
    clearResults();
});