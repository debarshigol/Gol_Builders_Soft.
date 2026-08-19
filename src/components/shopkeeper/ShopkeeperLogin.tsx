'use client';

import React, { useState } from 'react';
import { Building2, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const ShopkeeperLogin: React.FC = () => {
  const { loginShopkeeper } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please enter your username');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await loginShopkeeper(username, password, true);
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4 font-sans animate-fadeIn">
      {/* Login Card */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        
        {/* Brand Logo & Name */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-300/40 text-slate-950 mb-3">
            <Building2 className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-white">
            Gol Builders
          </h1>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mt-0.5">
            Shopkeeper Login
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter shopkeeper username"
                autoComplete="username"
                autoCapitalize="none"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-medium"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Click to Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.99] text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Click to Login</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
