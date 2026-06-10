import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { CreditCard, Printer, DollarSign, X, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

export const FeeConsole: React.FC = () => {
  const queryClient = useQueryClient();

  const [showPayModal, setShowPayModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<any | null>(null);

  // Stripe Mock Card Form States
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('422');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const payInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase
        .from('fees')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees-invoices-list'] });
      confetti({
        particleCount: 100,
        spread: 70
      });
      setShowPayModal(false);
      setPayingInvoice(null);
      setPaymentProcessing(false);
    },
    onError: (err) => {
      alert(`Payment failed: ${err.message}`);
      setPaymentProcessing(false);
    }
  });

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    setPaymentProcessing(true);
    setTimeout(() => {
      payInvoiceMutation.mutate(payingInvoice.id);
    }, 1800);
  };

  // Query all invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['fees-invoices-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('fees')
        .select('*, students(*, profiles(*))')
        .order('due_date', { ascending: false });
      return data || [];
    }
  });

  const totals = invoices?.reduce(
    (acc: any, inv: any) => {
      const amt = Number(inv.amount);
      if (inv.status === 'paid') acc.collected += amt;
      else if (inv.status === 'pending') acc.pending += amt;
      else if (inv.status === 'overdue') acc.overdue += amt;
      return acc;
    },
    { collected: 0, pending: 0, overdue: 0 }
  ) || { collected: 0, pending: 0, overdue: 0 };

  const statCards = [
    { label: 'Revenue Collected', value: `$${totals.collected.toLocaleString()}`, color: 'text-cyber-success', bg: 'bg-cyber-success/10' },
    { label: 'Pending Invoices', value: `$${totals.pending.toLocaleString()}`, color: 'text-cyber-warning', bg: 'bg-cyber-warning/10' },
    { label: 'Overdue Balances', value: `$${totals.overdue.toLocaleString()}`, color: 'text-cyber-danger', bg: 'bg-cyber-danger/10' }
  ];

  // Print PDF Invoice Receipt (Formal Billing Format)
  const printReceipt = (invoice: any) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5' // A5 Size for Receipt Slip
    });

    // Dark-ish Cyber/Corporate Theme header block
    doc.setFillColor(10, 11, 19);
    doc.rect(0, 0, 148, 32, 'F');

    // School Banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NEXUS PORTAL', 15, 13);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(6, 182, 212);
    doc.text('ACADEMIC FEE RECEIPT', 15, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Invoice No: ${invoice.invoice_number}`, 100, 13);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 100, 18);

    // Bill To section
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('BILL TO STUDENT:', 15, 42);

    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(invoice.students?.profiles?.full_name || 'Student Name', 15, 47);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Student ID: ${invoice.students?.student_id || 'N/A'}`, 15, 52);
    doc.text(`Email: ${invoice.students?.profiles?.email || 'N/A'}`, 15, 56);

    // Items table header
    doc.setFillColor(240, 242, 245);
    doc.rect(15, 65, 118, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text('DESCRIPTION', 18, 70);
    doc.text('STATUS', 90, 70);
    doc.text('AMOUNT', 115, 70);

    // Item line
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(invoice.description, 18, 78);
    doc.text(invoice.status.toUpperCase(), 90, 78);
    doc.setFont('Helvetica', 'bold');
    doc.text(`$${Number(invoice.amount).toFixed(2)}`, 115, 78);

    // Lines separator
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 82, 133, 82);

    // Grand total
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('GRAND TOTAL PAID', 75, 90);
    doc.setFontSize(11);
    doc.setTextColor(139, 92, 246);
    doc.text(`$${Number(invoice.amount).toFixed(2)}`, 115, 90);

    // Payment watermark banner
    doc.setFillColor(240, 253, 250);
    doc.roundedRect(15, 98, 118, 12, 1, 1, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text('STATUS: FULLY PAID & SETTLED', 50, 106, { align: 'center' });

    // Footer signature
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('Thank you for your academic payment. Generated by Nexus System.', 74, 125, { align: 'center' });

    doc.save(`Receipt_${invoice.invoice_number}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="pb-2 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white tracking-tight">Finance Console</h1>
        <p className="text-gray-400 text-xs mt-0.5 font-sans">Audit fee records, collect balances, or print billing receipts</p>
      </div>

      {/* KPI Stats widgets grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="glass-card rounded-xl p-5 border border-white/5 shadow-md flex items-center justify-between group"
          >
            <div>
              <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider block">{card.label}</span>
              <span className={`text-2xl font-bold block mt-1 tracking-tight ${card.color}`}>
                {isLoading ? '...' : card.value}
              </span>
            </div>
            <div className={`p-3 rounded-lg ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-150`}>
              <DollarSign size={20} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Invoice Grid table */}
      <div className="glass-card rounded-xl border border-white/5 overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-white/5 bg-white/2">
          <span className="font-bold text-xs uppercase text-white tracking-wider flex items-center gap-1.5">
            <CreditCard size={16} className="text-cyber-primary" />
            <span>Invoice Ledger</span>
          </span>
        </div>

        {isLoading ? (
          <p className="text-xs text-gray-500 text-center py-10 animate-pulse">Syncing invoices...</p>
        ) : invoices && invoices.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-10">No invoicing logs registered in database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-400 border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-gray-500 bg-white/2">
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-400">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-white/2 transition-colors duration-100">
                    <td className="p-4 font-mono font-semibold text-cyber-secondary">{inv.invoice_number}</td>
                    <td className="p-4">
                      <span className="text-white font-medium block">{inv.students?.profiles?.full_name}</span>
                      <span className="text-[9px] text-gray-500 block mt-0.5">ID: {inv.students?.student_id}</span>
                    </td>
                    <td className="p-4 text-gray-300">{inv.description}</td>
                    <td className="p-4 font-semibold text-white">${Number(inv.amount).toFixed(2)}</td>
                    <td className="p-4">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'paid' 
                          ? 'bg-cyber-success/10 text-cyber-success' 
                          : inv.status === 'pending' 
                            ? 'bg-cyber-warning/10 text-cyber-warning' 
                            : 'bg-cyber-danger/10 text-cyber-danger'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        {inv.status === 'paid' ? (
                          <button
                            onClick={() => printReceipt(inv)}
                            className="p-2 rounded-lg border border-cyber-primary/20 text-cyber-secondary hover:bg-cyber-primary/10 text-xs transition active:scale-95 cursor-pointer"
                            title="Print payment receipt"
                          >
                            <Printer size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setPayingInvoice(inv);
                              setShowPayModal(true);
                            }}
                            className="p-2 rounded-lg border border-cyber-warning/20 text-cyber-warning hover:bg-cyber-warning/10 text-xs transition active:scale-95 cursor-pointer"
                            title="Pay Invoice online"
                          >
                            <CreditCard size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stripe Payment Checkout Simulator */}
      <AnimatePresence>
        {showPayModal && payingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#0c0d16] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative text-left animate-fade-in"
            >
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-white/5 bg-white/2">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-cyber-success animate-pulse" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">Stripe Secure Checkout</span>
                </div>
                <button 
                  onClick={() => {
                    if (!paymentProcessing) {
                      setShowPayModal(false);
                      setPayingInvoice(null);
                    }
                  }} 
                  disabled={paymentProcessing}
                  className="text-gray-400 hover:text-white disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleProcessPayment} className="p-5 space-y-4 text-xs">
                {/* Invoice Brief */}
                <div className="bg-white/2 p-3 rounded-lg border border-white/5 space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Billing Item</span>
                  <span className="font-semibold text-white block text-xs">{payingInvoice.description}</span>
                  <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-white/5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Amount Due</span>
                    <span className="text-sm font-extrabold text-cyber-secondary font-mono">${Number(payingInvoice.amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Card details */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        disabled={paymentProcessing}
                        className="w-full glass-input text-xs pl-8 font-mono"
                      />
                      <CreditCard size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">EXPIRATION</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        disabled={paymentProcessing}
                        className="w-full glass-input text-xs font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">CVC CODE</label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        disabled={paymentProcessing}
                        className="w-full glass-input text-xs font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* SSL info label */}
                <div className="text-[9px] text-gray-500 flex items-center justify-center gap-1">
                  <Lock size={10} className="text-cyber-success" />
                  <span>Your credentials are encrypted & secured via Stripe Sandbox protocols.</span>
                </div>

                <button
                  type="submit"
                  disabled={paymentProcessing}
                  className="w-full glass-button-primary flex items-center justify-center gap-2 text-xs py-2.5 mt-6 font-semibold"
                >
                  {paymentProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing transaction...</span>
                    </div>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Pay ${Number(payingInvoice.amount).toFixed(2)} USD</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
