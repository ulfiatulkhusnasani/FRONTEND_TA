'use client';
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from 'primereact/button';
import 'primereact/resources/primereact.min.css';
import 'primeflex/primeflex.css';
import { Dialog } from 'primereact/dialog';

interface EmployeeData {
    name: string;
    employeeId: string;
    position: string;
    department: string;
    month: string;
    dirName: string;
    performance: string;
    basicSalary: number;
    allowances: number;
    overtime: number;
    deductions: number;
}

interface PayslipProps {
    employeeData: EmployeeData | any;
    showDialogSlip: boolean;
    setShowDialogSlip: (value: boolean) => void;
}

const PayslipComponent: React.FC<PayslipProps> = ({ employeeData, setShowDialogSlip, showDialogSlip }) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        pageStyle: `
            @page {
                size: A4 portrait;
                margin: 20mm;
            }
        `
    });

    const printStyles = `
        @media print {
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background: white !important;
            }
            
            .print-section {
                box-shadow: none !important;
                border: 1px solid #000 !important;
                margin: 0 !important;
                padding: 20px !important;
            }
            
            .no-print {
                display: none !important;
            }
            
            .signature-section {
                page-break-inside: avoid;
            }
            
            .table-print {
                border-collapse: collapse;
                width: 100%;
            }
            
            .table-print th,
            .table-print td {
                border: 1px solid #ddd !important;
                padding: 8px !important;
            }
            
            .surface-0 {
                background-color: #ffffff !important;
            }
            
            .surface-100 {
                background-color: #f8f9fa !important;
            }
        }
    `;

    console.log(employeeData);

    return (
        <Dialog
            visible={showDialogSlip}
            onHide={() => {
                setShowDialogSlip(false);
            }}
        >
            <div className="p-4">
                <style>{printStyles}</style>

                <Button label="Cetak Slip Gaji" icon="pi pi-print" className="p-button-info mb-4 no-print" onClick={handlePrint} />

                <div ref={componentRef} className="surface-card p-6 shadow-2 border-round print-section">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold mb-2">PT. MARSTECH GLOBAL</h1>
                        <div className="text-600">
                            <p>Jl. Margatama Asri IV, Kanigoro, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63118</p>
                            <p>Telp: (0351) 2812555</p>
                        </div>
                    </div>

                    {/* Informasi Karyawan */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-4">Slip Gaji {employeeData?.month}</h2>
                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="flex-1">
                                <p className="mb-2">
                                    <span className="font-medium">Nama:</span> {employeeData?.name}
                                </p>
                                <p>
                                    <span className="font-medium">Jabatan:</span> {employeeData?.position}
                                </p>
                            </div>
                            <div className="flex-1">
                                <p className="mb-2">
                                    <span className="font-medium">NIP:</span> {employeeData?.employeeId}
                                </p>
                                <p>
                                    <span className="font-medium">Kinerja:</span> {employeeData?.performance || '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Detail Gaji */}
                    <table className="table-print w-full mb-6">
                        <thead>
                            <tr className="surface-100">
                                <th className="text-left p-2">Komponen</th>
                                <th className="text-right p-2">Jumlah (IDR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="surface-0">
                                <td>Gaji Pokok</td>
                                <td className="text-right">{employeeData?.basicSalary.toLocaleString()}</td>
                            </tr>
                            <tr className="surface-100">
                                <td>Tunjangan</td>
                                <td className="text-right">{employeeData?.allowances.toLocaleString()}</td>
                            </tr>
                            <tr className="surface-0">
                                <td>Potongan</td>
                                <td className="text-right">-{employeeData?.deductions.toLocaleString()}</td>
                            </tr>
                            <tr className="surface-100 font-semibold">
                                <td>Gaji Bersih</td>
                                <td className="text-right">{employeeData?.netSalary.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Tanda Tangan */}
                    <div className="flex flex-wrap mt-8 signature-section">
                        <div className="w-6 p-2 text-center">
                            <p className="mb-4 font-medium">Karyawan</p>
                            <div className="border-top-1 border-300 pt-3">({employeeData?.name})</div>
                        </div>
                        <div className="w-6 p-2 text-center">
                            <p className="mb-4 font-medium">Direktur</p>
                            <div className="border-top-1 border-300 pt-3">(Muhammad Gaffi Al Ghifari)</div>
                        </div>
                    </div>

                    {/* Catatan Kaki */}
                    <div className="text-xs mt-6 text-center text-600">
                        <p>* Slip gaji ini merupakan dokumen resmi dan sah</p>
                        <p>* Dicetak secara elektronik - tidak memerlukan cap basah</p>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default PayslipComponent;
