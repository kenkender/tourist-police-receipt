import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '../components/three/ParticleBackground';
import { PoliceEmblem } from '../components/layout/Navbar';
import { Shield } from 'lucide-react';
import { GOOGLE_CONFIG, LINE_CONFIG } from '../config/google.config';

export default function LoginPage() {
  const { loginWithGoogle, loginWithLine } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('issuer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // โหลด Google GIS และ LINE LIFF SDK ในลักษณะ Dynamic
  useEffect(() => {
    if (!document.getElementById('google-gis-script')) {
      const script = document.createElement('script');
      script.id = 'google-gis-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    if (!document.getElementById('line-liff-script')) {
      const script = document.createElement('script');
      script.id = 'line-liff-script';
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Google Sign-In Handler
  const handleGoogleLogin = async () => {
    setError('');
    if (!GOOGLE_CONFIG.CLIENT_ID) {
      setError('⚠️ ยังไม่ได้ตั้งค่า VITE_GOOGLE_CLIENT_ID ใน Vercel กรุณาใส่ Client ID จาก Google Cloud Console เพื่อเปิดระบบล็อกอิน Google ของจริงครับ');
      return;
    }

    setLoading(true);
    try {
      if (window.google?.accounts?.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          scope: 'email profile',
          callback: async (tokenResponse) => {
            if (tokenResponse.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await res.json();
                await loginWithGoogle({
                  email: userInfo.email,
                  name: userInfo.name,
                  picture: userInfo.picture,
                  role: role,
                });
                navigate('/dashboard');
              } catch (err) {
                setError('เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google: ' + err.message);
              }
            }
          },
        });
        client.requestAccessToken();
      } else {
        const redirectUri = window.location.origin + '/login';
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${GOOGLE_CONFIG.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email%20profile`;
        window.location.href = googleAuthUrl;
      }
    } catch (err) {
      setError('ไม่สามารถลงชื่อเข้าใช้ด้วย Google ได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // LINE Login Handler
  const handleLineLogin = async () => {
    setError('');
    if (!LINE_CONFIG.LIFF_ID && !LINE_CONFIG.CHANNEL_ID) {
      setError('⚠️ ยังไม่ได้ตั้งค่า VITE_LIFF_ID หรือ VITE_LINE_CHANNEL_ID ใน Vercel กรุณาใส่ Channel ID จาก LINE Developers Console เพื่อเปิดระบบล็อกอิน LINE ของจริงครับ');
      return;
    }

    setLoading(true);
    try {
      if (LINE_CONFIG.LIFF_ID && window.liff) {
        await window.liff.init({ liffId: LINE_CONFIG.LIFF_ID });
        if (!window.liff.isLoggedIn()) {
          window.liff.login();
        } else {
          const profile = await window.liff.getProfile();
          await loginWithLine({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            role: role,
          });
          navigate('/dashboard');
        }
      } else if (LINE_CONFIG.CHANNEL_ID) {
        const redirectUri = window.location.origin + '/login';
        const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CONFIG.CHANNEL_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=line_login&scope=profile%20openid%20email`;
        window.location.href = lineAuthUrl;
      }
    } catch (err) {
      setError('ไม่สามารถลงชื่อเข้าใช้ด้วย LINE ได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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
        width: '100%', maxWidth: 430,
        padding: '36px 32px',
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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-block',
            animation: 'float 4s ease-in-out infinite',
            marginBottom: 12,
            filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.6))',
          }}>
            <PoliceEmblem size={72} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#e8edf5', marginBottom: 4 }}>
            ระบบออกใบเสร็จรับเงิน
          </h1>
          <p style={{ fontSize: 12, color: '#c9a84c', fontWeight: 500 }}>
            กองทุนสวัสดิการ กองบัญชาการตำรวจท่องเที่ยว
          </p>
        </div>

        {/* Role Selector */}
        <div style={{ marginBottom: 20 }}>
          <label className="form-label" style={{ fontSize: 11, color: '#a8b5cc' }}>
            สิทธิ์การใช้งานที่ต้องการเข้าถึง
          </label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="form-select"
            style={{ fontSize: 13, padding: '10px 12px' }}
          >
            <option value="issuer">ผู้ออกใบเสร็จ (Officer / Issuer)</option>
            <option value="admin">ผู้ดูแลระบบ (System Admin)</option>
          </select>

        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            padding: '12px 14px',
            marginBottom: 16,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            color: '#fca5a5',
            fontSize: 12,
            display: 'flex', alignItems: 'flex-start', gap: 8,
            lineHeight: 1.4,
          }}>
            <Shield size={14} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Social Login Buttons Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)',
              background: '#ffffff',
              color: '#1f2937',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 6px 18px rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            เข้าสู่ระบบด้วย Gmail (Google)
          </button>

          {/* LINE Sign In Button */}
          <button
            type="button"
            onClick={handleLineLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#06C755',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              boxShadow: '0 4px 12px rgba(6,199,85,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#05b34c'}
            onMouseOut={(e) => e.currentTarget.style.background = '#06C755'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.412-.105-.534-.285l-2.481-3.565v3.193c0 .346-.282.63-.63.63-.346 0-.627-.285-.627-.63V8.108c0-.27.174-.51.432-.596.066-.021.133-.031.199-.031.211 0 .413.105.534.285l2.482 3.565V8.108c0-.346.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-6.234 0c0 .346-.282.63-.63.63-.346 0-.627-.285-.627-.63V8.108c0-.346.281-.63.627-.63.348 0 .63.284.63.63v4.771zm-2.441.63H4.449c-.346 0-.628-.285-.628-.63V8.108c0-.346.282-.63.628-.63.346 0 .628.284.628.63v4.141h1.755c.348 0 .63.283.63.63 0 .344-.282.629-.63.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08-.085.635-.386 2.446-.425 2.972-.059.78.361.767.613.511.253-.256 2.766-1.63 3.774-2.392 1.488-.992 3.864-2.88 5.433-4.992C22.617 15.65 24 13.136 24 10.314" />
            </svg>
            เข้าสู่ระบบด้วย LINE
          </button>
        </div>

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
