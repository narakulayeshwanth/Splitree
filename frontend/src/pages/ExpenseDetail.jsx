import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExpense } from '../api/expenses';
import { getComments, createComment } from '../api/comments';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

function fmt(n) {
  return `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ExpenseDetail() {
  const { groupId, expenseId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getExpense(groupId, expenseId).then(r => setExpense(r.data));
    getComments(expenseId).then(r => setComments(r.data));
  }, [expenseId, groupId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_expense', { expenseId });
    socket.on('new_comment', c => setComments(prev => [...prev, c]));
    return () => { socket.emit('leave_expense', { expenseId }); socket.off('new_comment'); };
  }, [socket, expenseId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try { await createComment(expenseId, text); setText(''); }
    catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  if (!expense) return (
    <div style={{ display: 'flex' }}><Sidebar />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid rgba(16,185,129,0.3)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    </div>
  );

  return (
    <>
      <Sidebar />
      <div className="main-content fade-up">
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(`/groups/${groupId}`)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 14, cursor: 'pointer' }}>←</button>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💳</div>
            <div>
              <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16 }}>{expense.title}</p>
              <p style={{ color: '#4b5563', fontSize: 12 }}>Sharing · {expense.payer?.name} · {new Date(expense.expenseDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</p>
            </div>
          </div>
          <p style={{ color: '#10b981', fontWeight: 800, fontSize: 24 }}>{fmt(expense.amount)}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, height: 'calc(100vh - 61px)' }}>
          {/* Left: Who Owes + Audit */}
          <div style={{ padding: '24px 28px', borderRight: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto' }}>
            {/* Who Owes What */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 700 }}>Who Owes What</h2>
              <span style={{ color: '#10b981', fontSize: 12 }}>Total by NET</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 }}>
              {expense.splits?.map(s => {
                const isPayer = s.userId === expense.paidBy;
                const isMe = s.userId === user?.id;
                return (
                  <div key={s.userId} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: isMe ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 700, fontSize: 13 }}>
                      {s.user?.name?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{s.user?.name} {isMe && <span style={{ color: '#4b5563' }}>(you)</span>}</p>
                      <p style={{ color: '#4b5563', fontSize: 11 }}>{isPayer ? 'Paid full amount' : 'Waiting for payment'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: isPayer ? '#10b981' : '#f87171', fontWeight: 700, fontSize: 15 }}>{fmt(s.amount)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Audit Trail */}
            <h2 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Audit Trail</h2>
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0, marginTop: 5 }} />
                  <div>
                    <p style={{ color: '#d1d5db', fontSize: 13 }}><span style={{ color: '#10b981', fontWeight: 500 }}>{expense.creator?.name}</span> created the expense</p>
                    <p style={{ color: '#4b5563', fontSize: 11, marginTop: 2 }}>{new Date(expense.createdAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                  </div>
                </div>
                {comments.length > 0 && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 5 }} />
                    <p style={{ color: '#d1d5db', fontSize: 13 }}>{comments.length} comment{comments.length > 1 ? 's' : ''} in discussion</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Discussion */}
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 700 }}>Discussion</h2>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {comments.length === 0 && (
                <p style={{ textAlign: 'center', color: '#374151', fontSize: 13, marginTop: 40 }}>No messages yet. Start the conversation!</p>
              )}
              {comments.map((c, i) => {
                const isMe = c.user?.id === user?.id;
                return (
                  <div key={c.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '75%', background: isMe ? '#10b981' : '#1a2236', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '10px 14px', border: isMe ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                      {!isMe && <p style={{ color: '#10b981', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{c.user?.name}</p>}
                      <p style={{ color: isMe ? '#0d1117' : '#e2e8f0', fontSize: 13, lineHeight: 1.4 }}>{c.text}</p>
                      <p style={{ color: isMe ? 'rgba(0,0,0,0.4)' : '#4b5563', fontSize: 10, marginTop: 5, textAlign: 'right' }}>
                        {new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10 }}>
              <input type="text" placeholder="Type a message..." value={text}
                onChange={e => setText(e.target.value)} className="input-field"
                style={{ flex: 1, fontSize: 13 }} />
              <button type="submit" className="btn-primary" style={{ padding: '0 18px', fontSize: 13 }} disabled={sending || !text.trim()}>
                {sending ? '...' : '→'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
