
export const tourSteps = [
  {
    target: 'body',
    content: "Welcome to the Teach-Back Engine! Let's take a quick tour of how it works.",
    placement: 'center',
  },
  {
    target: '[data-tour-id="input-area"]',
    content: "You start here. For this demo, I've added some sample medical instructions.",
  },
  {
    target: '[data-tour-id="input-buttons"]',
    content: "You can also use these buttons to dictate instructions, listen to the text, or upload a PDF.",
  },
  {
    target: '[data-tour-id="generate-button"]',
    content: "After providing text, you'd click this button. For our tour, the results are already generated below.",
  },
  {
    target: '[data-tour-id="simplified-text-card"]',
    content: "This is the simplified version of the instructions, written in plain language. Any safety warnings are flagged here.",
  },
  {
    target: '[data-tour-id="quiz-card"]',
    content: "Next, you take a short quiz to check your understanding of the most important points.",
  },
  {
    target: '[data-tour-id="metrics-footer"]',
    content: "This footer tracks your progress, showing the reading level, your quiz attempts, and how long it takes to master the material.",
  },
   {
    target: '[data-tour-id="tabs"]',
    content: "Beyond the main Teach-Back tool, you have other ways to get help. Let's look at the Chat Helper next.",
  },
  {
    target: '[data-tour-id="chat-helper-content"]',
    content: "The Chat Helper is perfect for asking specific questions about words or phrases you don't understand.",
    placement: 'top'
  },
  {
    target: '[data-tour-id="live-qa-tab"]',
    content: "Now let's check out the Live Q&A.",
  },
  {
    target: '[data-tour-id="live-qa-content"]',
    content: "For a more natural conversation, you can use Live Q&A to talk directly with the AI assistant using your voice.",
    placement: 'top'
  },
  {
    target: '[data-tour-id="session-buttons"]',
    content: "Finally, remember you can save your progress and load it later, or clear everything to start fresh. Enjoy the app!",
  },
];
