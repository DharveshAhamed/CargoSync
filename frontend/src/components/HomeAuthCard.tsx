'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { saveAuth } from '@/lib/auth';

type Role = 'company' | 'trucker' | 'admin';
type Mode = 'login' | 'register';

interface RoleConfig {
  id: Role;
  label: string;
  badge: string;
  color: string;
  darkColor: string;
  icon: string;
  description: string;
  submitVerb: string;
}

const ROLES: RoleConfig[] = [
  {
    id: 'company',
    label: 'Company',
    badge: 'SHIPPER',
    color: '#176451',
    darkColor: '#0e3a2f',
    icon: '🏢',
    description: 'Post freight jobs, build 3D load plans & discover available fleet trucks.',
    submitVerb: 'Sign in to Company',
  },
  {
    id: 'trucker',
    label: 'Trucker',
    badge: 'FLEET',
    color: '#315F7E',
    darkColor: '#1d394b',
    icon: '🚛',
    description: 'List vehicles & drivers, accept freight requests and verify chain of custody.',
    submitVerb: 'Sign in to Fleet',
  },
  {
    id: 'admin',
    label: 'Admin',
    badge: 'CONTROL',
    color: '#A66C33',
    darkColor: '#633f1c',
    icon: '🛡️',
    description: 'Platform governance, user verification, job monitoring & activity audit trail.',
    submitVerb: 'Sign in to Admin',
  },
];

