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

    @PostMapping("/proyecciones/excel")
    public ResponseEntity<byte[]> generarProyeccionesExcel(@RequestBody List<com.gestion.inventario.dto.ProyeccionDTO> proyecciones) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Proyecciones de Compra");
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            font.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Insumo", "Stock Actual", "Stock Máximo", "Déficit", "Costo Unitario", "Inversión", "Urgencia"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (com.gestion.inventario.dto.ProyeccionDTO proy : proyecciones) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(proy.getInsumo() != null ? proy.getInsumo() : "N/A");
                row.createCell(1).setCellValue(proy.getStock() != null ? proy.getStock() : 0);
                row.createCell(2).setCellValue(proy.getStockMaximo() != null ? proy.getStockMaximo() : 50);
                row.createCell(3).setCellValue(proy.getDeficit() != null ? proy.getDeficit() : 0);
                row.createCell(4).setCellValue(proy.getCostoEstimado() != null ? proy.getCostoEstimado().doubleValue() : 0.0);
                row.createCell(5).setCellValue(proy.getInversionNecesaria() != null ? proy.getInversionNecesaria().doubleValue() : 0.0);
                row.createCell(6).setCellValue(proy.getUrgencia() != null ? proy.getUrgencia() : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);

            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentDispositionFormData("attachment", "proyecciones.xlsx");
            responseHeaders.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));

            return ResponseEntity.ok().headers(responseHeaders).body(outputStream.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Error generando Excel de Proyecciones", e);
        }
    }

    @PostMapping("/proyecciones/pdf")
    public ResponseEntity<byte[]> generarProyeccionesPdf(@RequestBody List<com.gestion.inventario.dto.ProyeccionDTO> proyecciones) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            com.lowagie.text.Document document = new com.lowagie.text.Document(com.lowagie.text.PageSize.A4);
            com.lowagie.text.pdf.PdfWriter writer = com.lowagie.text.pdf.PdfWriter.getInstance(document, outputStream);
            document.open();
            
            // Header del Reporte (Profesional)
            com.lowagie.text.Font titleFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 22, new java.awt.Color(30, 58, 138)); // Azul corporativo
            com.lowagie.text.Paragraph title = new com.lowagie.text.Paragraph("Proyecciones de Abastecimiento", titleFont);
            title.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);
            
            com.lowagie.text.Font subTitleFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA, 12, java.awt.Color.GRAY);
            com.lowagie.text.Paragraph subTitle = new com.lowagie.text.Paragraph("Smart Restock - Análisis Financiero de Inventario\nGenerado el: " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), subTitleFont);
            subTitle.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            subTitle.setSpacingAfter(30);
            document.add(subTitle);
            
            // Tabla con diseño
            com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[] {3.0f, 1.2f, 1.2f, 1.5f, 2.0f, 2.2f, 2.0f});
            
            com.lowagie.text.Font headFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 10, java.awt.Color.WHITE);
            String[] headers = {"Insumo", "Stock", "Meta", "Déficit", "Costo U.", "Inversión", "Urgencia"};
            
            for (String header : headers) {
                com.lowagie.text.pdf.PdfPCell hcell = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(header, headFont));
                hcell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                hcell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
                hcell.setBackgroundColor(new java.awt.Color(30, 58, 138)); // bg-blue-900
                hcell.setPadding(8);
                hcell.setBorderWidth(0);
                table.addCell(hcell);
            }
            
            com.lowagie.text.Font cellFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA, 9, java.awt.Color.DARK_GRAY);
            com.lowagie.text.Font boldCell = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 9, new java.awt.Color(185, 28, 28)); // red-700
            
            boolean rowColor = true;
            for (com.gestion.inventario.dto.ProyeccionDTO proy : proyecciones) {
                java.awt.Color bgColor = rowColor ? new java.awt.Color(248, 250, 252) : java.awt.Color.WHITE; // striped rows
                rowColor = !rowColor;
                
                String insumo = proy.getInsumo() != null ? proy.getInsumo() : "N/A";
                String stock = proy.getStock() != null ? proy.getStock().toString() : "0";
                String meta = proy.getStockMaximo() != null ? proy.getStockMaximo().toString() : "50";
                String deficit = proy.getDeficit() != null ? proy.getDeficit().toString() : "0";
                String costo = proy.getCostoEstimado() != null ? String.format("Q%.2f", proy.getCostoEstimado().doubleValue()) : "Q0.00";
                String inversion = proy.getInversionNecesaria() != null ? String.format("Q%.2f", proy.getInversionNecesaria().doubleValue()) : "Q0.00";
                String urgencia = proy.getUrgencia() != null ? proy.getUrgencia() : "";
                
                com.lowagie.text.Font currentUrgenciaFont = "Alta".equals(urgencia) ? boldCell : cellFont;

                com.lowagie.text.pdf.PdfPCell[] cells = new com.lowagie.text.pdf.PdfPCell[7];
                cells[0] = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(insumo, cellFont));
                cells[1] = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(stock, cellFont));
                cells[2] = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(meta, cellFont));
                cells[3] = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(deficit, com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 9)));
                cells[4] = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(costo, cellFont));
                cells[5] = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(inversion, com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 9, new java.awt.Color(4, 120, 87)))); // green-700
                cells[6] = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Phrase(urgencia, currentUrgenciaFont));

                for (int i=0; i<cells.length; i++) {
                    cells[i].setBackgroundColor(bgColor);
                    cells[i].setPadding(6);
                    cells[i].setBorderColor(new java.awt.Color(226, 232, 240)); // slate-200
                    cells[i].setHorizontalAlignment(i == 0 ? com.lowagie.text.Element.ALIGN_LEFT : (i == 4 || i == 5 ? com.lowagie.text.Element.ALIGN_RIGHT : com.lowagie.text.Element.ALIGN_CENTER));
                    table.addCell(cells[i]);
                }
            }
            
            document.add(table);
            document.close();

            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentDispositionFormData("attachment", "proyecciones_financieras.pdf");
            responseHeaders.setContentType(MediaType.APPLICATION_PDF);

            return ResponseEntity.ok().headers(responseHeaders).body(outputStream.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Error generando PDF de Proyecciones", e);
        }
    }
}
