'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { saveAuth } from '@/lib/auth';

export default function RoleLogin({role}:{role:'company'|'trucker'}) {
  const router=useRouter(); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  const company=role==='company'; const accent=company?'var(--color-primary)':'var(--color-secondary)';
  async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError('');try{const {data}=await api.post(`/auth/${role}/login`,{email,password});saveAuth(data);router.push('/dashboard')}catch(err:any){setError(err.response?.data?.detail||'Unable to sign in')}finally{setLoading(false)}}
  return <main className="min-h-screen grid lg:grid-cols-2">
    <section className="hidden lg:flex p-14 flex-col justify-between text-white" style={{background:company?'linear-gradient(145deg,#174f3a,#236b4d)':'linear-gradient(145deg,#203c57,#315f7e)'}}>
      <Link href="/login" className="text-xl font-bold">CargoSync</Link>
      <div><p className="text-xs tracking-[.25em] font-semibold opacity-70">{company?'SHIPPER OPERATIONS':'FLEET OPERATIONS'}</p><h1 className="text-5xl font-bold leading-tight mt-4">{company?'Move cargo with confidence.':'Keep every truck moving.'}</h1><p className="mt-5 text-lg opacity-75 max-w-lg">{company?'Find capacity, validate every load and follow the complete chain of custody.':'Publish your fleet, accept the right work and prove every handoff.'}</p></div>
      <p className="text-sm opacity-60">3D load planning · QR verification · delivery traceability</p>
    </section>
    <section className="flex items-center justify-center p-7" style={{background:'var(--color-bg)'}}><div className="w-full max-w-md">
      <Link href="/login" className="text-sm" style={{color:'var(--color-text-muted)'}}>← All portals</Link>
      <p className="mt-10 text-xs tracking-[.2em] font-bold" style={{color:accent}}>{role.toUpperCase()} LOGIN</p>
      <h2 className="text-3xl font-bold mt-2" style={{color:'var(--color-text)'}}>Welcome back</h2><p className="mt-2 mb-8" style={{color:'var(--color-text-secondary)'}}>Sign in to your {role} workspace.</p>
      {error&&<div className="p-3 rounded-xl mb-5 text-sm" style={{background:'#C25B5615',color:'var(--color-danger)'}}>{error}</div>}
      <form onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium">Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full px-4 py-3 rounded-xl" style={{background:'var(--color-card)',border:'1px solid var(--color-border)'}} placeholder="you@business.com"/></label><label className="block text-sm font-medium">Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full px-4 py-3 rounded-xl" style={{background:'var(--color-card)',border:'1px solid var(--color-border)'}} placeholder="••••••••"/></label><button disabled={loading} className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50" style={{background:accent}}>{loading?'Signing in…':`Sign in as ${company?'Company':'Trucker'}`}</button></form>
      <p className="mt-7 text-center text-sm" style={{color:'var(--color-text-secondary)'}}>New to CargoSync? <Link href={`/${role}/register`} className="font-semibold" style={{color:accent}}>Create {company?'a company':'a trucker'} account</Link></p>
    </div></section>
  </main>;
}
