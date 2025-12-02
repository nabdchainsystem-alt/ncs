import { jsPDF } from 'jspdf';

interface PaymentRequestData {
    vendorName: string;
    department: string;
    branch: string;
    poNumber: string;
    poDate: string;
    description: string;
    amountBeforeVat: number;
    vatAmount: number;
    totalAmount: number;
    logoDataUrl?: string;
}

export const generatePaymentRequestPDF = (data: PaymentRequestData) => {
    // Create new PDF document (A4, portrait)
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // --- Header Section ---

    // Logo
    if (data.logoDataUrl) {
        try {
            doc.addImage(data.logoDataUrl, 'JPEG', 15, 10, 40, 20);
        } catch (e) {
            console.error("Error adding logo:", e);
            // Fallback if image fails
            doc.setFillColor(240, 240, 240);
            doc.rect(15, 10, 40, 20, 'F');
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(10);
            doc.text("Logo Error", 35, 22, { align: "center" });
        }
    } else {
        // Logo Placeholder (Top Left)
        doc.setFillColor(240, 240, 240);
        doc.rect(15, 10, 40, 20, 'F');
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text("Logo", 35, 22, { align: "center" });
    }

    // Company Name (Top Right)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Factory First Address For Water", 195, 20, { align: "right" });

    // Title
    doc.setFontSize(14);
    doc.text("Claim & Petty Cash Form", 105, 35, { align: "center" });

    // --- Info Section ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Date Row
    const today = new Date().toISOString().split('T')[0];
    doc.rect(15, 45, 180, 10);
    doc.line(105, 45, 105, 55); // Middle separator

    // Left Side: Department (User Input)
    doc.text("Dep. :", 17, 51);
    doc.text(data.department, 30, 51);

    // Right Side: Date
    doc.text("Date :", 107, 51);
    doc.text(today, 120, 51);

    // Name Row
    doc.rect(15, 55, 180, 10);
    doc.line(105, 55, 105, 65); // Middle separator

    // Right Side: Name (Vendor)
    doc.text("Name :", 107, 61);
    doc.text(data.vendorName, 120, 61);

    // --- Table Section ---
    const startY = 75;

    // Table Header
    doc.setFillColor(255, 255, 255); // White background
    doc.rect(15, startY, 180, 15); // Outer Border

    // Vertical lines for main columns
    // Columns: Branch (25mm), Documents (40mm), Description (85mm), Amount (30mm)
    // X positions: 15 (start), 40 (end of Branch), 80 (end of Docs), 165 (end of Desc), 195 (end of Amount)
    doc.line(40, startY, 40, startY + 15);
    doc.line(80, startY, 80, startY + 15);
    doc.line(165, startY, 165, startY + 15);

    // Header Text - Main Columns
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    // Branch
    doc.text("Branch", 27.5, startY + 8, { align: "center" });

    // Description
    doc.text("Description", 122.5, startY + 8, { align: "center" });

    // Amount
    doc.text("Amount", 180, startY + 8, { align: "center" });

    // Documents Column (Merged Header Logic)
    // Top Half: "Documents"
    doc.text("Documents", 60, startY + 5, { align: "center" });

    // Horizontal Line Split
    doc.line(40, startY + 7.5, 80, startY + 7.5);

    // Vertical Line Split for Sub-columns (Date | Type)
    doc.line(60, startY + 7.5, 60, startY + 15);

    // Sub-headers
    // Date (Left sub-column: 40-60)
    doc.text("Date", 50, startY + 12, { align: "center" });
    // Type (Right sub-column: 60-80)
    doc.text("Type", 70, startY + 12, { align: "center" });

    // Table Rows (Main Content)
    const rowHeight = 10;
    const rows = 12; // Number of empty rows to simulate the grid
    let currentY = startY + 15;

    // Helper for number formatting
    const formatNumber = (num: number) => {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Helper for vertical centering
    const textY = (y: number) => y + (rowHeight / 2) + 1.5; // Approximate middle alignment

    for (let i = 0; i < rows; i++) {
        doc.rect(15, currentY, 180, rowHeight);

        // Vertical Lines
        doc.line(40, currentY, 40, currentY + rowHeight); // Branch sep
        doc.line(60, currentY, 60, currentY + rowHeight); // Date/Type sep
        doc.line(80, currentY, 80, currentY + rowHeight); // Docs/Desc sep
        doc.line(165, currentY, 165, currentY + rowHeight); // Desc/Amount sep

        // Fill first row with data
        if (i === 0) {
            doc.setFont("helvetica", "normal");
            // Branch
            doc.text(data.branch, 27.5, textY(currentY), { align: "center" });
            // Date (under Date sub-column)
            doc.text(data.poDate, 50, textY(currentY), { align: "center" });
            // Type / PO Number (under Type sub-column)
            doc.text(data.poNumber, 70, textY(currentY), { align: "center" });
            // Description
            doc.text(data.description, 122.5, textY(currentY), { align: "center" }); // Center align as requested
            // Amount
            doc.text(formatNumber(data.amountBeforeVat), 180, textY(currentY), { align: "center" }); // Center align as requested
        }

        // VAT Row - Place it immediately after the last empty row or at the bottom of the grid
        // The user wants NO gap between VAT and Total.
        // Let's put VAT in the last row of the grid (index 11)
        if (i === rows - 1) {
            doc.setFont("helvetica", "bold");
            doc.text("VAT 15%", 163, textY(currentY), { align: "right" });
            doc.text(formatNumber(data.vatAmount), 180, textY(currentY), { align: "center" }); // Center align to match column
        }

        currentY += rowHeight;
    }

    // Total Amount Row - Attached directly to the bottom of the grid
    doc.setFont("helvetica", "bold");
    doc.rect(15, currentY, 180, 10);
    doc.text("Total Amount", 163, textY(currentY), { align: "right" });
    doc.text(formatNumber(data.totalAmount), 180, textY(currentY), { align: "center" }); // Center align to match column

    // --- Footer Section ---
    const footerY = currentY + 15;

    // Signatures
    doc.setFontSize(9);
    doc.text("Requester", 30, footerY);
    doc.text("Direct Manager", 70, footerY);
    doc.text("Dep. Manager", 110, footerY);
    doc.text("Approval", 160, footerY);

    doc.line(15, footerY + 10, 195, footerY + 10);

    // Finance Section
    doc.setFontSize(11);
    doc.text("Fill By Finance", 105, footerY + 18, { align: "center" });

    doc.setFontSize(9);
    doc.text("Dear Secretary of the Treasury:", 15, footerY + 28);
    doc.text("Kindly Please do necessary of amount payment ........................(only....................................................................................)", 15, footerY + 38);

    doc.text("CFO", 180, footerY + 50, { align: "right" });
    doc.text("TO Mr. : ............................................................", 15, footerY + 50);

    // Page Watermark
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(60);
    doc.text("Page 1", 105, 150, { align: "center", angle: 0 });

    // Save
    doc.save(`Payment_Request_${data.vendorName}_${today}.pdf`);
};
