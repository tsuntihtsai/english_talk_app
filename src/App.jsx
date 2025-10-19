import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, RotateCcw } from 'lucide-react';

// 【重要】請確保您的 .env 檔案中有正確設定 REACT_APP_GEMINI_API_KEY
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const teachers = {
  teacher1: {
    name: 'Emma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma_Teacher&backgroundColor=ffb6c1&scale=90&mood=happy',
    bio: 'English Culture Expert',
    voice: 'Female'
  },
  teacher2: {
    name: 'James',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James_Teacher&backgroundColor=add8e6&scale=90&mood=happy',
    bio: 'Business English Teacher',
    voice: 'Male'
  },
  teacher3: {
    name: 'Sofia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia_Teacher&backgroundColor=dda0dd&scale=90&mood=happy',
    bio: 'Travel English Guide',
    voice: 'Female'
  },
  teacher4: {
    name: 'Alex',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex_Teacher&backgroundColor=90ee90&scale=90&mood=happy',
    bio: 'Technology Expert',
    voice: 'Male'
  }
};

const topics = {
  business: { name: 'Business', icon: '💼', desc: 'Business communication' },
  travel: { name: 'Travel', icon: '✈️', desc: 'Travel and tourism' },
  news: { name: 'News', icon: '📰', desc: 'News discussion' },
  technology: { name: 'Technology', icon: '🚀', desc: 'Tech trends' },
  presentation: { name: 'Presentation', icon: '📊', desc: 'English presentation practice' }
};

const levels = {
  beginner: { name: '初級', level: 'Beginner' },
  intermediate: { name: '中級', level: 'Intermediate' },
  advanced: { name: '高級', level: 'Advanced' },
  fluent: { name: '流暢', level: 'Fluent' }
};

