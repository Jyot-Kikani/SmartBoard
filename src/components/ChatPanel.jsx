import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket'; // Your shared socket instance
import { IoSend } from "react-icons/io5"; // Example send icon
import { FaSpinner } from "react-icons/fa"; // Example loading icon

function ChatPanel({ fabricCanvasRef }) { // Receive canvas ref as prop
  const [messages, setMessages] = useState([]); // { sender: 'user' | 'ai' | 'error', text: string }
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null); // To auto-scroll

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for AI responses
  useEffect(() => {
    const handleAiResponse = (data) => {
      setIsLoading(false); // Stop loading indicator
      if (data.error) {
        setMessages((prev) => [...prev, { sender: 'error', text: data.error }]);
      } else if (data.response) {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.response }]);
      } else {
        // Handle unexpected response format
         setMessages((prev) => [...prev, { sender: 'error', text: 'Received an unexpected response from the AI.' }]);
      }
    };

    socket.on('ai-response', handleAiResponse);

    // Cleanup listener on component unmount
    return () => {
      socket.off('ai-response', handleAiResponse);
    };
  }, []); // Run only once on mount

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = inputValue.trim();
    if (!query || isLoading) return; // Prevent sending empty or while loading

    // Add user message to chat display
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setInputValue(''); // Clear input field
    setIsLoading(true); // Show loading indicator

    // Get canvas context
    let canvasContext = null;
    if (fabricCanvasRef && fabricCanvasRef.current) {
      try {
          // Select properties relevant for the AI context
          const propertiesToInclude = [
              'id', 'type', 'text', // 'text' is crucial for IText/Textbox
              'left', 'top', 'width', 'height',
              'fill', 'stroke', 'strokeWidth', 'opacity'
              // Add other relevant properties if needed (e.g., 'fontSize', 'fontFamily')
          ];
         canvasContext = fabricCanvasRef.current.toJSON(propertiesToInclude);
         // Optional: You might want to filter out cursors or other non-content objects
         // canvasContext.objects = canvasContext.objects.filter(obj => !obj.isCursor);
      } catch(error) {
          console.error("Error getting canvas context:", error);
          setMessages((prev) => [...prev, { sender: 'error', text: 'Could not read whiteboard content.' }]);
          setIsLoading(false);
          return; // Stop if context cannot be retrieved
      }
    } else {
       console.warn("Canvas reference not available.");
       // Decide if you want to send the query without context or show an error
       // Sending without context:
       canvasContext = { objects: [] }; // Send empty context
       // Or show error:
       // setMessages((prev) => [...prev, { sender: 'error', text: 'Whiteboard not ready.' }]);
       // setIsLoading(false);
       // return;
    }


    // Emit the query and context to the backend
    console.log("Sending 'ask-ai' with query and context");
    socket.emit('ask-ai', { query, canvasContext });
  };

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-20 flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">AI Assistant</h3>
        <p className="text-xs text-gray-500">Ask questions about the whiteboard content.</p>
      </div>

      {/* Messages Area */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-2 rounded-lg text-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : msg.sender === 'ai'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-red-100 text-red-700 border border-red-300' // Error style
              }`}
            >
              {/* Basic markdown rendering (bold/italic) could be added here */}
              {msg.text}
            </div>
          </div>
        ))}
        {/* Loading Indicator */}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="max-w-[80%] p-2 rounded-lg text-sm bg-gray-200 text-gray-600 animate-pulse flex items-center space-x-2">
                     <FaSpinner className="animate-spin h-4 w-4" />
                     <span>Thinking...</span>
                 </div>
            </div>
        )}
        {/* Element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask about the board..."
            className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            className={`p-2 rounded-lg text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
            disabled={isLoading}
          >
            <IoSend className="h-5 w-5"/>
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPanel;