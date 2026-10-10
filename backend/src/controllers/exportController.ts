import { Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit-table';
import Registration from '../models/Registration';
import Event from '../models/Event';
import { AuthRequest } from '../middleware/auth';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1A3C5E' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
  name: 'Calibri',
};

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
  right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
};

function styleHeader(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = BORDER;
  });
  row.height = 22;
}

function styleDataRow(row: ExcelJS.Row, isFirstMember: boolean): void {
  row.eachCell((cell) => {
    cell.border = BORDER;
    cell.alignment = { vertical: 'middle', wrapText: true };
    if (isFirstMember) {
      cell.font = { name: 'Calibri', size: 10, bold: false };
    } else {
      cell.font = { name: 'Calibri', size: 10 };
    }
  });
  row.height = 18;
}

export const exportRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const format = req.query.format as string || 'xlsx';
    const query: any = { _id: req.params.eventId };
    if (req.organizerRole !== 'admin') {
      query.organizer = req.organizerId;
    }
    const event = await Event.findOne(query);
    if (!event) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const registrations = await Registration.find({ event: req.params.eventId }).sort({ registrationTime: 1 });

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${event.slug}_Registrations.pdf"`);
      doc.pipe(res);

      doc.fontSize(16).text(event.title.toUpperCase(), { align: 'center' });
      doc.fontSize(10).text(`Organized by: ${event.organizerName} | Date: ${new Date(event.startDate).toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      const table = {
        title: "Registered Teams",
        headers: ["S.No.", "Team ID", "Team Name", "Names", "Roll No."],
        rows: [] as string[][],
      };

      let sno = 1;
      registrations.forEach(reg => {
        const allMembers = [reg.teamLeader, ...reg.members];
        allMembers.forEach((member, idx) => {
          table.rows.push([
            idx === 0 ? String(sno) : "",
            idx === 0 ? reg.teamId : "",
            idx === 0 ? reg.teamName : "",
            member.fullName,
            member.rollNumber
          ]);
        });
        sno++;
      });

      await doc.table(table, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
          doc.font("Helvetica").fontSize(10);
        }
      });
      
      doc.end();
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Student Club';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Registered Teams', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    if (format === 'xlsx') {
      sheet.mergeCells('A1:E1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = event.title.toUpperCase();
      titleCell.font = { bold: true, size: 14, name: 'Calibri', color: { argb: 'FF1A3C5E' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 30;

      sheet.mergeCells('A2:E2');
      const subCell = sheet.getCell('A2');
      subCell.value = `Organized by: ${event.organizerName}  |  Date: ${new Date(event.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}  |  Venue: ${event.venue}`;
      subCell.font = { size: 10, name: 'Calibri', italic: true, color: { argb: 'FF555555' } };
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(2).height = 18;

      sheet.addRow([]); // spacer
    }

    sheet.columns = [
      { key: 'sno', width: 7 },
      { key: 'teamNo', width: 10 },
      { key: 'teamName', width: 22 },
      { key: 'name', width: 28 },
      { key: 'rollNo', width: 18 },
    ];

    const headerRow = sheet.addRow(['S.NO.', 'TEAM NO.', 'TEAM NAME', 'NAMES', 'ROLL NO.']);
    if (format === 'xlsx') styleHeader(headerRow);

    let sno = 1;

    for (const reg of registrations) {
      const allMembers = [reg.teamLeader, ...reg.members];
      const startRow = sheet.rowCount + 1;

      allMembers.forEach((member, idx) => {
        const isFirst = idx === 0;
        const row = sheet.addRow([
          isFirst ? sno : (format === 'csv' ? sno : ''), // fill sno in csv for easier filtering
          isFirst ? reg.teamId : (format === 'csv' ? reg.teamId : ''),
          isFirst ? reg.teamName : (format === 'csv' ? reg.teamName : ''),
          member.fullName,
          member.rollNumber,
        ]);
        if (format === 'xlsx') {
          styleDataRow(row, isFirst);
          if (sno % 2 === 0) {
            row.eachCell((cell, colNumber) => {
              if (colNumber >= 4) {
                (cell.fill as ExcelJS.FillPattern) = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF5F7FA' },
                };
              }
            });
          }
        }
      });

      const endRow = sheet.rowCount;

      if (format === 'xlsx' && allMembers.length > 1) {
        sheet.mergeCells(startRow, 1, endRow, 1);
        sheet.mergeCells(startRow, 2, endRow, 2);
        sheet.mergeCells(startRow, 3, endRow, 3);
        ['A', 'B', 'C'].forEach((col) => {
          const cell = sheet.getCell(`${col}${startRow}`);
          cell.alignment = { vertical: 'middle', horizontal: col === 'A' ? 'center' : 'left', wrapText: true };
        });
        sheet.getCell(`A${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
      }
      sno++;
    }

    if (format === 'xlsx') {
      sheet.addRow([]);
      const footerRow = sheet.addRow([`Total Teams: ${registrations.length}`, '', '', '', '']);
      footerRow.getCell(1).font = { bold: true, name: 'Calibri', size: 10 };
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${event.slug}_Registrations.csv"`);
      await workbook.csv.write(res);
      res.end();
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${event.slug}_Registrations.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};

export const exportAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const format = req.query.format as string || 'xlsx';
    const query: any = { _id: req.params.eventId };
    if (req.organizerRole !== 'admin') {
      query.organizer = req.organizerId;
    }
    const event = await Event.findOne(query);
    if (!event) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const registrations = await Registration.find({ event: req.params.eventId }).sort({ registrationTime: 1 });

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${event.slug}_Attendance.pdf"`);
      doc.pipe(res);

      doc.fontSize(16).text(`${event.title.toUpperCase()} — ATTENDANCE REPORT`, { align: 'center' });
      doc.fontSize(10).text(`Attendance Status: ${event.attendanceStatus.toUpperCase()} | Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      const table = {
        title: "Attendance Report",
        headers: ["S.No.", "Team ID", "Team Name", "Names", "Roll No.", "Attendance", "Check-in Time"],
        rows: [] as string[][],
      };

      let sno = 1;
      registrations.forEach(reg => {
        const allMembers = [reg.teamLeader, ...reg.members];
        allMembers.forEach((member, idx) => {
          table.rows.push([
            idx === 0 ? String(sno) : "",
            idx === 0 ? reg.teamId : "",
            idx === 0 ? reg.teamName : "",
            member.fullName,
            member.rollNumber,
            member.attendanceStatus === 'present' ? 'PRESENT' : member.attendanceStatus === 'absent' ? 'ABSENT' : 'NOT CHECKED',
            member.checkInTime ? new Date(member.checkInTime).toLocaleTimeString() : '—'
          ]);
        });
        sno++;
      });

      await doc.table(table, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
          doc.font("Helvetica").fontSize(10);
        }
      });
      
      doc.end();
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Student Club';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Attendance', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    if (format === 'xlsx') {
      sheet.mergeCells('A1:G1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `${event.title.toUpperCase()} — ATTENDANCE REPORT`;
      titleCell.font = { bold: true, size: 14, name: 'Calibri', color: { argb: 'FF1A3C5E' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 30;

      sheet.mergeCells('A2:G2');
      const subCell = sheet.getCell('A2');
      subCell.value = `Attendance Status: ${event.attendanceStatus.toUpperCase()}  |  Generated: ${new Date().toLocaleString('en-IN')}`;
      subCell.font = { size: 10, name: 'Calibri', italic: true, color: { argb: 'FF555555' } };
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(2).height = 18;

      sheet.addRow([]);
    }

    sheet.columns = [
      { key: 'sno', width: 7 },
      { key: 'teamNo', width: 10 },
      { key: 'teamName', width: 22 },
      { key: 'name', width: 28 },
      { key: 'rollNo', width: 18 },
      { key: 'attendance', width: 14 },
      { key: 'checkIn', width: 14 },
    ];

    const headerRow = sheet.addRow(['S.NO.', 'TEAM NO.', 'TEAM NAME', 'NAMES', 'ROLL NO.', 'ATTENDANCE', 'CHECK-IN TIME']);
    if (format === 'xlsx') styleHeader(headerRow);

    let sno = 1;

    const PRESENT_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
    const ABSENT_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
    const UNCHECKED_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };

    for (const reg of registrations) {
      const allMembers = [reg.teamLeader, ...reg.members];
      const startRow = sheet.rowCount + 1;

      allMembers.forEach((member, idx) => {
        const isFirst = idx === 0;
        const checkIn = member.checkInTime
          ? new Date(member.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : '—';
        const attendanceLabel =
          member.attendanceStatus === 'present' ? 'PRESENT' : member.attendanceStatus === 'absent' ? 'ABSENT' : 'NOT CHECKED';

        const row = sheet.addRow([
          isFirst ? sno : (format === 'csv' ? sno : ''),
          isFirst ? reg.teamId : (format === 'csv' ? reg.teamId : ''),
          isFirst ? reg.teamName : (format === 'csv' ? reg.teamName : ''),
          member.fullName,
          member.rollNumber,
          attendanceLabel,
          member.attendanceStatus === 'present' ? checkIn : '—',
        ]);

        if (format === 'xlsx') {
          row.getCell(6).font = {
            bold: true,
            name: 'Calibri',
            size: 10,
            color: {
              argb:
                member.attendanceStatus === 'present'
                  ? 'FF2E7D32'
                  : member.attendanceStatus === 'absent'
                  ? 'FFC62828'
                  : 'FFF57F17',
            },
          };

          row.getCell(6).fill =
            member.attendanceStatus === 'present'
              ? PRESENT_FILL
              : member.attendanceStatus === 'absent'
              ? ABSENT_FILL
              : UNCHECKED_FILL;

          styleDataRow(row, isFirst);
          row.getCell(6).border = BORDER;
          row.getCell(7).border = BORDER;
        }
      });

      const endRow = sheet.rowCount;

      if (format === 'xlsx' && allMembers.length > 1) {
        sheet.mergeCells(startRow, 1, endRow, 1);
        sheet.mergeCells(startRow, 2, endRow, 2);
        sheet.mergeCells(startRow, 3, endRow, 3);
        ['A', 'B', 'C'].forEach((col) => {
          const cell = sheet.getCell(`${col}${startRow}`);
          cell.alignment = { vertical: 'middle', horizontal: col === 'A' ? 'center' : 'left', wrapText: true };
        });
        sheet.getCell(`A${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
      }

      sno++;
    }

    if (format === 'xlsx') {
      const totalParticipants = registrations.reduce((acc, r) => acc + 1 + r.members.length, 0);
      const present = registrations.reduce((acc, r) => {
        return acc + [r.teamLeader, ...r.members].filter((m) => m.attendanceStatus === 'present').length;
      }, 0);

      sheet.addRow([]);
      const summaryRow = sheet.addRow([
        `Total Teams: ${registrations.length}`,
        '',
        '',
        `Total Participants: ${totalParticipants}`,
        '',
        `Present: ${present}`,
        `Absent: ${totalParticipants - present}`,
      ]);
      summaryRow.eachCell((cell) => {
        cell.font = { bold: true, name: 'Calibri', size: 10 };
      });
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${event.slug}_Attendance.csv"`);
      await workbook.csv.write(res);
      res.end();
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${event.slug}_Attendance.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};
