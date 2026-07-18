// ==============================
// 🎤 MIC SPEECH RECOGNITION
// ==============================

let recognition: any = null;

export const startSpeechRecognition = (
    onResult: (text: string) => void,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
) => {
    const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
        alert("Speech Recognition not supported in this browser");
        return;
    }

    recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
        console.log("🎤 Mic listening started");
        onStart && onStart();
    };

    recognition.onresult = (event: any) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                finalTranscript += transcript + " ";
            }
        }

        if (finalTranscript) {
            console.log("VOICE:", finalTranscript);
            onResult(finalTranscript);
        }
    };

    recognition.onerror = (err: any) => {
        console.error("Speech error:", err);
        onError && onError(err);
    };

    recognition.onend = () => {
        console.log("🛑 Mic stopped");
        onEnd && onEnd();
    };

    recognition.start();
};

export const stopSpeechRecognition = () => {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
};



// ==============================
// 🎧 SYSTEM AUDIO (ELECTRON)
// ==============================

export const startSystemAudio = async (): Promise<MediaStream> => {
    // @ts-ignore
    if (!(window as any).electronAPI) {
        console.log("Running in browser mode");

        // fallback to browser mic
        return await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    try {
        // @ts-ignore
        const stream = await window.electronAPI.getScreenStream();
        console.log("🎧 System audio stream started");
        return stream;
    } catch (err) {
        console.error("System audio error:", err);
        throw err;
    }
};