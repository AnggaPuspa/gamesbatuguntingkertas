       const URL = "http://localhost:5500/tm-my-audio-model";

        let recognizer;
        let lastMove = '';
        let lastDetectionTime = 0;
        const DETECTION_COOLDOWN = 1200; 
        let playerScore = 0;
        let computerScore = 0;
        
        const choiceIcons = {
            'BATU': '<i class="fa-solid fa-hand-back-fist fa-2x"></i>',
            'GUNTING': '<i class="fa-solid fa-hand-scissors fa-2x"></i>',
            'KERTAS': '<i class="fa-solid fa-hand fa-2x"></i>',
            '-': '<i class="fa-solid fa-question fa-2x"></i>'
        };
        
        const validChoices = ['BATU', 'GUNTING', 'KERTAS'];

        async function createModel() {
            const checkpointURL = URL + "/model.json";
            const metadataURL = URL + "/metadata.json";

            recognizer = speechCommands.create(
                "BROWSER_FFT",
                undefined,
                checkpointURL,
                metadataURL);

            await recognizer.ensureModelLoaded();
            return recognizer;
        }

        async function init() {
            document.querySelector('button').disabled = true;
            document.getElementById('game-container').classList.remove('hidden');
            document.getElementById('next-round').classList.add('hidden');

            const recognizer = await createModel();
            const classLabels = recognizer.wordLabels();
            const labelContainer = document.getElementById("label-container");
            for (let i = 0; i < classLabels.length; i++) {
                labelContainer.appendChild(document.createElement("div"));
            }

            recognizer.listen(result => {
                const scores = result.scores;
                const now = Date.now();
                let maxScore = 0;
                let predictedClass = '';
                let backgroundNoiseScore = 0;
                for (let i = 0; i < classLabels.length; i++) {
                    if (result.scores[i] > maxScore) {
                        maxScore = result.scores[i];
                        predictedClass = classLabels[i];
                    }
                    if (classLabels[i].toLowerCase().includes('background')) {
                        backgroundNoiseScore = result.scores[i];
                    }
                }

                for (let i = 0; i < classLabels.length; i++) {
                    const classPrediction = classLabels[i] + ": " + result.scores[i].toFixed(2);
                    labelContainer.childNodes[i].innerHTML = classPrediction;
                }

                if (backgroundNoiseScore > 0.5) {
                    lastMove = '';
                    return;
                }

                if (now - lastDetectionTime < DETECTION_COOLDOWN) {
                    return;
                }

                const validLabels = ['BATU', 'GUNTING', 'KERTAS'];
                if (
                    validLabels.includes(predictedClass.toUpperCase()) &&
                    predictedClass !== lastMove &&
                    maxScore > 0.8
                ) {
                    lastMove = predictedClass;
                    lastDetectionTime = now;
                    setTimeout(() => {
                        lastMove = '';
                    }, DETECTION_COOLDOWN);
                    playGame(predictedClass);
                }

            }, {
                includeSpectrogram: true,
                probabilityThreshold: 0.75,
                invokeCallbackOnNoiseAndUnknown: true,
                overlapFactor: 0.50
            });
        }

        function playGame(playerChoice) {
            playerChoice = playerChoice.toUpperCase();
            
            if (playerChoice === 'gunting') playerChoice = 'GUNTING';
            
            let computerChoice = validChoices[Math.floor(Math.random() * validChoices.length)];

            document.getElementById('player-choice').innerText = playerChoice;
            document.getElementById('computer-choice').innerText = computerChoice;
            
            document.getElementById('player-choice-icon').innerHTML = choiceIcons[playerChoice] || choiceIcons['-'];
            document.getElementById('computer-choice-icon').innerHTML = choiceIcons[computerChoice] || choiceIcons['-'];

            const result = getResult(playerChoice, computerChoice);
            document.getElementById('result').innerText = result;
            const nextRoundEl = document.getElementById('next-round');
            nextRoundEl.innerText = "Next Round siap! Ucapkan pilihan Anda lagi.";
            nextRoundEl.classList.remove('hidden');
            
            if (result === "Anda Menang!") {
                playerScore++;
                document.getElementById('player-score').innerText = playerScore;
            } else if (result === "Anda Kalah!") {
                computerScore++;
                document.getElementById('computer-score').innerText = computerScore;
            }
        }

        function getResult(player, computer) {
            console.log("Perbandingan: Player=" + player + ", Computer=" + computer);
            
            if (player === computer) {
                return "Seri!";
            } else if (
                (player === 'BATU' && computer === 'GUNTING') ||
                (player === 'GUNTING' && computer === 'KERTAS') ||
                (player === 'KERTAS' && computer === 'BATU')
            ) {
                return "Anda Menang!";
            } else {
                return "Anda Kalah!";
            }
        }
        
        function resetGame() {
            playerScore = 0;
            computerScore = 0;
            document.getElementById('player-score').innerText = '0';
            document.getElementById('computer-score').innerText = '0';
            document.getElementById('player-choice').innerText = '-';
            document.getElementById('computer-choice').innerText = '-';
            document.getElementById('player-choice-icon').innerHTML = '<i class="fa-solid fa-gamepad fa-2x"></i>';
            document.getElementById('computer-choice-icon').innerHTML = '<i class="fa-solid fa-desktop fa-2x"></i>';
            document.getElementById('result').innerText = '-';
            const nextRoundEl = document.getElementById('next-round');
            nextRoundEl.classList.add('hidden');
            nextRoundEl.innerText = "Next Round siap! Ucapkan pilihan Anda lagi.";
        }