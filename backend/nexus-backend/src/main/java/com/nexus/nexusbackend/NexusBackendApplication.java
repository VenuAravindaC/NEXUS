package com.nexus.nexusbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * @EnableScheduling flips the switch that turns on the app's background
 * "ticker". Any @Scheduled method (like ReminderScheduler's) then runs on
 * a timer — in our case, every 60 seconds: "which reminders are due now?"
 */
@SpringBootApplication
@EnableScheduling
public class NexusBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(NexusBackendApplication.class, args);
	}

}
