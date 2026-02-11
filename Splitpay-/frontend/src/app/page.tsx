'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getExpenses,
  addExpense,
  getBalances,
  settleUp,
  getMyGroups,
  createGroup,
  addMemberToGroup
} from '@/services/api';
import styles from './page.module.css';

interface Expense {
  id: number;
  title: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
}

interface Balance {
  debtor: string;
  creditor: string;
  amount: number;
}

interface Group {
  id: number;
  name: string;
  members?: any[];
}

export default function Home() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newGroupName, setNewGroupName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [splitType, setSplitType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]); // For EQUAL
  const [customShares, setCustomShares] = useState<{ name: string; amount: string }[]>([]); // For CUSTOM

  const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);

  // Fetch Data Callback
  const fetchData = useCallback(async () => {
    if (!selectedGroupId) return;
    setLoading(true);
    try {
      const [expData, balData] = await Promise.all([
        getExpenses(selectedGroupId),
        getBalances()
      ]);
      setExpenses(expData);
      setBalances(balData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId]);

  const loadGroups = useCallback(async () => {
    try {
      const myGroups = await getMyGroups();
      setGroups(myGroups);
      if (myGroups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(myGroups[0].id);
      }
    } catch (e) {
      console.error("Failed to load groups", e);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    loadGroups();
  }, [router, loadGroups]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchData();
      // Reset selected members when group changes
      setSelectedMembers([]);
      setCustomShares([]);
    }
  }, [selectedGroupId, fetchData]);

  // Handlers
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const group = await createGroup(newGroupName);
      setNewGroupName('');
      await loadGroups();
      setSelectedGroupId(group.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !selectedGroupId) return;
    try {
      await addMemberToGroup(selectedGroupId, newMemberEmail);
      setNewMemberEmail('');
      await loadGroups(); // Refresh member lists
      alert('Member added successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMemberToggle = (memberName: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberName)
        ? prev.filter(m => m !== memberName)
        : [...prev, memberName]
    );
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount || !user || !selectedGroupId) return;

    let payload: any = {
      title: expenseTitle,
      amount: parseFloat(expenseAmount),
      paidBy: user.name, // Account holder is the creator/payer
    };

    if (splitType === 'EQUAL') {
      if (selectedMembers.length === 0) {
        alert("Please select at least one member to split with.");
        return;
      }
      payload.splitBetween = selectedMembers;
    } else {
      payload.shares = customShares.filter(s => s.name && s.amount);
      if (payload.shares.length === 0) {
        alert("Please add at least one share.");
        return;
      }
    }

    try {
      await addExpense(payload, selectedGroupId);
      setExpenseTitle('');
      setExpenseAmount('');
      setSelectedMembers([]);
      setCustomShares([]);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSettleUp = async () => {
    if (confirm('Are you sure you want to settle all debts globally?')) {
      try {
        await settleUp();
        alert('All debts settled!');
        fetchData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const addCustomShareRow = () => {
    setCustomShares([...customShares, { name: '', amount: '' }]);
  };

  if (!user) return null;

  return (
    <main className={styles.main}>
      {/* 1. Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.logo}>SplitPay+</h1>
          <p className={styles.tagline}>Intelligent Expense Settlement Engine</p>
        </div>

        <div className={styles.headerControls}>
          <div className={styles.userInfo}>
            <span>Welcome, <strong>{user.name || user.email}</strong></span>
            <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Sidebar: Group Management */}
        <aside className={styles.sidebar}>
          <section className={styles.sidebarSection}>
            <h3>My Groups</h3>
            <div className={styles.groupList}>
              {groups.map(g => (
                <button
                  key={g.id}
                  className={`${styles.groupItem} ${selectedGroupId === g.id ? styles.activeGroup : ''}`}
                  onClick={() => setSelectedGroupId(g.id)}
                >
                  {g.name}
                </button>
              ))}
              {groups.length === 0 && <p className={styles.emptyText}>No groups yet.</p>}
            </div>
          </section>

          <section className={styles.sidebarSection}>
            <h3>Create Group</h3>
            <form onSubmit={handleCreateGroup} className={styles.miniForm}>
              <input
                type="text"
                placeholder="Group Name"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                required
              />
              <button type="submit" className={styles.secondaryBtn}>Create</button>
            </form>
          </section>

          {selectedGroup && (
            <section className={styles.sidebarSection}>
              <h3>Add Member to {selectedGroup.name}</h3>
              <form onSubmit={handleAddMember} className={styles.miniForm}>
                <input
                  type="email"
                  placeholder="User Email"
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  required
                />
                <button type="submit" className={styles.secondaryBtn}>Add</button>
              </form>
              <div className={styles.memberList}>
                <h4>Members:</h4>
                {selectedGroup.members?.map((m: any) => (
                  <div key={m.userId} className={styles.memberName}>
                    • {m.user?.name || m.user?.email}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* Main Content Area */}
        <div className={styles.content}>
          <div className={styles.topGrid}>
            {/* 2. Add Expense Section */}
            <section className={styles.card}>
              <h2>Add New Expense</h2>
              <form onSubmit={handleAddExpense} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Title</label>
                    <input
                      type="text"
                      value={expenseTitle}
                      onChange={e => setExpenseTitle(e.target.value)}
                      placeholder="Lunch, Grocery..."
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Amount (₹)</label>
                    <input
                      type="number"
                      value={expenseAmount}
                      onChange={e => setExpenseAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Payer (You)</label>
                  <input
                    type="text"
                    value={user.name || user.email}
                    disabled
                    className={styles.disabledInput}
                  />
                  <p className={styles.hintText}>You are the account holder and primary payer.</p>
                </div>

                <div className={styles.splitToggle}>
                  <button
                    type="button"
                    className={splitType === 'EQUAL' ? styles.activeToggle : ''}
                    onClick={() => setSplitType('EQUAL')}
                  >
                    Equal Split
                  </button>
                  <button
                    type="button"
                    className={splitType === 'CUSTOM' ? styles.activeToggle : ''}
                    onClick={() => setSplitType('CUSTOM')}
                  >
                    Custom Amounts
                  </button>
                </div>

                {splitType === 'EQUAL' ? (
                  <div className={styles.formGroup}>
                    <label>Include in Split</label>
                    <div className={styles.checkboxGrid}>
                      {selectedGroup?.members?.map((m: any) => {
                        const mName = m.user?.name || m.user?.email || `User ${m.userId}`;
                        return (
                          <label key={m.userId} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(mName)}
                              onChange={() => handleMemberToggle(mName)}
                            />
                            <span>{mName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className={styles.customSharesArea}>
                    <label>Custom Shares</label>
                    {customShares.map((share, idx) => (
                      <div key={idx} className={styles.shareRow}>
                        <select
                          value={share.name}
                          onChange={e => {
                            const newShares = [...customShares];
                            newShares[idx].name = e.target.value;
                            setCustomShares(newShares);
                          }}
                          className={styles.selectInput}
                        >
                          <option value="">Select Member</option>
                          {selectedGroup?.members?.map((m: any) => {
                            const mName = m.user?.name || m.user?.email || `User ${m.userId}`;
                            return <option key={m.userId} value={mName}>{mName}</option>;
                          })}
                        </select>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={share.amount}
                          onChange={e => {
                            const newShares = [...customShares];
                            newShares[idx].amount = e.target.value;
                            setCustomShares(newShares);
                          }}
                        />
                      </div>
                    ))}
                    <button type="button" onClick={addCustomShareRow} className={styles.linkBtn}>+ Add Person</button>
                  </div>
                )}

                <button type="submit" className={styles.primaryBtn}>Record Expense</button>
              </form>
            </section>

            {/* 3. Balance Summary & Settlement */}
            <section className={styles.card}>
              <div className={styles.sectionHeader}>
                <h2>Global Settlement Suggestions</h2>
                <button onClick={handleSettleUp} className={styles.settleBtn}>Settle All</button>
              </div>
              <p className={styles.helperText}>Optimized paths to clear all debts across groups.</p>
              <div className={styles.balanceList}>
                {balances.length > 0 ? (
                  balances.map((bal, idx) => (
                    <div key={idx} className={styles.balanceItem}>
                      <span className={styles.debtor}>{bal.debtor}</span>
                      <span className={styles.arrow}>→</span>
                      <span className={styles.creditor}>{bal.creditor}</span>
                      <span className={styles.amount}>₹{bal.amount.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyState}>Fantastic! Everyone is squared up.</p>
                )}
              </div>
            </section>
          </div>

          {/* 4. Expense List Section */}
          <section className={styles.card}>
            <h2>Recent Activity: {selectedGroup?.name || 'Select a Group'}</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Total</th>
                    <th>Paid By</th>
                    <th>Split Details</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className={styles.bold}>{exp.title}</td>
                      <td className={styles.amountText}>₹{exp.amount.toFixed(2)}</td>
                      <td>{exp.paidBy}</td>
                      <td className={styles.dimText}>{exp.splitBetween.join(', ')}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className={styles.emptyState}>No history in this group.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
