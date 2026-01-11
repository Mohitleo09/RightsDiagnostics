'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation'; // Import usePathname hook
import { FiSend, FiX, FiMessageCircle, FiMinimize2 } from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';

export default function AIChatbot() {
    const pathname = usePathname(); // Get current pathname
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [localInput, setLocalInput] = useState('');
    const messagesEndRef = useRef(null);
    const [sessionId, setSessionId] = useState(null);
    const [shouldRender, setShouldRender] = useState(false);
    const [authStatus, setAuthStatus] = useState(typeof window !== 'undefined' ? localStorage.getItem('isLoggedIn') : '');

    // Monitor localStorage changes for auth status
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'isLoggedIn') {
                setAuthStatus(e.newValue || '');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Check if we're on a patient page and user is logged in as a patient
    const checkShouldRender = () => {
        // Check if we're on a patient page
        const isPatientPage = pathname === '/' || pathname.startsWith('/Patients/') || pathname.startsWith('/patients/');
        
        // If not on a patient page, don't show chatbot
        if (!isPatientPage) {
            return false;
        }
        
        // If on a patient page, check if user is logged in as a patient
        if (typeof window !== 'undefined') {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const user = localStorage.getItem('user');
            
            // Only show chatbot for logged in patients
            if (isLoggedIn && user) {
                try {
                    const userData = JSON.parse(user);
                    // Check if user is a patient (not admin or vendor)
                    // Patients don't have a specific role, or have role !== admin/superadmin/support/other/vendor
                    const userRole = userData.role;
                    const isPatient = !userRole || 
                                     (userRole !== 'admin' && 
                                      userRole !== 'superadmin' && 
                                      userRole !== 'support' && 
                                      userRole !== 'other' && 
                                      userRole !== 'vendor');
                    
                    return isPatient;
                } catch (e) {
                    // If there's an error parsing user data, assume not a patient
                    return false;
                }
            }
        }
        
        // Don't show chatbot for non-logged in users
        return false;
    };

    // Set whether we should render the chatbot
    useEffect(() => {
        setShouldRender(checkShouldRender());
    }, [pathname, authStatus]);

    // Initialize session and load saved messages
    useEffect(() => {
        // Only run if we should render the chatbot
        if (!shouldRender) return;
        
        // Get or create session ID
        let currentSessionId = localStorage.getItem('chatSessionId');

        if (!currentSessionId) {
            // Create new session ID
            currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('chatSessionId', currentSessionId);
        }

        setSessionId(currentSessionId);

        // Load saved messages for this session
        const savedMessages = localStorage.getItem(`chatMessages_${currentSessionId}`);
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                setMessages(parsed);
            } catch (err) {
                console.error('Error loading saved messages:', err);
            }
        }

        // Listen for logout event
        const handleLogout = () => {
            // Clear chat data on logout
            const currentSession = localStorage.getItem('chatSessionId');
            if (currentSession) {
                localStorage.removeItem(`chatMessages_${currentSession}`);
                localStorage.removeItem('chatSessionId');
            }
            setMessages([]);
            setSessionId(null);
        };

        // Listen for login/logout events
        const handleAuthChange = () => {
            // Check if user is still logged in
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (!isLoggedIn) {
                // User logged out, clear chat data
                handleLogout();
            } else {
                // User logged in, create a new session for fresh chat
                const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('chatSessionId', newSessionId);
                setSessionId(newSessionId);
                setMessages([]); // Clear messages for fresh start
            }
        };

        // Listen for custom auth change event
        window.addEventListener('userLoggedIn', handleAuthChange);

        // Also listen for the old userLogout event for backward compatibility
        window.addEventListener('userLogout', handleLogout);

        return () => {
            window.removeEventListener('userLoggedIn', handleAuthChange);
            window.removeEventListener('userLogout', handleLogout);
        };
    }, [shouldRender, authStatus]);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        // Only run if we should render the chatbot
        if (!shouldRender) return;
        
        if (sessionId && messages.length > 0) {
            localStorage.setItem(`chatMessages_${sessionId}`, JSON.stringify(messages));
        }
    }, [messages, sessionId, shouldRender]);

    // Scroll to bottom when new messages appear
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        // Only run if we should render the chatbot
        if (!shouldRender) return;
        
        if (isOpen && !isMinimized) {
            const timeout = setTimeout(scrollToBottom, 100);
            return () => clearTimeout(timeout);
        }
    }, [messages, isOpen, isMinimized, shouldRender]);

    // Don't render the chatbot if we shouldn't show it
    if (!shouldRender) {
        return null;
    }

    const toggleChat = () => {
        setIsOpen(!isOpen);
        setIsMinimized(false);
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    const handleLocalInputChange = (e) => {
        setLocalInput(e.target.value);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!localInput.trim() || isLoading) return;

        const userContent = localInput;
        setLocalInput('');
        setError(null);
        setIsLoading(true);

        const userMessage = { id: Date.now().toString(), role: 'user', content: userContent };
        setMessages((prev) => [...prev, userMessage]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: userContent }]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API error ${response.status}: ${errText}`);
            }

            const aiMessageId = (Date.now() + 1).toString();
            setMessages((prev) => [...prev, { id: aiMessageId, role: 'assistant', content: '' }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiContent = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                aiContent += chunk;
                setMessages((prev) => {
                    const updated = [...prev];
                    const idx = updated.findIndex((m) => m.id === aiMessageId);
                    if (idx !== -1) {
                        updated[idx] = { ...updated[idx], content: aiContent };
                    }
                    return updated;
                });
            }
        } catch (err) {
            console.error(err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={toggleChat}
                    className="fixed bottom-6 right-6 z-50 bg-[#0052FF] text-white p-4 rounded-full shadow-lg hover:bg-[#0052FF] transition-colors"
                    aria-label="Open AI Chat"
                >
                    <BsRobot className="w-6 h-6" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden ${isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'}`}
                >
                    {/* Header */}
                    <div className="bg-[#0052FF] text-white p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BsRobot className="w-5 h-5" />
                            <h3 className="font-semibold">RightsLab AI</h3>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={toggleMinimize} className="p-1 hover:bg-[#0052FF] rounded">
                                <FiMinimize2 className="w-4 h-4" />
                            </button>
                            <button onClick={toggleChat} className="p-1 hover:bg-[#0052FF] rounded">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    {!isMinimized && (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>Welcome! How can I help you?</p>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-[#0052FF] text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500">Typing...</div>
                                    </div>
                                )}
                                {error && (
                                    <div className="text-center text-red-500 text-xs p-2">Error: {error.message}</div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Form */}
                            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={localInput}
                                        onChange={handleLocalInputChange}
                                        placeholder="Type a message..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !localInput.trim()}
                                        className="bg-[#0052FF] text-white p-2 rounded-lg hover:bg-[#0052FF] disabled:opacity-50"
                                    >
                                        <FiSend className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    );
}