import { useState, useRef, useEffect } from 'react'
import OpenAI from 'openai'
import { Send, Bot, User, Settings, Plus, MessageSquare, Trash2, Edit3, Check, X, Image as ImageIcon, X as XIcon } from 'lucide-react'
import './App.css'

const AVAILABLE_MODELS = [
  'gpt-5',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo'

]

function App() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [apiKey, setApiKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editingConversationId, setEditingConversationId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [uploadedImages, setUploadedImages] = useState([])
  const messagesEndRef = useRef(null)
  const isStreamingRef = useRef(false)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // Cleanup effect for streaming
  useEffect(() => {
    return () => {
      isStreamingRef.current = false
    }
  }, [])

  useEffect(() => {
    // Load API key from environment or localStorage
    const savedApiKey = localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
    
    // Load saved model preference
    const savedModel = localStorage.getItem('preferred_model')
    if (savedModel && AVAILABLE_MODELS.includes(savedModel)) {
      setSelectedModel(savedModel)
    }
    
    // Load conversations from localStorage
    const savedConversations = localStorage.getItem('conversations')
    if (savedConversations) {
      const parsedConversations = JSON.parse(savedConversations)
      setConversations(parsedConversations)
      
      // Load current conversation
      const currentId = localStorage.getItem('current_conversation_id')
      if (currentId && parsedConversations.find(c => c.id === currentId)) {
        setCurrentConversationId(currentId)
        const currentConv = parsedConversations.find(c => c.id === currentId)
        setMessages(currentConv.messages || [])
      }
    }
  }, [])

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && uploadedImages.length === 0) || !apiKey) return

    // Create new conversation if none exists
    let conversationId = currentConversationId
    if (!conversationId) {
      createNewConversation()
      conversationId = Date.now().toString()
    }

    // Build message content
    let messageContent
    if (uploadedImages.length > 0) {
      // Message with images
      const contentParts = []
      if (inputMessage.trim()) {
        contentParts.push({
          type: 'text',
          text: inputMessage
        })
      }
      
      // Add images
      uploadedImages.forEach(image => {
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: image.dataUrl
          }
        })
      })
      
      messageContent = contentParts
    } else {
      // Text-only message
      messageContent = inputMessage
    }

    const userMessage = { 
      role: 'user', 
      content: messageContent,
      images: uploadedImages.map(img => ({ dataUrl: img.dataUrl, name: img.name }))
    }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputMessage('')
    setUploadedImages([])
    setIsLoading(true)
    setStreamingMessage('')
    isStreamingRef.current = true

    let fullResponse = ''

    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      })

      const stream = await openai.chat.completions.create({
        model: selectedModel,
        messages: newMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true
      })
      
      for await (const chunk of stream) {
        if (!isStreamingRef.current) break // Stop streaming if component unmounted
        
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullResponse += content
          setStreamingMessage(fullResponse)
          // Small delay for smoother visual effect
          await sleep(10)
        }
      }

      // Add the complete response to messages
      const assistantMessage = {
        role: 'assistant',
        content: fullResponse
      }

      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)

      // Update conversation in storage
      const updatedConversations = conversations.map(c => 
        c.id === conversationId 
          ? { 
              ...c, 
              messages: finalMessages,
              title: c.title === 'New Chat' ? generateConversationTitle(inputMessage || 'Image message') : c.title
            }
          : c
      )
      saveConversations(updatedConversations)
    } catch (error) {
      console.error('Error:', error)
      
      // If we have a partial response from streaming, append the error to it
      const errorText = `\n\n[Error: ${error.message || 'Failed to get response from OpenAI'}]`
      const finalContent = fullResponse ? fullResponse + errorText : errorText.trim()
      
      const errorMessage = {
        role: 'assistant',
        content: finalContent
      }
      const finalMessages = [...newMessages, errorMessage]
      setMessages(finalMessages)

      // Update conversation in storage even with error
      const updatedConversations = conversations.map(c => 
        c.id === conversationId 
          ? { 
              ...c, 
              messages: finalMessages,
              title: c.title === 'New Chat' ? generateConversationTitle(inputMessage || 'Image message') : c.title
            }
          : c
      )
      saveConversations(updatedConversations)
    } finally {
      setIsLoading(false)
      setStreamingMessage('')
      isStreamingRef.current = false
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey)
    setShowSettings(false)
  }

  const clearConversation = () => {
    setMessages([])
    if (currentConversationId) {
      const updatedConversations = conversations.map(c => 
        c.id === currentConversationId 
          ? { ...c, messages: [] }
          : c
      )
      saveConversations(updatedConversations)
    }
  }

  const handleModelChange = (newModel) => {
    setSelectedModel(newModel)
    localStorage.setItem('preferred_model', newModel)
  }

  const saveConversations = (newConversations) => {
    setConversations(newConversations)
    localStorage.setItem('conversations', JSON.stringify(newConversations))
  }

  const generateConversationTitle = (firstMessage) => {
    return firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage
  }

  const createNewConversation = () => {
    const newId = Date.now().toString()
    const newConversation = {
      id: newId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString()
    }
    
    const updatedConversations = [newConversation, ...conversations]
    saveConversations(updatedConversations)
    setCurrentConversationId(newId)
    setMessages([])
    localStorage.setItem('current_conversation_id', newId)
  }

  const switchConversation = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setCurrentConversationId(conversationId)
      setMessages(conversation.messages || [])
      localStorage.setItem('current_conversation_id', conversationId)
    }
  }

  const deleteConversation = (conversationId) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId)
    saveConversations(updatedConversations)
    
    if (currentConversationId === conversationId) {
      if (updatedConversations.length > 0) {
        switchConversation(updatedConversations[0].id)
      } else {
        setCurrentConversationId(null)
        setMessages([])
        localStorage.removeItem('current_conversation_id')
      }
    }
  }

  const startEditingConversation = (conversationId, currentTitle) => {
    setEditingConversationId(conversationId)
    setEditingTitle(currentTitle)
  }

  const saveConversationTitle = () => {
    if (editingConversationId && editingTitle.trim()) {
      const updatedConversations = conversations.map(c => 
        c.id === editingConversationId 
          ? { ...c, title: editingTitle.trim() }
          : c
      )
      saveConversations(updatedConversations)
    }
    setEditingConversationId(null)
    setEditingTitle('')
  }

  const cancelEditingConversation = () => {
    setEditingConversationId(null)
    setEditingTitle('')
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setUploadedImages(prev => [...prev, {
            name: file.name,
            dataUrl: reader.result
          }])
        }
        reader.readAsDataURL(file)
      }
    })
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      // Check if the item is an image
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault() // Prevent default paste behavior for images
        
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onloadend = () => {
            setUploadedImages(prev => [...prev, {
              name: file.name || `pasted-image-${Date.now()}.png`,
              dataUrl: reader.result
            }])
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  return (
    <div className="app">
      <div className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <button 
              onClick={createNewConversation}
              className="new-chat-btn"
            >
              <Plus size={20} />
              New Chat
            </button>
          </div>
          
          <div className="conversations-list">
            {conversations.map(conversation => (
              <div 
                key={conversation.id}
                className={`conversation-item ${currentConversationId === conversation.id ? 'active' : ''}`}
              >
                {editingConversationId === conversation.id ? (
                  <div className="conversation-edit">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && saveConversationTitle()}
                      className="conversation-title-input"
                      autoFocus
                    />
                    <div className="conversation-edit-actions">
                      <button onClick={saveConversationTitle} className="edit-btn">
                        <Check size={16} />
                      </button>
                      <button onClick={cancelEditingConversation} className="edit-btn">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="conversation-content">
                    <button
                      onClick={() => switchConversation(conversation.id)}
                      className="conversation-title"
                    >
                      <MessageSquare size={16} />
                      <span>{conversation.title}</span>
                    </button>
                    <div className="conversation-actions">
                      <button 
                        onClick={() => startEditingConversation(conversation.id, conversation.title)}
                        className="conversation-action-btn"
                        title="Rename"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => deleteConversation(conversation.id)}
                        className="conversation-action-btn"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      
      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="sidebar-toggle"
            >
              <MessageSquare size={20} />
            </button>
            <h1>PAYG ChatGPT</h1>
          </div>
          <div className="header-controls">
            <select 
              value={selectedModel} 
              onChange={(e) => handleModelChange(e.target.value)}
              className="model-selector"
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="settings-btn"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-content">
            <h3>Settings</h3>
            <div className="input-group">
              <label htmlFor="api-key">OpenAI API Key:</label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
                className="api-key-input"
              />
              <div className="api-key-warning">
                <p>🔒 Your API key is only stored locally in your browser and is never sent to or stored by our servers.</p>
                <p>⚠️ Never share your API key with anyone. Keep it secure!</p>
              </div>
            </div>
            <div className="settings-actions">
              <button onClick={saveApiKey} className="save-btn">Save</button>
              <button onClick={clearConversation} className="clear-btn">Clear Chat</button>
            </div>
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <Bot size={48} />
              <h2>Welcome to PAYG ChatGPT</h2>
              <p>Start a conversation by typing a message below.</p>
              {!apiKey && (
                <p className="warning">⚠️ Please add your OpenAI API key in settings to start chatting.</p>
              )}
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-avatar">
                  {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className="message-content">
                  {message.images && message.images.length > 0 && (
                    <div className="message-images">
                      {message.images.map((image, imgIndex) => (
                        <img 
                          key={imgIndex} 
                          src={image.dataUrl} 
                          alt={image.name}
                          className="message-image"
                        />
                      ))}
                    </div>
                  )}
                  <div className="message-text">
                    {typeof message.content === 'string' 
                      ? message.content 
                      : message.content.find(c => c.type === 'text')?.text || ''}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-content">
                {streamingMessage ? (
                  <div className="message-text streaming">
                    {streamingMessage}
                    <span className="streaming-cursor">|</span>
                  </div>
                ) : (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          {uploadedImages.length > 0 && (
            <div className="image-preview-container">
              {uploadedImages.map((image, index) => (
                <div key={index} className="image-preview">
                  <img src={image.dataUrl} alt={image.name} />
                  <button 
                    onClick={() => removeImage(index)}
                    className="remove-image-btn"
                    title="Remove image"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="input-wrapper">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!apiKey || isLoading}
              className="image-upload-button"
              title="Upload image"
            >
              <ImageIcon size={20} />
            </button>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder={apiKey ? "Type your message or paste an image..." : "Add API key in settings to start chatting..."}
              disabled={!apiKey || isLoading}
              className="message-input"
              rows="1"
            />
            <button
              onClick={handleSendMessage}
              disabled={(!inputMessage.trim() && uploadedImages.length === 0) || !apiKey || isLoading}
              className="send-button"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default App
