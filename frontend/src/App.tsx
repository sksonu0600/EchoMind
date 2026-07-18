import { useState, useRef } from "react";
import { startSystemAudio } from "./utils/speech";

function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcriptRef = useRef("");
  const silenceTimerRef = useRef<any>(null);

  // =========================
  // START LISTENING
  // =========================
  const startListening = async () => {
    if (isListening) return;

    console.log("🎤 START LISTENING CLICKED");

    setTranscript("");
    transcriptRef.current = "";
    setResponse("");
    setIsListening(true);

    try {
      const stream = await startSystemAudio();

      console.log("STREAM:", stream);

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        const blob = event.data;

        console.log(
          "AUDIO CHUNK:",
          blob.size,
          blob.type
        );

        if (!blob || blob.size === 0) return;

        const formData = new FormData();
        formData.append("file", blob);

        try {
          const res = await fetch(
            "http://127.0.0.1:8001/transcribe",
            {
              method: "POST",
              body: formData,
            }
          );

          const data = await res.json();

          console.log("TRANSCRIBE:", data);

          if (data.text) {
            transcriptRef.current += " " + data.text;

            setTranscript(
              transcriptRef.current
            );

            if (silenceTimerRef.current) {
              clearTimeout(
                silenceTimerRef.current
              );
            }

            silenceTimerRef.current =
              setTimeout(() => {
                console.log(
                  "🛑 Silence detected"
                );

                stopListening();
              }, 15000);
          }
        } catch (err) {
          console.error(
            "Transcription error:",
            err
          );
        }
      };

      recorder.start(5000);
    } catch (err) {
      console.error("Stream error:", err);
      setIsListening(false);
    }
  };

  // =========================
  // STOP + ANSWER
  // =========================
  const stopListening = async () => {
    if (!isListening) return;

    console.log("🛑 STOP CLICKED");

    setIsListening(false);
    setLoading(true);

    mediaRecorderRef.current?.stop();

    try {
      const res = await fetch(
        "http://127.0.0.1:8001/analyze-text",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            text: transcriptRef.current,
          }),
        }
      );

      const data = await res.json();

      console.log("ANSWER:", data);

      setResponse(
        data.answer || "No response"
      );
    } catch (err) {
      console.error(err);
      setResponse(
        "Error getting answer"
      );
    }

    setLoading(false);
  };

  // =========================
  // MANUAL ASK
  // =========================
  const callAPI = async () => {
    if (!input) return;

    setLoading(true);

    try {
      const res = await fetch(
        "http://127.0.0.1:8001/analyze-text",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            text: input,
          }),
        }
      );

      const data = await res.json();

      setResponse(
        data.answer || "No response"
      );
    } catch (err) {
      console.error(err);
      setResponse(
        "Error calling API"
      );
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>AI Assistant</h2>

      <input
        style={{
          width: "350px",
          padding: "10px",
        }}
        placeholder="Ask something..."
        value={input}
        onChange={(e) =>
          setInput(e.target.value)
        }
      />

      <br />
      <br />

      <button
        onClick={callAPI}
        disabled={loading}
      >
        {loading
          ? "Loading..."
          : "Ask AI"}
      </button>

      <br />
      <br />

      <button
        onClick={startListening}
        disabled={isListening}
      >
        🎤 Start Listening
      </button>

      <button
        onClick={stopListening}
        disabled={!isListening}
        style={{
          marginLeft: "10px",
        }}
      >
        🔇 Stop & Answer
      </button>

      {isListening && (
        <p style={{ color: "orange" }}>
          🎧 Listening to system audio...
        </p>
      )}

      {transcript && (
        <div
          style={{
            marginTop: "20px",
          }}
        >
          <h3>Live Transcript</h3>

          <div
            style={{
              background: "#333",
              color: "#fff",
              padding: "10px",
              borderRadius: "8px",
              maxWidth: "700px",
              whiteSpace: "pre-wrap",
            }}
          >
            {transcript}
          </div>
        </div>
      )}

      {response && (
        <div
          style={{
            marginTop: "20px",
          }}
        >
          <h3>AI Answer</h3>

          <div
            style={{
              background: "#222",
              color: "#0f0",
              padding: "10px",
              borderRadius: "8px",
              maxWidth: "700px",
            }}
          >
            {response}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;