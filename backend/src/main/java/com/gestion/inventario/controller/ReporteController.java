package com.gestion.inventario.controller;

import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.repository.MovimientoRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    @Autowired
    private MovimientoRepository movimientoRepository;

    @PostMapping("/excel")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> generarReporteExcel(@RequestBody List<Long> idsMovimientos) {
        
        List<Movimiento> movimientos = movimientoRepository.findAllById(idsMovimientos);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Reporte de Movimientos");

            // Estilos de Encabezado
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.PALE_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            // Crear fila de encabezados
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Fecha", "Usuario", "Movimiento", "Insumo", "Cantidad", "Justificación/Detalle"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Llenar Datos
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            int rowNum = 1;
            for (Movimiento mov : movimientos) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(mov.getCreatedAt().format(dtf));
                row.createCell(1).setCellValue(mov.getUsuario().getNombre());
                row.createCell(2).setCellValue(mov.getTipo());
                row.createCell(3).setCellValue(mov.getInsumo().getInsumo());
                row.createCell(4).setCellValue(mov.getCantidad());
                row.createCell(5).setCellValue(mov.getDetalle() != null ? mov.getDetalle() : "");
            }

            // Autoajustar columnas
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);

            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentDispositionFormData("attachment", "reporte_movimientos.xlsx");
            responseHeaders.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));

            return ResponseEntity.ok()
                    .headers(responseHeaders)
                    .body(outputStream.toByteArray());

        } catch (IOException e) {
            throw new RuntimeException("Error generando archivo Excel", e);
        }
    }

    @PostMapping("/pdf")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> generarReportePdf(@RequestBody List<Long> idsMovimientos) {
        
        List<Movimiento> movimientos = movimientoRepository.findAllById(idsMovimientos);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            
            com.lowagie.text.Document document = new com.lowagie.text.Document(com.lowagie.text.PageSize.A4.rotate());
            com.lowagie.text.pdf.PdfWriter.getInstance(document, outputStream);
            
            document.open();
            
            com.lowagie.text.Font titleFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 18, java.awt.Color.BLACK);
            com.lowagie.text.Paragraph title = new com.lowagie.text.Paragraph("Reporte de Movimientos - Kárdex", titleFont);
            title.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);
            
            com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[] {2.0f, 2.5f, 2.0f, 3.0f, 1.5f, 4.0f});
            
            com.lowagie.text.Font headFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD);
            String[] headers = {"Fecha", "Usuario", "Movimiento", "Insumo", "Cant.", "Justificación/Detalle"};
            
            for (String header : headers) {
                com.lowagie.text.pdf.PdfPCell hcell = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(header, headFont));
                hcell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                hcell.setBackgroundColor(new java.awt.Color(220, 230, 241));
                hcell.setPadding(5);
                table.addCell(hcell);
            }
            
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            com.lowagie.text.Font cellFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA, 10);
            
            for (Movimiento mov : movimientos) {
                table.addCell(new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(mov.getCreatedAt().format(dtf), cellFont)));
                table.addCell(new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(mov.getUsuario().getNombre(), cellFont)));
                table.addCell(new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(mov.getTipo(), cellFont)));
                table.addCell(new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(mov.getInsumo().getInsumo(), cellFont)));
                table.addCell(new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(mov.getCantidad().toString(), cellFont)));
                table.addCell(new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(mov.getDetalle() != null ? mov.getDetalle() : "", cellFont)));
            }
            
            document.add(table);
            document.close();

            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentDispositionFormData("attachment", "reporte_movimientos.pdf");
            responseHeaders.setContentType(MediaType.APPLICATION_PDF);

            return ResponseEntity.ok()
                    .headers(responseHeaders)
                    .body(outputStream.toByteArray());

        } catch (Exception e) {
            throw new RuntimeException("Error generando archivo PDF", e);
        }
    }
}
