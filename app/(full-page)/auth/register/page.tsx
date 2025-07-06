'use client';

/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import Link from 'next/link';
import Swal from 'sweetalert2';
import axios from 'axios';

const Register = () => {
    const [namaKaryawan, setNamaKaryawan] = useState('');
    const [nip, setNip] = useState('');
    const [nik, setNik] = useState('');
    const [email, setEmail] = useState('');
    const [noHandphone, setNoHandphone] = useState('');
    const [alamat, setAlamat] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [checked, setChecked] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    const handleRegister = async () => {
        if (!nip.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'NIP Diperlukan',
                text: 'Silakan masukkan NIP karyawan.'
            });
            return;
        }

        if (!nik.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'NIK Diperlukan',
                text: 'Silakan masukkan NIK karyawan.'
            });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Swal.fire({
                icon: 'error',
                title: 'Email Tidak Valid',
                text: 'Silakan masukkan alamat email yang valid.'
            });
            return;
        }

        if (!password.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Password Diperlukan',
                text: 'Silakan masukkan kata sandi.'
            });
            return;
        }

        if (!checked) {
            Swal.fire({
                icon: 'error',
                title: 'Ketentuan Tidak Diterima',
                text: 'Anda harus setuju dengan Syarat dan Ketentuan.'
            });
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:3000/api/crud',
                {
                    nama_karyawan: namaKaryawan,
                    nip,
                    nik,
                    email,
                    password,
                    no_handphone: noHandphone,
                    alamat
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-ENDPOINT': 'api/register'
                    }
                }
            );

            Swal.fire({
                icon: 'success',
                title: 'Akun Dibuat',
                text: 'Akun Anda telah berhasil dibuat!'
            }).then(() => {
                router.push('/auth/login');
            });
        } catch (error: any) {
            console.error('Kesalahan saat pendaftaran:', error.response?.data || error.message);

            Swal.fire({
                icon: 'error',
                title: 'Pendaftaran Gagal',
                text: error.response?.data?.message || 'Terjadi kesalahan saat pendaftaran. Silakan coba lagi.'
            });
        }
    };

    return (
        <div
            className={containerClassName}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F2F3F7',
                padding: '2rem'
            }}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: '10px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                    width: '100%',
                    maxWidth: '800px',
                    padding: '2rem'
                }}
            >
                <div className="flex gap-2 flex-column">
                    <h3 className="text-center text-900 text-3xl font-medium mb-5">Register</h3>

                    <div className="flex gap-2">
                        <div className="mb-3 flex-1">
                            <label htmlFor="namaKaryawan" className="block text-900 text-xl font-medium mb-2">
                                Nama Lengkap
                            </label>
                            <InputText 
                                id="namaKaryawan" 
                                type="text" 
                                placeholder="Nama lengkap" 
                                value={namaKaryawan} 
                                onChange={(e) => setNamaKaryawan(e.target.value)} 
                                className="w-full p-3" 
                            />
                        </div>

                        <div className="mb-3 flex-1">
                            <label htmlFor="nip" className="block text-900 text-xl font-medium mb-2">
                                NIP
                            </label>
                            <InputText 
                                id="nip" 
                                type="text" 
                                placeholder="Nomor Induk Pegawai" 
                                value={nip} 
                                onChange={(e) => setNip(e.target.value)} 
                                className="w-full p-3" 
                                maxLength={8} 
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="mb-3 flex-1">
                            <label htmlFor="nik" className="block text-900 text-xl font-medium mb-2">
                                NIK
                            </label>
                            <InputText 
                                id="nik" 
                                type="text" 
                                placeholder="Nomor Induk Kependudukan" 
                                value={nik} 
                                onChange={(e) => setNik(e.target.value)} 
                                className="w-full p-3" 
                                maxLength={16} 
                            />
                        </div>

                        <div className="mb-3 flex-1">
                            <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">
                                Email
                            </label>
                            <InputText 
                                id="email" 
                                type="email" 
                                placeholder="Email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                className="w-full p-3" 
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="mb-3 flex-1">
                            <label htmlFor="noHandphone" className="block text-900 text-xl font-medium mb-2">
                                No. Handphone
                            </label>
                            <InputText 
                                id="noHandphone" 
                                type="tel" 
                                placeholder="Contoh: 081234567890" 
                                value={noHandphone} 
                                onChange={(e) => setNoHandphone(e.target.value)} 
                                className="w-full p-3" 
                            />
                        </div>
                        <div className="mb-3 flex-1">
                            <label htmlFor="alamat" className="block text-900 text-xl font-medium mb-2">
                                Alamat
                            </label>
                            <InputText 
                                id="alamat" 
                                type="text" 
                                placeholder="Alamat lengkap" 
                                value={alamat} 
                                onChange={(e) => setAlamat(e.target.value)} 
                                className="w-full p-3" 
                            />
                        </div>
                    </div>

                    <div className="mb-3" style={{ position: 'relative' }}>
                        <label htmlFor="password" className="block text-900 text-xl font-medium mb-2">
                            Password
                        </label>
                        <InputText 
                            id="password" 
                            type={passwordVisible ? 'text' : 'password'} 
                            placeholder="Password" 
                            className="w-full p-3" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                        <i
                            className={`fas ${passwordVisible ? 'fa-eye-slash' : 'fa-eye'}`}
                            onClick={() => setPasswordVisible(!passwordVisible)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'pointer',
                                fontSize: '18px',
                                color: '#888'
                            }}
                        ></i>
                    </div>

                    <div className="flex align-items-center justify-content-between mb-5 gap-5">
                        <div className="flex align-items-center">
                            <input 
                                type="checkbox" 
                                id="agreeTerms" 
                                checked={checked} 
                                onChange={(e) => setChecked(e.target.checked)} 
                                className="mr-2 p-2 cursor-pointer" 
                            />
                            <label htmlFor="agreeTerms" className="text-sm cursor-pointer select-none">
                                Saya setuju dengan{' '}
                                <a href="#" className="font-medium" style={{ color: 'var(--primary-color)' }}>
                                    Syarat dan Ketentuan
                                </a>
                            </label>
                        </div>
                    </div>

                    <Button 
                        label="Daftar" 
                        className="w-full p-3 text-xl" 
                        style={{ backgroundColor: '#007bff', borderColor: '#007bff' }} 
                        onClick={handleRegister} 
                    />

                    <div className="text-center mt-5">
                        <span className="text-600">Sudah memiliki akun?</span>
                        <Link href="/auth/login" className="font-medium" style={{ color: 'var(--primary-color)', marginLeft: '5px' }}>
                            Masuk sekarang
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;