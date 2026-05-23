"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ChevronLeft, ChevronRight, Zap, Shield, Globe, PlayCircle,
  CheckCircle, DollarSign, Check, X
} from "lucide-react";

const card = "rounded-2xl p-6 bg-zinc-900/40 border border-white/20 hover:border-white/30 hover:bg-zinc-900/60 transition-all shadow-xl";

const slides = [
  {
    id: "title",
    content: (
      <div className="relative flex items-center h-full px-6 lg:px-12 overflow-hidden bg-black">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-kast-teal/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl grid lg:grid-cols-2 gap-16 items-center w-full mx-auto">
          <div className="flex flex-col gap-6 z-10">
            <span
              className="text-kast-teal text-lg font-semibold tracking-widest uppercase"
            >
              Introducing
            </span>
            <h1
              className="text-[36px] md:text-[52px] font-medium tracking-tight leading-[1.2] text-white"
            >
              A Real Time{" "}
              <span className="text-kast-teal">Private</span> Payroll.
            </h1>
            <p
              className="text-2xl md:text-3xl text-gray-400 max-w-2xl leading-relaxed"
            >
              Instant payment and confidential settlement.
            </p>
          </div>
          <div
            className="flex items-center justify-center"
          >
            <div className="relative w-[320px] h-auto overflow-hidden bg-black z-20 shadow-[0_0_100px_-20px_rgba(30,186,152,0.25)] rounded-[2.5rem]">
              <Image
                src="/phone-screenshot-v2.png"
                alt="Expaynse App"
                width={632}
                height={1048}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "hook",
    content: (
      <div className="relative flex flex-col items-center justify-center h-full text-center max-w-5xl mx-auto px-6 overflow-hidden">
        {/* Removed the noisy radial gradient so it stays pure dark like the screenshot */}
        <p
          className="relative z-10 mb-8 text-kast-teal text-base md:text-[22px] font-semibold tracking-[0.35em] uppercase"
        >
          Because
        </p>
        <h1
          className="relative z-10 text-[42px] md:text-[68px] lg:text-[78px] font-medium tracking-tight text-white mb-8 leading-[1.1] max-w-5xl text-balance"
        >
          Salaries were never meant to be <span className="text-kast-teal">public on chain</span>.
        </h1>
        <p
          className="relative z-10 text-[18px] md:text-[28px] text-gray-400 leading-[1.4] max-w-3xl text-balance"
        >
          Payroll should be private — whether paid monthly or streamed every second.
        </p>
      </div>
    ),
  },
  {
    id: "problems",
    content: (
      <div className="flex flex-col h-full justify-center max-w-6xl mx-auto px-6 w-full">
        <div className="text-center mb-12">
          <p className="text-kast-teal text-sm font-semibold tracking-wide uppercase mb-4">The Challenge</p>
          <h2 className="text-[40px] md:text-[52px] font-medium text-white tracking-tight">Problems</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {[
            { tag: "SPEED", stat: "78%", desc: "of U.S. workers would face financial difficulty if a paycheck were delayed by one week.", source: "PayrollOrg" },
            { tag: "PRIVACY", stat: "80%", desc: "of 755 employees preferred to hide salary information from coworkers.", source: "UCLA / Harvard Business School" },
            { tag: "ADOPTION", stat: "Adoption blocker", desc: "Companies want faster payroll on-chain, but public balance, salary, and burn-rate visibility makes it nearly impossible to adopt." },
          ].map((c, i) => (
            <div key={i} className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col relative">
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-4">{c.tag}</p>
              <p className="text-[36px] font-bold tracking-tight text-kast-teal mb-4 whitespace-nowrap">{c.stat}</p>
              <p className="text-[18px] font-bold text-white/95 leading-[1.6] flex-grow">{c.desc}</p>
              {c.source && (
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-8">
                  SOURCE: {c.source}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-7 px-8 w-full shadow-xl">
          <p className="text-[22px] font-bold text-white flex justify-between items-center">
            <span>Solving these problems unlocks a <span className="text-kast-teal">$13 Trillion</span> payroll market.</span>
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">SOURCE: FRED / BEA</span>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "solution",
    content: (
      <div className="flex flex-col h-full justify-center max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-14">
          <p className="text-[12px] font-bold text-kast-teal tracking-[0.3em] uppercase mb-5">The Solution</p>
          <h2 className="text-[36px] md:text-[44px] font-medium text-white tracking-tight">Private Payroll with Two Payout Modes</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {[
            {
              tag: "MODE 1 · INSTANT",
              title: "Instant private payouts",
              bullets: ["Private payroll.", "Instant settlement.", "No public salaries."]
            },
            {
              tag: "MODE 2 · REAL-TIME",
              title: "Per-second streaming",
              bullets: ["Live salary accrual.", "Access pay anytime.", "Private by default."]
            },
            {
              tag: "COMPLIANCE",
              title: "Enterprise controls",
              bullets: ["Hidden compensation.", "Protected team data.", "Clean reporting."]
            }
          ].map((c, i) => (
            <div key={i} className="bg-zinc-900/40 border border-white/20 rounded-2xl p-8 shadow-xl flex flex-col justify-start min-h-[220px]">
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-6">{c.tag}</p>
              <p className="text-[28px] xl:text-[32px] font-bold tracking-tight text-kast-teal mb-8 whitespace-nowrap">{c.title}</p>
              <div className="flex flex-col gap-4">
                {c.bullets.map((bullet, idx) => (
                  <p key={idx} className="text-[18px] lg:text-[20px] font-bold text-white/95">{bullet}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "architecture",
    content: (
      <div className="flex h-full w-full items-center justify-center px-5 pt-20 pb-24 md:px-6">
        <div className="flex h-full w-full flex-col justify-center gap-4 md:hidden">
          <div className="text-center">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.32em] text-kast-teal">Architecture</p>
            <h2 className="text-[30px] font-semibold leading-tight text-white">How Expaynse Works</h2>
            <p className="mx-auto mt-3 max-w-[340px] text-[13px] font-semibold leading-relaxed text-gray-400">
              Solana anchors payroll records. MagicBlock runs confidential transfers and real-time payroll.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-gray-500">Mode 1</p>
                  <h3 className="mt-1 text-[22px] font-extrabold text-white">Private Payout</h3>
                </div>
                <span className="rounded-full border border-kast-teal/30 bg-kast-teal/10 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.2em] text-kast-teal">
                  Private API
                </span>
              </div>
              <p className="mb-4 text-[13px] font-semibold leading-relaxed text-gray-400">
                One-off or batch payroll without public salary exposure.
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {["Fund private treasury", "Send privately", "Employee private wallet"].map((step, idx) => (
                  <div key={step} className="rounded-xl border border-white/10 bg-black px-2 py-3">
                    <p className="mb-1 text-[10px] font-extrabold tracking-[0.2em] text-kast-teal">0{idx + 1}</p>
                    <p className="text-[10px] font-extrabold leading-tight text-white">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-gray-500">Mode 2</p>
                  <h3 className="mt-1 text-[22px] font-extrabold text-white">Real-time Streaming</h3>
                </div>
                <span className="rounded-full border border-kast-teal/30 bg-kast-teal/10 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.2em] text-kast-teal">
                  PER
                </span>
              </div>
              <p className="mb-4 text-[13px] font-semibold leading-relaxed text-gray-400">
                Salary accrues every second inside a selected date range.
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {["Set date range", "Accrue per sec", "Claim privately"].map((step, idx) => (
                  <div key={step} className="rounded-xl border border-white/10 bg-black px-2 py-3">
                    <p className="mb-1 text-[10px] font-extrabold tracking-[0.2em] text-kast-teal">0{idx + 1}</p>
                    <p className="text-[10px] font-extrabold leading-tight text-white">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative hidden aspect-video w-full max-w-[1540px] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.55)] md:block"
        >
          <Image
            src="/pitch-architecture-expaynse.svg?v=8"
            alt="Expaynse architecture overview showing private payout and real-time private streaming modes"
            fill
            priority
            unoptimized
            className="object-contain"
          />
        </div>
      </div>
    ),
  },
  {
    id: "market-opportunity",
    content: (
      <div className="flex flex-col h-full justify-center max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-14">
          <p className="text-[12px] font-bold text-kast-teal tracking-[0.3em] uppercase mb-5">The Opportunity</p>
          <h2 className="text-[44px] md:text-[50px] font-medium text-white tracking-tight">Market Opportunity</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {[
            { tag: "ADOPTION", stat: "25%", desc: "of businesses globally now use crypto payroll." },
            { tag: "RAIL", stat: "90%+", desc: "of crypto payroll is paid in USDC/USDT." },
            { tag: "VOLUME", stat: "$226B", desc: "B2B stablecoin payment volume in 2025." },
          ].map((c, i) => (
            <div key={i} className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col relative min-h-[220px]">
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-5">{c.tag}</p>
              <p className="text-[44px] md:text-[50px] font-bold tracking-tight text-kast-teal mb-5">{c.stat}</p>
              <p className="text-[18px] font-bold text-white/95 leading-[1.6] flex-grow">{c.desc}</p>
            </div>
          ))}
        </div>
        
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest text-center mt-4">
          SOURCES: RISEWORKS 2025 / BINANCE RESEARCH / ALPHAPOINT / MCKINSEY / JUNIPER RESEARCH
        </p>
      </div>
    ),
  },
  {
    id: "target-markets",
    content: (
      <div className="flex flex-col h-full justify-center max-w-6xl mx-auto px-6 w-full">
        <div className="text-center mb-14">
          <p className="text-[12px] font-bold text-kast-teal tracking-[0.3em] uppercase mb-5">WHO IT IS FOR</p>
          <h2 className="text-[44px] md:text-[50px] font-medium text-white tracking-tight">Target Markets</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: DollarSign, text: "Companies paying teams in StableCoins" },
            { icon: Globe, text: "DAOs paying contributors globally" },
            { icon: Zap, text: "Crypto-native teams with remote workforces" },
            { icon: Shield, text: "Companies wanting on-chain payroll with compensation privacy" },
          ].map((item, idx) => (
            <div key={idx} className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-10 shadow-xl flex items-center gap-8 min-h-[160px]">
              <div className="p-5 bg-kast-teal/10 rounded-2xl shrink-0">
                <item.icon className="w-9 h-9 text-kast-teal" />
              </div>
              <p className="text-[18px] md:text-[20px] font-bold text-white/95 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "competitive",
    content: (
      <div className="flex flex-col h-full justify-center max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-14">
          <p className="text-[12px] font-bold text-kast-teal tracking-[0.3em] uppercase mb-5">How we compare</p>
          <h2 className="text-[44px] md:text-[50px] font-medium text-white tracking-tight">Competitive Landscape</h2>
        </div>
        
        <div className="w-full rounded-2xl bg-[#0c0c0c] border border-white/10 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-6 text-left border-b border-white/10 bg-[#0c0c0c] text-[12px] md:text-[13px] font-extrabold text-gray-200 uppercase tracking-widest divide-x divide-white/10 whitespace-nowrap">
            <div className="py-7 px-4 md:px-6 flex items-center">Company</div>
            <div className="py-7 px-4 md:px-6 flex items-center justify-center">Payroll Support</div>
            <div className="py-7 px-4 md:px-6 flex items-center justify-center">Real-Time Pay</div>
            <div className="py-7 px-4 md:px-6 flex items-center justify-center">On-Chain Native</div>
            <div className="py-7 px-4 md:px-6 flex items-center justify-center">Salary Privacy</div>
            <div className="py-7 px-4 md:px-6 flex items-center">Best Fit</div>
          </div>
          
          <div className="divide-y divide-white/10 bg-[#0c0c0c]">
            {[
              { company: "Zebec", payroll: true, realtime: true, native: true, privacy: false, fit: "Crypto payroll streaming", hl: false },
              { company: "Superfluid", payroll: false, realtime: true, native: true, privacy: false, fit: "General token streaming", hl: false },
              { company: "Gusto", payroll: true, realtime: false, native: false, privacy: false, fit: "Traditional payroll compliance", hl: false },
              { company: "Expaynse", payroll: true, realtime: true, native: true, privacy: true, fit: "Private real-time payroll", hl: true },
            ].map((row, idx) => (
              <div key={idx} className={`grid grid-cols-6 items-stretch text-[15px] divide-x divide-white/10 transition-colors ${row.hl ? "bg-kast-teal/[0.03]" : ""}`}>
                <div className={`py-7 px-4 md:px-6 flex items-center font-bold ${row.hl ? "text-kast-teal text-[24px]" : "text-white text-[18px]"}`}>{row.company}</div>
                
                <div className="py-7 px-4 md:px-6 flex items-center justify-center">
                  <span className={`px-5 py-1.5 rounded-full text-[14px] font-bold ${row.payroll ? "bg-kast-teal/10 text-kast-teal border border-kast-teal/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"}`}>
                    {row.payroll ? "Yes" : "No"}
                  </span>
                </div>
                
                <div className="py-7 px-4 md:px-6 flex items-center justify-center">
                  <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${row.realtime ? "border-kast-teal/30 text-kast-teal bg-kast-teal/5" : "border-red-500/30 text-red-500 bg-red-500/5"}`}>
                    {row.realtime ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </div>
                </div>
                
                <div className="py-7 px-4 md:px-6 flex items-center justify-center">
                  <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${row.native ? "border-kast-teal/30 text-kast-teal bg-kast-teal/5" : "border-red-500/30 text-red-500 bg-red-500/5"}`}>
                    {row.native ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </div>
                </div>
                
                <div className="py-7 px-4 md:px-6 flex items-center justify-center">
                  <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${row.privacy ? "border-kast-teal/30 text-kast-teal bg-kast-teal/5" : "border-red-500/30 text-red-500 bg-red-500/5"}`}>
                    {row.privacy ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </div>
                </div>
                
                <div className="py-7 px-4 md:px-6 flex items-center text-white/70 font-semibold leading-[1.4] pr-4">{row.fit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "business-model",
    content: (
      <div className="flex flex-col h-full justify-center max-w-5xl mx-auto px-6 w-full">
        <div className="text-center mb-14">
          <p className="text-kast-teal text-sm font-semibold tracking-wide uppercase mb-4">Revenue Streams</p>
          <h2 className="text-[40px] md:text-[52px] font-medium text-white tracking-tight">Business Model</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className={`${card} p-10 flex flex-col items-center text-center`}>
            <p className="text-base text-kast-teal mb-5 font-bold uppercase tracking-[0.15em]">Recurring Revenue</p>
            <div className="text-6xl font-bold text-white mb-2 flex items-baseline justify-center">
              $99<span className="text-4xl text-gray-300 ml-3">– $499</span>
            </div>
            <p className="text-kast-teal font-mono text-base mb-10">/ month</p>
            <ul className="space-y-5 text-lg text-white font-semibold text-left w-full max-w-[280px]">
              <li className="flex items-center gap-4"><CheckCircle className="w-6 h-6 text-kast-teal shrink-0" /> Dashboard Access</li>
              <li className="flex items-center gap-4"><CheckCircle className="w-6 h-6 text-kast-teal shrink-0" /> Private Payroll Vaults</li>
              <li className="flex items-center gap-4"><CheckCircle className="w-6 h-6 text-kast-teal shrink-0" /> Advanced Reporting</li>
            </ul>
          </div>
          <div className={`${card} p-10 flex flex-col items-center text-center`}>
            <p className="text-base text-kast-teal mb-5 font-bold uppercase tracking-[0.15em]">Active Worker Fee</p>
            <div className="text-6xl font-bold text-kast-teal mb-2 flex items-baseline justify-center">
              $3<span className="text-4xl text-kast-teal/90 ml-3">– $8</span>
            </div>
            <p className="text-gray-300 font-mono text-base mb-10">one-time / worker</p>
            <ul className="space-y-5 text-lg text-white font-semibold text-left w-full max-w-[280px]">
              <li className="flex items-center gap-4"><CheckCircle className="w-6 h-6 text-kast-teal shrink-0" /> Private Balance Accounts</li>
              <li className="flex items-center gap-4"><CheckCircle className="w-6 h-6 text-kast-teal shrink-0" /> Claim Gas Subsidization</li>
              <li className="flex items-center gap-4"><CheckCircle className="w-6 h-6 text-kast-teal shrink-0" /> Payment History Verification</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "why-solana",
    content: (
      <div className="flex flex-col h-full justify-center max-w-6xl mx-auto px-6 w-full">
        <div className="text-center mb-16">
          <p className="text-[12px] font-bold text-kast-teal tracking-[0.3em] uppercase mb-5">Infrastructure</p>
          <h2 className="text-[44px] md:text-[50px] font-medium text-white tracking-tight">
            Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14F195] to-[#9945FF]">Solana</span>
          </h2>
          <p className="text-[18px] text-gray-300 max-w-2xl mx-auto mt-6 font-semibold">Solana already has the stablecoin payment activity needed for payroll.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { value: "$1T+", label: "Stablecoin volume 2025" },
            { value: "$200B", label: "Monthly transfers" },
            { value: "$15.4B", label: "Stablecoin market cap" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#0c0c0c] border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-12 min-h-[200px] shadow-xl">
              <p className="text-[54px] font-bold text-kast-teal mb-4 leading-none tracking-tight">{stat.value}</p>
              <p className="text-[13px] font-bold text-gray-400 uppercase tracking-[0.15em]">{stat.label}</p>
            </div>
          ))}
        </div>
        
        <div className="rounded-full py-4 px-10 text-center mx-auto inline-block bg-[#0c0c0c] border border-white/10 shadow-xl">
          <p className="text-[15px] text-gray-400 font-medium">
            Trusted by <span className="text-white font-bold">PayPal</span>, <span className="text-white font-bold">Visa</span>, <span className="text-white font-bold">Western Union</span>, <span className="text-white font-bold">Worldpay</span>, and <span className="text-white font-bold">Fiserv</span>.
          </p>
        </div>
        
        <p className="text-[11px] text-gray-500 text-center mt-6 tracking-wide">Sources: CoinMarketCap, DLNews, CryptoRank, BLS QCEW 2024</p>
      </div>
    ),
  },
  {
    id: "team",
    content: (
      <div className="flex flex-col h-full justify-center max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-20">
          <p className="text-[12px] font-bold text-kast-teal tracking-[0.3em] uppercase mb-6">The team behind Expaynse</p>
          <h2 className="text-[44px] md:text-[50px] font-medium text-white tracking-tight">Team</h2>
          <p className="text-[18px] text-gray-300 mt-6 max-w-2xl mx-auto font-semibold leading-relaxed">Founder-led execution with the right mix: payments, product, operations, and marketing.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              name: "Shuman",
              role: "Founder & CTO",
              desc: "Superteam Nepal Solana Minihack 2026 winner, 2nd at MagicBlock Privacy Blitz V3, and Superteam Nepal member.",
              image: "/shuman.jpg",
              imgClass: "object-[50%_62%] scale-[1.15]",
            },
            { 
              name: "Isha", 
              role: "Marketing Lead", 
              desc: "Growth marketer at Expaynse Protocol, building awareness, traction, and community.",
              image: "/isha.jpg", 
            },
            { 
              name: "Ananda", 
              role: "Business Ops", 
              desc: "3 years consulting at Anovox Labs, with strong business ops experience and startup scaling work.",
              image: "/ananda.jpg",
            },
            { 
              name: "Mohit", 
              role: "Full Stack Dev", 
              desc: "2 years of full-stack experience, with shipped fintech products and high-scale commerce systems.",
              image: "/mohit.jpg",
            },
          ].map((member, idx) => (
            <div key={idx} className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col text-left group shadow-xl">
              <div className="w-20 h-20 rounded-full mb-8 border border-white/10 overflow-hidden flex items-center justify-center bg-kast-teal/10 group-hover:border-kast-teal/40 transition-colors duration-500 shrink-0 relative">
                <span className="text-[24px] font-bold text-white/80">{member.name[0]}</span>
                {member.image && (
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className={`w-full h-full object-cover absolute inset-0 z-10 transition-transform duration-300 ${member.imgClass || ""}`} 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                  />
                )}
              </div>
              <h3 className="text-[20px] md:text-[22px] font-bold text-white mb-1 group-hover:text-kast-teal transition-colors text-left w-full">{member.name}</h3>
              <p className="text-[11px] text-kast-teal font-bold tracking-[0.1em] uppercase mb-6 text-left w-full">{member.role}</p>
              <p className="text-[14px] md:text-[15px] text-gray-300 leading-[1.6] font-semibold text-left w-full">{member.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "find-us-on",
    content: (
      <div className="flex flex-col h-full justify-between max-w-5xl mx-auto px-6 py-24 w-full text-center relative z-10">
        <div /> {/* Spacer to balance flex layout */}
        
        <div className="-mt-12">
          <p className="text-[12px] font-bold text-kast-teal tracking-[0.3em] uppercase mb-16">Find us on</p>
          <h2 className="text-[54px] md:text-[68px] font-bold text-white tracking-tight mb-8">expaynse.xyz</h2>
          <p className="text-[18px] md:text-[22px] text-gray-400 font-medium">Follow our journey and stay close to the build.</p>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-6 text-[15px] md:text-[17px] font-medium tracking-wide">
          <a href="https://expaynse.xyz" target="_blank" rel="noopener noreferrer" className="text-white hover:text-kast-teal transition-colors">
            https://expaynse.xyz
          </a>
          <span className="text-white/20">/</span>
          <a href="https://x.com/expaynse" target="_blank" rel="noopener noreferrer" className="text-kast-teal hover:text-kast-teal/80 transition-colors">
            https://x.com/expaynse
          </a>
        </div>
      </div>
    ),
  },
  {
    id: "watch-demo",
    content: (
      <div className="flex h-full w-full items-center justify-center px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 text-center">
          <div className="space-y-6">
            <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-kast-teal">Last Step</p>
            <h2 className="text-[50px] md:text-[72px] font-bold tracking-tight text-white">Watch the Demo</h2>
            <p className="mx-auto max-w-3xl text-[18px] md:text-[24px] font-medium leading-relaxed text-gray-400">
              See how Expaynse handles private transfers and real-time private payroll end to end.
            </p>
          </div>

          <a
            href="https://www.youtube.com/watch?v=EFAKB6muRYg"
            target="_blank"
            rel="noopener noreferrer"
            className="group w-full max-w-3xl rounded-[32px] border border-kast-teal/30 bg-gradient-to-br from-kast-teal/10 via-zinc-950 to-zinc-950 px-8 py-12 shadow-[0_0_80px_rgba(30,186,152,0.08)] transition-all hover:border-kast-teal/60 hover:bg-kast-teal/10"
          >
            <div className="flex flex-col items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-kast-teal/40 bg-kast-teal/10 text-kast-teal">
                <PlayCircle className="h-9 w-9" />
              </div>
              <div className="space-y-3">
                <p className="text-[28px] md:text-[36px] font-bold tracking-tight text-white group-hover:text-kast-teal transition-colors">
                  Open YouTube Demo
                </p>
                <p className="text-[15px] md:text-[18px] font-medium text-gray-400">
                  https://www.youtube.com/watch?v=EFAKB6muRYg
                </p>
              </div>
            </div>
          </a>
        </div>
      </div>
    ),
  },
];

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((p) => (p === slides.length - 1 ? p : p + 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((p) => (p === 0 ? p : p - 1));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") nextSlide();
      else if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nextSlide, prevSlide]);

  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col z-[100] selection:bg-kast-teal/30 selection:text-black">
      {/* Radial blur glows */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-kast-teal/[0.08] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-kast-teal/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="absolute top-0 left-0 w-full h-[2px] z-50 bg-white/5">
        <div className="h-full bg-kast-teal" style={{ width: `${progress}%` }} />
      </div>

      <div className="absolute top-0 left-0 w-full z-50 px-6 lg:px-12 py-5 flex items-center gap-3">
        <div className="relative w-8 h-8">
          <Image src="/logo.png" alt="Expaynse Logo" fill className="object-contain invert mix-blend-screen" />
        </div>
        <span className="text-white text-lg font-semibold tracking-tight">Expaynse</span>
      </div>

      <div className="relative flex-1 z-10 w-full h-full">
        
          <div 
            key={currentSlide} 
            className="absolute inset-0 w-full h-full"
          >
            {slides[currentSlide].content}
          </div>
        
      </div>

      <div className="absolute bottom-0 left-0 w-full p-6 z-50 flex justify-between items-center bg-gradient-to-t from-black via-black/80 to-transparent">
        <span className="text-xs font-mono text-gray-500"><span className="text-white font-semibold">{currentSlide + 1}</span> / {slides.length}</span>
        <div className="flex gap-3">
          <button onClick={prevSlide} disabled={currentSlide === 0} className="p-2.5 rounded-full bg-zinc-900/40 border border-white/10 hover:border-kast-teal/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={nextSlide} disabled={currentSlide === slides.length - 1} className="p-2.5 rounded-full bg-kast-teal text-black hover:scale-105 disabled:opacity-20 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
}
