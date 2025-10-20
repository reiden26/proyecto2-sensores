import 'dart:typed_data';
import 'dart:convert';
import 'package:flutter/foundation.dart' show compute;
import 'package:pdf/widgets.dart' as pw;
import 'package:pdf/pdf.dart' as pdf;
// Ya no cargamos fuentes desde assets para evitar 404 en web
// Fallback: incrustar NotoSans vía assets locales si google_fonts no está disponible
import 'package:printing/printing.dart';
import 'package:syncfusion_flutter_xlsio/xlsio.dart' as xlsio;
import 'package:file_saver/file_saver.dart';

class ExportService {
  // Exporta y comparte un PDF en Web/Móvil con múltiples gráficos en grande
  static Future<void> exportPdf({
    required String fileName,
    required String title,
    required Map<String, List<num>> series,
    Map<String, Uint8List>? chartImages, // mapa: título -> imagen
  }) async {
    // Preparar payload con tipos simples para isolate/webworker
    final seriesDouble = <String, List<double>>{
      for (final e in series.entries)
        e.key: e.value.map((n) => (n).toDouble()).toList(),
    };
    final payload = <String, dynamic>{
      'title': title,
      'series': seriesDouble,
      'chartImages': chartImages ?? <String, Uint8List>{},
    };

    // Generar PDF en un isolate (en web esto usa Web Worker) para no bloquear UI
    final bytes = await compute(_buildPdfBytes, payload);
    await Printing.sharePdf(bytes: bytes, filename: '$fileName.pdf');
  }

  // Guarda un Excel en Web/Móvil usando FileSaver (descarga en Web)
  static Future<void> exportExcel({
    required String fileName,
    required Map<String, List<num>> series,
    Map<String, Uint8List>? chartImages,
  }) async {
    final book = xlsio.Workbook();
    final sheet = book.worksheets[0];

    int col = 1;
    for (final entry in series.entries) {
      // Encabezado por sensor
      final header = sheet.getRangeByIndex(1, col);
      header.setText(entry.key);
      header.cellStyle.bold = true;

      for (int i = 0; i < entry.value.length; i++) {
        sheet.getRangeByIndex(i + 2, col).setNumber(entry.value[i].toDouble());
      }

      sheet.autoFitColumn(col);
      col++;
    }

    // Hoja con gráficos (como imágenes capturadas del dashboard)
    if (chartImages != null && chartImages.isNotEmpty) {
      final chartsSheet = book.worksheets.addWithName('Graficos');
      int currentRow = 1;
      for (final e in chartImages.entries) {
        // Título
        final titleRange = chartsSheet.getRangeByIndex(currentRow, 1);
        titleRange.setText(e.key);
        titleRange.cellStyle.bold = true;
        currentRow += 1;

        // Insertar imagen del gráfico
        final pic = chartsSheet.pictures.addStream(currentRow, 1, e.value);
        // Ajustar tamaño aproximado
        pic.height = 360;
        pic.width = 640;
        currentRow += 22; // Dejar espacio entre gráficos
      }
      chartsSheet.autoFitColumn(1);
    }

    final bytes = Uint8List.fromList(book.saveAsStream());
    book.dispose();
    await FileSaver.instance.saveFile(
      name: fileName,
      ext: 'xlsx',
      mimeType: MimeType.microsoftExcel,
      bytes: bytes,
    );
  }

  // Exporta una tabla a CSV (UTF-8 BOM) y descarga/guarda el archivo
  static Future<void> exportCsvTable({
    required String fileName,
    required List<Map<String, dynamic>> rows,
    required List<String> columns,
    bool useCommaDecimal = false,
  }) async {
    final buffer = StringBuffer();
    buffer.writeln(columns.join(','));
    for (final row in rows) {
      final values = columns
          .map((c) {
            final v = row[c];
            String s = v == null ? '' : v.toString();
            if (useCommaDecimal && v is num) {
              s = v.toString().replaceAll('.', ',');
            }
            final needsQuote =
                s.contains(',') || s.contains('"') || s.contains('\n');
            final escaped = s.replaceAll('"', '""');
            return needsQuote ? '"$escaped"' : escaped;
          })
          .join(',');
      buffer.writeln(values);
    }
    final bytes = Uint8List.fromList(
      const [0xEF, 0xBB, 0xBF] + utf8.encode(buffer.toString()),
    );
    await FileSaver.instance.saveFile(
      name: fileName,
      ext: 'csv',
      mimeType: MimeType.csv,
      bytes: bytes,
    );
  }

  // Exporta tabla a JSON
  static Future<void> exportJsonTable({
    required String fileName,
    required List<Map<String, dynamic>> rows,
  }) async {
    final jsonStr = const JsonEncoder.withIndent('  ').convert(rows);
    final bytes = Uint8List.fromList(utf8.encode(jsonStr));
    await FileSaver.instance.saveFile(
      name: fileName,
      ext: 'json',
      mimeType: MimeType.json,
      bytes: bytes,
    );
  }

