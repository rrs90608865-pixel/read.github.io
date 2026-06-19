const input = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const video = document.getElementById("camera");

let capturedFile = null;
let lastHindiText = "";

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle("dark");
}

// Welcome Guide
function startGuide() {

    const msg = new SpeechSynthesisUtterance(
        "Welcome to Smart Reader. You can upload an image or open the camera and convert the text into speech."
    );

    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
}

// Camera Start
function startCamera() {

    navigator.mediaDevices.getUserMedia({
        video: true
    })

        .then(stream => {

            video.srcObject = stream;
            video.style.display = "block";

        })

        .catch(error => {

            alert("Camera Permission Denied");
            console.error(error);

        });
}

// Capture Image
function captureImage() {

    if (!video.srcObject) {

        alert("Please open camera first.");
        return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {

        capturedFile = new File(
            [blob],
            "capture.png",
            {
                type: "image/png"
            }
        );

        preview.src = URL.createObjectURL(blob);

    });
}

// Upload Image
input.addEventListener("change", () => {

    const file = input.files[0];

    if (!file) return;

    capturedFile = file;

    preview.src = URL.createObjectURL(file);

});

// OCR + Translation
async function processImage() {

    if (!capturedFile) {

        alert("Please upload or capture an image first.");
        return;
    }

    const loading = document.getElementById("loading");
    const progressBar = document.getElementById("progressBar");

    try {

        loading.innerText = "Extracting Text...";
        progressBar.value = 20;

        const result = await Tesseract.recognize(
            capturedFile,
            "eng"
        );

        progressBar.value = 60;

        const text = result.data.text;

        document.getElementById("englishText").innerText =
            text;

        loading.innerText = "Translating...";

        const url =
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url);

        const data = await response.json();

        const hindiText =
            data[0]
                .map(item => item[0])
                .join("");

        document.getElementById("hindiText").innerText =
            hindiText;

        lastHindiText = hindiText;

        progressBar.value = 100;

        loading.innerText = "Completed";

        speakHindi(hindiText);

    }

    catch (error) {

        console.error(error);

        loading.innerText = "Error Occurred";

    }
}

// Hindi Speech
function speakHindi(text) {

    if (!text) return;

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.lang = "hi-IN";

    speechSynthesis.cancel();

    speechSynthesis.speak(speech);
}

// Replay Speech
function replaySpeech() {

    if (lastHindiText) {

        speakHindi(lastHindiText);

    } else {

        alert("No text available.");

    }
}

// Pause Speech
function pauseSpeech() {

    if (
        speechSynthesis.speaking &&
        !speechSynthesis.paused
    ) {

        speechSynthesis.pause();

    }
}

// Resume Speech
function resumeSpeech() {

    if (speechSynthesis.paused) {

        speechSynthesis.resume();

    }
}

// Stop Speech
function stopSpeech() {

    speechSynthesis.cancel();

}

// Generic Speaker
function speakMessage(text) {

    const msg =
        new SpeechSynthesisUtterance(text);

    speechSynthesis.cancel();

    speechSynthesis.speak(msg);
}

// Voice Assistant
function startListening() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        alert(
            "Speech Recognition not supported in this browser."
        );

        return;
    }

    const recognition =
        new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.continuous = false;

    recognition.start();

    speakMessage("Listening");

    recognition.onresult = function (event) {

        const command =
            event.results[0][0]
                .transcript
                .toLowerCase();

        console.log("Command:", command);

        if (
            command.includes("open camera")
        ) {

            startCamera();
            speakMessage("Opening camera");
        }

        else if (
            command.includes("capture")
        ) {

            captureImage();
            speakMessage("Image captured");
        }

        else if (
            command.includes("convert")
        ) {

            processImage();
        }

        else if (
            command.includes("read text")
        ) {

            replaySpeech();
        }

        else if (
            command.includes("pause")
        ) {

            pauseSpeech();
        }

        else if (
            command.includes("resume")
        ) {

            resumeSpeech();
        }

        else if (
            command.includes("stop")
        ) {

            stopSpeech();
        }

        else if (
            command.includes("help")
        ) {

            speakMessage(
                "Available commands are open camera, capture image, convert image, read text, pause, resume and stop."
            );
        }

        else {

            speakMessage(
                "Command not recognized."
            );
        }
    };

    recognition.onerror = function () {

        speakMessage(
            "Unable to recognize voice command."
        );
    };
}

// Welcome Voice on Load
window.onload = function () {

    setTimeout(() => {

        const welcome =
            new SpeechSynthesisUtterance(
                "Welcome to Smart Reader for Blind. Press voice assistant or click start guide."
            );

        speechSynthesis.speak(welcome);

    }, 1000);

};