const styles = {
    // ... 您原本的 styles 物件，此處省略以保持簡潔 ...
    homeScreen: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
        color: 'white',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '100vh'
    },
    title: { fontSize: '48px', fontWeight: 'bold', margin: '20px 0 10px 0', textAlign: 'center' },
    subtitle: { fontSize: '18px', opacity: 0.9, textAlign: 'center', margin: '10px 0' },
    button: {
        width: '100%',
        padding: '16px',
        margin: '12px 0',
        fontSize: '16px',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    primaryButton: { background: 'white', color: '#3b82f6' },
    secondaryButton: { background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)' },
    topicScreen: { background: '#f3f4f6', padding: '24px', minHeight: '100vh', overflowY: 'auto' },
    topicItem: {
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        margin: '12px 0',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    topicItemSelected: { background: '#3b82f6', color: 'white', border: '2px solid #3b82f6' },
    chatScreen: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f3f4f6' },
    chatHeader: {
        background: 'white',
        borderBottom: '2px solid #e5e7eb',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    chatMessages: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    userMessage: {
        alignSelf: 'flex-end',
        background: '#3b82f6',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        maxWidth: '70%',
        wordWrap: 'break-word'
    },
    aiMessage: {
        alignSelf: 'flex-start',
        background: 'white',
        color: '#1f2937',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '2px solid #e5e7eb',
        maxWidth: '70%',
        wordWrap: 'break-word'
    },
    correctionBox: {
        alignSelf: 'flex-start',
        background: '#fef3c7',
        color: '#92400e',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '2px solid #fcd34d',
        maxWidth: '70%',
        wordWrap: 'break-word',
        fontSize: '13px'
    },
    chatControls: {
        background: 'white',
        borderTop: '2px solid #e5e7eb',
        padding: '16px',
        textAlign: 'center'
    },
    micButton: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        border: 'none',
        fontSize: '32px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginBottom: '16px'
    }
};

function App() {
  const [screen, setScreen] = useState('home');
  const [topic, setTopic] = useState('business');
  const [level, setLevel] = useState('intermediate');
  const [teacher, setTeacher] = useState('teacher1');
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isRepeatMode, setIsRepeatMode] = useState(false);
  const conversationHistory = useRef([]);
  const correctAttempts = useRef(0);
  const availableVoices = useRef([]);

  useEffect(() => {
    const loadVoices = () => {
      availableVoices.current = window.speechSynthesis.getVoices();
      if (availableVoices.current.length > 0) {
        console.log('Voices successfully loaded:', availableVoices.current.map(v => v.name));
      }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const getSystemPrompt = useCallback(() => {
    return `You are ${teachers[teacher].name}, an enthusiastic English teacher.
Student level: ${levels[level].name}.
Topic: ${topics[topic].name}.

IMPORTANT: Speak naturally with emotion and personality!
- Use contractions (I'm, don't, can't).
- Add emotional words (wow, amazing, oh, hmm).
- Show enthusiasm with exclamation marks!
- Ask questions to engage the student.
- Be friendly and encouraging.

Instructions:
1. Speak naturally with feeling.
2. Keep responses to 1-2 sentences.
${(level === 'beginner' || level === 'intermediate') && !isRepeatMode ? `
3. Check every sentence for grammar errors. If a mistake is found, point it out kindly and ask them to repeat. Example: "Almost there! Just say 'I am happy' instead of 'I is happy'. Can you try that again?"
` : ''}
${isRepeatMode ? `
The student is repeating their sentence. Evaluate if it is now correct (80% accuracy).
If correct, praise them enthusiastically and continue the conversation.
If still has errors, encourage them to try again.
` : ''}`;
  }, [teacher, level, topic, isRepeatMode]);

  const speakText = useCallback((text) => {
    if (!window.speechSynthesis) {
        alert("Your browser does not support speech output.");
        return;
    }
    
    if (availableVoices.current.length === 0) {
      setTimeout(() => speakText(text), 100);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = 'en-US';

    let selectedVoice = null;
    const isFemaleTeacher = teachers[teacher].voice === 'Female';

    if (isFemaleTeacher) {
      selectedVoice = availableVoices.current.find(v => v.lang === 'en-US' && /Google US English|Microsoft Zira|Female/i.test(v.name));
    } else {
      selectedVoice = availableVoices.current.find(v => v.lang === 'en-US' && /Google US English|Microsoft David|Male/i.test(v.name));
    }
    if (!selectedVoice) {
      selectedVoice = availableVoices.current.find(v => v.lang === 'en-US');
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    if (level === 'beginner') utterance.rate = 0.8;
    else if (level === 'intermediate') utterance.rate = 0.9;
    else utterance.rate = 1.0;

    utterance.pitch = isFemaleTeacher ? 1.1 : 0.9;
    utterance.volume = 1.0;

    let processedText = text
      .replace(/["'(){}[\]<>*\/\\&@#$%^`~=_+-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    utterance.text = processedText;
    window.speechSynthesis.speak(utterance);
  }, [teacher, level]);
  
  const generateAIResponse = useCallback(async (userMessage, retryCount = 0) => {
    setIsListening(true);
    setIsLoading(true);

    if(retryCount === 0) {
        conversationHistory.current.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });
    }

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: getSystemPrompt() }] },
          contents: conversationHistory.current,
          generationConfig: { maxOutputTokens: 200, temperature: 0.9 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown API error'}`);
      }

      const data = await response.json();

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiResponse = data.candidates[0].content.parts[0].text;

        conversationHistory.current.push({
          role: 'model',
          parts: [{ text: aiResponse }]
        });

        const hasRepeatRequest = aiResponse.toLowerCase().includes('again') || aiResponse.toLowerCase().includes('repeat');
        
        if (hasRepeatRequest && (level === 'beginner' || level === 'intermediate')) {
          setIsRepeatMode(true);
          correctAttempts.current = 0;
        } else {
            setIsRepeatMode(false);
            setMessageCount(prev => prev + 1);
        }

        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        speakText(aiResponse);

      } else if (data?.promptFeedback?.blockReason) {
        const errorMessage = `Teacher couldn't respond: Content was filtered. Please try rephrasing.`;
        setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
        speakText(errorMessage);
      } else if (retryCount < 2) {
        await new Promise(res => setTimeout(res, 1500));
        return generateAIResponse(userMessage, retryCount + 1);
      } else {
        throw new Error('Invalid response format after multiple retries.');
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      alert(`Error: ${error.message}. Please check API key and network.`);
    } finally {
      setIsListening(false);
      setIsLoading(false);
    }
  }, [getSystemPrompt, speakText, level, isRepeatMode]);

  const startRecording = useCallback(async () => {
    if (isRecording || isListening || isLoading) return;
    
    setIsRecording(true);
    window.speechSynthesis.cancel();

    try {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          setMessages(prev => [...prev, { role: 'user', content: transcript }]);
          generateAIResponse(transcript);
        }
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        alert(`Speech recognition error: ${event.error}.`);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (error) {
      alert('Cannot access microphone. Please check permissions.');
      setIsRecording(false);
    }
  }, [isRecording, isListening, isLoading, generateAIResponse]);

  if (screen === 'home') {
    return (
      <div style={styles.homeScreen}>
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <h1 style={styles.title}>English Talk</h1>
          <p style={styles.subtitle}>Learn English with AI Teachers</p>
        </div>
        <div style={{ width: '100%', marginBottom: '40px' }}>
          <button style={{ ...styles.button, ...styles.primaryButton }} onClick={() => setScreen('topic')}>Start Conversation</button>
          <button style={{ ...styles.button, ...styles.secondaryButton }} onClick={() => setScreen('settings')}>Choose Teacher ({teachers[teacher].name})</button>
        </div>
      </div>
    );
  }

  if (screen === 'topic') {
    return (
      <div style={styles.topicScreen}>
        <button style={{ ...styles.button, background: '#3b82f6', color: 'white', marginBottom: '20px' }} onClick={() => setScreen('home')}>Back</button>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>Choose Topic</h2>
        {Object.entries(topics).map(([key, value]) => (
          <div key={key} style={{ ...styles.topicItem, ...(topic === key ? styles.topicItemSelected : {}) }} onClick={() => setTopic(key)}>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{value.name}</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>{value.desc}</div>
          </div>
        ))}
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '30px 0 10px 0' }}>Choose Level</h2>
        {Object.entries(levels).map(([key, value]) => (
          <button key={key} style={{ ...styles.topicItem, ...(level === key ? { background: '#9333ea', color: 'white', border: '2px solid #9333ea' } : {}), width: '100%', textAlign: 'left' }} onClick={() => setLevel(key)}>
            {value.name} ({value.level})
          </button>
        ))}
        <button
          style={{ ...styles.button, ...styles.primaryButton, marginTop: '30px', background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)', color: 'white' }}
          onClick={() => {
            setMessages([]);
            conversationHistory.current = [];
            setMessageCount(0);
            setScreen('chat');
            setTimeout(() => generateAIResponse("Hello! I'm ready to start our conversation."), 100);
          }}
        >
          Start Chat
        </button>
      </div>
    );
  }

  if (screen === 'chat') {
    return (
      <div style={styles.chatScreen}>
        <div style={styles.chatHeader}>
          <button style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }} onClick={() => setScreen('topic')}>Back</button>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontWeight: 'bold' }}>{topics[topic].name}</h3>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>{levels[level].name}</p>
          </div>
          <img src={teachers[teacher].avatar} alt="teacher" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        </div>
        <div style={styles.chatMessages}>
          {messages.map((msg, idx) => (
            <div key={idx} style={msg.role === 'correction' ? styles.correctionBox : (msg.role === 'user' ? styles.userMessage : styles.aiMessage)}>
              {msg.content}
            </div>
          ))}
          {isLoading && <p style={{ textAlign: 'center', color: '#3b82f6', fontWeight: 'bold' }}>Thinking...</p>}
          {isRepeatMode && <p style={{ textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>Please try again...</p>}
        </div>
        <div style={styles.chatControls}>
          <button style={{ ...styles.micButton, background: isRecording ? '#ef4444' : '#3b82f6' }} onClick={startRecording} disabled={isRecording || isListening || isLoading}>
            {isRecording ? <MicOff size={40} color="white" /> : <Mic size={40} color="white" />}
          </button>
          <p>{isRecording ? 'Recording...' : isListening ? 'Teacher speaking...' : 'Press microphone to speak'}</p>
          <button style={{ ...styles.button, background: '#e5e7eb', color: '#1f2937', marginTop: '12px' }} onClick={() => {
            window.speechSynthesis.cancel();
            setMessages([]);
            conversationHistory.current = [];
            setMessageCount(0);
            setIsRepeatMode(false);
            correctAttempts.current = 0;
          }}>
            <RotateCcw size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Reset Chat
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <div style={styles.topicScreen}>
        <button style={{ ...styles.button, background: '#3b82f6', color: 'white', marginBottom: '20px' }} onClick={() => setScreen('home')}>Back</button>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>Choose Your Teacher</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {Object.entries(teachers).map(([key, value]) => (
            <button key={key} style={{ ...styles.topicItem, textAlign: 'center', padding: '24px', ...(teacher === key ? { background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)', color: 'white', border: 'none' } : {}) }} onClick={() => setTeacher(key)}>
              <img src={value.avatar} alt={value.name} style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '12px' }} />
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{value.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>{value.bio}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }
}

export default App;