  // Exporta tabla a Excel
  static Future<void> exportExcelTable({
    required String fileName,
    required List<Map<String, dynamic>> rows,
    required List<String> columns,
  }) async {
    final book = xlsio.Workbook();
    final sheet = book.worksheets[0];
    for (int i = 0; i < columns.length; i++) {
      final cell = sheet.getRangeByIndex(1, i + 1);
      cell.setText(columns[i]);
      cell.cellStyle.bold = true;
    }
    for (int r = 0; r < rows.length; r++) {
      final row = rows[r];
      for (int c = 0; c < columns.length; c++) {
        final value = row[columns[c]];
        final cell = sheet.getRangeByIndex(r + 2, c + 1);
        if (value is num) {
          cell.setNumber(value.toDouble());
        } else {
          cell.setText(value?.toString() ?? '');
        }
      }
    }
    for (int c = 1; c <= columns.length; c++) {
      sheet.autoFitColumn(c);
    }
    final bytes = Uint8List.fromList(book.saveAsStream());
    book.dispose();
    await FileSaver.instance.saveFile(
      name: fileName,
      ext: 'xlsx',
      mimeType: MimeType.microsoftExcel,
      bytes: bytes,
    );
  }

  // Exporta tabla a PDF sencillo
  static Future<void> exportPdfTable({
    required String fileName,
    required String title,
    required List<Map<String, dynamic>> rows,
    required List<String> columns,
  }) async {
    final payload = <String, dynamic>{
      'title': title,
      'columns': columns,
      'rows': rows,
    };
    final bytes = await compute(_buildPdfTableBytes, payload);
    await Printing.sharePdf(bytes: bytes, filename: '$fileName.pdf');
  }
}

// Debe ser top-level para compute
Future<Uint8List> _buildPdfBytes(Map<String, dynamic> payload) async {
  final String title = payload['title'] as String;
  final Map<String, List<dynamic>> rawSeries = (payload['series'] as Map)
      .cast<String, List<dynamic>>();
  final Map<String, List<double>> series = {
    for (final e in rawSeries.entries)
      e.key: e.value.map((v) => (v as num).toDouble()).toList(),
  };
  final Map<String, Uint8List> chartImages = (payload['chartImages'] as Map)
      .cast<String, Uint8List>();

  final doc = pw.Document();
  doc.addPage(
    pw.MultiPage(
      theme: null,
      build: (ctx) => [
        pw.Text(
          title,
          style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold),
        ),
        pw.SizedBox(height: 16),

        if (chartImages.isNotEmpty)
          ...chartImages.entries.map(
            (e) => pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  e.key,
                  style: pw.TextStyle(
                    fontSize: 14,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
                pw.SizedBox(height: 8),
                pw.Center(
                  child: pw.Image(
                    pw.MemoryImage(e.value),
                    height: 240,
                    fit: pw.BoxFit.contain,
                  ),
                ),
                pw.SizedBox(height: 18),
              ],
            ),
          ),

        ...series.entries.map(
          (e) => pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(
                e.key,
                style: pw.TextStyle(
                  fontSize: 14,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
              pw.SizedBox(height: 6),
              pw.Wrap(
                spacing: 8,
                runSpacing: 6,
                children: e.value
                    .map(
                      (v) => pw.Container(
                        padding: const pw.EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 4,
                        ),
                        decoration: pw.BoxDecoration(
                          border: pw.Border.all(width: 0.3),
                          borderRadius: pw.BorderRadius.circular(3),
                        ),
                        child: pw.Text(v.toString()),
                      ),
                    )
                    .toList(),
              ),
              pw.SizedBox(height: 14),
            ],
          ),
        ),
      ],
    ),
  );
  return await doc.save();
}

Future<Uint8List> _buildPdfTableBytes(Map<String, dynamic> payload) async {
  final String title = payload['title'] as String;
  final List<String> columns = (payload['columns'] as List).cast<String>();
  final List<Map<String, dynamic>> rows = (payload['rows'] as List)
      .cast<Map<String, dynamic>>();

  final doc = pw.Document();
  // Paginar manualmente las filas para evitar TooManyPagesException en web
  const int rowsPerPage = 500; // ajustar si es necesario
  final List<List<Map<String, dynamic>>> chunks = [];
  for (int i = 0; i < rows.length; i += rowsPerPage) {
    chunks.add(
      rows.sublist(
        i,
        i + rowsPerPage > rows.length ? rows.length : i + rowsPerPage,
      ),
    );
  }

  for (int pageIndex = 0; pageIndex < chunks.length; pageIndex++) {
    final chunk = chunks[pageIndex];
    doc.addPage(
      pw.MultiPage(
        build: (ctx) => [
          if (pageIndex == 0)
            pw.Text(
              title,
              style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold),
            ),
          if (pageIndex == 0) pw.SizedBox(height: 12),
          pw.Table.fromTextArray(
            headers: columns,
            data: chunk
                .map((r) => columns.map((c) => r[c]?.toString() ?? '').toList())
                .toList(),
            headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold),
            headerDecoration: pw.BoxDecoration(color: pdf.PdfColors.grey300),
            cellAlignments: {
              for (int i = 0; i < columns.length; i++)
                i: pw.Alignment.centerLeft,
            },
            cellPadding: const pw.EdgeInsets.symmetric(
              horizontal: 6,
              vertical: 4,
            ),
          ),
          pw.SizedBox(height: 8),
          pw.Align(
            alignment: pw.Alignment.centerRight,
            child: pw.Text(
              'Página ${pageIndex + 1} de ${chunks.length}',
              style: pw.TextStyle(fontSize: 10),
            ),
          ),
        ],
      ),
    );
  }
  return await doc.save();
}
