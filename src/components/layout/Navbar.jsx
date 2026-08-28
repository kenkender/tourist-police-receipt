import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileText, BookOpen, BarChart2, Settings, LogOut, Menu, X, Shield
} from 'lucide-react';
import { useState } from 'react';

// โลโก้ บช.ทท. จริง (ภาพตราตำรวจท่องเที่ยว)
export function PoliceEmblem({ size = 40, className = '' }) {
  return (
    <img
      src="/logo.png"
      alt="ตราตำรวจท่องเที่ยว"
      width={size}
      height={size}
      className={className}
      onError={(e) => {
        if (!e.target.dataset.tried) {
          e.target.dataset.tried = 'true';
          e.target.src = '/โลโก้ตำรวจท่องเที่ยว.jpg';
        }
      }}
      style={{
        objectFit: 'contain',
        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
        display: 'inline-block',
      }}
    />
  );
}

const NAV_ITEMS = [
  { to: '/new-receipt', label: 'ออกใบเสร็จ', icon: FileText },
  { to: '/receipts', label: 'ทะเบียนผู้บริจาค', icon: BookOpen },
  { to: '/dashboard', label: 'รายงานยอดรับเงิน', icon: BarChart2 },
  { to: '/settings', label: 'ตั้งค่าระบบ', icon: Settings, adminOnly: true },
];

export default function Navbar() {
  const { currentUser, logout, getRoleName, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return null;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="navbar no-print" style={{
      position: 'sticky', top: 0, zIndex: 'var(--z-navbar)',
      background: 'linear-gradient(135deg, #060f20 0%, #1a3a6b 100%)',
      borderBottom: '1px solid rgba(201,168,76,0.3)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo + Title */}
        <Link to="/dashboard" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          textDecoration: 'none', flexShrink: 0,
        }}>
          <div style={{
            width: 44, height: 44,
            filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.5))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PoliceEmblem size={44} />
          </div>
          <div>
            <div style={{
              fontSize: 16, fontWeight: 800, color: '#e8edf5',
              letterSpacing: '-0.02em', lineHeight: 1.2,
            }}>
              ระบบออกใบเสร็จรับเงิน
            </div>
            <div style={{ fontSize: 11, color: '#c9a84c', fontWeight: 500 }}>
              กองทุนสวัสดิการ บช.ตำรวจท่องเที่ยว
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hide-mobile" style={{
          display: 'flex', gap: 4,
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 12, padding: 4,
        }}>
          {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
                background: isActive(to)
                  ? 'linear-gradient(135deg, #1e4080, #2d5fa6)'
                  : 'transparent',
                color: isActive(to) ? '#e8edf5' : '#a8b5cc',
                borderBottom: isActive(to) ? '2px solid #c9a84c' : '2px solid transparent',
                boxShadow: isActive(to) ? '0 2px 12px rgba(201,168,76,0.2)' : 'none',
              }}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User Info + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* User Profile Avatar / Image */}
          {currentUser.picture ? (
            <img
              src={currentUser.picture}
              alt={currentUser.name}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                border: '2px solid #c9a84c', objectFit: 'cover',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            />
          ) : (
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: currentUser.provider === 'line' ? '#06C755' : currentUser.provider === 'google' ? '#4285F4' : 'linear-gradient(135deg, #1e4080, #c9a84c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', fontWeight: 800, fontSize: 13,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              {currentUser.name ? currentUser.name.substring(0, 1).toUpperCase() : 'U'}
            </div>
          )}

          <div className="hide-mobile" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#e8edf5', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              <span>{currentUser.name || currentUser.email}</span>
              {currentUser.provider === 'google' && (
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#4285F4', color: 'white', fontWeight: 700 }}>Google</span>
              )}
              {currentUser.provider === 'line' && (
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#06C755', color: 'white', fontWeight: 700 }}>LINE</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#c9a84c', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
              {isAdmin && <Shield size={10} />}
              {getRoleName(currentUser.role)}
            </div>
          </div>
          <button
            className="btn btn-danger btn-icon"
            onClick={logout}
            title="ออกจากระบบ"
            style={{ flexShrink: 0 }}
          >
            <LogOut size={16} />
          </button>

          {/* Mobile menu toggle */}
          <button
            className="hide-desktop btn btn-ghost btn-icon"
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="hide-desktop" style={{
          background: 'rgba(6,15,32,0.98)',
          borderTop: '1px solid rgba(201,168,76,0.2)',
          padding: '8px 16px 16px',
          animation: 'slideInLeft 0.2s ease',
        }}>
          {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 10,
                textDecoration: 'none', marginBottom: 4,
                background: isActive(to) ? 'rgba(45,95,166,0.3)' : 'transparent',
                color: isActive(to) ? '#e8edf5' : '#a8b5cc',
                fontSize: 14, fontWeight: 600,
                borderLeft: isActive(to) ? '3px solid #c9a84c' : '3px solid transparent',
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <div style={{
            marginTop: 12, padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: 12, color: '#6b7a99',
          }}>
            {currentUser.email} — {getRoleName(currentUser.role)}
          </div>
        </div>
      )}
    </header>
  );
}
