import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Search, Filter, ArrowLeft, Send, Eye } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

function AdminTicketsTab({ 
  tickets, setTickets, selectedTicket, setSelectedTicket, 
  page, setPage, totalPages, setTotalPages, filters, setFilters,
  showMassMessageModal, setShowMassMessageModal, massMessageForm, setMassMessageForm,
  adminReplyMessage, setAdminReplyMessage
}) {
  const [activeView, setActiveView] = useState('list'); // 'list', 'view', 'mass-message'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminTickets();
  }, [page, filters]);

  const fetchAdminTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (filters.status) params.append('status_filter', filters.status);
      if (filters.category) params.append('category_filter', filters.category);
      if (filters.contact_type) params.append('contact_type_filter', filters.contact_type);
      if (filters.user) params.append('user_filter', filters.user);

      const response = await axios.get(
        `${API_URL}/admin/tickets?${params}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setTickets(response.data.tickets || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch admin tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${API_URL}/admin/tickets/${ticketId}`,
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

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API_URL}/admin/tickets/${ticketId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update local ticket status
      if (selectedTicket && selectedTicket.ticket.ticket_id === ticketId) {
        setSelectedTicket({
          ...selectedTicket,
          ticket: { ...selectedTicket.ticket, status: newStatus }
        });
      }
      
      // Refresh ticket list
      fetchAdminTickets();
      alert('Ticket status updated successfully');
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      alert('Failed to update ticket status');
    }
  };

  const replyToTicket = async () => {
    if (!adminReplyMessage.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('message', adminReplyMessage);

      await axios.post(
        `${API_URL}/admin/tickets/${selectedTicket.ticket.ticket_id}/reply`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setAdminReplyMessage('');
      fetchTicketDetails(selectedTicket.ticket.ticket_id);
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply');
    }
  };

  const sendMassMessage = async () => {
    try {
      if (!massMessageForm.subject.trim() || !massMessageForm.message.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_URL}/admin/tickets/mass-message`,
        massMessageForm,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      alert('Mass message sent successfully!');
      setShowMassMessageModal(false);
      setMassMessageForm({
        target_type: 'all_users',
        target_tiers: [],
        target_users: [],
        subject: '',
        message: ''
      });
      fetchAdminTickets();
    } catch (error) {
      console.error('Failed to send mass message:', error);
      alert('Failed to send mass message');
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

  const downloadAttachment = async (url, filename) => {
    try {
      const token = localStorage.getItem('adminToken');
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
                background: #dc2626; color: white; padding: 10px 20px; 
                border: none; border-radius: 4px; cursor: pointer; margin: 5px;
                text-decoration: none; display: inline-block;
              }
              .download-btn:hover { background: #b91c1c; }
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
                <h2 style="margin: 0 0 10px 0;">${filename || 'Attachment'} [ADMIN VIEW]</h2>
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

  // Ticket Details View
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
          <h3 className="text-2xl font-bold text-white">Ticket Details</h3>
        </div>

        {/* Ticket Header */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-xl font-bold text-white mb-2">{selectedTicket.ticket.subject}</h4>
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
            <div className="flex items-center space-x-2">
              <select
                value={selectedTicket.ticket.status}
                onChange={(e) => updateTicketStatus(selectedTicket.ticket.ticket_id, e.target.value)}
                className="px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
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
            <div>
              <span className="text-gray-400">Type: </span>
              <span className="text-white capitalize">{selectedTicket.ticket.contact_type.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-gray-400">Created: </span>
              <span className="text-white">{new Date(selectedTicket.ticket.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
          <h5 className="text-lg font-bold text-white mb-4">Conversation</h5>
          
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
                        onClick={() => downloadAttachment(url, `attachment-${i + 1}`)}
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

          {/* Admin Reply Section */}
          <div className="border-t border-gray-600 pt-4">
            <textarea
              value={adminReplyMessage}
              onChange={(e) => setAdminReplyMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white resize-none mb-4"
              placeholder="Type your admin reply..."
            />
            
            <div className="flex justify-end">
              <button
                onClick={replyToTicket}
                disabled={!adminReplyMessage.trim()}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Send Admin Reply</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Ticket Management</h3>
        <button
          onClick={() => setShowMassMessageModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2"
        >
          <Mail className="h-4 w-4" />
          <span>Send Mass Message</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-white text-sm font-medium mb-2">Contact Type</label>
            <select
              value={filters.contact_type}
              onChange={(e) => setFilters({...filters, contact_type: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
            >
              <option value="">All Types</option>
              <option value="admin">Admin Tickets</option>
              <option value="sponsor">Sponsor Messages</option>
              <option value="downline_individual">Downline Messages</option>
              <option value="news">News Messages</option>
            </select>
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">User Search</label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => setFilters({...filters, user: e.target.value})}
              className="w-full px-3 py-2 bg-black bg-opacity-30 border border-gray-600 rounded text-white"
              placeholder="Search username/email"
            />
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-white mb-2">No Tickets Found</h4>
            <p className="text-gray-300">No tickets match the current filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black bg-opacity-30">
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-medium">Subject</th>
                    <th className="px-6 py-4 text-left text-white font-medium">From</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Type</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Category</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Priority</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Status</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Updated</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.ticket_id}
                      className="hover:bg-white hover:bg-opacity-5"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <h4 className="text-white font-medium">{ticket.subject}</h4>
                          <p className="text-gray-400 text-sm">#{ticket.ticket_id.slice(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{ticket.sender_username}</td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-gray-300">
                          {ticket.contact_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-gray-300">{ticket.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(ticket.updated_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => fetchTicketDetails(ticket.ticket_id)}
                          className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center py-4 space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded"
                >
                  Previous
                </button>
                
                <span className="text-white">
                  Page {page} of {totalPages}
                </span>
                
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mass Message Modal */}
      {showMassMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">Send Mass Message</h4>
              <button
                onClick={() => setShowMassMessageModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Target Audience</label>
                <select
                  value={massMessageForm.target_type}
                  onChange={(e) => setMassMessageForm({...massMessageForm, target_type: e.target.value})}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
                >
                  <option value="all_users">All Users</option>
                  <option value="specific_tiers">Specific Tiers</option>
                </select>
              </div>

              {massMessageForm.target_type === 'specific_tiers' && (
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Select Tiers</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['affiliate', 'bronze', 'silver', 'gold'].map(tier => (
                      <label key={tier} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={massMessageForm.target_tiers.includes(tier)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMassMessageForm({
                                ...massMessageForm,
                                target_tiers: [...massMessageForm.target_tiers, tier]
                              });
                            } else {
                              setMassMessageForm({
                                ...massMessageForm,
                                target_tiers: massMessageForm.target_tiers.filter(t => t !== tier)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-white capitalize">{tier}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white text-sm font-medium mb-2">Subject *</label>
                <input
                  type="text"
                  value={massMessageForm.subject}
                  onChange={(e) => setMassMessageForm({...massMessageForm, subject: e.target.value})}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white"
                  placeholder="Message subject"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Message *</label>
                <textarea
                  value={massMessageForm.message}
                  onChange={(e) => setMassMessageForm({...massMessageForm, message: e.target.value})}
                  rows={6}
                  className="w-full px-4 py-3 bg-black bg-opacity-30 border border-gray-600 rounded-lg text-white resize-none"
                  placeholder="Your message content..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={sendMassMessage}
                  disabled={!massMessageForm.subject || !massMessageForm.message}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg"
                >
                  Send Message
                </button>
                <button
                  onClick={() => setShowMassMessageModal(false)}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Integrations Tab Component for Admin (API Key Management)

export default AdminTicketsTab;
