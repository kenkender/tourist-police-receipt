import { useReceipts } from '../contexts/ReceiptContext';
import { formatBaht, toThaiDateShort } from '../services/utils';
import { useState, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, FileText, Users, ArrowUpRight, Calendar,
  DollarSign, Activity, Table, ExternalLink,
} from 'lucide-react';
import { getGoogleSheetUrl } from '../config/google.config';

function StatCard({ title, value, sub, icon: Icon, color = '#c9a84c', trend }) {
  return (
    <div className="glass-card stat-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: '#a8b5cc', fontWeight: 500, marginBottom: 8, letterSpacing: '0.05em' }}>
            {title}
          </div>
          <div style={{
            fontSize: 28, fontWeight: 800, color: '#e8edf5',
            letterSpacing: '-0.02em', lineHeight: 1,
            animation: 'count-up 0.5s ease',
          }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 12, color: '#6b7a99', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              {trend && <ArrowUpRight size={12} style={{ color: '#10b981' }} />}
              {sub}
            </div>
          )}
        </div>
        <div style={{
          width: 48, height: 48,
          background: `rgba(${color === '#c9a84c' ? '201,168,76' : '45,95,166'},0.15)`,
          border: `1px solid ${color}30`,
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,31,61,0.97)', border: '1px solid rgba(201,168,76,0.3)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ color: '#c9a84c', fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: '#e8edf5', display: 'flex', gap: 8 }}>
          <span style={{ color: p.color }}>●</span>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{formatBaht(p.value)} บาท</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { receipts, settings, stats, getDailySummaries } = useReceipts();
  const dashRef = useRef(null);

  const sheetUrl = getGoogleSheetUrl(settings?.spreadsheetUrl);

  const s = stats();
  const dailyData = getDailySummaries().slice(0, 14).reverse().map(d => ({
    date: toThaiDateShort(d.date),
    amount: d.amount,
    count: d.count,
  }));

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 28, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{
            fontSize: 24, fontWeight: 800, color: '#e8edf5',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Activity size={24} style={{ color: '#c9a84c' }} />
            รายงานยอดรับเงิน
          </h2>
          <p style={{ fontSize: 13, color: '#6b7a99', marginTop: 4 }}>
            ภาพรวมการรับเงินและใบเสร็จทั้งหมดในระบบ
          </p>
        </div>

        <a
          href={sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-success"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', fontSize: 14, fontWeight: 700,
            textDecoration: 'none', borderRadius: 12,
            boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
          }}
          title="เปิดไปยังตารางข้อมูล Google Sheets"
        >
          <Table size={18} />
          เปิดดู Google Sheets
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Main Dashboard Content */}
      <div ref={dashRef}>
        {/* Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16, marginBottom: 24,
        }}>
          <StatCard
            title="ยอดรับเงินรวมทั้งหมด"
            value={`${formatBaht(s.totalAmount)}`}
            sub="บาท รวมทุกใบเสร็จ"
            icon={DollarSign}
            color="#c9a84c"
            trend
          />
          <StatCard
            title="ใบเสร็จทั้งหมดในระบบ"
            value={`${s.total.toLocaleString('th-TH')}`}
            sub="ฉบับ"
            icon={FileText}
            color="#3b7dd8"
          />
          <StatCard
            title="ยอดรับเงินวันนี้"
            value={`${formatBaht(s.todayAmount)}`}
            sub={`${s.todayCount} ใบเสร็จวันนี้`}
            icon={TrendingUp}
            color="#c9a84c"
            trend
          />
          <StatCard
            title="ยอดรับเงินเดือนนี้"
            value={`${formatBaht(s.monthAmount)}`}
            sub={`${s.monthCount} ใบเสร็จเดือนนี้`}
            icon={Calendar}
            color="#3b7dd8"
          />
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Bar Chart */}
          <div className="glass-card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart size={16} style={{ color: '#c9a84c' }} />
              ยอดรับเงินรายวัน (14 วันล่าสุด)
            </h3>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7a99', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7a99', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" name="ยอดรับเงิน" stroke="#c9a84c" fill="url(#goldGrad)" strokeWidth={2} dot={{ fill: '#c9a84c', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5a75', fontSize: 13 }}>
                ยังไม่มีข้อมูลใบเสร็จ
              </div>
            )}
          </div>

          {/* Count Chart */}
          <div className="glass-card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} style={{ color: '#3b7dd8' }} />
              จำนวนใบเสร็จ (14 วัน)
            </h3>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7a99', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7a99', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="จำนวนใบเสร็จ" radius={[4, 4, 0, 0]}>
                    {dailyData.map((_, i) => (
                      <Cell key={i} fill={i === dailyData.length - 1 ? '#c9a84c' : '#2d5fa6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5a75', fontSize: 13 }}>
                ยังไม่มีข้อมูล
              </div>
            )}
          </div>
        </div>

        {/* Recent Receipts Table */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e8edf5', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} style={{ color: '#c9a84c' }} />
            ใบเสร็จล่าสุด
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>เล่มที่/เลขที่</th>
                  <th>ผู้รับเงิน</th>
                  <th>รายการ</th>
                  <th style={{ textAlign: 'right' }}>จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {receipts.slice(0, 8).map(r => (
                  <tr key={r.id}>
                    <td style={{ color: '#a8b5cc', fontSize: 12 }}>
                      {r.createdAt ? toThaiDateShort(r.createdAt.split('T')[0]) : '-'}
                    </td>
                    <td>
                      <span className="badge badge-blue">{r.bookNo}/{r.receiptNo}</span>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.receivedFrom || '-'}
                    </td>
                    <td style={{ color: '#a8b5cc', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.description || '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#c9a84c' }}>
                      {formatBaht(r.amount)}
                    </td>
                  </tr>
                ))}
                {receipts.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#4b5a75' }}>
                      ยังไม่มีข้อมูลใบเสร็จ — เริ่มออกใบเสร็จได้เลย
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
