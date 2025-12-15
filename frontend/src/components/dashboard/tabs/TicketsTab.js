import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function TicketsTab() {
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'view'
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    page: 1
  });

  // Form states
  const [createForm, setCreateForm] = useState({
    contact_type: 'admin',
    recipient_address: '',
    category: 'general',
    priority: 'medium',
    subject: '',
    message: ''
  });
  
  const [replyMessage, setReplyMessage] = useState('');
  const [downlineContacts, setDownlineContacts] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTickets();
    if (createForm.contact_type === 'downline_individual') {
      fetchDownlineContacts();
    }
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '10'
      });
      
      if (filters.status) params.append('status_filter', filters.status);
      if (filters.category) params.append('category_filter', filters.category);

      const response = await axios.get(
        `${API_URL}/tickets/user?${params}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      alert('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchDownlineContacts = async () => {
    try {
      console.log('Fetching downline contacts...');
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/tickets/downline-contacts`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      console.log('Downline contacts response:', response.data);
      const contacts = response.data.contacts || [];
      console.log(`Found ${contacts.length} contacts`);
      setDownlineContacts(contacts);
    } catch (error) {
      console.error('Failed to fetch downline contacts:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(
          `${API_URL}/tickets/upload-attachment`,
          formData,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        setAttachments(prev => [...prev, {
          id: response.data.attachment_id,
          filename: response.data.filename,
          size: response.data.file_size
        }]);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const createTicket = async () => {
    try {
      if (!createForm.subject.trim() || !createForm.message.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Add form data
      formData.append('contact_type', createForm.contact_type);
      formData.append('category', createForm.category);
      formData.append('priority', createForm.priority);
      formData.append('subject', createForm.subject);
      formData.append('message', createForm.message);
      
      if (createForm.recipient_address) {
        formData.append('recipient_address', createForm.recipient_address);
      }
      
      if (attachments.length > 0) {
        formData.append('attachment_ids', JSON.stringify(attachments.map(a => a.id)));
      }

      await axios.post(
        `${API_URL}/tickets/create`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert('Ticket created successfully!');
      
      // Reset form
      setCreateForm({
        contact_type: 'admin',
        recipient_address: '',
        category: 'general',
        priority: 'medium',
        subject: '',
        message: ''
      });
      setAttachments([]);
      setActiveView('list');
      fetchTickets();
    } catch (error) {
      console.error('Failed to create ticket:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMsg = error.response?.data?.detail || 'Failed to create ticket. Please try again.';
      alert(errorMsg);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/tickets/${ticketId}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setSelectedTicket(response.data);
      setActiveView('view');
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      alert('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const replyToTicket = async () => {
    if (!replyMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('message', replyMessage);
      
      if (attachments.length > 0) {
        formData.append('attachment_ids', JSON.stringify(attachments.map(a => a.id)));
      }

      await axios.post(
        `${API_URL}/tickets/${selectedTicket.ticket.ticket_id}/reply`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setReplyMessage('');
      setAttachments([]);
      fetchTicketDetails(selectedTicket.ticket.ticket_id);
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply');
    }
  };

  const deleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/tickets/${ticketId}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      alert('Ticket deleted successfully');
      fetchTickets();
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      alert('Failed to delete ticket. Only closed tickets can be deleted.');
    }
  };

  const openAttachmentModal = async (url, filename) => {
    try {
      const token = localStorage.getItem('token');
      // Handle URLs that might already have /api prefix
      const attachmentUrl = url.startsWith('/api/') ? `${BACKEND_URL}${url}` : `${API_URL}${url}`;
      const response = await fetch(attachmentUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load attachment');
      }

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      const contentType = response.headers.get('content-type') || '';
      
      // Open in new window with the blob URL
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>${filename || 'Attachment'}</title>
            <style>
              body { 
                margin: 0; padding: 20px; font-family: Arial, sans-serif; 
                background: #f5f5f5; text-align: center;
              }
              .container { max-width: 100%; }
              .header { 
                background: white; padding: 15px; margin-bottom: 20px; 
                border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .content { 
                background: white; padding: 20px; border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); min-height: 70vh;
              }
              .download-btn { 
                background: #3b82f6; color: white; padding: 10px 20px; 
                border: none; border-radius: 4px; cursor: pointer; margin: 5px;
                text-decoration: none; display: inline-block;
              }
              .download-btn:hover { background: #2563eb; }
              .close-btn { background: #6b7280; }
              .close-btn:hover { background: #4b5563; }
              img { max-width: 100%; height: auto; }
              iframe { width: 100%; height: 70vh; border: none; }
              .file-info { color: #6b7280; font-size: 14px; margin-bottom: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0 0 10px 0;">${filename || 'Attachment'}</h2>
                <div class="file-info">Type: ${contentType}</div>
                <a href="${fileUrl}" download="${filename || 'attachment'}" class="download-btn">
                  📥 Download
                </a>
                <button onclick="window.close()" class="download-btn close-btn">
                  ❌ Close
                </button>
              </div>
              <div class="content">
                ${contentType.startsWith('image/') ? 
                  `<img src="${fileUrl}" alt="${filename}" />` :
                  contentType === 'application/pdf' ?
                  `<iframe src="${fileUrl}" type="application/pdf"></iframe>` :
                  contentType.startsWith('text/') ?
                  `<iframe src="${fileUrl}"></iframe>` :
                  `<div style="padding: 40px;">
                     <h3>Preview not available for this file type</h3>
                     <p>Click the download button above to save the file.</p>
                   </div>`
                }
              </div>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 60000); // Clean up after 1 minute
      
    } catch (error) {
      console.error('Failed to open attachment:', error);
      alert('Failed to open attachment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-600 text-blue-100';
      case 'in_progress': return 'bg-yellow-600 text-yellow-100';
      case 'closed': return 'bg-gray-600 text-gray-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-red-100';
      case 'medium': return 'bg-orange-600 text-orange-100';
      case 'low': return 'bg-green-600 text-green-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  if (activeView === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Tickets</span>
          </button>
          <h2 className="text-2xl font-bold text-white">Create New Ticket</h2>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contact Type */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Contact Type *</label>
              <select
                value={createForm.contact_type}
                onChange={(e) => {
                  const newContactType = e.target.value;
                  setCreateForm({
                    ...createForm, 
                    contact_type: newContactType, 
                    recipient_address: '',
                    category: 'general' // Always set default category for backend validation
                  });
                  if (newContactType === 'downline_individual') {
                    fetchDownlineContacts();
                  }
                }}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
              >
                <option value="admin">Contact Admin</option>
              </select>
            </div>

            {/* Category - Only show for admin tickets */}
            {createForm.contact_type === 'admin' && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">Category *</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({...createForm, category: e.target.value})}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
                >
                  <option value="general">General</option>
                  <option value="billing">Billing</option>
                  <option value="leads">Leads</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Priority</label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm({...createForm, priority: e.target.value})}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">Subject *</label>
            <input
              type="text"
              value={createForm.subject}
              onChange={(e) => setCreateForm({...createForm, subject: e.target.value})}
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
              placeholder="Enter ticket subject"
            />
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">Message *</label>
            <textarea
              value={createForm.message}
              onChange={(e) => setCreateForm({...createForm, message: e.target.value})}
              rows={6}
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white resize-none"
              placeholder="Describe your issue or message..."
            />
          </div>

          {/* File Attachments */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">Attachments</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer">
                <Paperclip className="h-4 w-4" />
                <span>Choose Files</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                />
              </label>
              {uploading && <span className="text-yellow-400">Uploading...</span>}
            </div>
            
            {/* Attachment List */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                    <span className="text-gray-300">{attachment.filename}</span>
                    <button
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              onClick={createTicket}
              disabled={!createForm.subject || !createForm.message}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send Ticket</span>
            </button>
            <button
              onClick={() => setActiveView('list')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'view' && selectedTicket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Tickets</span>
          </button>
          <h2 className="text-2xl font-bold text-white">Ticket Details</h2>
        </div>

        {/* Ticket Header */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{selectedTicket.ticket.subject}</h3>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs uppercase font-medium ${getStatusColor(selectedTicket.ticket.status)}`}>
                  {selectedTicket.ticket.status.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs uppercase font-medium ${getPriorityColor(selectedTicket.ticket.priority)}`}>
                  {selectedTicket.ticket.priority}
                </span>
                <span className="text-gray-400 text-sm">
                  {selectedTicket.ticket.category.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="text-right text-gray-400 text-sm">
              <p>Created: {new Date(selectedTicket.ticket.created_at).toLocaleString()}</p>
              <p>Updated: {new Date(selectedTicket.ticket.updated_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">From: </span>
              <span className="text-white">{selectedTicket.ticket.sender_username}</span>
            </div>
            <div>
              <span className="text-gray-400">To: </span>
              <span className="text-white">
                {selectedTicket.ticket.recipient_username || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-4">Conversation</h4>
          
          <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
            {selectedTicket.messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.sender_role === 'admin' 
                    ? 'bg-red-600 bg-opacity-20 border-l-4 border-red-400' 
                    : 'bg-blue-600 bg-opacity-20 border-l-4 border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white">
                      {message.sender_username}
                    </span>
                    {message.sender_role === 'admin' && (
                      <span className="px-2 py-1 bg-red-600 text-red-100 rounded text-xs">Admin</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap">{message.message}</p>
                
                {/* Attachments */}
                {message.attachment_urls && message.attachment_urls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachment_urls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => openAttachmentModal(url, `attachment-${i + 1}`)}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 cursor-pointer"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span>View Attachment {i + 1}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reply Section */}
          {selectedTicket.ticket.status !== 'closed' && (
            <div className="border-t border-gray-600 pt-4">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white resize-none mb-4"
                placeholder="Type your reply..."
              />
              
              {/* Reply Attachments */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded cursor-pointer">
                    <Paperclip className="h-4 w-4" />
                    <span>Attach</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                    />
                  </label>
                  {uploading && <span className="text-yellow-400">Uploading...</span>}
                </div>
                
                <button
                  onClick={replyToTicket}
                  disabled={!replyMessage.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Reply</span>
                </button>
              </div>
              
              {/* Reply Attachment List */}
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                      <span className="text-gray-300 text-sm">{attachment.filename}</span>
                      <button
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchTickets()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2"
          >
            <Circle className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setActiveView('create')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="billing">Billing</option>
              <option value="leads">Leads</option>
              <option value="technical">Technical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Tickets Found</h3>
            <p className="text-gray-300 mb-4">You haven't created any tickets yet.</p>
            <button
              onClick={() => setActiveView('create')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-600">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="p-6 hover:bg-white hover:bg-opacity-5 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-white hover:text-blue-300 cursor-pointer"
                          onClick={() => fetchTicketDetails(ticket.ticket_id)}>
                        {ticket.subject}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                      <span>#{ticket.ticket_id.slice(0, 8)}</span>
                      <span className="capitalize">{ticket.category}</span>
                      <span>
                        {ticket.contact_type === 'admin' ? 'To Admin' : 
                         ticket.contact_type === 'sponsor' ? 'To Sponsor' :
                         ticket.contact_type === 'downline_individual' ? 'To Downline' :
                         ticket.contact_type === 'news' ? 'News Message' :
                         'Mass Message'}
                      </span>
                      {ticket.recipient_username && (
                        <span>→ {ticket.recipient_username}</span>
                      )}
                    </div>
                    
                    <p className="text-gray-300 text-sm">
                      Updated {new Date(ticket.updated_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {ticket.attachment_count > 0 && (
                      <Paperclip className="h-4 w-4 text-gray-400" />
                    )}
                    
                    {/* View Button */}
                    <button
                      onClick={() => fetchTicketDetails(ticket.ticket_id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    
                    {/* Delete Button - Only for closed tickets */}
                    {ticket.status === 'closed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the row click
                          deleteTicket(ticket.ticket_id);
                        }}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2 transition-all duration-200"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Account Tab Component with sub-tabs

export default TicketsTab;
