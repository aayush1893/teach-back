
# Teach-Back Engine: Intelligent Communication for Health

![Teach-Back Engine Screenshot](https://storage.googleapis.com/aistudio-programmable-ui-project-images/5a21e42a-99f5-46f9-813c-33b2fe92f15f.png)

The **Teach-Back Engine** is a sophisticated web application designed to bridge the health literacy gap by transforming complex medical instructions into simple, understandable, and actionable information for patients and caregivers. It leverages the power of the Google Gemini API to not only simplify text but also to verify a user's comprehension through a dynamic, adaptive learning loop.

## The Problem

Medical jargon is a significant barrier to patient understanding. Instructions for prescriptions, discharge plans, or insurance documents can be dense and confusing, leading to poor adherence, medical errors, and anxiety. The clinical "teach-back" method—where a provider asks a patient to explain instructions in their own words—is a proven technique to improve comprehension, but it requires time and can be difficult to scale.

This application digitizes and enhances the teach-back method, empowering users to check their understanding privately and at their own pace.

## Features at a Glance

| Structured Data Extraction | Adaptive Quiz & Remediation |
| :---: | :---: |
| ![Screenshot of the Domain Details Card showing extracted prescription information like dose and frequency.](https://storage.googleapis.com/aistudio-programmable-ui-project-images/tbe_screenshot_domain_details.png) | ![Screenshot of the quiz showing one incorrect answer with a detailed rationale and a re-teaching remediation box below.](https://storage.googleapis.com/aistudio-programmable-ui-project-images/tbe_screenshot_quiz_remediation.png) |
| The app intelligently identifies the document type and extracts key information into a clean, easy-to-read summary card. | The quiz provides instant feedback. If you miss a question, a re-teaching module helps you understand the concept before you try again. |

| Chat Helper & Personal Glossary | Live Voice Q&A |
| :---: | :---: |
| ![Screenshot of the Chat Helper defining a medical term, with a button to add the definition to a personal glossary.](https://storage.googleapis.com/aistudio-programmable-ui-project-images/tbe_screenshot_chat_glossary.png) | ![Screenshot of the Live Q&A tab showing a real-time transcript of a voice conversation between the user and the AI assistant.](https://storage.googleapis.com/aistudio-programmable-ui-project-images/tbe_screenshot_live_qa.png) |
| Ask for definitions of complex terms and save them to your personal glossary for future reference. | Have a natural, hands-free conversation with the AI assistant. The entire dialogue is transcribed in real-time. |


## Core Features

### 1. Intelligent Simplification & Data Extraction
The app employs a powerful two-stage process powered by the Gemini API:

*   **Stage 1: Document Classification:** The application first analyzes the provided input (text, uploaded PDF, or dictated audio) to classify it into one of several medical contexts:
    *   Prescription Details
    *   Explanation of Benefits (EOB)
    *   Prior Authorization
    *   Discharge Instructions
    *   Lab Results
    *   General/Unknown
*   **Stage 2: Structured Generation:** Using the identified context, the model generates a rich, structured output that includes:
    *   **Simplified Text:** The original instructions rewritten at a 6th-8th grade reading level.
    *   **Domain-Specific Details:** Key information is extracted and displayed in a clear, organized card (e.g., dosage and frequency for a prescription; follow-up dates for discharge).
    *   **Safety Flags:** The app identifies and highlights potentially urgent "red flag" terms (e.g., "severe headache," "chest pain") to prompt users to contact their provider.

### 2. Multi-Modal Input
Users can provide information in the most convenient way:
*   **Text:** Paste text directly into the input area.
*   **PDF Upload (Vision):** Upload a PDF document. The app uses `pdf.js` to render the first page as an image, which is then analyzed by Gemini's vision capabilities.
*   **Audio Transcription & Translation:** Dictate instructions in one of several supported languages. The app transcribes the audio and can translate it into another language, populating the input field with the result.

### 3. Adaptive Quiz & Mastery Loop
To ensure true comprehension, the app doesn't just simplify—it verifies.
*   **Dynamic Quiz:** A 3-5 question quiz is generated based on the most critical information in the source text.
*   **Instant Feedback:** After submitting, users see which questions they answered correctly and receive clear rationales for each answer.
*   **Remediation:** If any questions are answered incorrectly, a "re-teaching" module appears, explaining the concepts again in a new way with examples.
*   **Mastery Badge:** Users can "Try Again" until they answer all questions correctly, at which point they earn a "Mastery Badge," providing a sense of accomplishment and confidence.

### 4. Interactive Assistance Tools
*   **Chat Helper:** A conversational chatbot where users can ask for definitions of specific medical terms (e.g., "What is an anticoagulant?") or ask for sentences to be rephrased.
*   **Personal Glossary:** The chat helper can identify and define terms in a structured format. Users can save these definitions to a personal, persistent glossary for future reference.
*   **Live Q&A:** For a more natural, hands-free experience, users can start a real-time, voice-to-voice conversation with the Gemini assistant. The full conversation is transcribed on-screen.

### 5. User-Centric Conveniences
*   **Session Management:** Save an entire session (input, results, quiz state) to local storage and load it again later.
*   **Printable Summary:** Download a clean, well-formatted summary of the simplified text, key details, and quiz answers to bring to a doctor's appointment.
*   **Progressive Web App (PWA):** The app is fully installable on desktop and mobile devices and offers offline access to the application shell and saved sessions.
*   **Accessibility:** Includes a Light/Dark mode toggle and is designed with ARIA attributes for screen reader compatibility.

## Tech Stack

*   **AI Engine:** Google Gemini API (`gemini-2.5-flash` for text/vision, `gemini-2.5-flash-preview-tts` for speech, and `gemini-2.5-flash-native-audio-preview-09-2025` for live conversation).
*   **Frontend:** React 19 with TypeScript.
*   **Styling:** Tailwind CSS (via JIT CDN for rapid prototyping).
*   **Client-Side Libraries:**
    *   **PDF.js:** For rendering PDF documents into images for vision analysis.
    *   **React Joyride:** For the interactive product tour.
*   **Offline Support:** Implemented via a custom Service Worker.

## Limitations & Disclaimer

**This is an educational tool, not a substitute for professional medical advice.**

*   **AI is not infallible:** The AI model can make mistakes or "hallucinate" information. All simplified text and extracted data **must be verified** with a qualified healthcare professional.
*   **Not for emergencies:** This tool should never be used in a medical emergency. If you are experiencing urgent symptoms, call your local emergency number immediately.
*   **Privacy:** This application is designed with privacy in mind. All data processing occurs between your browser and the Google Gemini API. No instruction text or personal health information is stored on any intermediary server. Session data is stored exclusively in your browser's local storage.