export default function HomeAuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeRole, setActiveRole] = useState<Role>('company');
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Synchronize role/mode with URL parameters if present
  useEffect(() => {
    const roleParam = searchParams.get('role');
    const modeParam = searchParams.get('mode');
    if (roleParam === 'company' || roleParam === 'trucker' || roleParam === 'admin') {
      setActiveRole(roleParam);
    }
    if (modeParam === 'login' || modeParam === 'register') {
      setMode(modeParam);
    }
  }, [searchParams]);

  const currentRole = ROLES.find((r) => r.id === activeRole) || ROLES[0];

  const handleRoleChange = (role: Role) => {
    setActiveRole(role);
    setError('');
    setSuccessMsg('');
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
  };

  const fillDemoAdmin = () => {
    setActiveRole('admin');
    setMode('login');
    setEmail('dharvesh@gmail.com');
    setPassword('dharvesh123');
    setError('');
  };

  const fillDemoCompany = () => {
    setActiveRole('company');
    setMode('login');
    setEmail('abc@gmail.com');
    setPassword('Password123!');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please provide your email and password.');
      return;
    }

    if (mode === 'register') {
      if (cleanPassword.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        setError('Passwords do not match.');
        return;
      }
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (activeRole !== 'admin' && !companyName.trim()) {
        setError(`Please enter your ${activeRole === 'company' ? 'company' : 'fleet/trucking'} name.`);
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const endpoint =
          activeRole === 'admin'
            ? '/auth/admin/login'
            : activeRole === 'trucker'
            ? '/auth/trucker/login'
            : '/auth/company/login';

        const { data } = await api.post(endpoint, {
          email: cleanEmail,
          password: cleanPassword,
        });

        saveAuth(data);
        setSuccessMsg('Signed in successfully! Redirecting...');

        setTimeout(() => {
          if (activeRole === 'admin') {
            router.push('/admin/companies');
          } else {
            router.push('/dashboard');
          }
        }, 350);
      } else {
        // Registration
        if (activeRole === 'admin') {
          const { data } = await api.post('/auth/admin/register', {
            name: fullName.trim(),
            email: cleanEmail,
            password: cleanPassword,
          });
          saveAuth(data);
          setSuccessMsg('Administrator account created! Redirecting...');
          setTimeout(() => router.push('/admin/companies'), 400);
        } else {
          const endpoint = activeRole === 'trucker' ? '/auth/trucker/register' : '/auth/company/register';
          const payload = {
            company_name: companyName.trim(),
            name: fullName.trim(),
            email: cleanEmail,
            password: cleanPassword,
            phone: phone.trim() || undefined,
          };
          const { data } = await api.post(endpoint, payload);
          saveAuth(data);
          setSuccessMsg(`${activeRole === 'company' ? 'Company' : 'Fleet'} workspace created! Redirecting...`);
          setTimeout(() => router.push('/dashboard'), 400);
        }
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : err.message || 'Authentication failed. Please verify your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="access"
      className="w-full max-w-[480px] rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all duration-300"
      style={{
        background: 'rgba(255, 255, 255, 0.94)',
        border: '1px solid rgba(22, 53, 45, 0.12)',
        boxShadow: '0 20px 48px -12px rgba(8, 31, 26, 0.28), 0 4px 16px rgba(0, 0, 0, 0.04)',
        color: '#16352d',
      }}
    >
      {/* Header & Role Badges */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{currentRole.icon}</span>
          <div>
            <span
              className="text-[10px] font-extrabold tracking-[0.2em] uppercase px-2 py-0.5 rounded-full"
              style={{
                background: `${currentRole.color}15`,
                color: currentRole.color,
                border: `1px solid ${currentRole.color}30`,
              }}
            >
              {currentRole.badge}
            </span>
          </div>
        </div>

        {/* Mode Switcher (Sign In vs Register) */}
        <div className="inline-flex p-1 rounded-xl bg-gray-100 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white shadow-sm font-bold text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white shadow-sm font-bold text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Register
          </button>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100/90 rounded-2xl mb-5">
        {ROLES.map((r) => {
          const isActive = r.id === activeRole;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRoleChange(r.id)}
              className="py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5"
              style={{
                backgroundColor: isActive ? '#ffffff' : 'transparent',
                color: isActive ? r.color : '#6b7280',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <span className="text-sm">{r.icon}</span>
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
          {mode === 'login' ? `Sign in to ${currentRole.label}` : `Create ${currentRole.label} Account`}
        </h2>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
          {currentRole.description}
        </p>
      </div>

      {/* Error / Success Alerts */}
      {error && (
        <div className="mb-4 p-3.5 rounded-xl text-xs font-medium bg-red-50 text-red-700 border border-red-200/60 animate-fade-in flex items-start gap-2">
          <span className="text-sm">⚠️</span>
          <span className="flex-1">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60 animate-fade-in flex items-start gap-2">
          <span className="text-sm">✓</span>
          <span className="flex-1">{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === 'register' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 text-gray-900"
              />
            </div>

            {activeRole !== 'admin' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {activeRole === 'company' ? 'Company Name' : 'Fleet / Business Name'}
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={activeRole === 'company' ? 'Apex Global Logistics' : 'Blue Star Fleet LLC'}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 text-gray-900"
                />
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={
              activeRole === 'admin'
                ? 'dharvesh@gmail.com'
                : activeRole === 'trucker'
                ? 'trucker@cargosync.com'
                : 'company@cargosync.com'
            }
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 text-gray-900"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-700">Password</label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-gray-500 hover:text-gray-800 transition-colors"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={mode === 'register' ? 8 : 1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 text-gray-900"
          />
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 text-gray-900"
            />
          </div>
        )}

        {mode === 'register' && activeRole !== 'admin' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Phone Number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 text-gray-900"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all duration-200 hover:opacity-95 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            backgroundColor: currentRole.color,
          }}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
            </>
          ) : (
            <span>
              {mode === 'login'
                ? currentRole.submitVerb
                : `Create ${currentRole.label} Account`}
            </span>
          )}
        </button>
      </form>

      {/* Demo shortcuts & Quick Fill */}
      {mode === 'login' && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>Quick demo credentials:</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="px-2 py-1 rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200 font-medium transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={fillDemoCompany}
              className="px-2 py-1 rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200 font-medium transition-colors"
            >
              Company
            </button>
          </div>
        </div>
      )}

      {/* Toggle between register and login */}
      <div className="mt-4 text-center text-xs text-gray-600">
        {mode === 'login' ? (
          <span>
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className="font-bold underline hover:opacity-80"
              style={{ color: currentRole.color }}
            >
              Register here
            </button>
          </span>
        ) : (
          <span>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className="font-bold underline hover:opacity-80"
              style={{ color: currentRole.color }}
            >
              Sign in here
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
