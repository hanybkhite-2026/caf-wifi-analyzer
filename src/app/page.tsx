'use client';

import React, { useState, useEffect } from 'react';

export default function CAFWiFiApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('admin@caf.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [networkInfo, setNetworkInfo] = useState({
    ip: 'Loading...',
    isp: 'Loading...',
    country: 'Loading...'
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchIP();
    }
  }, [isLoggedIn]);

  const fetchIP = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      setNetworkInfo({
        ip: data.ip || '192.168.1.100',
        isp: data.org || 'ISP',
        country: data.country_name || 'Country'
      });
    } catch (err) {
      setNetworkInfo({
        ip: '192.168.1.100',
        isp: 'Zain Network',
        country: 'Jordan'
      });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (email === 'admin@caf.com' && password === 'admin123') {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('❌ Invalid credentials. Use: admin@caf.com / admin123');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('admin@caf.com');
    setPassword('admin123');
    setError('');
    setActiveTab('home');
  };

  // LOGIN PAGE
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: '#1e293b',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '1px solid #334155'
        }}>
          {/* Logo */}
          <div style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: '#3b82f6',
              borderRadius: '12px',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              📡
            </div>
            <h1 style={{
              color: 'white',
              fontSize: '28px',
              fontWeight: 'bold',
              margin: '0 0 10px 0'
            }}>
              NetPulse CAF
            </h1>
            <p style={{
              color: '#94a3b8',
              margin: '0',
              fontSize: '14px'
            }}>
              Enterprise WiFi Analyzer
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ marginBottom: '20px' }}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '8px',
                letterSpacing: '0.5px'
              }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '8px',
                letterSpacing: '0.5px'
              }}>
                SECURITY KEY
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #dc2626',
                color: '#fca5a5',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            {/* Demo Info */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid #3b82f6',
              color: '#93c5fd',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              ✅ Demo: admin@caf.com / admin123
            </div>

            {/* Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                background: '#3b82f6',
                color: 'white',
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Sign In to Infrastructure
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN APP
  return (
    <div style={{
      background: '#0f172a',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📡</span>
            <div>
              <h1 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                NetPulse CAF
              </h1>
              <p style={{ margin: '0', fontSize: '11px', color: '#94a3b8' }}>
                Logged in as: Admin
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '16px',
          borderTop: '1px solid #334155',
          paddingTop: '12px'
        }}>
          {['home', 'analytics', 'networks', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                background: activeTab === tab ? '#3b82f6' : 'transparent',
                color: activeTab === tab ? 'white' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 20px'
      }}>
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
              Dashboard
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              {[
                { icon: '📡', label: 'Networks', value: '6' },
                { icon: '🛜', label: 'Active APs', value: '18' },
                { icon: '📶', label: 'Avg Signal', value: '-52 dBm' },
                { icon: '❤️', label: 'Health', value: '98%' }
              ].map((card, i) => (
                <div key={i} style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '20px',
                  transition: 'all 0.3s ease'
                }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                    {card.icon}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {card.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
              ⚡ Network Analytics
            </h2>
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <h3 style={{ marginTop: '0', color: '#e2e8f0' }}>📊 Your Network Info</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '16px'
              }}>
                <div style={{
                  background: '#334155',
                  padding: '16px',
                  borderRadius: '6px'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                    🌐 Your IP Address
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {networkInfo.ip}
                  </div>
                </div>
                <div style={{
                  background: '#334155',
                  padding: '16px',
                  borderRadius: '6px'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                    📍 ISP
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {networkInfo.isp}
                  </div>
                </div>
                <div style={{
                  background: '#334155',
                  padding: '16px',
                  borderRadius: '6px'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                    🌍 Country
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {networkInfo.country}
                  </div>
                </div>
                <div style={{
                  background: '#334155',
                  padding: '16px',
                  borderRadius: '6px'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                    🔍 DNS
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
                    8.8.8.8
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NETWORKS TAB */}
        {activeTab === 'networks' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
              📡 WiFi Networks
            </h2>
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#334155' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>SSID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Signal</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Channel</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Band</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ssid: 'CAF-WIFI-5G', signal: '-45 dBm', channel: '36', band: '5 GHz' },
                    { ssid: 'CAF-WIFI-2G', signal: '-58 dBm', channel: '6', band: '2.4 GHz' },
                    { ssid: 'CAF-GUEST', signal: '-65 dBm', channel: '52', band: '5 GHz' },
                  ].map((net, i) => (
                    <tr key={i} style={{
                      borderTop: '1px solid #334155',
                      background: i % 2 === 0 ? 'transparent' : '#0f172a'
                    }}>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{net.ssid}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#10b981' }}>{net.signal}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{net.channel}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{net.band}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
              ⚙️ Settings
            </h2>
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <h3 style={{ marginTop: '0' }}>📧 Developer Contact</h3>
              <div style={{
                background: '#334155',
                padding: '16px',
                borderRadius: '6px',
                marginTop: '12px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                    👤 Developer
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>
                    Hany Bkhite
                  </div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                    📧 Email
                  </div>
                  <a href="mailto:hany.bkhite@gmail.com" style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#3b82f6',
                    textDecoration: 'none'
                  }}>
                    hany.bkhite@gmail.com
                  </a>
                </div>
              </div>
              <p style={{
                color: '#94a3b8',
                fontSize: '13px',
                marginTop: '16px',
                marginBottom: '0'
              }}>
                For questions or feature requests, please contact the developer.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
