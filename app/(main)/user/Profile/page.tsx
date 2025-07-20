'use client';

import axios from 'axios';
import { useSession } from 'next-auth/react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRef, useState, useEffect } from 'react';
import { classNames } from 'primereact/utils';

const ProfilePage = () => {
    const { data: session, update } = useSession();
    const toastRef = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [formData, setFormData] = useState({
        nama_karyawan: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (session?.user) {
            setFormData({
                nama_karyawan: session.user.name || '',
                email: session.user.email || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        }
    }, [session]);

    const handleAxiosError = (error: any) => {
        console.error('Error:', error);
        const errorMessage = error.response?.data?.message || 'Terjadi kesalahan';
        toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 3000
        });
    };

    const handleSubmit = async () => {
        setSubmitted(true);

        // Validasi password baru dan konfirmasi
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Password baru dan konfirmasi tidak sama',
                life: 3000
            });
            return;
        }

        try {
            setLoading(true);
            const token = (session?.user as any)?.token;

            const payload: any = {
                nama_karyawan: formData.nama_karyawan
            };

            // Hanya kirim password jika diisi
            if (formData.currentPassword && formData.newPassword) {
                payload.current_password = formData.currentPassword;
                payload.new_password = formData.newPassword;
            }

            const response = await axios.put('http://127.0.0.1:8000/api/profile', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update session
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: formData.nama_karyawan
                }
            });

            toastRef.current?.show({
                severity: 'success',
                summary: 'Sukses',
                detail: 'Profil berhasil diperbarui',
                life: 3000
            });

            // Reset password fields
            setFormData((prev) => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (error) {
            handleAxiosError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-5">
            <Toast ref={toastRef} />

            <div className="card p-4">
                <h3 className="mb-4">Profil Pengguna</h3>

                <div className="grid">
                    <div className="col-12 md:col-6">
                        <div className="field mb-4">
                            <label htmlFor="nama_karyawan">Nama Lengkap *</label>
                            <InputText
                                id="nama_karyawan"
                                value={formData.nama_karyawan}
                                onChange={(e) => setFormData({ ...formData, nama_karyawan: e.target.value })}
                                className={classNames('w-full', { 'p-invalid': submitted && !formData.nama_karyawan })}
                            />
                            {submitted && !formData.nama_karyawan && <small className="p-error">Nama wajib diisi</small>}
                        </div>

                        <div className="field mb-4">
                            <label htmlFor="email">Email</label>
                            <InputText id="email" value={formData.email} readOnly className="w-full p-inputtext-disabled" />
                        </div>
                    </div>

                    <div className="col-12 md:col-6">
                        <div className="card p-4 border-1 surface-border">
                            <h4 className="mb-3">Ubah Password</h4>

                            <div className="field mb-4">
                                <label htmlFor="currentPassword">Password Saat Ini</label>
                                <div className="p-inputgroup">
                                    <InputText
                                        id="currentPassword"
                                        type={passwordVisible ? 'text' : 'password'}
                                        placeholder="Password saat ini"
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                        className="w-full"
                                    />
                                    <span className="p-inputgroup-addon cursor-pointer" onClick={() => setPasswordVisible(!passwordVisible)}>
                                        <i className={`pi ${passwordVisible ? 'pi-eye-slash' : 'pi-eye'}`}></i>
                                    </span>
                                </div>
                            </div>

                            <div className="field mb-4">
                                <label htmlFor="newPassword">Password Baru</label>
                                <InputText id="newPassword" type="password" placeholder="Password baru" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} className="w-full" />
                            </div>

                            <div className="field">
                                <label htmlFor="confirmPassword">Konfirmasi Password Baru</label>
                                <InputText
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Konfirmasi password baru"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className={classNames('w-full', {
                                        'p-invalid': submitted && formData.newPassword !== formData.confirmPassword
                                    })}
                                />
                                {submitted && formData.newPassword !== formData.confirmPassword && <small className="p-error">Password tidak sama</small>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-content-end mt-4">
                    <Button label="Simpan Perubahan" icon="pi pi-check" loading={loading} onClick={handleSubmit} />
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;