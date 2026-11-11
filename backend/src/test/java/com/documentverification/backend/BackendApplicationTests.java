package com.documentverification.backend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Smoke test: starts the whole application, including the real database connection.
 *
 * It only runs when you ask for it, because it needs the shared cloud database to be reachable.
 * A normal build (mvnw test / package) skips it. To run it:
 *     PowerShell:  $env:RUN_DB_TESTS = "true"; .\mvnw.cmd test
 */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "RUN_DB_TESTS", matches = "true")
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
