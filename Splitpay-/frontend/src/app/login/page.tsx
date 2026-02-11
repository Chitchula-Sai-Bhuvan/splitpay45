'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '@/services/api';
import styles from './page.module.css';

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email || !password || (isRegister && !name)) {
            setError('Please fill in all fields');
            return;
        }

        try {
            if (isRegister) {
                // ACID Compliant Database Insertion via Backend
                await register(email, name, password);
                setSuccess('Account created! You can now log in.');
                setIsRegister(false);
                setPassword('');
            } else {
                // Database Verification & Token Generation
                const data = await login(email, password);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/');
            }
        } catch (err: any) {
            setError(err.message || 'Action failed. Please check your details.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>SplitPay</h1>
                <p className={styles.subtitle}>
                    {isRegister ? 'Create your account' : 'Simple and transparent expense sharing'}
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {isRegister && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}
                    {success && <p className={styles.success}>{success}</p>}

                    <button type="submit" className={styles.button}>
                        {isRegister ? 'Register' : 'Login'}
                    </button>
                </form>

                <div className={styles.footer}>
                    <button
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError('');
                            setSuccess('');
                        }}
                        className={styles.linkButton}
                    >
                        {isRegister ? 'Already have an account? Login' : 'New user? Register'}
                    </button>
                </div>
            </div>
        </div>
    );
}
