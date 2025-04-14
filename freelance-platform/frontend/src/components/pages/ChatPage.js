import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const ChatPage = () => {
  const { threadId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  
  // Fetch all user's chat threads - updated to use the database
  useEffect(() => {
    const fetchChatThreads = async () => {
      try {
        setLoading(true);
        
        // Get authentication token
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }

        // Fetch threads from API
        const response = await axios.get('http://localhost:5000/api/chat/threads', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Threads loaded from database:', response.data);
        setThreads(response.data);
        
        // If threadId is provided in URL, activate that thread
        if (threadId) {
          const thread = response.data.find(t => t._id === threadId);
          if (thread) {
            setActiveThread(thread);
            fetchChatMessages(thread._id);
          } else {
            navigate('/chat');
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chat threads:', error);
        setLoading(false);
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          alert('Your session has expired. Please log in again.');
          // Optionally redirect to login
        }
      }
    };
    
    if (user && user._id) {
      fetchChatThreads();
    } else {
      setLoading(false);
    }
  }, [threadId, navigate, user]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const fetchChatMessages = async (threadId) => {
    try {
      setChatLoading(true);
      
      // Get authentication token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Fetch messages from API
      const response = await axios.get(`http://localhost:5000/api/chat/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Messages loaded from database:', response.data);
      setMessages(response.data);
      
      // Mark thread as read
      await axios.post(`http://localhost:5000/api/chat/threads/${threadId}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update threads to mark as read
      setThreads(prevThreads => 
        prevThreads.map(thread => 
          thread._id === threadId 
            ? { ...thread, unreadCount: 0 } 
            : thread
        )
      );
      
      setChatLoading(false);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      setChatLoading(false);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        // Optionally redirect to login
      }
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeThread) return;
    
    try {
      // Create temporary message object for UI feedback
      const tempMessageObj = {
        _id: `temp-${Date.now()}`,
        sender: { 
          _id: user._id, 
          name: user.name, 
          role: user.role 
        },
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
        pending: true
      };
      
      // Add to messages immediately for UI feedback
      setMessages(prev => [...prev, tempMessageObj]);
      setNewMessage('');
      
      // Get authentication token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Send to server
      const response = await axios.post('http://localhost:5000/api/chat/messages', {
        threadId: activeThread._id,
        text: newMessage.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Message saved to database:', response.data);
      
      // Replace pending message with confirmed message from server
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempMessageObj._id 
            ? response.data
            : msg
        )
      );
      
      // Update thread's last message
      setThreads(prev => 
        prev.map(thread => 
          thread._id === activeThread._id 
            ? {
                ...thread,
                lastMessage: {
                  sender: { _id: user._id, name: user.name },
                  text: newMessage.trim(),
                  timestamp: new Date().toISOString()
                }
              } 
            : thread
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error state for message
      setMessages(prev => 
        prev.map(msg => 
          msg._id.startsWith('temp-')
            ? { ...msg, error: true, errorMessage: error.response?.data?.msg || 'Failed to send' } 
            : msg
        )
      );
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        // Optionally redirect to login
      }
    }
  };
  
  const handleThreadSelect = (thread) => {
    setActiveThread(thread);
    fetchChatMessages(thread._id);
    
    // Update URL without reloading
    navigate(`/chat/${thread._id}`, { replace: true });
  };
  
  // Format date function (for message timestamps)
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Format date for thread list
  const formatThreadTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 6) {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    }
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    }
    
    return 'Just now';
  };
  
  // Filter threads based on search term
  const filteredThreads = threads.filter(thread => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in job title
    if (thread.jobTitle.toLowerCase().includes(searchLower)) return true;
    
    // Search in participant names
    if (thread.participants.some(p => p.name.toLowerCase().includes(searchLower))) return true;
    
    // Search in last message
    if (thread.lastMessage?.text.toLowerCase().includes(searchLower)) return true;
    
    return false;
  });
  
  // Get avatar background color based on user role
  const getAvatarColor = (role) => {
    switch (role) {
      case 'freelancer':
        return 'bg-blue-500';
      case 'job_provider':
        return 'bg-purple-500';
      case 'verifier':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your conversations...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-1">
          Communication hub for job verifications and submissions
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex h-[70vh]">
          {/* Sidebar with threads */}
          <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {filteredThreads.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {searchTerm ? (
                    <p>No conversations found matching "{searchTerm}"</p>
                  ) : (
                    <p>No active conversations</p>
                  )}
                </div>
              ) : (
                <ul>
                  {filteredThreads.map((thread) => (
                    <li 
                      key={thread._id} 
                      className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        activeThread?._id === thread._id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleThreadSelect(thread)}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium text-gray-900 truncate max-w-[70%]" title={thread.jobTitle}>
                            {thread.jobTitle}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {thread.lastMessage ? formatThreadTime(thread.lastMessage.timestamp) : ''}
                          </span>
                        </div>
                        
                        <div className="flex gap-1 mt-2 mb-2 flex-wrap">
                          {thread.participants.map((participant, index) => (
                            <div 
                              key={participant._id}
                              className="flex items-center bg-gray-100 rounded-full py-0.5 px-2 text-xs"
                              title={`${participant.name} (${participant.role.replace('_', ' ')})`}
                            >
                              <div className={`w-4 h-4 rounded-full ${getAvatarColor(participant.role)} flex items-center justify-center text-white text-[8px] font-bold mr-1`}>
                                {getInitials(participant.name)}
                              </div>
                              <span className="truncate max-w-[80px]">{participant.name}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <p className="text-gray-600 truncate">
                            {thread.lastMessage ? (
                              <>
                                <span className="font-medium">
                                  {thread.lastMessage.sender._id === user._id 
                                    ? 'You: ' 
                                    : `${thread.lastMessage.sender.name.split(' ')[0]}: `}
                                </span>
                                {thread.lastMessage.text}
                              </>
                            ) : (
                              <span className="text-gray-400 italic">No messages yet</span>
                            )}
                          </p>
                          
                          {thread.unreadCount > 0 && (
                            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Chat window */}
          <div className="hidden md:flex md:w-2/3 flex-col">
            {!activeThread ? (
              <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-1">Select a Conversation</h3>
                  <p className="text-gray-500 max-w-md">
                    Choose a conversation from the list to view messages and communicate with job providers, freelancers and other verifiers.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {activeThread.jobTitle}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="text-xs text-gray-500">
                          with
                        </div>
                        <div className="flex -space-x-1">
                          {activeThread.participants
                            .filter(p => p._id !== user._id)
                            .map((participant) => (
                              <div 
                                key={participant._id}
                                className={`w-6 h-6 rounded-full ${getAvatarColor(participant.role)} flex items-center justify-center text-white text-xs font-bold border-2 border-white`}
                                title={`${participant.name} (${participant.role.replace('_', ' ')})`}
                              >
                                {getInitials(participant.name)}
                              </div>
                            ))}
                        </div>
                        <div className="text-xs text-gray-500 ml-1">
                          {activeThread.participants
                            .filter(p => p._id !== user._id)
                            .map(p => p.name)
                            .join(', ')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      
                      <Link 
                        to={`/jobs/${activeThread.jobId}`}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Job
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {chatLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-pulse text-gray-500">Loading messages...</div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-center max-w-xs">
                        No messages yet. Start the conversation by sending a message.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isCurrentUser = message.sender._id === user._id;
                        // Check if date needs to be displayed (first message or different day from previous)
                        const showDate = index === 0 || 
                          new Date(message.timestamp).toDateString() !== 
                          new Date(messages[index - 1].timestamp).toDateString();
                        
                        return (
                          <React.Fragment key={message._id}>
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <div className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                                  {new Date(message.timestamp).toLocaleDateString(undefined, {
                                    weekday: 'long', 
                                    month: 'short', 
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                            )}
                            
                            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                              <div className="max-w-[75%]">
                                <div className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                  <div className={`rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold ${
                                    getAvatarColor(message.sender.role)
                                  }`}>
                                    {getInitials(message.sender.name)}
                                  </div>
                                  <div>
                                    <div className={`rounded-lg px-4 py-2 ${
                                      isCurrentUser
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white border border-gray-200 text-gray-800'
                                    }`}>
                                      {message.text}
                                    </div>
                                    <div className={`text-xs mt-1 text-gray-500 flex items-center ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                      <span className="font-medium mr-1">
                                        {isCurrentUser ? 'You' : message.sender.name}
                                      </span> 
                                      <span className="mx-1">•</span>
                                      <span>{formatMessageTime(message.timestamp)}</span>
                                      
                                      {message.pending && (
                                        <span className="ml-1 text-yellow-500">
                                          <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </span>
                                      )}
                                      
                                      {message.error && (
                                        <span className="ml-1 text-red-500">
                                          <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                {/* Message input */}
                <div className="border-t border-gray-200 p-4 bg-white">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={`p-2 rounded-lg ${
                        newMessage.trim()
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
          
          {/* Mobile message view (shown only when thread is selected on mobile) */}
          {activeThread && (
            <div className="fixed inset-0 bg-white z-50 md:hidden">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 flex items-center">
                  <button 
                    onClick={() => setActiveThread(null)}
                    className="mr-2"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <div>
                    <h3 className="font-bold text-gray-900 truncate max-w-[230px]">
                      {activeThread.jobTitle}
                    </h3>
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-gray-500">
                        with
                      </div>
                      <div className="text-xs text-gray-700 truncate max-w-[200px]">
                        {activeThread.participants
                          .filter(p => p._id !== user._id)
                          .map(p => p.name)
                          .join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Messages area (mobile) */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {chatLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-pulse text-gray-500">Loading messages...</div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-center max-w-xs">
                        No messages yet. Start the conversation by sending a message.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isCurrentUser = message.sender._id === user._id;
                        // Check if date needs to be displayed (first message or different day from previous)
                        const showDate = index === 0 || 
                          new Date(message.timestamp).toDateString() !== 
                          new Date(messages[index - 1].timestamp).toDateString();
                        
                        return (
                          <React.Fragment key={message._id}>
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <div className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                                  {new Date(message.timestamp).toLocaleDateString(undefined, {
                                    weekday: 'long', 
                                    month: 'short', 
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                            )}
                            
                            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                              <div className="max-w-[85%]">
                                <div className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                  <div className={`rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold ${
                                    getAvatarColor(message.sender.role)
                                  }`}>
                                    {getInitials(message.sender.name)}
                                  </div>
                                  <div>
                                    <div className={`rounded-lg px-4 py-2 ${
                                      isCurrentUser
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white border border-gray-200 text-gray-800'
                                    }`}>
                                      {message.text}
                                    </div>
                                    <div className={`text-xs mt-1 text-gray-500 flex items-center ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                      <span className="font-medium mr-1">
                                        {isCurrentUser ? 'You' : message.sender.name.split(' ')[0]}
                                      </span> 
                                      <span className="mx-1">•</span>
                                      <span>{formatMessageTime(message.timestamp)}</span>
                                      
                                      {message.pending && (
                                        <span className="ml-1 text-yellow-500">
                                          <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                {/* Message input (mobile) */}
                <div className="border-t border-gray-200 p-4 bg-white">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={`p-2 rounded-lg ${
                        newMessage.trim()
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;