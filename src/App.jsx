import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./index.css";
import { Link } from "react-router-dom";

function App() {
  const videoRef = useRef(null);
  const [predictedLetters, setPredictedLetters] = useState([]);
  const [predictedWord, setPredictedWord] = useState("");
  const [lastPredictedLetter, setLastPredictedLetter] = useState("");
  const [processedImage, setProcessedImage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [language, setLanguage] = useState("en");
  const [translatedWord, setTranslatedWord] = useState("");
  const [volume, setVolume] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const startVideoStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setIsStreaming(true);
    };

    startVideoStream();

    const sendFrame = async () => {
      if (isStreaming) {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const context = canvas.getContext("2d");
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg");

        try {
          const response = await axios.post("http://localhost:5000/predict", {
            image: imageData.split(",")[1],
          });

          const predictedLetter = response.data.predicted_label;

          if (predictedLetter === "Space") {
            setPredictedWord((prevWord) => prevWord + " ");
            setPredictedLetters([]);
            setLastPredictedLetter("");
          } else {
            if (predictedLetter !== lastPredictedLetter) {
              setPredictedLetters((prev) => [...prev, predictedLetter]);
              setPredictedWord((prevWord) => prevWord + predictedLetter);
            }
            setLastPredictedLetter(predictedLetter);
          }

          setProcessedImage(`data:image/jpeg;base64,${response.data.image}`);

          if (predictedWord) {
            translateWord(predictedWord);
          }
        } catch (error) {
          console.error("Error fetching prediction: ", error);
        }
      }
    };

    const interval = setInterval(sendFrame, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isStreaming, lastPredictedLetter, predictedWord, language]);

  const handleDeleteLetter = () => {
    setPredictedWord((prevWord) => prevWord.slice(0, -1));
    setPredictedLetters((prev) => prev.slice(0, -1));
    setLastPredictedLetter("");
  };

  const mapPitch = (value) => {
    return (value + 10) / 10;
  };

  const speakWord = (word) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = language;
    utterance.volume = volume;
    utterance.pitch = mapPitch(pitch);
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeakAloud = () => {
    if (predictedWord) {
      speakWord(predictedWord);
    }
  };

  const translateWord = async (word) => {
    try {
      const response = await axios.post(
        "https://translation.googleapis.com/language/translate/v2",
        {
          q: word,
          target: language,
          format: "text",
        },
        {
          params: {
            key: "YOUR_GOOGLE_TRANSLATE_API_KEY",
          },
        }
      );

      setTranslatedWord(response.data.data.translations[0].translatedText);
    } catch (error) {
      console.error("Error translating word: ", error);
    }
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleVolumeChange = (event) => {
    setVolume(event.target.value);
  };

  const handlePitchChange = (event) => {
    setPitch(event.target.value);
  };

  const handleRateChange = (event) => {
    setRate(event.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="  bg-blue-600 border border-red-600 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-white text-2xl font-bold">Signease</h1>

          <h2 className="text-white text-2xl font-bold">Educational sector</h2>
        </div>
      </nav>

      {/* Main content */}
      <div className="container mx-auto mt-10 p-5 bg-white shadow-md rounded-lg">
        <div className="flex justify-center border border-red-600 mb-5">
          <video
            ref={videoRef}
            width="520"
            height="440"
            autoPlay
            className="border  border-red-600 rounded-md"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>

        <div className="text-center mb-5">
          <h2 className="text-xl font-semibold">
            Predicted Word: {predictedWord}
          </h2>
          <h2 className="text-xl font-semibold">
            Translated Word: {translatedWord}
          </h2>
          <h3 className="text-lg">
            Predicted Letters: {predictedLetters.join("")}
          </h3>
        </div>

        {/* Buttons */}
        <div className="flex justify-center  space-x-5 mb-5">
          <button
            onClick={handleDeleteLetter}
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
          >
            Delete Last Letter
          </button>
          <button
            onClick={handleSpeakAloud}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Speak Aloud
          </button>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block mb-2">Translate to:</label>
            <select
              id="language"
              value={language}
              onChange={handleLanguageChange}
              className="border border-gray-300 p-2 rounded w-full"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <div>
            <label htmlFor="volume" className="block mb-2">
              Volume
            </label>
            <input
              type="range"
              id="volume"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full"
            />
            <span>{volume}</span>
          </div>

          <div>
            <label htmlFor="pitch" className="block mb-2">
              Pitch
            </label>
            <input
              type="range"
              id="pitch"
              min="-10"
              max="10"
              step="0.1"
              value={pitch}
              onChange={handlePitchChange}
              className="w-full"
            />
            <span>{pitch}</span>
          </div>

          <div>
            <label htmlFor="rate" className="block mb-2">
              Speed
            </label>
            <input
              type="range"
              id="rate"
              min="0.1"
              max="3"
              step="0.1"
              value={rate}
              onChange={handleRateChange}
              className="w-full"
            />
            <span>{rate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
