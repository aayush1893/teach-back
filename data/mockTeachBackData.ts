
import { TeachBackData } from '../types';

export const sampleInputText = `
Patient: John Doe, DOB: 01/15/1965
Discharge Instructions for Atrial Fibrillation

Medication:
- Eliquis (apixaban) 5 mg tablet. Take one tablet by mouth twice daily. This is an anticoagulant to prevent stroke. Do not stop taking this without consulting your cardiologist.
- Metoprolol Succinate ER 50 mg tablet. Take one tablet by mouth once daily. This is a beta-blocker to control your heart rate.

Follow-up:
- Schedule an appointment with Dr. Smith (Cardiology) in 4 weeks.
- Obtain an outpatient lab draw for a basic metabolic panel (BMP) and complete blood count (CBC) in 2 weeks.

Warning Signs:
- Seek immediate medical attention for signs of major bleeding, such as red or black tarry stools, severe headache, or coughing up blood.
- Contact our office if you experience increased shortness of breath, dizziness, fainting, or chest pain.
`;

export const mockTeachBackData: TeachBackData = {
  simplified_text: "Here is a simpler way to understand your instructions for Atrial Fibrillation.\n\n**Your Medicines:**\n\n*   **Eliquis (apixaban) 5 mg:** Take one pill two times every day. This is a blood thinner that helps prevent strokes. It is very important that you do not stop taking this medicine unless your heart doctor tells you to.\n*   **Metoprolol Succinate ER 50 mg:** Take one pill one time every day. This medicine helps keep your heart from beating too fast.\n\n**Next Steps:**\n\n*   You need to see your heart doctor, Dr. Smith, in about one month.\n*   You also need to get some blood tests done in two weeks. These are called a BMP and a CBC.\n\n**When to Get Help Right Away:**\n\nYou must get help immediately if you see signs of serious bleeding. This includes:\n\n*   Your stool is red or looks like black tar.\n*   You have a very bad headache.\n*   You cough up blood.\n\nAlso, please call the doctor's office if you feel more out of breath, dizzy, feel like you might faint, or have chest pain.",
  reading_grade: 7,
  qa: [
    {
      q: "How many times a day should you take your Eliquis (apixaban) pill?",
      a_correct: "Twice a day",
      a_distractors: [
        "Once a day",
        "Only when my heart feels fast"
      ],
      rationale_correct: "The instructions clearly state to take one tablet twice daily. This is crucial for preventing strokes.",
      rationale_incorrect: "Taking it once a day is incorrect and would not be effective. You must take it every day as scheduled, not just based on symptoms."
    },
    {
      q: "Which of these is a reason to get medical help immediately?",
      a_correct: "Coughing up blood",
      a_distractors: [
        "You need to schedule a follow-up appointment",
        "Feeling a little tired"
      ],
      rationale_correct: "Coughing up blood is a sign of major bleeding, which is a serious side effect of Eliquis and requires immediate attention.",
      rationale_incorrect: "Scheduling an appointment is a normal follow-up action, not an emergency. Feeling tired can be a side effect, but is not a reason for immediate help unless it's severe."
    },
    {
      q: "When should you get your blood tests done?",
      a_correct: "In 2 weeks",
      a_distractors: [
        "In 4 weeks, at your follow-up appointment",
        "You don't need any blood tests"
      ],
      rationale_correct: "The instructions specify getting the lab work done in 2 weeks, which is before your 4-week follow-up appointment.",
      rationale_incorrect: "The appointment is in 4 weeks, but the tests are needed sooner. The instructions explicitly state that blood tests are required."
    }
  ],
  remediation: {
    if_wrong: "Let's review the key points. It's very important to take your medicine exactly as prescribed and to know when to seek help for serious problems.",
    examples: [
      "For example, taking Eliquis twice a day is not optional; it's what protects you from a stroke.",
      "A sign of bleeding, like red or black stool, is an emergency. A regular follow-up is not an emergency."
    ]
  },
  safety_flags: {
    urgent_contact: true,
    contraindication_mentioned: false,
    red_flags: [
      "major bleeding",
      "red or black tarry stools",
      "severe headache",
      "coughing up blood",
      "shortness of breath",
      "dizziness",
      "fainting",
      "chest pain"
    ]
  }
};
