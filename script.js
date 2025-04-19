document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
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

    // SVG elements
    const histogramSvg = d3.select('#histogram');
    const cumulativeSvg = d3.select('#cumulative');

    // Generated numbers
    let generatedNumbers = [];

    // SVG dimensions
    const margin = { top: 40, right: 20, bottom: 50, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Generate random numbers
    function generateRandomNumbers() {
        const distributionType = distributionTypeSelect.value;
        const min = parseFloat(minInput.value);
        const max = parseFloat(maxInput.value);
        const count = parseInt(countInput.value);

        if (isNaN(min) || isNaN(max) || isNaN(count) || count <= 0) {
            alert('Please enter valid numbers!');
            return;
        }

        if (min >= max) {
            alert('Minimum value must be less than maximum value!');
            return;
        }

        generatedNumbers = [];
        for (let i = 0; i < count; i++) {
            let randomNum;
            if (distributionType === 'discrete') {
                // Generate integer numbers
                randomNum = Math.floor(Math.random() * (max - min + 1) + min);
            } else {
                // Generate floating-point numbers
                randomNum = Math.random() * (max - min) + min;
            }
            generatedNumbers.push(randomNum);
        }

        displayNumbers();
        drawHistogram();
        drawCumulativeDistribution();
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

    // Clear all results
    function clearResults() {
        generatedNumbers = [];
        numbersOutput.textContent = '';
        histogramSvg.selectAll('*').remove();
        cumulativeSvg.selectAll('*').remove();
    }

    // Update min and max input types based on distribution type
    function updateInputTypes() {
        const distributionType = distributionTypeSelect.value;
        minInput.step = distributionType === 'discrete' ? '1' : 'any';
        maxInput.step = distributionType === 'discrete' ? '1' : 'any';
    }

    // Event listeners
    generateBtn.addEventListener('click', generateRandomNumbers);
    clearBtn.addEventListener('click', clearResults);
    updateHistogramBtn.addEventListener('click', drawHistogram);
    updateCdfBtn.addEventListener('click', drawCumulativeDistribution);
    distributionTypeSelect.addEventListener('change', updateInputTypes);

    // Initial setup
    updateInputTypes();
    clearResults();
});