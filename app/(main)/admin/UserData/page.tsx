'use client';

import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { useRef, useState, useEffect } from 'react';

interface User {
    id?: number;
    nama_user_data: string;
    email: string;
    role: string;
    password?: string;
}

const User = () => {
    const toastRef = useRef<Toast>(null);
    const { status, data: session } = useSession();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [formData, setFormData] = useState<User>({
        nama_user_data: '',
        email: '',
        role: '',
        password: ''
    });

    const roleOptions = [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' }
    ];

    const handleAxiosError = (error: any, action: string) => {
        console.error(`Error ${action}:`, error);
        toastRef.current?.show({
            severity: 'error',
            summary: `Gagal ${action} data`,
            detail: error?.response?.data?.errors || 'Terjadi kesalahan',
            life: 3000
        });
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = (session?.user as any)?.token;
            const response = await axios.get('http://127.0.0.1:8000/api/user_data', { headers: { Authorization: `Bearer ${token}` } });
            setUsers(response.data || []);
        } catch (error) {
            handleAxiosError(error, 'mengambil');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchUsers();
        }
    }, [session]);

    const handleCreate = () => {
        setFormData({ nama_user_data: '', email: '', role: '', password: '' });
        setSubmitted(false);
        setDialogVisible(true);
    };

    const handleEdit = (user: User) => {
        setFormData({ ...user, password: '' });
        setDialogVisible(true);
    };

    const handleDelete = (user: User) => {
        setSelectedUser(user);
        setDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!selectedUser) return;

        try {
            const token = (session?.user as any)?.token;
            await axios.delete(`http://127.0.0.1:8000/api/user_data/${selectedUser.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toastRef.current?.show({
                severity: 'success',
                summary: 'Sukses',
                detail: 'Data berhasil dihapus',
                life: 3000
            });
            fetchUsers();
        } catch (error) {
            handleAxiosError(error, 'menghapus');
        } finally {
            setDeleteDialog(false);
            setSelectedUser(null);
        }
    };

    const handleSubmit = async () => {
        setSubmitted(true);

        // Validasi required fields
        if (!formData.nama_user_data || !formData.email || !formData.role) {
            return;
        }

        try {
            const token = (session?.user as any)?.token;
            const payload = {
                nama_user_data: formData.nama_user_data,
                email: formData.email,
                role: formData.role,
                ...(formData.password && { password: formData.password })
            };

            if (formData.id) {
                // Update existing user
                await axios.put(`http://127.0.0.1:8000/api/user_data/${formData.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                // Create new user
                await axios.post('http://127.0.0.1:8000/api/user_data', payload, { headers: { Authorization: `Bearer ${token}` } });
            }

            toastRef.current?.show({
                severity: 'success',
                summary: 'Sukses',
                detail: `Data berhasil ${formData.id ? 'diperbarui' : 'ditambahkan'}`,
                life: 3000
            });

            setDialogVisible(false);
            fetchUsers();
        } catch (error) {
            handleAxiosError(error, 'menyimpan');
        }
    };

    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Batal" icon="pi pi-times" className="p-button-text" onClick={() => setDialogVisible(false)} />
            <Button label="Simpan" icon="pi pi-check" onClick={handleSubmit} />
        </div>
    );

    return (
        <div className="p-5">
            <Toast ref={toastRef} />

            <div className="card">
                <div className="flex justify-content-between align-items-center mb-5">
                    <h5>Data User_data</h5>
                    <Button label="Tambah" icon="pi pi-plus" className="p-button-raised p-button-sm" onClick={handleCreate} />
                </div>

                <DataTable value={users} loading={loading} paginator rows={10} rowsPerPageOptions={[5, 10, 25]} emptyMessage="Tidak ada data">
                    <Column field="id" header="ID" style={{ width: '5%' }} />
                    <Column field="nama_user_data" header="Nama User_data" />
                    <Column field="email" header="Email" />
                    <Column field="role" header="Role" />

                    <Column
                        header="Aksi"
                        body={(rowData: User) => (
                            <div className="flex gap-2">
                                <Button icon="pi pi-pencil" className="p-button-sm p-button-success" onClick={() => handleEdit(rowData)} />
                                <Button icon="pi pi-trash" className="p-button-sm p-button-danger" onClick={() => handleDelete(rowData)} />
                            </div>
                        )}
                        style={{ width: '10%' }}
                    />
                </DataTable>
            </div>

            {/* Dialog Form */}
            <Dialog visible={dialogVisible} style={{ width: '500px' }} header={formData.id ? 'Edit User_data' : 'Tambah User_data'} modal footer={dialogFooter} onHide={() => setDialogVisible(false)}>
                <div className="p-fluid">
                    <div className="field mb-4">
                        <label htmlFor="nama_user_data">Nama User *</label>
                        <InputText id="nama_user_data" value={formData.nama_user_data} onChange={(e) => setFormData({ ...formData, nama_user_data: e.target.value })} className={classNames({ 'p-invalid': submitted && !formData.nama_user_data })} />
                        {submitted && !formData.nama_user_data && <small className="p-error">Nama wajib diisi</small>}
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="email">Email *</label>
                        <InputText id="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={classNames({ 'p-invalid': submitted && !formData.email })} />
                        {submitted && !formData.email && <small className="p-error">Email wajib diisi</small>}
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="role">Role *</label>
                        <Dropdown id="role" options={roleOptions} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.value })} placeholder="Pilih Role" className={classNames({ 'p-invalid': submitted && !formData.role })} />
                        {submitted && !formData.role && <small className="p-error">Role wajib dipilih</small>}
                    </div>

                    <div className="w-full relative" style={{ position: 'relative' }}>
                        <label htmlFor="password">{formData.id ? 'Password (Biarkan kosong jika tidak ingin mengganti)' : 'Password *'}</label>
                        <InputText
                            id="password"
                            type={passwordVisible ? 'text' : 'password'}
                            placeholder="Password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={classNames({
                                'p-invalid': submitted && !formData.id && !formData.password
                            })}
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
                                zIndex: '999',
                                fontSize: '18px',
                                color: '#888'
                            }}
                        ></i>
                        {submitted && !formData.id && !formData.password && <small className="p-error">Password wajib diisi</small>}
                    </div>
                </div>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog
                visible={deleteDialog}
                style={{ width: '500px' }}
                header="Konfirmasi"
                modal
                footer={
                    <div>
                        <Button label="Tidak" icon="pi pi-times" className="p-button-text" onClick={() => setDeleteDialog(false)} />
                        <Button label="Ya" icon="pi pi-check" className="p-button-danger" onClick={confirmDelete} />
                    </div>
                }
                onHide={() => setDeleteDialog(false)}
            >
                <div className="flex align-items-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        Apakah Anda yakin ingin menghapus <b>{selectedUser?.nama_user_data}</b>?
                    </span>
                </div>
            </Dialog>
        </div>
    );
};

export default User;
