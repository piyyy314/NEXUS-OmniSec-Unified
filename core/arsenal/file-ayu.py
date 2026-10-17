def recognize_speech(audio_path, language="english"):
    model = whisper.load_model("base")
    result = model.transcribe(audio_path, language=language)
    return result["text"]

def speak_text(text, language="en"):
    piper = Piper(language=language)
    piper.speak(text)