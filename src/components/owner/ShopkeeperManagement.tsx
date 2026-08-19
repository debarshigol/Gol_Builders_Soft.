'use client';

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Store,
  Calendar,
  Clock,
  KeyRound,
  Loader2,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ShopkeeperUser } from '@/types';

export const ShopkeeperManagement: React.FC = () => {
  const {
    shopkeeperUsers,
    isLoadingShopkeeperUsers,
    fetchShopkeeperUsers,
    createShopkeeperUser,
    deleteShopkeeperUser,
    toggleShopkeeperUserStatus,
    resetShopkeeperPassword,
  } = useApp();

  // Create Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'shopkeeper'>('shopkeeper');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reset Password Modal State
  const [resetTargetUser, setResetTargetUser] = useState<ShopkeeperUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Fetch shopkeepers on initial mount
  useEffect(() => {
    fetchShopkeeperUsers();
  }, []);

  const handleCreateShopkeeper = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!name.trim()) {
      setFormError('Please enter user full name.');
      return;
    }
    if (!username.trim()) {
      setFormError('Please enter a unique User ID / username.');
      return;
    }
    if (!password.trim()) {
      setFormError('Please set a password.');
      return;
    }
    if (password.trim().length < 4) {
      setFormError('Password must be at least 4 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createShopkeeperUser({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
      });

      if (res.success) {
        setFormSuccess(`Shopkeeper user "@${username.trim().toLowerCase()}" created successfully!`);
        setName('');
        setUsername('');
        setPassword('');
      } else {
        setFormError(res.error || 'Failed to create shopkeeper account.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetError(null);
    setResetSuccess(null);

    if (!newPassword.trim()) {
      setResetError('Please enter a new password.');
      return;
    }
    if (newPassword.trim().length < 4) {
      setResetError('Password must be at least 4 characters long.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetShopkeeperPassword(resetTargetUser.id, newPassword.trim());
      if (res.success) {
        setResetSuccess(`Password for @${resetTargetUser.username} has been updated successfully!`);
        setTimeout(() => {
          setResetTargetUser(null);
          setNewPassword('');
          setResetSuccess(null);
        }, 1200);
      } else {
        setResetError(res.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      setResetError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async (id: string, userDisplayName: string) => {
    if (!window.confirm(`Are you sure you want to revoke access for "${userDisplayName}"?`)) {
      return;
    }
    setDeletingId(id);
    await deleteShopkeeperUser(id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Top Header Card */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <Store className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Shopkeeper Access Portal</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Staff Credentials
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Create, manage, and reset staff login credentials stored in database table <code className="text-emerald-400 font-mono">shopkeeper_users</code>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchShopkeeperUsers()}
          disabled={isLoadingShopkeeperUsers}
          className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center space-x-1.5 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingShopkeeperUsers ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Sync Database</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Shopkeeper Access Form */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
            <div className="flex items-center space-x-2 pb-4 mb-5 border-b border-slate-800">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                Create Shopkeeper Access
              </h3>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateShopkeeper} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Full Name of User <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Role Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Access Role <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Shield className="w-4 h-4" />
                  </div>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as 'shopkeeper')}
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-medium"
                  >
                    <option value="shopkeeper">Shopkeeper (POS Billing Terminal Access)</option>
                  </select>
                </div>
              </div>

              {/* User ID / Username Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  User ID (Login Username) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
                    @
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. cashier1"
                    autoCapitalize="none"
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-500">The shopkeeper will use this User ID to log in.</p>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Set secret password..."
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-60 cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 stroke-[2.5]" />
                    <span>Create Shopkeeper Account</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Directory of Existing Shopkeepers */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Store className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                  Active Shopkeepers Directory
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {shopkeeperUsers.length} {shopkeeperUsers.length === 1 ? 'User' : 'Users'}
              </span>
            </div>

            {isLoadingShopkeeperUsers ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-xs">Loading shopkeeper directory...</span>
              </div>
            ) : shopkeeperUsers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-2">
                <Store className="w-10 h-10 stroke-1 text-slate-600 mb-1" />
                <p className="text-xs font-semibold text-slate-400">No shopkeeper accounts created yet.</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Fill out the form on the left to create credentials for your billing staff and cashiers.
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {shopkeeperUsers.map(user => (
                  <div
                    key={user.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 font-black text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-xs text-white">{user.name}</h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            @{user.username}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-600" />
                            Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                          {user.lastLogin && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3 text-slate-500" />
                              Last Login: {new Date(user.lastLogin).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                      {/* Reset Password Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setResetTargetUser(user);
                          setNewPassword('');
                          setResetError(null);
                          setResetSuccess(null);
                        }}
                        title="Reset Password for this shopkeeper"
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <KeyRound className="w-3 h-3 text-amber-400" />
                        <span>Reset Password</span>
                      </button>

                      {/* Active Status Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleShopkeeperUserStatus(user.id, !user.isActive)}
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                          user.isActive
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span>{user.isActive ? 'Active' : 'Disabled'}</span>
                      </button>

                      {/* Delete / Revoke Access */}
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={deletingId === user.id}
                        title="Revoke access"
                        className="p-1.5 rounded-xl border border-slate-800 hover:border-red-500/50 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setResetTargetUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <KeyRound className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Reset Shopkeeper Password</h3>
                <p className="text-xs text-slate-400">
                  Update login credentials for <span className="text-amber-300 font-bold">{resetTargetUser.name}</span> (<span className="font-mono text-indigo-300">@{resetTargetUser.username}</span>)
                </p>
              </div>
            </div>

            {resetError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="font-medium">{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  New Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 4 characters)..."
                    disabled={isResetting}
                    autoFocus
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  After saving, the shopkeeper must use this new password to log in to the POS billing terminal.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  disabled={isResetting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Save New Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
