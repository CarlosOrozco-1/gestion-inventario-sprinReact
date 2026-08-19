package com.gestion.inventario;

import org.junit.jupiter.api.Test;
import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

class BackendApplicationTests {

	@Test
	void migrateDatabase() {
		try {
			File dbFile = new File("data/inventario.db");
			if (!dbFile.exists()) {
				dbFile = new File("backend/data/inventario.db");
			}
			System.out.println("Migrating DB at: " + dbFile.getAbsolutePath());
			String url = "jdbc:sqlite:" + dbFile.getAbsolutePath();
			try (Connection conn = DriverManager.getConnection(url);
				 Statement stmt = conn.createStatement()) {
				try {
					stmt.execute("ALTER TABLE inventario_insumos ADD COLUMN codigo_qr TEXT;");
					System.out.println("COLUMN codigo_qr ADDED SUCCESSFULLY!");
				} catch (Exception e) {
					System.out.println("Column alter info: " + e.getMessage());
				}
				try {
					stmt.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_insumos_codigo_qr ON inventario_insumos(codigo_qr);");
					System.out.println("INDEX idx_insumos_codigo_qr CREATED!");
				} catch (Exception e) {
					System.out.println("Index create info: " + e.getMessage());
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
