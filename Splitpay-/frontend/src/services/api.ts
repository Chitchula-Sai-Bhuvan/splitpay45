
import axios from 'axios';

// Constants
const API_URL = 'http://localhost:5000/api';
// Fallback if no group selected
const DEFAULT_GROUP_ID = 1;

// Helper to get token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Axios Instance
const api = axios.create({
  baseURL: API_URL,
});

// Auth Error Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear session on auth error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Cache for users map (Name -> ID)
let usersCache: any[] = [];

const fetchUsers = async () => {
  if (usersCache.length > 0) return usersCache;
  try {
    const res = await api.get('/users', { headers: getAuthHeader() });
    usersCache = res.data;
    return usersCache;
  } catch (e) {
    console.error("Failed to fetch users", e);
    return [];
  }
};

const findUserByName = (name: string) => {
  return usersCache.find(u => u.name?.toLowerCase() === name.toLowerCase() || u.email.toLowerCase().includes(name.toLowerCase()));
};

const findUserById = (id: number) => {
  return usersCache.find(u => u.id === id);
};

// --- API Functions ---

export const login = async (email, password) => {
  try {
    const res = await api.post('/users/login', { email, password });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Login failed');
  }
};

export const register = async (email, name, password) => {
  try {
    const res = await api.post('/users/register', { email, name, password });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Registration failed');
  }
};

export const getMyGroups = async () => {
  try {
    const res = await api.get('/groups', { headers: getAuthHeader() });
    return res.data;
  } catch (error) {
    console.error("Failed to fetch groups", error);
    return [];
  }
};

export const createGroup = async (name: string) => {
  try {
    const res = await api.post('/groups', { name }, { headers: getAuthHeader() });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to create group');
  }
};

export const addMemberToGroup = async (groupId: number, email: string) => {
  try {
    const res = await api.post('/groups/add-member', { groupId, email }, { headers: getAuthHeader() });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to add member');
  }
};

export const getExpenses = async (groupId: number = DEFAULT_GROUP_ID) => {
  await fetchUsers(); // Ensure we have users to map names
  try {
    const res = await api.get(`/expenses?groupId=${groupId}`, { headers: getAuthHeader() });
    // Map API response to UI format
    return res.data.map((e: any) => ({
      id: e.id,
      title: e.description,
      amount: parseFloat(e.amount),
      paidBy: e.payer?.name || `User ${e.payerId}`,
      splitBetween: e.shares.map((s: any) => s.user?.name || `User ${s.userId}`)
    }));
  } catch (error) {
    console.error("Get Expenses error", error);
    return [];
  }
};

export const addExpense = async (expenseData: any, groupId: number = DEFAULT_GROUP_ID) => {
  await fetchUsers();

  // Resolve Payer
  const payer = findUserByName(expenseData.paidBy);
  if (!payer) throw new Error(`User '${expenseData.paidBy}' not found. Please use exact registered name.`);

  let shares = [];

  if (expenseData.shares && expenseData.shares.length > 0) {
    // Custom Shares provided from UI
    shares = expenseData.shares.map((s: any) => {
      const u = findUserByName(s.name);
      if (!u) throw new Error(`User '${s.name}' not found.`);
      return {
        userId: u.id,
        amount: parseFloat(s.amount)
      };
    });
  } else {
    // Resolve Split Users from comma list (Equal Split)
    const shareUsers: any[] = [];
    for (const name of expenseData.splitBetween) {
      const u = findUserByName(name.trim());
      if (!u) throw new Error(`User '${name.trim()}' not found.`);
      shareUsers.push(u);
    }

    const splitPixels = shareUsers.length;
    if (splitPixels === 0) throw new Error("No users to split with");

    const shareAmount = expenseData.amount / splitPixels;

    shares = shareUsers.map(u => ({
      userId: u.id,
      amount: shareAmount
    }));
  }

  try {
    const payload = {
      groupId: groupId,
      payerId: payer.id,
      amount: expenseData.amount,
      description: expenseData.title,
      shares: shares
    };

    const res = await api.post('/expenses', payload, { headers: getAuthHeader() });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to add expense');
  }
};

export const getBalances = async () => {
  await fetchUsers();
  try {
    // Use the global simplification endpoint (cross-group)
    const res = await api.get('/settlements/simplify', { headers: getAuthHeader() });

    return res.data.map((s: any) => ({
      debtor: findUserById(s.payerId)?.name || `User ${s.payerId}`,
      creditor: findUserById(s.payeeId)?.name || `User ${s.payeeId}`,
      amount: parseFloat(s.amount)
    }));
  } catch (error) {
    console.error("Get Balances error", error);
    return [];
  }
};

export const settleUp = async () => {
  // Real implementation: Settle ALL suggested debts
  // 1. Get suggestions
  const suggestions = await api.get('/settlements/simplify', { headers: getAuthHeader() });
  const debts = suggestions.data;

  if (debts.length === 0) return { message: 'Nothing to settle' };

  // 2. Loop and settle each
  const promises = debts.map((d: any) => {
    // POST /settlements takes { payerId, payeeId, amount }
    return api.post('/settlements', {
      payerId: d.payerId,
      payeeId: d.payeeId,
      amount: d.amount
    }, { headers: getAuthHeader() });
  });

  await Promise.all(promises);
  return { success: true, message: 'All debts settled!' };
};

export default api;
