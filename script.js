    // FileName:script.js
    const cropVarieties = {
        "Wheat": ["HD-2967", "PBW-343", "WH-147"],
        "Onion": ["Nashik Red", "Pusa Red", "Agrifound Dark Red"],
        "Tomato": ["Local Red", "Pusa Ruby", "Hybrid Tomato"],
        "Maize": ["Hybrid-1", "PMH-1", "HQPM-1"],
        "Potato": ["Kufri Jyoti", "Kufri Sindhuri", "Kufri Chandramukhi"],
        "Rice": ["Basmati", "Pusa-1121", "Sona Masuri"]
    };
    const appContent = document.getElementById('app-content');
    const navLinks = document.querySelectorAll('nav a, .btn[data-page]');
    let loadingOverlay;
    let loadingText;
    let cropSelect, varietySelect, predictionForm, resultsSection, minPriceElem, maxPriceElem, modalPriceElem, priceChartCanvas, priceChart;
    let actualCropSelect, actualVarietySelect, actualDataForm;
    //Url from flask 
    const PREDICT_API_URL = 'http://127.0.0.1:5000/predict';
    const SUBMIT_DATA_API_URL = 'http://127.0.0.1:5000/submit_actual_data';

    function initializePredictPageElements() {
        if (!cropSelect) {
            cropSelect = document.getElementById('crop');
            varietySelect = document.getElementById('variety');
            predictionForm = document.getElementById('predictionForm');
            resultsSection = document.getElementById('results-section');
            minPriceElem = document.getElementById('minPrice');
            maxPriceElem = document.getElementById('maxPrice');
            modalPriceElem = document.getElementById('modalPrice');
            priceChartCanvas = document.getElementById('priceChart');

            if (cropSelect && varietySelect) {
                cropSelect.addEventListener('change', () => handleCropChange(cropSelect, varietySelect));
                handleCropChange(cropSelect, varietySelect);
            }
            if (predictionForm) {
                predictionForm.addEventListener('submit', handlePredictionSubmit);
                predictionForm.addEventListener('reset', handleFormReset);
            }

            const synchronizedInputsPredict = [
                { sliderId: 'rainfall', textId: 'rainfall_text', displayId: 'rainfall_value_display' },
                { sliderId: 'temperature', textId: 'temperature_text', displayId: 'temperature_value_display' },
                { sliderId: 'humidity', textId: 'humidity_text', displayId: 'humidity_value_display' },
                { sliderId: 'pesticide', textId: 'pesticide_text', displayId: 'pesticide_value_display' }
            ];
            setupSliderSynchronization(synchronizedInputsPredict);
            minPriceElem.innerHTML = '0.00 <span>Rs/qtl</span>';
            maxPriceElem.innerHTML = '0.00 <span>Rs/qtl</span>';
            modalPriceElem.innerHTML = '0.00 <span>Rs/qtl</span>';
            resultsSection.classList.remove('active');
        }
    }

    function initializeSubmitDataPageElements() {
        if (!actualCropSelect) { 
            actualCropSelect = document.getElementById('actual_crop');
            actualVarietySelect = document.getElementById('actual_variety');
            actualDataForm = document.getElementById('actualDataForm');

            if (actualCropSelect && actualVarietySelect) {
                actualCropSelect.addEventListener('change', () => handleCropChange(actualCropSelect, actualVarietySelect));
                handleCropChange(actualCropSelect, actualVarietySelect);
            }
            if (actualDataForm) {
                actualDataForm.addEventListener('submit', handleSubmitActualData);
                actualDataForm.addEventListener('reset', handleActualDataFormReset);
            }

            const synchronizedInputsActual = [
                { sliderId: 'actual_rainfall', textId: 'actual_rainfall_text', displayId: 'actual_rainfall_value_display' },
                { sliderId: 'actual_temperature', textId: 'actual_temperature_text', displayId: 'actual_temperature_value_display' },
                { sliderId: 'actual_humidity', textId: 'actual_humidity_text', displayId: 'actual_humidity_value_display' },
                { sliderId: 'actual_pesticide', textId: 'actual_pesticide_text', displayId: 'actual_pesticide_value_display' }
            ];
            setupSliderSynchronization(synchronizedInputsActual);
        }
    }


    

    // Function to populate variety dropdown based on selected crop
    function handleCropChange(cropDropdown, varietyDropdown) {
        const selectedCrop = cropDropdown.value;
        varietyDropdown.innerHTML = '<option value="">Select Variety</option>';
        varietyDropdown.disabled = true; 

        if (selectedCrop && cropVarieties[selectedCrop]) {
            cropVarieties[selectedCrop].forEach(variety => {
                const option = document.createElement('option');
                option.value = variety;
                option.textContent = variety;
                varietyDropdown.appendChild(option);
            });
            varietyDropdown.disabled = false;
        }
    }
    function setupSliderSynchronization(inputsArray) {
        inputsArray.forEach(({ sliderId, textId, displayId }) => {
            const slider = document.getElementById(sliderId);
            const textInput = document.getElementById(textId);
            const valueDisplay = document.getElementById(displayId);

            if (slider && textInput && valueDisplay) {
                slider.addEventListener('input', () => {
                    textInput.value = parseFloat(slider.value).toFixed(slider.step.includes('.') ? 2 : 0);
                    valueDisplay.textContent = parseFloat(slider.value).toFixed(slider.step.includes('.') ? 2 : 0);
                });
                textInput.addEventListener('input', () => {
                    let value = parseFloat(textInput.value);
                    const min = parseFloat(textInput.min);
                    const max = parseFloat(textInput.max);
                    const step = parseFloat(textInput.step);
                    if (isNaN(value) || value < min) {
                        value = min;
                    } else if (value > max) {
                        value = max;
                    }
                    value = Math.round(value / step) * step;

                    slider.value = value;
                    valueDisplay.textContent = value.toFixed(textInput.step.includes('.') ? 2 : 0);
                });
                textInput.value = parseFloat(slider.value).toFixed(slider.step.includes('.') ? 2 : 0);
                valueDisplay.textContent = parseFloat(slider.value).toFixed(slider.step.includes('.') ? 2 : 0);
            }
        });
    }

    function resetSliderInputs(inputsArray) {
        inputsArray.forEach(({ sliderId, textId, displayId, defaultValue }) => {
            const slider = document.getElementById(sliderId);
            const textInput = document.getElementById(textId);
            const valueDisplay = document.getElementById(displayId);

            if (slider && textInput && valueDisplay) {
                slider.value = defaultValue;
                textInput.value = defaultValue.toFixed(slider.step.includes('.') ? 2 : 0);
                valueDisplay.textContent = defaultValue.toFixed(slider.step.includes('.') ? 2 : 0);
            }
        });
    }

    function showPage(pageId) {
        const currentActive = document.querySelector('.page-section.active');
        if(currentActive) {
            currentActive.classList.remove('active');
        }

        const targetPage = document.getElementById(pageId + '-page');
        if(targetPage) {
            targetPage.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (pageId === 'predict') {
                initializePredictPageElements();
            } else if (pageId === 'submit-data') {
                initializeSubmitDataPageElements();
            }
            if (pageId === 'train-model') {
    initializeTrainModelPageElements();
}

        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            if (pageId) {
                history.pushState(null, '', `#${pageId}`);
                showPage(pageId);
            }
        });
    });


    window.addEventListener('hashchange', () => {
        const pageId = window.location.hash.substring(1) || 'home';
        showPage(pageId);
    });

    //page load
    document.addEventListener('DOMContentLoaded', () => {
    
        loadingOverlay = document.getElementById('loadingOverlay');
        loadingText = document.querySelector('.loading-text');

        const initialPageId = window.location.hash.substring(1) || 'home';
        showPage(initialPageId);
       
        if (initialPageId === 'predict') {
            initializePredictPageElements();
        } else if (initialPageId === 'submit-data') {
            initializeSubmitDataPageElements();
        }
    });


    async function handlePredictionSubmit(e) {
        e.preventDefault();
        if (loadingOverlay && loadingText) {
            const loadingMessages = [
                "Analyzing market trends...",
                "Crunching the numbers...",
                "Generating your forecast...",
                "Processing agricultural data..."
            ];
            let messageIndex = 0;
            loadingText.textContent = loadingMessages[messageIndex];
            const messageInterval = setInterval(() => {
                messageIndex = (messageIndex + 1) % loadingMessages.length;
                loadingText.textContent = loadingMessages[messageIndex];
            }, 1500);

            loadingOverlay.classList.add('active');
        }


        const formData = new FormData(predictionForm);
        const data = Object.fromEntries(formData.entries());
        //converting into float
        data.rainfall = parseFloat(data.rainfall);
        data.temperature = parseFloat(data.temperature);
        data.arrival = parseFloat(data.arrival);
        data.humidity = parseFloat(data.humidity);
        data.pesticide = parseFloat(data.pesticide);

        try {
            const response = await fetch(PREDICT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = "Prediction failed. Please check your inputs and try again.";
                if (errorData && errorData.messages) {
                    errorMessage = "Input Error:\n" + Object.values(errorData.messages).flat().join("\n");
                } else if (errorData && errorData.error) {
                    errorMessage = `Error: ${errorData.error}`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            animateNumber(minPriceElem, result.min_price);
            animateNumber(maxPriceElem, result.max_price);
            animateNumber(modalPriceElem, result.modal_price);

            updatePriceChart(result.min_price, result.max_price, result.modal_price);

            if (loadingOverlay && loadingText) {
                clearInterval(messageInterval);
                loadingOverlay.classList.remove('active');
            }


            resultsSection.classList.add('active');
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error("Error during prediction:", error);
            if (loadingOverlay && loadingText) {
                clearInterval(messageInterval);
                loadingOverlay.classList.remove('active');
            }
            alert(`Prediction failed: ${error.message}`);
            resultsSection.classList.remove('active');
        }
    }

    function handleFormReset() {
        varietySelect.innerHTML = '<option value="">Select Variety</option>';
        varietySelect.disabled = true;
        resultsSection.classList.remove('active');

        const synchronizedInputsPredict = [
            { sliderId: 'rainfall', textId: 'rainfall_text', displayId: 'rainfall_value_display', defaultValue: 50.0 },
            { sliderId: 'temperature', textId: 'temperature_text', displayId: 'temperature_value_display', defaultValue: 25.0 },
            { sliderId: 'humidity', textId: 'humidity_text', displayId: 'humidity_value_display', defaultValue: 60.0 },
            { sliderId: 'pesticide', textId: 'pesticide_text', displayId: 'pesticide_value_display', defaultValue: 3.00 }
        ];
        resetSliderInputs(synchronizedInputsPredict);
        document.getElementById('arrival').value = 1000;

        minPriceElem.innerHTML = '0.00 <span>Rs/qtl</span>';
        maxPriceElem.innerHTML = '0.00 <span>Rs/qtl</span>';
        modalPriceElem.innerHTML = '0.00 <span>Rs/qtl</span>';

        if (priceChart) {
            priceChart.destroy();
            priceChart = null;
        }
    }


    //Submit Actual Data Form

    async function handleSubmitActualData(e) {
        e.preventDefault();

        if (loadingOverlay && loadingText) {
            loadingOverlay.classList.add('active');
            loadingText.textContent = "Submitting actual data...";
        }
        let messageInterval = null;

        try {
            const formData = new FormData(actualDataForm);
            const data = Object.fromEntries(formData.entries());
            data.rainfall = parseFloat(data.rainfall);
            data.temperature = parseFloat(data.temperature);
            data.arrival = parseFloat(data.arrival);
            data.humidity = parseFloat(data.humidity);
            data.pesticide = parseFloat(data.pesticide);
            data.min_price = parseFloat(data.min_price);
            data.max_price = parseFloat(data.max_price);
            data.modal_price = parseFloat(data.modal_price);

            console.log("Sending actual data:", data);

            const response = await fetch(SUBMIT_DATA_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = "Failed to submit actual data. Please check your inputs.";
                if (errorData && errorData.messages) {
                    errorMessage = "Input Error:\n" + Object.values(errorData.messages).flat().join("\n");
                } else if (errorData && errorData.error) {
                    errorMessage = `Error: ${errorData.error}`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            alert(result.message);
            actualDataForm.reset(); 

        } catch (error) {
            console.error("Error submitting actual data:", error);
            alert(`Submission failed: ${error.message}`);
        } finally {
            if (messageInterval) clearInterval(messageInterval);
            if (loadingOverlay) loadingOverlay.classList.remove('active'); 
        }
    }

    function handleActualDataFormReset() {
        actualVarietySelect.innerHTML = '<option value="">Select Variety</option>';
        actualVarietySelect.disabled = true;

        const synchronizedInputsActual = [
            { sliderId: 'actual_rainfall', textId: 'actual_rainfall_text', displayId: 'actual_rainfall_value_display', defaultValue: 50.0 },
            { sliderId: 'actual_temperature', textId: 'actual_temperature_text', displayId: 'actual_temperature_value_display', defaultValue: 25.0 },
            { sliderId: 'actual_humidity', textId: 'actual_humidity_text', displayId: 'actual_humidity_value_display', defaultValue: 60.0 },
            { sliderId: 'actual_pesticide', textId: 'actual_pesticide_text', displayId: 'actual_pesticide_value_display', defaultValue: 3.00 }
        ];
        resetSliderInputs(synchronizedInputsActual);
        document.getElementById('actual_arrival').value = 1000;

        document.getElementById('actual_min_price').value = '';
        document.getElementById('actual_max_price').value = '';
        document.getElementById('actual_modal_price').value = '';
    }


 
    function animateNumber(element, targetValue) {
        const startValue = parseFloat(element.textContent.split(' ')[0]);
        const duration = 1000; 
        let startTime = null;

        function easeOutQuad(t) {
            return t * (2 - t);
        }

        function step(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = (currentTime - startTime) / duration;
            const easedProgress = easeOutQuad(progress);

            const currentValue = startValue + (targetValue - startValue) * easedProgress;
            element.innerHTML = `${currentValue.toFixed(2)} <span>Rs/qtl</span>`;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.innerHTML = `${targetValue.toFixed(2)} <span>Rs/qtl</span>`; // Ensure final value is exact and formatted
            }
        }
        requestAnimationFrame(step);
    }
    //price chart
    function updatePriceChart(min, max, modal) {
        const ctx = priceChartCanvas.getContext('2d');

        if (priceChart) {
            priceChart.destroy(); 
        }

        priceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Min Price', 'Modal Price', 'Max Price'],
                datasets: [{
                    label: 'Price (Rs/qtl)',
                    data: [min, modal, max],
                    backgroundColor: [
                        'rgba(255, 152, 0, 0.7)', /* Orange for Min */
                        'rgba(3, 169, 244, 0.7)', /* Blue for Modal */
                        'rgba(139, 195, 74, 0.7)'  /* Light Green for Max */
                    ],
                    borderColor: [
                        'rgba(255, 152, 0, 1)',
                        'rgba(3, 169, 244, 1)',
                        'rgba(139, 195, 74, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart',
                    onComplete: () => {
                      
                        document.querySelectorAll('.price-card').forEach(card => {
                            card.style.animation = '';
                            card.style.opacity = 0;
                            card.style.transform = 'translateY(20px)';
                            setTimeout(() => {
                                card.style.animation = 'slideUpFadeIn 0.8s ease-out forwards';
                            }, 50); 
                        });
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        },
                        ticks: {
                            color: 'var(--color-text-light)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        },
                        ticks: {
                            color: 'var(--color-text-light)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                        labels: {
                            color: 'var(--color-text-light)'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Predicted Price Distribution',
                        color: 'var(--color-text-light)',
                        font: {
                            size: 18,
                            family: 'Poppins'
                        }
                    }
                }
            }
        });
    }

    //Scroll-triggered animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                // entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .prediction-section, .results-section, .about-section, .contact-section, .data-submission-section').forEach(section => {
        observer.observe(section);
    });

    //Contact Form
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (loadingOverlay && loadingText) {
                loadingOverlay.classList.add('active');
                loadingText.textContent = "Sending message...";
            }

            const formData = new FormData(contactForm);
            const templateParams = {
                from_name: formData.get('from_name'),
                from_email: formData.get('from_email'),
                message: formData.get('message')
            };
            const serviceID = 'service_r86w4sl';
            const templateID = 'template_ca62lk1';

            try {
                // Sending email using EmailJS
                await emailjs.send(serviceID, templateID, templateParams);

                if (loadingOverlay) loadingOverlay.classList.remove('active'); 
                alert('Thank you for your message! We will get back to you soon.');
                contactForm.reset();
            } catch (error) {
                console.error("Error sending message:", error);
                if (loadingOverlay) loadingOverlay.classList.remove('active');
                alert('Failed to send message. Please try again later.');
            }
        });
    }
    