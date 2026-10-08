import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import type { IncidentInvestigation } from '../types';

export async function exportInvestigationToDocx(inv: IncidentInvestigation) {
  const FONT = 'Times New Roman';
  const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
  const borders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

  function heading(text: string): Paragraph {
    return new Paragraph({
      children: [new TextRun({ text, font: FONT, size: 28, bold: true })],
      spacing: { before: 200, after: 100 },
    });
  }

  function bodyText(text: string): Paragraph {
    return new Paragraph({
      children: [new TextRun({ text, font: FONT, size: 24 })],
      spacing: { after: 100 },
    });
  }

  function bulletItem(text: string): Paragraph {
    return new Paragraph({
      children: [new TextRun({ text: `• ${text}`, font: FONT, size: 24 })],
      spacing: { after: 50 },
      indent: { left: 360 },
    });
  }

  function tableCell(text: string, bold = false): TableCell {
    return new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: String(text), font: FONT, size: 22, bold })],
      })],
      borders,
    });
  }

  const children: (Paragraph | Table)[] = [];

  // Header
  children.push(new Paragraph({
    children: [new TextRun({ text: 'РАЗБОР ИНЦИДЕНТА', font: FONT, size: 32, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));

  // Info block
  children.push(bodyText(`Номер разбора: ${inv.investigationNumber}`));
  children.push(bodyText(`Уровень инцидента: ${inv.incidentLevel}`));
  children.push(bodyText(`Дата: ${new Date(inv.date).toLocaleDateString('ru-RU')}`));
  children.push(bodyText(`Фактическая продолжительность: ${inv.actualDuration} мин`));
  children.push(bodyText(''));

  // Incident description
  children.push(heading('Инцидент'));
  children.push(bodyText(inv.incidentDescription));

  // Production downtimes table
  children.push(heading('Простои производства'));
  if (inv.productionDowntimes.length > 0) {
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            tableCell('Цех', true),
            tableCell('Длительность (мин)', true),
            tableCell('Примечание', true),
          ],
        }),
        ...inv.productionDowntimes.map((pd) =>
          new TableRow({
            children: [
              tableCell(pd.shop),
              tableCell(String(pd.duration)),
              tableCell(pd.note),
            ],
          })
        ),
      ],
    }));
  }

  // Shipment downtimes table
  children.push(heading('Простои отгрузки'));
  if (inv.shipmentDowntimes.length > 0) {
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            tableCell('Направление', true),
            tableCell('Длительность (мин)', true),
            tableCell('Примечание', true),
          ],
        }),
        ...inv.shipmentDowntimes.map((sd) =>
          new TableRow({
            children: [
              tableCell(sd.destination),
              tableCell(String(sd.duration)),
              tableCell(sd.note),
            ],
          })
        ),
      ],
    }));
  }

  // Causes
  children.push(heading('Непосредственные причины'));
  inv.immediateCauses.forEach((c) => children.push(bulletItem(c)));

  children.push(heading('Корневые причины'));
  inv.rootCauses.forEach((c) => children.push(bulletItem(c)));

  children.push(heading('Сопутствующие причины'));
  inv.contributingCauses.forEach((c) => children.push(bulletItem(c)));

  // Measures
  children.push(heading('Принятые меры'));
  inv.takenMeasures.forEach((m, i) => children.push(bulletItem(`${i + 1}. ${m}`)));

  // Planned actions table
  children.push(heading('Запланированные мероприятия'));
  if (inv.plannedActions.length > 0) {
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            tableCell('№', true),
            tableCell('Мероприятие', true),
            tableCell('Ответственный', true),
            tableCell('Срок исполнения', true),
            tableCell('Формат результата', true),
            tableCell('Статус', true),
          ],
        }),
        ...inv.plannedActions.map((a) =>
          new TableRow({
            children: [
              tableCell(String(a.number)),
              tableCell(a.text),
              tableCell(a.responsible),
              tableCell(new Date(a.deadline).toLocaleDateString('ru-RU')),
              tableCell(a.resultFormat),
              tableCell(a.status === 'completed' ? 'Выполнено' : a.status === 'overdue' ? 'Просрочено' : 'Не выполнено'),
            ],
          })
        ),
      ],
    }));
  }

  // Special opinion
  if (inv.specialOpinion) {
    children.push(heading('Особое мнение'));
    children.push(bodyText(inv.specialOpinion));
  }

  // Timeline
  children.push(heading('Хронология событий'));
  if (inv.timeline.length > 0) {
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            tableCell('Время', true),
            tableCell('Событие', true),
          ],
        }),
        ...inv.timeline.map((entry) =>
          new TableRow({
            children: [
              tableCell(entry.type === 'date-separator' ? (entry.dateLabel || '') : (entry.time || '')),
              tableCell(entry.type === 'date-separator' ? `── ${entry.dateLabel} ──` : entry.description),
            ],
          })
        ),
      ],
    }));
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `Разбор_инцидента_${inv.investigationNumber}.docx`);
}
