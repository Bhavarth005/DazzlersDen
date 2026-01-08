import PDFDocument from 'pdfkit';

export async function generateLedgerPDF(title: string, headers: string[], rows: any[]) {
    // Reuse the generator for the single ledger
    return generateCustomerStatementPDF([{ 
        name: title,
        isLedger: true, 
        headers,
        rows
    }]);
}

export async function generateCustomerStatementPDF(customers: any[]) {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    const drawTable = (headers: string[], rows: string[][], startY: number, colPercent: number[]) => {
        let currentY = startY;
        const pageW = doc.page.width - 60; // 30px margin each side
        const rowHeight = 20;

        // Draw Header Row
        doc.fillColor('#f5f5f5').rect(30, currentY, pageW, rowHeight).fill();
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8);
        
        let currentX = 30;
        headers.forEach((h, i) => {
            const w = pageW * colPercent[i];
            // Explicit X/Y coordinates for every text element
            doc.text(h, currentX + 5, currentY + 6, { width: w - 10, align: 'left' });
            currentX += w;
        });
        currentY += rowHeight;

        // Draw Data Rows
        doc.font('Helvetica').fontSize(8);
        rows.forEach((row) => {
            // Auto Page Break
            if (currentY > doc.page.height - 40) {
                doc.addPage();
                currentY = 30;
                // Redraw header on new page
                doc.fillColor('#f5f5f5').rect(30, currentY, pageW, rowHeight).fill();
                doc.fillColor('#000000').font('Helvetica-Bold');
                let hX = 30;
                headers.forEach((h, i) => {
                    const w = pageW * colPercent[i];
                    doc.text(h, hX + 5, currentY + 6, { width: w - 10, align: 'left' });
                    hX += w;
                });
                doc.font('Helvetica'); // Reset font
                currentY += rowHeight;
            }

            // Draw Row Data
            let rX = 30;
            row.forEach((text, i) => {
                const w = pageW * colPercent[i];
                // 'lineBreak: false' prevents wrapping if text is too long
                // 'ellipsis: true' adds "..." if it doesn't fit
                doc.text(text, rX + 5, currentY + 6, { 
                    width: w - 10, 
                    align: 'left', 
                    lineBreak: false, 
                    ellipsis: true 
                });
                rX += w;
            });
            
            // Draw bottom border
            doc.moveTo(30, currentY + rowHeight)
               .lineTo(doc.page.width - 30, currentY + rowHeight)
               .lineWidth(0.5)
               .strokeColor('#e0e0e0')
               .stroke();
               
            currentY += rowHeight;
        });
        
        return currentY;
    };

    // --- MAIN GENERATION LOOP ---
    customers.forEach((c, index) => {
        if (index > 0) doc.addPage(); 

        if (c.isLedger) {
            // --- SIMPLE LEDGER MODE ---
            doc.fontSize(16).font('Helvetica-Bold').text(c.name, { align: 'center' });
            doc.moveDown();
            doc.fontSize(9).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
            doc.moveDown();

            // Default: Equal width if not specified
            const equalWidth = 1 / c.headers.length;
            const widths = new Array(c.headers.length).fill(equalWidth);
            
            drawTable(c.headers, c.rows, doc.y, widths);

        } else {
            // --- CUSTOMER STATEMENT MODE ---
            doc.fontSize(16).font('Helvetica-Bold').text("Customer Statement", { align: 'center' });
            doc.moveDown();
            
            // Force reset X to margin (Fixes alignment drift)
            doc.x = 30;
            
            doc.fontSize(10).font('Helvetica').fillColor('#333333');
            doc.text(`Name: ${c.name}`);
            doc.text(`Mobile: ${c.mobileNumber}`);
            doc.text(`Current Balance: Rs. ${c.currentBalance.toFixed(2)}`);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`);
            doc.moveDown(1.5);

            // 1. Transactions Section
            doc.x = 30; // FORCE RESET X
            doc.fontSize(12).font('Helvetica-Bold').fillColor('black').text("Transaction History");
            doc.moveDown(0.5);

            const txnHeaders = ["Date", "Type", "Mode", "Amount", "Admin"];
            const txnWidths = [0.15, 0.35, 0.15, 0.20, 0.15]; // Adjusted for wider Type

            const txnRows = c.transactions.map((t: any) => [
                new Date(t.date).toLocaleDateString(),
                t.transactionType,
                t.paymentMode || "-",
                t.amount.toFixed(2),
                t.admin?.username || "System"
            ]);
            
            let y = drawTable(txnHeaders, txnRows, doc.y, txnWidths);

            // 2. Sessions Section
            doc.y = y + 25; 
            doc.x = 30; // FORCE RESET X (This fixes the Session History Header alignment)
            
            doc.fontSize(12).font('Helvetica-Bold').text("Session History");
            doc.moveDown(0.5);

            const sessionHeaders = ["Date", "Duration", "Guests", "Cost", "Status"];
            const sessionWidths = [0.20, 0.15, 0.25, 0.20, 0.20];

            const sessionRows = c.sessions.map((s: any) => [
                new Date(s.startTime).toLocaleDateString(),
                `${s.durationHr} hrs`,
                `${s.adults}A + ${s.children}C`,
                s.discountedCost.toFixed(2),
                s.status
            ]);

            drawTable(sessionHeaders, sessionRows, doc.y, sessionWidths);
        }
    });

    doc.end();
    return new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
}