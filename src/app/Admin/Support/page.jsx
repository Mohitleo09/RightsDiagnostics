'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Reply, User, Mail, Phone, Calendar, MessageSquare, RefreshCw, Paperclip, X, Image, Search, Archive, Delete, MoreVertical, Star, Tag, ChevronDown, Inbox, Send as SendIcon, FileText, AlertCircle, Plus } from 'lucide-react';

const SupportPage = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState('inbox');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [toEmails, setToEmails] = useState([]);
  const [currentEmailInput, setCurrentEmailInput] = useState('');
  const fileInputRef = useRef(null);
  const emailInputRef = useRef(null);

  const addEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && emailRegex.test(email)) {
      if (!toEmails.includes(email)) {
        setToEmails([...toEmails, email]);
      }
      return true;
    }
    return false;
  };

  const removeEmail = (emailToRemove) => {
    setToEmails(toEmails.filter(email => email !== emailToRemove));
  };

  const handleEmailInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      const email = currentEmailInput.trim();
      if (email) {
        if (addEmail(email)) {
          setCurrentEmailInput('');
        }
      }
    } else if (e.key === 'Backspace' && currentEmailInput === '' && toEmails.length > 0) {
      // Remove the last email when backspace is pressed on empty input
      setToEmails(toEmails.slice(0, -1));
    }
  };

  const handleEmailInputChange = (e) => {
    setCurrentEmailInput(e.target.value);
  };

  const handleEmailInputBlur = () => {
    const email = currentEmailInput.trim();
    if (email) {
      addEmail(email);
      setCurrentEmailInput('');
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Split by commas, semicolons, spaces, or newlines
    const potentialEmails = pastedText.split(/[,;\s\n]+/).map(email => email.trim()).filter(email => email.length > 0);

    const validEmails = [];
    const invalidEmails = [];

    potentialEmails.forEach(email => {
      if (emailRegex.test(email)) {
        if (!toEmails.includes(email) && !validEmails.includes(email)) {
          validEmails.push(email);
        }
      } else {
        invalidEmails.push(email);
      }
    });

    if (validEmails.length > 0) {
      setToEmails([...toEmails, ...validEmails]);
    }

    if (invalidEmails.length > 0) {
      alert(`Invalid email addresses were not added: ${invalidEmails.join(', ')}`);
    }

    setCurrentEmailInput('');
  };

  const handleComposeSubmit = async (e) => {
    e.preventDefault();

    // Add any remaining email in the input field
    if (currentEmailInput.trim()) {
      addEmail(currentEmailInput.trim());
    }

    if (toEmails.length === 0) {
      alert('Please enter at least one valid email address');
      emailInputRef.current?.focus();
      return;
    }

    // Immediately update UI to show sending state
    setIsSending(true);

    try {
      // Create a sent message object
      const sentMessageData = {
        name: 'You', // Since this is a sent message
        email: toEmails.join(', '), // Show all recipients
        subject: composeData.subject,
        message: composeData.message,
        phone: '',
        status: 'sent',
        archived: false,
        // Include the actual recipient emails for the backend to send emails
        recipients: toEmails
      };

      console.log('Sending message data:', sentMessageData);

      // Immediately update UI to show success and reset form
      setToEmails([]);
      setCurrentEmailInput('');
      setComposeData({ to: '', subject: '', message: '' });
      setShowComposeModal(false);

      // Show success message immediately
      alert(`Message Sent to ${toEmails.length} recipient(s)!`);

      // Send the message in the background
      const response = await fetch('/api/support-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sentMessageData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        // Reload messages from database to reflect the new sent message
        await loadMessages();
      } else {
        console.error('Error sending message:', data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Load messages from API
  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/support-messages');
      const data = await response.json();

      console.log('Loaded messages data:', data);

      if (data.success) {
        setMessages(data.messages);
        setFilteredMessages(data.messages);
      } else {
        setError(data.message || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'inbox', name: 'Inbox', icon: Inbox, count: messages ? messages.filter(m => !m.archived && m.status !== 'sent').length : 0 },
    { id: 'sent', name: 'Sent', icon: SendIcon, count: messages ? messages.filter(m => m.status === 'sent').length : 0 },
    { id: 'archive', name: 'Archive', icon: Archive, count: messages ? messages.filter(m => m.archived === true).length : 0 }
  ];

  console.log('Categories with counts:', categories);

  // Filter messages based on search term and active category
  useEffect(() => {
    console.log('Filtering messages. Active category:', activeCategory);
    console.log('All messages:', messages);

    let filtered = [];

    if (activeCategory === 'archive') {
      // Show only archived messages
      filtered = messages.filter(message => message.archived === true);
      console.log('Filtered for archive:', filtered);
    } else if (activeCategory === 'sent') {
      // Show only sent messages
      filtered = messages.filter(message => message.status === 'sent');
      console.log('Filtered for sent:', filtered);
    } else if (activeCategory === 'inbox') {
      // Show only non-archived messages that are not sent
      filtered = messages.filter(message => (!message.archived || message.archived === false) && message.status !== 'sent');
      console.log('Filtered for inbox:', filtered);
    } else {
      // For other categories, show all messages
      filtered = [...messages];
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(message =>
        message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    console.log('Final filtered messages:', filtered);
    setFilteredMessages(filtered);

    // Clear selected message if it doesn't belong to the current category
    if (selectedMessage) {
      const messageInCurrentCategory = filtered.some(msg => msg.id === selectedMessage.id);
      if (!messageInCurrentCategory) {
        setSelectedMessage(null);
      }
    }
  }, [searchTerm, messages, activeCategory]);

  // Load messages on component mount
  useEffect(() => {
    loadMessages();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      // Get the current message to preserve other fields
      const currentMessage = messages.find(msg => msg.id === messageId);

      const response = await fetch(`/api/support-messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentMessage,
          status: 'read'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload messages from database to reflect changes
        await loadMessages();
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const handleSelectMessage = (message) => {
    setSelectedMessage(message);
    setReplyContent('');
    setAttachments([]);
    setIsReplying(false);

    // Mark message as read if it's unread
    if (message.status === 'unread') {
      markMessageAsRead(message.id);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    console.log('Selected files in handleFileChange:', files);

    // Add new files to existing attachments
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleReply = async () => {
    if ((!replyContent.trim() && attachments.length === 0) || !selectedMessage) return;

    try {
      setSendingReply(true);

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('replyMessage', replyContent);
      formData.append('userEmail', selectedMessage.email);
      formData.append('userName', selectedMessage.name);
      formData.append('originalSubject', selectedMessage.subject);

      attachments.forEach((file, index) => {
        formData.append(`attachment-${index}`, file);
      });

      // For now, we'll send as JSON since our API expects JSON
      // In a real implementation, you'd need to modify the API to accept FormData
      const response = await fetch(`/api/support-messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyMessage: replyContent,
          userEmail: selectedMessage.email,
          userName: selectedMessage.name,
          originalSubject: selectedMessage.subject,
          hasAttachments: attachments.length > 0
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        alert(`Reply sent successfully to ${selectedMessage.email}`);

        // Reset reply form
        setReplyContent('');
        setAttachments([]);
        setIsReplying(false);
      } else {
        alert(`Error: ${data.message || 'Failed to send reply'}`);
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  const toggleReply = () => {
    setIsReplying(!isReplying);
    if (!isReplying) {
      setReplyContent('');
      setAttachments([]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleComposeChange = (e) => {
    const { name, value } = e.target;
    setComposeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArchiveMessage = async (messageId) => {
    try {
      console.log('Archiving message ID:', messageId);

      // Send request to API to archive the message in the database
      const response = await fetch(`/api/support-messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          archived: true
        }),
      });

      console.log('Archive response status:', response.status);
      const data = await response.json();
      console.log('Archive response data:', data);

      if (data.success) {
        // Reload messages from database to reflect changes
        await loadMessages();

        // Clear the selected message to close the detail panel
        setSelectedMessage(null);

        // Show success message
        console.log(`Message ${messageId} has been archived in the database`);
        // Removed alert per user request
      } else {
        // Removed alert per user request
        console.error(`Error: ${data.message || 'Failed to archive message'}`);
      }
    } catch (err) {
      console.error('Error archiving message:', err);
      // Removed alert per user request
    }
  };

  const handleUnarchiveMessage = async (messageId) => {
    try {
      console.log('Unarchiving message ID:', messageId);

      // Send request to API to unarchive the message in the database
      const response = await fetch(`/api/support-messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          archived: false
        }),
      });

      console.log('Unarchive response status:', response.status);
      const data = await response.json();
      console.log('Unarchive response data:', data);

      if (data.success) {
        // Reload messages from database to reflect changes
        await loadMessages();

        // Clear the selected message to close the detail panel
        setSelectedMessage(null);

        // Show success message
        console.log(`Message ${messageId} has been unarchived in the database`);
        // Removed alert per user request
      } else {
        // Removed alert per user request
        console.error(`Error: ${data.message || 'Failed to unarchive message'}`);
      }
    } catch (err) {
      console.error('Error unarchiving message:', err);
      // Removed alert per user request
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      // Send request to API to delete the message from the database
      const response = await fetch(`/api/support-messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        // Reload messages from database to reflect changes
        await loadMessages();

        // Clear the selected message
        setSelectedMessage(null);

        // Show success message
        alert(`Message has been deleted`);
      } else {
        alert(`Error: ${data.message || 'Failed to delete message'}`);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Failed to delete message. Please try again.');
    }
  };

  console.log('Categories with counts:', categories);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50/50">
        <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm">
          <div className="relative">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 animate-pulse"></div>
            <RefreshCw className="absolute inset-0 m-auto h-6 w-6 text-indigo-600 animate-spin" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-600">Syncing messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50/50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md">
          <div className="h-12 w-12 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Issue</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={loadMessages}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors shadow-lg shadow-gray-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50/30 overflow-hidden font-sans text-slate-800">
      {/* Sidebar - Refined Glassy/Clean Look */}
      <div
        className={`flex flex-col bg-white border-r border-slate-100 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${sidebarCollapsed ? 'w-20' : 'w-72'
          } relative z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]`}
      >
        <div className="p-6">
          <h1 className={`text-xl font-bold tracking-tight text-slate-900 transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
            Support
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedMessage(null);
                  setActiveCategory(category.id);
                }}
                className={`w-full group flex items-center px-3.5 py-3 rounded-xl transition-all duration-300 ease-out ${isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-200 scale-[1.02]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <div className={`relative flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}
                  />

                  {!sidebarCollapsed && (
                    <span className="ml-3.5 text-[15px] font-medium tracking-wide">
                      {category.name}
                    </span>
                  )}

                  {!sidebarCollapsed && category.count > 0 && (
                    <span className={`ml-auto text-xs font-bold py-0.5 px-2 rounded-full transition-colors ${isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}>
                      {category.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-200"
          >
            <ChevronDown className={`h-5 w-5 transition-transform duration-500 ${sidebarCollapsed ? 'rotate-90' : '-rotate-90'}`} />
          </button>
        </div>
      </div>

      {/* Messages List - Elegant List View */}
      <div className={`flex flex-col border-r border-slate-100 bg-white/50 backdrop-blur-sm transition-all duration-500 ${selectedMessage ? 'hidden lg:flex lg:w-[420px]' : 'w-full lg:w-[420px]'
        }`}>
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">Inbox</h2>
              <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-md">
                {filteredMessages.length}
              </span>
            </div>
            <button
              onClick={loadMessages}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 transform rotate-12">
                <Inbox className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No messages found here.</p>
            </div>
          ) : (
            <div className="px-3 py-2 space-y-1">
              {filteredMessages.map((message) => {
                const isSelected = selectedMessage?.id === message.id;
                const isUnread = message.status === 'unread';

                return (
                  <div
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border border-transparent ${isSelected
                        ? 'bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border-slate-100 z-10'
                        : 'hover:bg-white hover:shadow-sm hover:border-slate-50'
                      } ${isUnread ? 'bg-slate-50/50' : ''}`}
                  >
                    {isUnread && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                          }`}>
                          {message.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className={`text-[15px] truncate leading-tight ${isUnread || isSelected ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {message.name}
                          </h3>
                          <span className="text-xs text-slate-400 font-medium">
                            {formatRelativeTime(message.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pl-[52px]">
                      <p className={`text-sm truncate mb-1 ${isUnread ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                        {message.subject}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {message.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Message Detail - Modern Reading Pane */}
      <div className={`flex-1 flex flex-col bg-white h-full relative z-0 ${selectedMessage ? 'flex' : 'hidden lg:flex'}`}>
        {selectedMessage ? (
          <>
            {/* Header */}
            <div className="flex-none px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-white/80 backdrop-blur-sm sticky top-0 z-20">
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">{selectedMessage.subject}</h1>
                  {selectedMessage.status === 'sent' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">Sent</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {(selectedMessage.status === 'sent' ? 'You' : selectedMessage.name).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">
                        {selectedMessage.status === 'sent' ? 'You' : selectedMessage.name}
                      </span>
                      <span className="text-xs text-slate-400">{selectedMessage.email}</span>
                    </div>
                  </div>

                  <div className="h-4 w-px bg-slate-200 mx-2"></div>

                  <div className="flex items-center gap-1.5" title={formatTime(selectedMessage.date)}>
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{formatDate(selectedMessage.date)}, {formatTime(selectedMessage.date)}</span>
                  </div>

                  {selectedMessage.phone && (
                    <>
                      <div className="h-4 w-px bg-slate-200 mx-2"></div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{selectedMessage.phone}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => selectedMessage.archived ? handleUnarchiveMessage(selectedMessage.id) : handleArchiveMessage(selectedMessage.id)}
                  className={`p-2 rounded-lg transition-all ${selectedMessage.archived
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                    }`}
                  title={selectedMessage.archived ? "Unarchive" : "Archive"}
                >
                  <Archive className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete"
                >
                  <Delete className="h-5 w-5" />
                </button>
                <button
                  className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg ml-2"
                  onClick={() => setSelectedMessage(null)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent">
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-slate max-w-none">
                  <p className="text-[15px] leading-8 text-slate-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachments ({selectedMessage.attachments.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {selectedMessage.attachments.map((attachment, index) => (
                        <div key={index} className="group relative aspect-square bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
                          {/* Placeholder for logic - relying on file type logic from original */}
                          <div className="absolute inset-0 flex items-center justify-center p-4">
                            <FileText className="h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur p-2 border-t border-slate-100">
                            <p className="text-xs font-medium text-slate-700 truncate text-center">{attachment.filename}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reply Area */}
            <div className="flex-none p-6 bg-slate-50 border-t border-slate-200">
              <div className={`max-w-4xl mx-auto transition-all duration-300 ${isReplying ? 'bg-white shadow-xl ring-1 ring-slate-900/5 rounded-2xl p-4' : ''}`}>
                {isReplying ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-500">Replying to {selectedMessage.name}...</span>
                      <button
                        onClick={toggleReply}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <textarea
                      className="w-full border-0 bg-slate-50 rounded-xl p-4 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all resize-none placeholder:text-slate-400"
                      rows="6"
                      placeholder="Type your reply here..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      disabled={sendingReply}
                      autoFocus
                    />

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          multiple
                        />
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                          <Paperclip className="h-5 w-5" />
                          <span >Attach File</span>
                        </button>

                        {attachments.length > 0 && (
                          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            {attachments.length} attached
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={toggleReply}
                          disabled={sendingReply}
                          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleReply}
                          disabled={(!replyContent.trim() && attachments.length === 0) || sendingReply}
                          className={`px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all flex items-center gap-2 ${((!replyContent.trim() && attachments.length === 0) || sendingReply) ? 'opacity-50 cursor-not-allowed transform-none' : ''
                            }`}
                        >
                          {sendingReply ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={toggleReply}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Reply className="h-5 w-5" />
                    Click here to reply to {selectedMessage.name}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50/50">
            <div className="w-24 h-24 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No conversation selected</h2>
            <p className="text-slate-500 max-w-xs text-center">Choose a conversation from the list to view details or start a new message.</p>
          </div>
        )}
      </div>

      {/* Compose Modal - Elegant Backdrop */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowComposeModal(false)} />

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">New Message</h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleComposeSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Recipients</label>
                  <div className="w-full p-2 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all bg-slate-50 focus-within:bg-white min-h-[50px] flex flex-wrap gap-2">
                    {toEmails.map((email, index) => (
                      <div key={index} className="flex items-center bg-white border border-slate-200 shadow-sm rounded-lg px-2.5 py-1 text-sm animate-in fade-in zoom-in duration-200">
                        <span className="text-slate-700 font-medium">{email}</span>
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="ml-2 text-slate-400 hover:text-red-500 focus:outline-none"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <input
                      ref={emailInputRef}
                      type="text"
                      placeholder={toEmails.length === 0 ? "Type email addresses..." : ""}
                      className="flex-grow min-w-[150px] bg-transparent border-none text-sm p-1.5 focus:ring-0 placeholder:text-slate-400"
                      value={currentEmailInput}
                      onChange={handleEmailInputChange}
                      onKeyDown={handleEmailInputKeyDown}
                      onBlur={handleEmailInputBlur}
                      onPaste={handlePaste}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    placeholder="What is this about?"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-400"
                    value={composeData.subject}
                    onChange={handleComposeChange}
                    required
                  />
                </div>

                <div className="space-y-1 flex-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Message</label>
                  <textarea
                    name="message"
                    placeholder="Write your message here..."
                    className="w-full h-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-400 resize-none"
                    value={composeData.message}
                    onChange={handleComposeChange}
                    required
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="flex items-center text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-sm font-medium"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach files
                  </button>
                  {attachments.length > 0 && (
                    <span className="ml-3 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      {attachments.length} files
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowComposeModal(false)}
                    className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-black hover:-translate-y-0.5 shadow-lg shadow-slate-200 flex items-center transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowComposeModal(true)}
        className="fixed bottom-8 right-8 h-14 w-14 lg:w-auto lg:h-12 lg:px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 z-40 flex items-center justify-center gap-2 group"
      >
        <Plus className="h-6 w-6 lg:h-5 lg:w-5 group-hover:rotate-0 transition-transform duration-300" />
        <span className="hidden lg:inline text-sm font-bold tracking-wide">Compose</span>
      </button>
    </div>
  );
};

export default SupportPage;