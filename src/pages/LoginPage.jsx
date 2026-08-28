import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '../components/three/ParticleBackground';
import { PoliceEmblem } from '../components/layout/Navbar';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react';

export default function LoginPage() {
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@touristpolice.go.th');
  const [password, setPassword] = useState('admin1234');
  const [role, setRole] = useState('admin');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithCredentials(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@touristpolice.go.th', password: 'admin1234', role: 'admin' },
    { label: 'ผู้ออกใบเสร็จ', email: 'officer1@touristpolice.go.th', password: 'officer1234', role: 'issuer' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
    }}>
      <ParticleBackground intensity={1.2} />

      {/* Glow effects */}
      <div style={{
        position: 'fixed', top: '20%', left: '10%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(45,95,166,0.15) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />
      <div style={{
        position: 'fixed', bottom: '15%', right: '8%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />

      {/* Login Card */}
      <div className="glass-card" style={{
        width: '100%', maxWidth: 420,
        padding: '40px 36px',
        background: 'linear-gradient(145deg, rgba(26,58,107,0.85) 0%, rgba(15,31,61,0.9) 100%)',
        border: '1px solid rgba(201,168,76,0.35)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(201,168,76,0.1)',
        animation: 'slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top decorative line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)',
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-block',
            animation: 'float 4s ease-in-out infinite',
            marginBottom: 16,
            filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.6))',
          }}>
            <PoliceEmblem size={80} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8edf5', marginBottom: 6 }}>
            ระบบออกใบเสร็จรับเงิน
          </h1>
          <p style={{ fontSize: 13, color: '#c9a84c', fontWeight: 500 }}>
            กองทุนสวัสดิการ กองบัญชาการตำรวจท่องเที่ยว
          </p>
        </div>

        {/* Demo Account Shortcuts */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#6b7a99', marginBottom: 8, textAlign: 'center' }}>
            บัญชีทดสอบ (Demo)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.password); setRole(acc.role); }}
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">อีเมลผู้ใช้งาน</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
              placeholder="name@touristpolice.go.th"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">รหัสผ่าน</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a99',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">สิทธิ์การใช้งาน</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="form-select"
            >
              <option value="issuer">ผู้ออกใบเสร็จ (Issuer)</option>
              <option value="auditor">ผู้ตรวจสอบ (Auditor)</option>
              <option value="admin">ผู้ดูแลระบบ (Admin)</option>
            </select>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              color: '#fca5a5',
              fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Shield size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-gold btn-lg"
            disabled={loading}
            style={{ marginTop: 4, justifyContent: 'center' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 16, height: 16,
                  border: '2px solid rgba(15,31,61,0.3)',
                  borderTopColor: 'var(--navy-900)',
                  borderRadius: '50%',
                  animation: 'spin-slow 0.8s linear infinite',
                  display: 'inline-block',
                }} />
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              <>
                <LogIn size={18} />
                เข้าสู่ระบบ
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: 24, textAlign: 'center',
          fontSize: 11, color: '#4b5a75',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Shield size={10} />
          ระบบจัดเก็บข้อมูลกลาง เชื่อมต่อฐานข้อมูลปลอดภัย
        </div>
      </div>
    </div>
  );
}
