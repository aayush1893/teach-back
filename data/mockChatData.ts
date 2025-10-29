
import { ChatMessage } from '../types';

export const mockChatMessages: ChatMessage[] = [
    { role: 'model', text: 'Hello! This is a demo of the Chat Helper. I can help explain medical terms.' },
    { role: 'user', text: 'What does "anticoagulant" mean?' },
    { role: 'model', text: 'An anticoagulant is a type of medicine often called a "blood thinner." It helps prevent blood clots from forming, which is very important for conditions like Atrial Fibrillation to reduce the risk of a stroke.' }
];

export const mockLiveTranscript: ChatMessage[] = [
    { role: 'user', text: 'Can you remind me what a beta-blocker does?' },
    { role: 'model', text: 'Of course. A beta-blocker is a medication that helps your heart beat more slowly and with less force. In your case, it\'s used to help control your heart rate.' }
];
